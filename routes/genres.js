const express = require('express');
const router = express.Router();
const Genre = require('../models/Genre');

// List all genres
router.get('/', async (req, res) => {
  try {
    const genres = await Genre.find().sort('name');
    res.render('genres/index', { genres });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// New genre form
router.get('/new', (req, res) => {
  res.render('genres/new');
});

// Create genre
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const lastGenre = await Genre.findOne().sort('-genre_id');
    const genre_id = lastGenre ? lastGenre.genre_id + 1 : 1;
    await Genre.create({ genre_id, name });
    res.redirect('/genres');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Edit genre form
router.get('/:id/edit', async (req, res) => {
  try {
    const genre = await Genre.findById(req.params.id);
    if (!genre) return res.redirect('/genres');
    res.render('genres/edit', { genre });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Update genre
router.post('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    await Genre.findByIdAndUpdate(req.params.id, { name });
    res.redirect('/genres');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Delete genre
router.post('/:id/delete', async (req, res) => {
  try {
    await Genre.findByIdAndDelete(req.params.id);
    res.redirect('/genres');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
