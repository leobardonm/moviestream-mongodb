# MovieStream MongoDB App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Node.js/Express/EJS web app with full CRUD on Movies and Genres, backed by MongoDB Atlas, seeded with synthetic data.

**Architecture:** Express server with Mongoose models, EJS templates rendered server-side, POST-only HTML forms (no PUT/DELETE from browser — use POST /resource/:id/delete for deletes and POST /resource/:id for updates). No auth, no sessions.

**Tech Stack:** Node.js, Express 4, EJS, Mongoose 8, dotenv, nodemon (dev)

---

## File Map

| File | Responsibility |
|------|---------------|
| `package.json` | Dependencies and scripts |
| `.env` | MONGODB_URI + PORT (not committed) |
| `.env.example` | Template for env vars |
| `.gitignore` | Exclude node_modules, .env |
| `server.js` | Express app: middleware, routes, listen |
| `models/Genre.js` | Mongoose schema for genres |
| `models/Movie.js` | Mongoose schema for movies (with embedded genres array) |
| `models/Customer.js` | Mongoose schema for customers (with embedded segment) |
| `models/Activity.js` | Mongoose schema for activities (ObjectId refs) |
| `routes/genres.js` | CRUD: list, new, create, edit, update, delete |
| `routes/movies.js` | CRUD: list+filter, new, create, show, edit, update, delete |
| `views/layout.ejs` | Shared HTML shell with nav |
| `views/genres/index.ejs` | Genre list |
| `views/genres/new.ejs` | Create genre form |
| `views/genres/edit.ejs` | Edit genre form |
| `views/movies/index.ejs` | Movie list with search/filter |
| `views/movies/show.ejs` | Movie detail |
| `views/movies/new.ejs` | Create movie form |
| `views/movies/edit.ejs` | Edit movie form |
| `public/style.css` | Minimal styling |
| `seed.js` | Drop + recreate all collections |

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `server.js`

- [ ] **Step 1: Initialize project**

```bash
cd /Users/leobardo/Desktop/tareadb
npm init -y
npm install express mongoose ejs dotenv
npm install --save-dev nodemon
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
.env
```

- [ ] **Step 3: Create `.env.example`**

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/moviestream
PORT=3000
```

- [ ] **Step 4: Create `.env`** (fill in real Atlas URI)

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/moviestream
PORT=3000
```

- [ ] **Step 5: Update `package.json` scripts**

