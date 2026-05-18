const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const Genre = require('../models/Genre');

// List movies with optional search and genre filter
router.get('/', async (req, res) => {
  try {
    const { search, genre } = req.query;
    const filter = {};
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (genre) filter['genres.name'] = genre;
    const [movies, totalCount, genres] = await Promise.all([
      Movie.find(filter).sort('title').limit(200),
      Movie.countDocuments(filter),
      Genre.find().sort('name')
    ]);
    res.render('movies/index', {
      movies,
      totalCount,
      genres,
      search: search || '',
      selectedGenre: genre || ''
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// New movie form
router.get('/new', async (req, res) => {
  try {
    const genres = await Genre.find().sort('name');
    res.render('movies/new', { genres });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Create movie
router.post('/', async (req, res) => {
  try {
    const { title, year, runtime, summary, list_price, image_url, genreIds } = req.body;
    const lastMovie = await Movie.findOne().sort('-movie_id');
    const movie_id = lastMovie ? lastMovie.movie_id + 1 : 1;

    const selectedIds = Array.isArray(genreIds) ? genreIds : (genreIds ? [genreIds] : []);
    const genreDocs = await Genre.find({ _id: { $in: selectedIds } });
    const embeddedGenres = genreDocs.map(g => ({ genre_id: g.genre_id, name: g.name }));

    const cast = (req.body.cast || '').split('\n').filter(Boolean).map(line => {
      const [name, role] = line.split(',').map(s => s.trim());
      return { name: name || '', role: role || '' };
    });
    const crew = (req.body.crew || '').split('\n').filter(Boolean).map(line => {
      const [name, role] = line.split(',').map(s => s.trim());
      return { name: name || '', role: role || '' };
    });

    await Movie.create({
      movie_id,
      title,
      year: parseInt(year) || null,
      genres: embeddedGenres,
      cast,
      crew,
      runtime: runtime || '',
      summary: summary || '',
      list_price: parseFloat(list_price) || 0,
      image_url: image_url || '',
      awards: { wins: 0, nominations: 0 },
      studio: { name: '' }
    });
    res.redirect('/movies');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Show movie detail — MUST come before /:id/edit to avoid conflict
router.get('/:id/edit', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.redirect('/movies');
    const genres = await Genre.find().sort('name');
    const castText = movie.cast.map(c => `${c.name}, ${c.role}`).join('\n');
    const crewText = movie.crew.map(c => `${c.name}, ${c.role}`).join('\n');
    const selectedGenreIds = movie.genres.map(g => g.genre_id);
    res.render('movies/edit', { movie, genres, castText, crewText, selectedGenreIds });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.redirect('/movies');
    res.render('movies/show', { movie });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Update movie
router.post('/:id', async (req, res) => {
  try {
    const { title, year, runtime, summary, list_price, image_url, genreIds } = req.body;

    const selectedIds = Array.isArray(genreIds) ? genreIds : (genreIds ? [genreIds] : []);
    const genreDocs = await Genre.find({ _id: { $in: selectedIds } });
    const embeddedGenres = genreDocs.map(g => ({ genre_id: g.genre_id, name: g.name }));

    const cast = (req.body.cast || '').split('\n').filter(Boolean).map(line => {
      const [name, role] = line.split(',').map(s => s.trim());
      return { name: name || '', role: role || '' };
    });
    const crew = (req.body.crew || '').split('\n').filter(Boolean).map(line => {
      const [name, role] = line.split(',').map(s => s.trim());
      return { name: name || '', role: role || '' };
    });

    await Movie.findByIdAndUpdate(req.params.id, {
      title,
      year: parseInt(year) || null,
      genres: embeddedGenres,
      cast,
      crew,
      runtime: runtime || '',
      summary: summary || '',
      list_price: parseFloat(list_price) || 0,
      image_url: image_url || ''
    });
    res.redirect(`/movies/${req.params.id}`);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Delete movie
router.post('/:id/delete', async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    res.redirect('/movies');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
