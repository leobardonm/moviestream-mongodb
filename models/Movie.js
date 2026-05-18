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