Add to the `"scripts"` section:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node seed.js"
  }
}
```

- [ ] **Step 6: Create `server.js`**

```js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => { console.error(err); process.exit(1); });

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/genres', require('./routes/genres'));
app.use('/movies', require('./routes/movies'));
app.get('/', (req, res) => res.redirect('/movies'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

- [ ] **Step 7: Verify server starts (routes don't exist yet, will error — that's expected)**

```bash
node server.js
# Expected: "MongoDB connected" then crash on missing routes module — OK for now
```

---

## Task 2: Mongoose Models

**Files:**
- Create: `models/Genre.js`
- Create: `models/Movie.js`
- Create: `models/Customer.js`
- Create: `models/Activity.js`

- [ ] **Step 1: Create `models/Genre.js`**

```js
const mongoose = require('mongoose');

const genreSchema = new mongoose.Schema({
  genre_id: { type: Number, required: true, unique: true },
  name: { type: String, required: true, trim: true }
});

module.exports = mongoose.model('Genre', genreSchema);
```

- [ ] **Step 2: Create `models/Movie.js`**

```js
const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  movie_id: { type: Number, required: true, unique: true },
  title: { type: String, required: true, trim: true },
  year: Number,
  genres: [{ genre_id: Number, name: String }],
  cast: [{ name: String, role: String }],
  crew: [{ name: String, role: String }],
  awards: { wins: Number, nominations: Number },
  studio: { name: String },
  runtime: String,
  summary: String,
  list_price: Number,
  image_url: String
});

module.exports = mongoose.model('Movie', movieSchema);
```

- [ ] **Step 3: Create `models/Customer.js`**

```js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  cust_id: { type: Number, required: true, unique: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true },
  country: String,
  age: Number,
  income_level: String,
  segment: {
    segment_id: Number,
    name: String,
    short_name: String
  }
});

module.exports = mongoose.model('Customer', customerSchema);
```

- [ ] **Step 4: Create `models/Activity.js`**

```js
const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  movie_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
  activity: { type: String, enum: ['watch', 'rate', 'search', 'purchase'] },
  activity_time: { type: Date, default: Date.now },
  app: String,
  device: String,
  os: String
});

module.exports = mongoose.model('Activity', activitySchema);
```

---

## Task 3: Seed Script

**Files:**
- Create: `seed.js`

- [ ] **Step 1: Create `seed.js`**

```js
require('dotenv').config();
const mongoose = require('mongoose');
const Genre = require('./models/Genre');
const Movie = require('./models/Movie');
const Customer = require('./models/Customer');
const Activity = require('./models/Activity');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Dropping collections...');

  await Genre.deleteMany({});
  await Movie.deleteMany({});
  await Customer.deleteMany({});
  await Activity.deleteMany({});

  // --- GENRES ---
  const genres = await Genre.insertMany([
    { genre_id: 1, name: 'Action' },
    { genre_id: 2, name: 'Drama' },
    { genre_id: 3, name: 'Sci-Fi' },
    { genre_id: 4, name: 'Comedy' },
    { genre_id: 5, name: 'Thriller' }
  ]);
  console.log(`Inserted ${genres.length} genres`);

  // --- MOVIES ---
  const movies = await Movie.insertMany([
    {
      movie_id: 1, title: 'Inception', year: 2010,
      genres: [{ genre_id: 3, name: 'Sci-Fi' }, { genre_id: 5, name: 'Thriller' }],
      cast: [{ name: 'Leonardo DiCaprio', role: 'Cobb' }, { name: 'Ellen Page', role: 'Ariadne' }],
      crew: [{ name: 'Christopher Nolan', role: 'Director' }],
      awards: { wins: 4, nominations: 8 },
      studio: { name: 'Warner Bros' }, runtime: '148 min',
      summary: 'A thief who enters the dreams of others to steal secrets.', list_price: 3.99,
      image_url: 'https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg'
    },
    {
      movie_id: 2, title: 'The Dark Knight', year: 2008,
      genres: [{ genre_id: 1, name: 'Action' }, { genre_id: 5, name: 'Thriller' }],
      cast: [{ name: 'Christian Bale', role: 'Bruce Wayne' }, { name: 'Heath Ledger', role: 'Joker' }],
      crew: [{ name: 'Christopher Nolan', role: 'Director' }],
      awards: { wins: 2, nominations: 8 },
      studio: { name: 'Warner Bros' }, runtime: '152 min',
      summary: 'Batman faces the Joker, a criminal mastermind who plunges Gotham into chaos.', list_price: 3.99,
      image_url: 'https://upload.wikimedia.org/wikipedia/en/1/1c/The_Dark_Knight_%282008_film%29.jpg'
    },
    {
      movie_id: 3, title: 'Interstellar', year: 2014,
      genres: [{ genre_id: 3, name: 'Sci-Fi' }, { genre_id: 2, name: 'Drama' }],
      cast: [{ name: 'Matthew McConaughey', role: 'Cooper' }, { name: 'Anne Hathaway', role: 'Brand' }],
      crew: [{ name: 'Christopher Nolan', role: 'Director' }],
      awards: { wins: 1, nominations: 5 },
      studio: { name: 'Paramount Pictures' }, runtime: '169 min',
      summary: 'Explorers travel through a wormhole in space to save humanity.', list_price: 3.99,
      image_url: 'https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg'
    },
    {
      movie_id: 4, title: 'Parasite', year: 2019,
      genres: [{ genre_id: 5, name: 'Thriller' }, { genre_id: 2, name: 'Drama' }],
      cast: [{ name: 'Song Kang-ho', role: 'Ki-taek' }, { name: 'Lee Sun-kyun', role: 'Mr. Park' }],
      crew: [{ name: 'Bong Joon-ho', role: 'Director' }],
      awards: { wins: 4, nominations: 6 },
      studio: { name: 'CJ Entertainment' }, runtime: '132 min',
      summary: 'A poor family schemes to become employed by a wealthy household.', list_price: 2.99,
      image_url: 'https://upload.wikimedia.org/wikipedia/en/5/53/Parasite_%282019_film%29.png'
    },
    {
      movie_id: 5, title: 'The Grand Budapest Hotel', year: 2014,
      genres: [{ genre_id: 4, name: 'Comedy' }, { genre_id: 2, name: 'Drama' }],
      cast: [{ name: 'Ralph Fiennes', role: 'Gustave H' }, { name: 'Tony Revolori', role: 'Zero' }],
      crew: [{ name: 'Wes Anderson', role: 'Director' }],
      awards: { wins: 4, nominations: 9 },
      studio: { name: 'Fox Searchlight' }, runtime: '99 min',
      summary: 'The adventures of a legendary hotel concierge and his lobby boy.', list_price: 2.99,
      image_url: 'https://upload.wikimedia.org/wikipedia/en/1/1c/The_Grand_Budapest_Hotel_%282014%29_poster.jpg'
    },
    {
      movie_id: 6, title: 'Mad Max: Fury Road', year: 2015,
      genres: [{ genre_id: 1, name: 'Action' }, { genre_id: 3, name: 'Sci-Fi' }],
      cast: [{ name: 'Tom Hardy', role: 'Max Rockatansky' }, { name: 'Charlize Theron', role: 'Furiosa' }],
      crew: [{ name: 'George Miller', role: 'Director' }],
      awards: { wins: 6, nominations: 10 },
      studio: { name: 'Warner Bros' }, runtime: '120 min',
      summary: 'In a post-apocalyptic wasteland, Max helps a rebel warrior escape a tyrant.', list_price: 3.49,
      image_url: 'https://upload.wikimedia.org/wikipedia/en/6/6e/Mad_Max_Fury_Road.jpg'
    },
    {
      movie_id: 7, title: 'The Shawshank Redemption', year: 1994,
      genres: [{ genre_id: 2, name: 'Drama' }],
      cast: [{ name: 'Tim Robbins', role: 'Andy Dufresne' }, { name: 'Morgan Freeman', role: 'Ellis Boyd' }],
      crew: [{ name: 'Frank Darabont', role: 'Director' }],
      awards: { wins: 0, nominations: 7 },
      studio: { name: 'Castle Rock Entertainment' }, runtime: '142 min',
      summary: 'Two imprisoned men bond over years, finding solace and redemption.', list_price: 1.99,
      image_url: 'https://upload.wikimedia.org/wikipedia/en/8/81/ShawshankRedemptionMoviePoster.jpg'
    },
    {
      movie_id: 8, title: 'Pulp Fiction', year: 1994,
      genres: [{ genre_id: 5, name: 'Thriller' }, { genre_id: 4, name: 'Comedy' }],
      cast: [{ name: 'John Travolta', role: 'Vincent Vega' }, { name: 'Uma Thurman', role: 'Mia Wallace' }],
      crew: [{ name: 'Quentin Tarantino', role: 'Director' }],
      awards: { wins: 1, nominations: 7 },
      studio: { name: 'Miramax' }, runtime: '154 min',
      summary: 'Intertwining stories of crime in Los Angeles.', list_price: 2.49,
      image_url: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Pulp_Fiction_%281994%29_poster.jpg'
    },
    {
      movie_id: 9, title: 'Spirited Away', year: 2001,
      genres: [{ genre_id: 4, name: 'Comedy' }, { genre_id: 2, name: 'Drama' }],
      cast: [{ name: 'Daveigh Chase', role: 'Chihiro (voice)' }],
      crew: [{ name: 'Hayao Miyazaki', role: 'Director' }],
      awards: { wins: 1, nominations: 4 },
      studio: { name: 'Studio Ghibli' }, runtime: '125 min',
      summary: 'A young girl enters the spirit world and must work to save her parents.', list_price: 2.99,
      image_url: 'https://upload.wikimedia.org/wikipedia/en/d/db/Spirited_Away_Japanese_poster.png'
    },
    {
      movie_id: 10, title: 'Get Out', year: 2017,
      genres: [{ genre_id: 5, name: 'Thriller' }],
      cast: [{ name: 'Daniel Kaluuya', role: 'Chris Washington' }, { name: 'Allison Williams', role: 'Rose Armitage' }],
      crew: [{ name: 'Jordan Peele', role: 'Director' }],
      awards: { wins: 1, nominations: 4 },
      studio: { name: 'Universal Pictures' }, runtime: '104 min',
      summary: 'A Black man uncovers disturbing secrets when visiting his white girlfriend\'s family.', list_price: 2.99,
      image_url: 'https://upload.wikimedia.org/wikipedia/en/a/a8/Get_Out_poster.png'
    },
    {
      movie_id: 11, title: 'Everything Everywhere All at Once', year: 2022,
      genres: [{ genre_id: 1, name: 'Action' }, { genre_id: 3, name: 'Sci-Fi' }, { genre_id: 4, name: 'Comedy' }],
      cast: [{ name: 'Michelle Yeoh', role: 'Evelyn Wang' }, { name: 'Ke Huy Quan', role: 'Waymond Wang' }],
      crew: [{ name: 'Daniel Kwan', role: 'Director' }, { name: 'Daniel Scheinert', role: 'Director' }],
      awards: { wins: 7, nominations: 11 },
      studio: { name: 'A24' }, runtime: '139 min',
      summary: 'A woman discovers she must connect with parallel universe versions of herself.', list_price: 4.99,
      image_url: 'https://upload.wikimedia.org/wikipedia/en/b/b7/Everything_Everywhere_All_at_Once.jpg'
    },
    {
      movie_id: 12, title: 'The Godfather', year: 1972,
      genres: [{ genre_id: 2, name: 'Drama' }, { genre_id: 5, name: 'Thriller' }],
      cast: [{ name: 'Marlon Brando', role: 'Vito Corleone' }, { name: 'Al Pacino', role: 'Michael Corleone' }],
      crew: [{ name: 'Francis Ford Coppola', role: 'Director' }],
      awards: { wins: 3, nominations: 11 },
      studio: { name: 'Paramount Pictures' }, runtime: '175 min',
      summary: 'The aging patriarch of a crime dynasty transfers control to his reluctant son.', list_price: 2.99,
      image_url: 'https://upload.wikimedia.org/wikipedia/en/1/1c/Godfather_ver1.jpg'
    },
    {
      movie_id: 13, title: 'Knives Out', year: 2019,
      genres: [{ genre_id: 5, name: 'Thriller' }, { genre_id: 4, name: 'Comedy' }],
      cast: [{ name: 'Daniel Craig', role: 'Benoit Blanc' }, { name: 'Ana de Armas', role: 'Marta Cabrera' }],
      crew: [{ name: 'Rian Johnson', role: 'Director' }],
      awards: { wins: 0, nominations: 1 },
      studio: { name: 'Lionsgate' }, runtime: '130 min',
      summary: 'A detective investigates the death of a crime novelist.', list_price: 3.49,
      image_url: 'https://upload.wikimedia.org/wikipedia/en/e/e5/Knives_Out_poster.jpeg'
    },
    {
      movie_id: 14, title: 'The Matrix', year: 1999,
      genres: [{ genre_id: 1, name: 'Action' }, { genre_id: 3, name: 'Sci-Fi' }],
      cast: [{ name: 'Keanu Reeves', role: 'Neo' }, { name: 'Laurence Fishburne', role: 'Morpheus' }],
      crew: [{ name: 'Lana Wachowski', role: 'Director' }, { name: 'Lilly Wachowski', role: 'Director' }],
      awards: { wins: 4, nominations: 4 },
      studio: { name: 'Warner Bros' }, runtime: '136 min',
      summary: 'A hacker discovers reality is a simulation and joins a rebellion.', list_price: 2.99,
      image_url: 'https://upload.wikimedia.org/wikipedia/en/c/c1/The_Matrix_Poster.jpg'
    },
    {
      movie_id: 15, title: 'Coco', year: 2017,
      genres: [{ genre_id: 4, name: 'Comedy' }, { genre_id: 2, name: 'Drama' }],
      cast: [{ name: 'Anthony Gonzalez', role: 'Miguel (voice)' }, { name: 'Gael García Bernal', role: 'Héctor (voice)' }],
      crew: [{ name: 'Lee Unkrich', role: 'Director' }],
      awards: { wins: 2, nominations: 4 },
      studio: { name: 'Pixar' }, runtime: '105 min',
      summary: 'A young boy travels to the Land of the Dead to find his great-great-grandfather.', list_price: 2.99,
      image_url: 'https://upload.wikimedia.org/wikipedia/en/9/98/Coco_%282017_film%29_poster.jpg'
    },
    {
      movie_id: 16, title: 'No Country for Old Men', year: 2007,
      genres: [{ genre_id: 5, name: 'Thriller' }, { genre_id: 2, name: 'Drama' }],
      cast: [{ name: 'Tommy Lee Jones', role: 'Ed Tom Bell' }, { name: 'Javier Bardem', role: 'Anton Chigurh' }],
      crew: [{ name: 'Joel Coen', role: 'Director' }, { name: 'Ethan Coen', role: 'Director' }],
      awards: { wins: 4, nominations: 8 },
      studio: { name: 'Miramax' }, runtime: '122 min',
      summary: 'Violence erupts after a man stumbles upon a drug deal gone wrong.', list_price: 2.49,
      image_url: 'https://upload.wikimedia.org/wikipedia/en/8/8b/No_Country_for_Old_Men_poster.jpg'
    },
    {
      movie_id: 17, title: 'Whiplash', year: 2014,
      genres: [{ genre_id: 2, name: 'Drama' }],
      cast: [{ name: 'Miles Teller', role: 'Andrew Neiman' }, { name: 'J.K. Simmons', role: 'Fletcher' }],
      crew: [{ name: 'Damien Chazelle', role: 'Director' }],
      awards: { wins: 3, nominations: 5 },
      studio: { name: 'Sony Pictures Classics' }, runtime: '107 min',
      summary: 'A young jazz drummer pushes himself to extremes under a demanding instructor.', list_price: 2.99,
      image_url: 'https://upload.wikimedia.org/wikipedia/en/4/44/Whiplash_%282014_film%29_poster.jpg'
    },
    {
      movie_id: 18, title: 'Arrival', year: 2016,
      genres: [{ genre_id: 3, name: 'Sci-Fi' }, { genre_id: 2, name: 'Drama' }],
      cast: [{ name: 'Amy Adams', role: 'Louise Banks' }, { name: 'Jeremy Renner', role: 'Ian Donnelly' }],
      crew: [{ name: 'Denis Villeneuve', role: 'Director' }],
      awards: { wins: 1, nominations: 8 },
      studio: { name: 'Paramount Pictures' }, runtime: '116 min',
      summary: 'A linguist works with the military to communicate with alien visitors.', list_price: 3.49,
      image_url: 'https://upload.wikimedia.org/wikipedia/en/4/4c/Arrival_%282016_film%29.jpg'
    },
    {
      movie_id: 19, title: 'Superbad', year: 2007,
      genres: [{ genre_id: 4, name: 'Comedy' }],
      cast: [{ name: 'Jonah Hill', role: 'Seth' }, { name: 'Michael Cera', role: 'Evan' }],
      crew: [{ name: 'Greg Mottola', role: 'Director' }],
      awards: { wins: 0, nominations: 2 },
      studio: { name: 'Columbia Pictures' }, runtime: '113 min',
      summary: 'Two co-dependent high school seniors on a mission to score alcohol for a party.', list_price: 1.99,
      image_url: 'https://upload.wikimedia.org/wikipedia/en/8/8e/Superbad_2007_film_poster.jpg'
    },
    {
      movie_id: 20, title: 'Dune', year: 2021,
      genres: [{ genre_id: 3, name: 'Sci-Fi' }, { genre_id: 1, name: 'Action' }],
      cast: [{ name: 'Timothée Chalamet', role: 'Paul Atreides' }, { name: 'Zendaya', role: 'Chani' }],
      crew: [{ name: 'Denis Villeneuve', role: 'Director' }],
      awards: { wins: 6, nominations: 10 },
      studio: { name: 'Warner Bros' }, runtime: '155 min',
      summary: 'A noble family controls the desert planet Arrakis, source of the most valuable resource.', list_price: 4.99,
      image_url: 'https://upload.wikimedia.org/wikipedia/en/8/8e/Dune_%282021_film%29_logo.png'
    }
  ]);
  console.log(`Inserted ${movies.length} movies`);

  // --- CUSTOMERS ---
  const segments = [
    { segment_id: 1, name: 'Basic Subscriber', short_name: 'BASIC' },
    { segment_id: 2, name: 'Premium Subscriber', short_name: 'PREM' },
    { segment_id: 3, name: 'Family Plan', short_name: 'FAM' },
    { segment_id: 4, name: 'Student', short_name: 'STU' }
  ];
  const customers = await Customer.insertMany([
    { cust_id: 1, first_name: 'Ana', last_name: 'García', email: 'ana.garcia@email.com', country: 'Mexico', age: 28, income_level: 'Middle', segment: segments[1] },
    { cust_id: 2, first_name: 'Carlos', last_name: 'López', email: 'carlos.lopez@email.com', country: 'Mexico', age: 22, income_level: 'Low', segment: segments[3] },
    { cust_id: 3, first_name: 'María', last_name: 'Rodríguez', email: 'maria.rodriguez@email.com', country: 'Spain', age: 35, income_level: 'High', segment: segments[1] },
    { cust_id: 4, first_name: 'John', last_name: 'Smith', email: 'john.smith@email.com', country: 'USA', age: 42, income_level: 'High', segment: segments[1] },
    { cust_id: 5, first_name: 'Laura', last_name: 'Martínez', email: 'laura.martinez@email.com', country: 'Argentina', age: 31, income_level: 'Middle', segment: segments[2] },
    { cust_id: 6, first_name: 'David', last_name: 'Chen', email: 'david.chen@email.com', country: 'USA', age: 26, income_level: 'Middle', segment: segments[0] },
    { cust_id: 7, first_name: 'Sofia', last_name: 'Hernández', email: 'sofia.hernandez@email.com', country: 'Colombia', age: 19, income_level: 'Low', segment: segments[3] },
    { cust_id: 8, first_name: 'Ahmed', last_name: 'Hassan', email: 'ahmed.hassan@email.com', country: 'Egypt', age: 38, income_level: 'Middle', segment: segments[0] },
    { cust_id: 9, first_name: 'Yuki', last_name: 'Tanaka', email: 'yuki.tanaka@email.com', country: 'Japan', age: 29, income_level: 'High', segment: segments[2] },
    { cust_id: 10, first_name: 'Emma', last_name: 'Wilson', email: 'emma.wilson@email.com', country: 'UK', age: 45, income_level: 'High', segment: segments[1] },
    { cust_id: 11, first_name: 'Luis', last_name: 'Pérez', email: 'luis.perez@email.com', country: 'Mexico', age: 33, income_level: 'Middle', segment: segments[2] },
    { cust_id: 12, first_name: 'Fatima', last_name: 'Ali', email: 'fatima.ali@email.com', country: 'UAE', age: 27, income_level: 'High', segment: segments[1] },
    { cust_id: 13, first_name: 'Pedro', last_name: 'Santos', email: 'pedro.santos@email.com', country: 'Brazil', age: 21, income_level: 'Low', segment: segments[3] },
    { cust_id: 14, first_name: 'Isabelle', last_name: 'Dupont', email: 'isabelle.dupont@email.com', country: 'France', age: 36, income_level: 'Middle', segment: segments[0] },
    { cust_id: 15, first_name: 'Raj', last_name: 'Patel', email: 'raj.patel@email.com', country: 'India', age: 30, income_level: 'Middle', segment: segments[1] }
  ]);
  console.log(`Inserted ${customers.length} customers`);

  // --- ACTIVITIES ---
  const activityTypes = ['watch', 'rate', 'search', 'purchase'];
  const apps = ['web', 'mobile', 'smart_tv'];
  const devices = ['desktop', 'phone', 'tablet', 'tv'];
  const oss = ['macOS', 'Windows', 'iOS', 'Android', 'Tizen'];

  const activitiesData = [];
  for (let i = 0; i < customers.length; i++) {
    const numActivities = 2 + Math.floor(Math.random() * 3);
    for (let j = 0; j < numActivities; j++) {
      const randomMovie = movies[Math.floor(Math.random() * movies.length)];
      activitiesData.push({
        customer_id: customers[i]._id,
        movie_id: randomMovie._id,
        activity: activityTypes[Math.floor(Math.random() * activityTypes.length)],
        activity_time: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        app: apps[Math.floor(Math.random() * apps.length)],
        device: devices[Math.floor(Math.random() * devices.length)],
        os: oss[Math.floor(Math.random() * oss.length)]
      });
    }
  }
  const activities = await Activity.insertMany(activitiesData);
  console.log(`Inserted ${activities.length} activities`);

  console.log('Seed complete!');
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
```

- [ ] **Step 2: Run seed to verify**

```bash
npm run seed
# Expected:
# Connected. Dropping collections...
# Inserted 5 genres
# Inserted 20 movies
# Inserted 15 customers
# Inserted ~35-45 activities
# Seed complete!
```

---

## Task 4: Genre Routes

**Files:**
- Create: `routes/genres.js`

- [ ] **Step 1: Create `routes/genres.js`**

```js
const express = require('express');
const router = express.Router();
const Genre = require('../models/Genre');

// List all genres
router.get('/', async (req, res) => {
  const genres = await Genre.find().sort('name');
  res.render('genres/index', { genres });
});

// New genre form
router.get('/new', (req, res) => {
  res.render('genres/new', { error: null });
});

// Create genre
router.post('/', async (req, res) => {
  const { name } = req.body;
  const lastGenre = await Genre.findOne().sort('-genre_id');
  const genre_id = lastGenre ? lastGenre.genre_id + 1 : 1;
  await Genre.create({ genre_id, name });
  res.redirect('/genres');
});

// Edit genre form
router.get('/:id/edit', async (req, res) => {
  const genre = await Genre.findById(req.params.id);
  res.render('genres/edit', { genre });
});

// Update genre
router.post('/:id', async (req, res) => {
  const { name } = req.body;
  await Genre.findByIdAndUpdate(req.params.id, { name });
  res.redirect('/genres');
});

// Delete genre
router.post('/:id/delete', async (req, res) => {
  await Genre.findByIdAndDelete(req.params.id);
  res.redirect('/genres');
});

module.exports = router;
```

---

## Task 5: Movie Routes

**Files:**
- Create: `routes/movies.js`

- [ ] **Step 1: Create `routes/movies.js`**

```js
const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const Genre = require('../models/Genre');

// List movies with optional filter
router.get('/', async (req, res) => {
  const { search, genre } = req.query;
  const filter = {};
  if (search) filter.title = { $regex: search, $options: 'i' };
  if (genre) filter['genres.name'] = genre;
  const movies = await Movie.find(filter).sort('title');
  const genres = await Genre.find().sort('name');
  res.render('movies/index', { movies, genres, search: search || '', selectedGenre: genre || '' });
});

// New movie form
router.get('/new', async (req, res) => {
  const genres = await Genre.find().sort('name');
  res.render('movies/new', { genres });
});

// Create movie
router.post('/', async (req, res) => {
  const { title, year, runtime, summary, list_price, image_url, genreIds } = req.body;
  const lastMovie = await Movie.findOne().sort('-movie_id');
  const movie_id = lastMovie ? lastMovie.movie_id + 1 : 1;

  // Resolve selected genres from DB to embed snapshot
  const selectedIds = Array.isArray(genreIds) ? genreIds : (genreIds ? [genreIds] : []);
  const genreDocs = await Genre.find({ _id: { $in: selectedIds } });
  const genresEmbedded = genreDocs.map(g => ({ genre_id: g.genre_id, name: g.name }));

  // Parse cast and crew from textarea (one per line: "Name, Role")
  const castLines = (req.body.cast || '').split('\n').filter(Boolean);
  const cast = castLines.map(line => {
    const [name, role] = line.split(',').map(s => s.trim());
    return { name: name || '', role: role || '' };
  });
  const crewLines = (req.body.crew || '').split('\n').filter(Boolean);
  const crew = crewLines.map(line => {
    const [name, role] = line.split(',').map(s => s.trim());
    return { name: name || '', role: role || '' };
  });

  await Movie.create({
    movie_id,
    title,
    year: parseInt(year) || null,
    genres: genresEmbedded,
    cast,
    crew,
    runtime,
    summary,
    list_price: parseFloat(list_price) || 0,
    image_url,
    awards: { wins: 0, nominations: 0 },
    studio: { name: '' }
  });
  res.redirect('/movies');
});

// Show movie detail
router.get('/:id', async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.redirect('/movies');
  res.render('movies/show', { movie });
});

// Edit movie form
router.get('/:id/edit', async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  const genres = await Genre.find().sort('name');
  const castText = movie.cast.map(c => `${c.name}, ${c.role}`).join('\n');
  const crewText = movie.crew.map(c => `${c.name}, ${c.role}`).join('\n');
  const selectedGenreIds = movie.genres.map(g => g.genre_id);
  res.render('movies/edit', { movie, genres, castText, crewText, selectedGenreIds });
});

// Update movie
router.post('/:id', async (req, res) => {
  const { title, year, runtime, summary, list_price, image_url, genreIds } = req.body;

  const selectedIds = Array.isArray(genreIds) ? genreIds : (genreIds ? [genreIds] : []);
  const genreDocs = await Genre.find({ _id: { $in: selectedIds } });
  const genresEmbedded = genreDocs.map(g => ({ genre_id: g.genre_id, name: g.name }));

  const castLines = (req.body.cast || '').split('\n').filter(Boolean);
  const cast = castLines.map(line => {
    const [name, role] = line.split(',').map(s => s.trim());
    return { name: name || '', role: role || '' };
  });
  const crewLines = (req.body.crew || '').split('\n').filter(Boolean);
  const crew = crewLines.map(line => {
    const [name, role] = line.split(',').map(s => s.trim());
    return { name: name || '', role: role || '' };
  });

  await Movie.findByIdAndUpdate(req.params.id, {
    title, year: parseInt(year) || null, genres: genresEmbedded,
    cast, crew, runtime, summary,
    list_price: parseFloat(list_price) || 0, image_url
  });
  res.redirect('/movies');
});

// Delete movie
router.post('/:id/delete', async (req, res) => {
  await Movie.findByIdAndDelete(req.params.id);
  res.redirect('/movies');
});

module.exports = router;
```

---

## Task 6: Views — Layout + CSS

**Files:**
- Create: `views/layout.ejs`
- Create: `public/style.css`

- [ ] **Step 1: Create `views/layout.ejs`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MovieStream</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <nav>
    <a href="/movies" class="brand">MovieStream</a>
    <div class="nav-links">
      <a href="/movies">Películas</a>
      <a href="/genres">Géneros</a>
    </div>
  </nav>
  <main>
    <%- body %>
  </main>
</body>
</html>
```

- [ ] **Step 2: Install `express-ejs-layouts`**

```bash
npm install express-ejs-layouts
```

- [ ] **Step 3: Update `server.js` to use layouts**

Add after `app.set('views', ...)`:
```js
const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);
app.set('layout', 'layout');
```

- [ ] **Step 4: Create `public/style.css`**

```css
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #0f0f0f;
  color: #e0e0e0;
  min-height: 100vh;
}

nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: #1a1a1a;
  border-bottom: 1px solid #333;
}

.brand {
  font-size: 1.4rem;
  font-weight: 700;
  color: #e50914;
  text-decoration: none;
}

.nav-links a {
  color: #ccc;
  text-decoration: none;
  margin-left: 1.5rem;
  font-size: 0.95rem;
}

.nav-links a:hover { color: #fff; }

main { padding: 2rem; max-width: 1200px; margin: 0 auto; }

h1 { font-size: 1.8rem; margin-bottom: 1.5rem; }
h2 { font-size: 1.3rem; margin-bottom: 1rem; color: #ccc; }

.btn {
  display: inline-block;
  padding: 0.5rem 1.2rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: none;
  transition: opacity 0.2s;
}
.btn:hover { opacity: 0.85; }
.btn-primary { background: #e50914; color: #fff; }
.btn-secondary { background: #333; color: #e0e0e0; }
.btn-danger { background: #8b0000; color: #fff; }
.btn-sm { padding: 0.3rem 0.8rem; font-size: 0.8rem; }

.toolbar {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.toolbar input, .toolbar select {
  padding: 0.5rem 0.8rem;
  background: #1a1a1a;
  border: 1px solid #333;
  color: #e0e0e0;
  border-radius: 4px;
  font-size: 0.9rem;
}

/* Movie grid */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.2rem;
}

.card {
  background: #1a1a1a;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #222;
  transition: transform 0.2s;
}
.card:hover { transform: translateY(-3px); }

.card img {
  width: 100%;
  aspect-ratio: 2/3;
  object-fit: cover;
  display: block;
}

.card-body { padding: 0.7rem; }
.card-title { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.3rem; }
.card-meta { font-size: 0.75rem; color: #888; }

.card-actions { display: flex; gap: 0.4rem; margin-top: 0.5rem; }

/* Genre list */
.list { display: flex; flex-direction: column; gap: 0.5rem; }

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1rem;
  background: #1a1a1a;
  border-radius: 4px;
  border: 1px solid #222;
}

.list-actions { display: flex; gap: 0.5rem; }

/* Forms */
.form-card {
  background: #1a1a1a;
  border: 1px solid #222;
  border-radius: 8px;
  padding: 2rem;
  max-width: 600px;
}

.form-group { margin-bottom: 1.2rem; }
.form-group label { display: block; margin-bottom: 0.4rem; font-size: 0.85rem; color: #aaa; }
.form-group input, .form-group textarea, .form-group select {
  width: 100%;
  padding: 0.6rem 0.8rem;
  background: #111;
  border: 1px solid #333;
  color: #e0e0e0;
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: inherit;
}
.form-group textarea { resize: vertical; min-height: 80px; }

.checkbox-group { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.7rem;
  background: #111;
  border: 1px solid #333;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #ccc;
}

.form-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }

/* Movie detail */
.movie-detail { display: grid; grid-template-columns: 240px 1fr; gap: 2rem; }
.movie-detail img { width: 100%; border-radius: 6px; }
.tag {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  background: #e50914;
  color: #fff;
  border-radius: 3px;
  font-size: 0.75rem;
  margin-right: 0.3rem;
  margin-bottom: 0.3rem;
}
.detail-section { margin-top: 1.2rem; }
.detail-section h3 { font-size: 0.85rem; color: #888; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }

.placeholder-img {
  width: 100%;
  aspect-ratio: 2/3;
  background: #222;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  font-size: 2rem;
}
```

---

## Task 7: Genre Views

**Files:**
- Create: `views/genres/index.ejs`
- Create: `views/genres/new.ejs`
- Create: `views/genres/edit.ejs`

- [ ] **Step 1: Create `views/genres/index.ejs`**

```html
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
  <h1>Géneros</h1>
  <a href="/genres/new" class="btn btn-primary">+ Nuevo género</a>
</div>

<div class="list">
  <% genres.forEach(genre => { %>
    <div class="list-item">
      <span><%= genre.name %></span>
      <div class="list-actions">
        <a href="/genres/<%= genre._id %>/edit" class="btn btn-secondary btn-sm">Editar</a>
        <form action="/genres/<%= genre._id %>/delete" method="POST" style="display:inline" onsubmit="return confirm('¿Eliminar <%= genre.name %>?')">
          <button class="btn btn-danger btn-sm">Eliminar</button>
        </form>
      </div>
    </div>
  <% }) %>
  <% if (!genres.length) { %>
    <p style="color:#888">No hay géneros. <a href="/genres/new">Crea uno</a>.</p>
  <% } %>
</div>
```

- [ ] **Step 2: Create `views/genres/new.ejs`**

```html
<h1>Nuevo Género</h1>
<div class="form-card">
  <form action="/genres" method="POST">
    <div class="form-group">
      <label>Nombre</label>
      <input type="text" name="name" required autofocus>
    </div>
    <div class="form-actions">
      <button class="btn btn-primary">Guardar</button>
      <a href="/genres" class="btn btn-secondary">Cancelar</a>
    </div>
  </form>
</div>
```

- [ ] **Step 3: Create `views/genres/edit.ejs`**

```html
<h1>Editar Género</h1>
<div class="form-card">
  <form action="/genres/<%= genre._id %>" method="POST">
    <div class="form-group">
      <label>Nombre</label>
      <input type="text" name="name" value="<%= genre.name %>" required autofocus>
    </div>
    <div class="form-actions">
      <button class="btn btn-primary">Guardar</button>
      <a href="/genres" class="btn btn-secondary">Cancelar</a>
    </div>
  </form>
</div>
```

---

## Task 8: Movie Views

**Files:**
- Create: `views/movies/index.ejs`
- Create: `views/movies/show.ejs`
- Create: `views/movies/new.ejs`
- Create: `views/movies/edit.ejs`

- [ ] **Step 1: Create `views/movies/index.ejs`**

```html
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
  <h1>Películas</h1>
  <a href="/movies/new" class="btn btn-primary">+ Nueva película</a>
</div>

<form class="toolbar" method="GET" action="/movies">
  <input type="text" name="search" placeholder="Buscar por título..." value="<%= search %>">
  <select name="genre" onchange="this.form.submit()">
    <option value="">Todos los géneros</option>
    <% genres.forEach(g => { %>
      <option value="<%= g.name %>" <%= selectedGenre === g.name ? 'selected' : '' %>><%= g.name %></option>
    <% }) %>
  </select>
  <button class="btn btn-secondary">Buscar</button>
  <% if (search || selectedGenre) { %>
    <a href="/movies" class="btn btn-secondary">Limpiar</a>
  <% } %>
</form>

<div class="grid">
  <% movies.forEach(movie => { %>
    <div class="card">
      <a href="/movies/<%= movie._id %>">
        <% if (movie.image_url) { %>
          <img src="<%= movie.image_url %>" alt="<%= movie.title %>" loading="lazy">
        <% } else { %>
          <div class="placeholder-img">🎬</div>
        <% } %>
      </a>
      <div class="card-body">
        <div class="card-title"><%= movie.title %></div>
        <div class="card-meta"><%= movie.year %> · $<%= movie.list_price?.toFixed(2) %></div>
        <div class="card-actions">
          <a href="/movies/<%= movie._id %>/edit" class="btn btn-secondary btn-sm">Editar</a>
          <form action="/movies/<%= movie._id %>/delete" method="POST" onsubmit="return confirm('¿Eliminar?')">
            <button class="btn btn-danger btn-sm">×</button>
          </form>
        </div>
      </div>
    </div>
  <% }) %>
  <% if (!movies.length) { %>
    <p style="color:#888;grid-column:1/-1">No se encontraron películas.</p>
  <% } %>
</div>
```

- [ ] **Step 2: Create `views/movies/show.ejs`**

```html
<div style="margin-bottom:1rem">
  <a href="/movies" style="color:#888;text-decoration:none">← Volver</a>
</div>

<div class="movie-detail">
  <div>
    <% if (movie.image_url) { %>
      <img src="<%= movie.image_url %>" alt="<%= movie.title %>">
    <% } else { %>
      <div class="placeholder-img" style="border-radius:6px">🎬</div>
    <% } %>
    <div style="margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap">
      <a href="/movies/<%= movie._id %>/edit" class="btn btn-secondary">Editar</a>
      <form action="/movies/<%= movie._id %>/delete" method="POST" onsubmit="return confirm('¿Eliminar esta película?')">
        <button class="btn btn-danger">Eliminar</button>
      </form>
    </div>
  </div>

  <div>
    <h1><%= movie.title %></h1>
    <p style="color:#888;margin:0.3rem 0 1rem"><%= movie.year %> · <%= movie.runtime %> · $<%= movie.list_price?.toFixed(2) %></p>

    <div>
      <% movie.genres.forEach(g => { %>
        <span class="tag"><%= g.name %></span>
      <% }) %>
    </div>

    <div class="detail-section">
      <h3>Sinopsis</h3>
      <p style="line-height:1.6;color:#ccc"><%= movie.summary %></p>
    </div>

    <div class="detail-section">
      <h3>Reparto</h3>
      <% movie.cast.forEach(c => { %>
        <div style="font-size:0.9rem;margin-bottom:0.3rem"><strong><%= c.name %></strong> <span style="color:#888">— <%= c.role %></span></div>
      <% }) %>
    </div>

    <div class="detail-section">
      <h3>Crew</h3>
      <% movie.crew.forEach(c => { %>
        <div style="font-size:0.9rem;margin-bottom:0.3rem"><strong><%= c.name %></strong> <span style="color:#888">— <%= c.role %></span></div>
      <% }) %>
    </div>

    <div class="detail-section">
      <h3>Premios</h3>
      <p style="font-size:0.9rem"><%= movie.awards?.wins %> premios · <%= movie.awards?.nominations %> nominaciones</p>
    </div>

    <% if (movie.studio?.name) { %>
    <div class="detail-section">
      <h3>Estudio</h3>
      <p style="font-size:0.9rem"><%= movie.studio.name %></p>
    </div>
    <% } %>
  </div>
</div>
```

- [ ] **Step 3: Create `views/movies/new.ejs`**

```html
<h1>Nueva Película</h1>
<div class="form-card">
  <form action="/movies" method="POST">
    <div class="form-group">
      <label>Título *</label>
      <input type="text" name="title" required autofocus>
    </div>
    <div class="form-group">
      <label>Año</label>
      <input type="number" name="year" min="1888" max="2030">
    </div>
    <div class="form-group">
      <label>Géneros</label>
      <div class="checkbox-group">
        <% genres.forEach(g => { %>
          <label>
            <input type="checkbox" name="genreIds" value="<%= g._id %>">
            <%= g.name %>
          </label>
        <% }) %>
      </div>
    </div>
    <div class="form-group">
      <label>Reparto (una línea por actor: Nombre, Rol)</label>
      <textarea name="cast" placeholder="Leonardo DiCaprio, Cobb&#10;Ellen Page, Ariadne"></textarea>
    </div>
    <div class="form-group">
      <label>Crew (una línea: Nombre, Rol)</label>
      <textarea name="crew" placeholder="Christopher Nolan, Director"></textarea>
    </div>
    <div class="form-group">
      <label>Duración (ej: 148 min)</label>
      <input type="text" name="runtime">
    </div>
    <div class="form-group">
      <label>Sinopsis</label>
      <textarea name="summary" rows="4"></textarea>
    </div>
    <div class="form-group">
      <label>Precio ($)</label>
      <input type="number" name="list_price" step="0.01" min="0">
    </div>
    <div class="form-group">
      <label>URL de imagen (poster)</label>
      <input type="url" name="image_url">
    </div>
    <div class="form-actions">
      <button class="btn btn-primary">Guardar</button>
      <a href="/movies" class="btn btn-secondary">Cancelar</a>
    </div>
  </form>
</div>
```

- [ ] **Step 4: Create `views/movies/edit.ejs`**

```html
<h1>Editar: <%= movie.title %></h1>
<div class="form-card">
  <form action="/movies/<%= movie._id %>" method="POST">
    <div class="form-group">
      <label>Título *</label>
      <input type="text" name="title" value="<%= movie.title %>" required>
    </div>
    <div class="form-group">
      <label>Año</label>
      <input type="number" name="year" value="<%= movie.year %>" min="1888" max="2030">
    </div>
    <div class="form-group">
      <label>Géneros</label>
      <div class="checkbox-group">
        <% genres.forEach(g => { %>
          <label>
            <input type="checkbox" name="genreIds" value="<%= g._id %>"
              <%= selectedGenreIds.includes(g.genre_id) ? 'checked' : '' %>>
            <%= g.name %>
          </label>
        <% }) %>
      </div>
    </div>
    <div class="form-group">
      <label>Reparto (una línea por actor: Nombre, Rol)</label>
      <textarea name="cast"><%= castText %></textarea>
    </div>
    <div class="form-group">
      <label>Crew (una línea: Nombre, Rol)</label>
      <textarea name="crew"><%= crewText %></textarea>
    </div>
    <div class="form-group">
      <label>Duración</label>
      <input type="text" name="runtime" value="<%= movie.runtime || '' %>">
    </div>
    <div class="form-group">
      <label>Sinopsis</label>
      <textarea name="summary" rows="4"><%= movie.summary || '' %></textarea>
    </div>
    <div class="form-group">
      <label>Precio ($)</label>
      <input type="number" name="list_price" step="0.01" value="<%= movie.list_price || '' %>">
    </div>
    <div class="form-group">
      <label>URL de imagen</label>
      <input type="url" name="image_url" value="<%= movie.image_url || '' %>">
    </div>
    <div class="form-actions">
      <button class="btn btn-primary">Guardar</button>
      <a href="/movies/<%= movie._id %>" class="btn btn-secondary">Cancelar</a>
    </div>
  </form>
</div>
```

---

## Task 9: Smoke Test Locally

- [ ] **Step 1: Run seed + start server**

```bash
npm run seed && npm run dev
# Expected: "MongoDB connected" + "Server running on port 3000"
```

- [ ] **Step 2: Verify all routes work**

Open http://localhost:3000 and check:
- `/movies` — shows grid of 20 movies with images
- `/movies?search=inc` — shows Inception
- `/movies?genre=Sci-Fi` — shows Sci-Fi movies
- `/movies/new` — form with genre checkboxes
- Create a movie, confirm it appears in list
- Edit a movie, confirm changes persist
- Delete a movie, confirm it disappears
- `/genres` — shows 5 genres
- Create, edit, delete a genre

---

## Task 10: Deploy to Render

- [ ] **Step 1: Push to GitHub**

Create a public GitHub repo and push all files (`.env` must be in `.gitignore`).

```bash
git init
git add .
git commit -m "feat: moviestream mongodb app"
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

- [ ] **Step 2: Create Render web service**

1. Go to render.com → New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Build command:** `npm install`
   - **Start command:** `node server.js`
4. Add environment variable: `MONGODB_URI` = your Atlas connection string

- [ ] **Step 3: Atlas network access**

In MongoDB Atlas → Network Access → Add IP Address → `0.0.0.0/0` (allow all — required for Render's dynamic IPs).

- [ ] **Step 4: Verify public URL**

Open the Render URL in an incognito window. App must load with movies visible.

---

## Task 11: Write MODEL.md and REFLECTION.md

- [ ] **Step 1: Create `MODEL.md`** — document the 4 collections with JSON examples and justify each embed/reference decision (use the design spec as reference).

- [ ] **Step 2: Create `REFLECTION.md`** — answer the 3 reflection questions with concrete examples from your implementation:
  1. What you'd redesign and why
  2. Which CRUD operation felt forced vs a SQL JOIN
  3. Honest take: was NoSQL better for MovieStream?

- [ ] **Step 3: Create `README.md`** — project description, run-from-zero steps (`npm install` → set `.env` → `npm run seed` → `npm start`), stack rationale, screenshot.
