require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Genre = require('./models/Genre');
const Movie = require('./models/Movie');
const Customer = require('./models/Customer');
const Activity = require('./models/Activity');

// Parse NDJSON (one JSON per line)
function parseNDJSON(filePath) {
  return fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));
}

// Parse CSV with quoted fields
function parseCSV(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  return lines.slice(1).map(line => {
    const values = [];
    let cur = '', inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { values.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    values.push(cur.trim());
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i] || '');
    return obj;
  });
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Dropping collections...');

  await Promise.all([
    Genre.deleteMany({}),
    Movie.deleteMany({}),
    Customer.deleteMany({}),
    Activity.deleteMany({})
  ]);

  // --- GENRES ---
  const genreCSV = parseCSV(path.join(__dirname, 'data/genre.csv'));
  const genreSegments = parseCSV(path.join(__dirname, 'data/customer_segment.csv'));

  const genreDocs = genreCSV.map(r => ({
    genre_id: parseInt(r.GENRE_ID),
    name: r.NAME
  }));
  const genres = await Genre.insertMany(genreDocs);
  console.log(`Inserted ${genres.length} genres`);

  // Build genre lookup by name for movie embedding
  const genreByName = {};
  genres.forEach(g => { genreByName[g.name.toLowerCase()] = g; });

  // --- MOVIES ---
  const rawMovies = parseNDJSON(path.join(__dirname, 'data/movies.json'));

  const movieDocs = rawMovies.map(m => {
    // Embed genres
    const embeddedGenres = (m.genre || []).map(gName => {
      const found = genreByName[gName.toLowerCase()];
      return found ? { genre_id: found.genre_id, name: found.name } : { genre_id: 0, name: gName };
    });

    // Transform cast: array of strings or null
    const cast = (m.cast || []).map(name =>
      typeof name === 'string' ? { name, role: '' } : { name: name.name || '', role: name.role || '' }
    );

    // Transform crew: array of {job, names} objects
    const crew = [];
    (m.crew || []).forEach(c => {
      (c.names || []).forEach(name => crew.push({ name, role: c.job || '' }));
    });

    // Awards: count arrays
    const awardWins = Array.isArray(m.awards) ? m.awards.length : 0;
    const awardNoms = Array.isArray(m.nominations) ? m.nominations.length : 0;

    // Studio
    const studioName = Array.isArray(m.studio) && m.studio.length > 0 ? m.studio[0] : '';

    // Runtime: strip leading +
    const runtime = m.runtime ? String(m.runtime).replace(/^\+/, '') + (String(m.runtime).includes('min') ? '' : ' min') : '';

    return {
      movie_id: m.movie_id,
      title: m.title,
      year: m.year || null,
      genres: embeddedGenres,
      cast,
      crew,
      awards: { wins: awardWins, nominations: awardNoms },
      studio: { name: studioName },
      runtime,
      summary: m.summary || '',
      list_price: m.list_price || 0,
      image_url: m.image_url || ''
    };
  });

  // Insert in batches of 500 to avoid memory issues
  let movieCount = 0;
  for (let i = 0; i < movieDocs.length; i += 500) {
    const batch = movieDocs.slice(i, i + 500);
    await Movie.insertMany(batch, { ordered: false });
    movieCount += batch.length;
    process.stdout.write(`\rInserted ${movieCount}/${movieDocs.length} movies...`);
  }
  console.log(`\nInserted ${movieCount} movies`);

  // --- CUSTOMERS ---
  // Get the cust_ids from activity.json
  const rawActivities = parseNDJSON(path.join(__dirname, 'data/activity.json'));
  const activityCustIds = new Set(rawActivities.map(a => a.cust_id));

  // Build segment lookup
  const segmentById = {};
  genreSegments.forEach(s => {
    segmentById[parseInt(s.SEGMENT_ID)] = {
      segment_id: parseInt(s.SEGMENT_ID),
      name: s.NAME,
      short_name: s.SHORT_NAME
    };
  });

  // Parse customers - we need the 99 that appear in activities
  // Stream through CSV to find matching customers
  const customerLines = fs.readFileSync(path.join(__dirname, 'data/customer.csv'), 'utf8').split('\n');
  const custHeaders = customerLines[0].split(',').map(h => h.replace(/"/g, '').trim());

  const foundCustomers = [];
  for (let i = 1; i < customerLines.length && foundCustomers.length < activityCustIds.size; i++) {
    if (!customerLines[i].trim()) continue;
    const values = [];
    let cur = '', inQuote = false;
    for (const ch of customerLines[i]) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { values.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    values.push(cur.trim());
    const row = {};
    custHeaders.forEach((h, idx) => row[h] = values[idx] || '');
    const custId = parseInt(row.CUST_ID);
    if (activityCustIds.has(custId)) {
      const segId = parseInt(row.SEGMENT_ID) || 1;
      foundCustomers.push({
        cust_id: custId,
        first_name: row.FIRST_NAME,
        last_name: row.LAST_NAME,
        email: row.EMAIL,
        country: row.COUNTRY,
        age: parseInt(row.AGE) || null,
        income_level: row.INCOME_LEVEL,
        segment: segmentById[segId] || segmentById[1]
      });
    }
  }

  const customers = await Customer.insertMany(foundCustomers);
  console.log(`Inserted ${customers.length} customers`);

  // Build customer lookup by cust_id
  const custByOrigId = {};
  customers.forEach(c => { custByOrigId[c.cust_id] = c._id; });

  // Build movie lookup by movie_id
  const movieByOrigId = {};
  const allMovies = await Movie.find({}, { movie_id: 1 }).lean();
  allMovies.forEach(m => { movieByOrigId[m.movie_id] = m._id; });

  // --- ACTIVITIES ---
  const activityDocs = rawActivities
    .filter(a => custByOrigId[a.cust_id] && movieByOrigId[a.movie_id])
    .map(a => ({
      customer_id: custByOrigId[a.cust_id],
      movie_id: movieByOrigId[a.movie_id],
      activity: ['watch','rate','search','purchase'].includes(a.activity) ? a.activity : 'watch',
      activity_time: new Date(a.activity_time),
      app: a.app || '',
      device: a.device || '',
      os: a.os || ''
    }));

  const activities = await Activity.insertMany(activityDocs);
  console.log(`Inserted ${activities.length} activities`);

  console.log('\n✓ Seed complete!');
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
