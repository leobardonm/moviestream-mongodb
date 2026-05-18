const mongoose = require('mongoose');

const genreSchema = new mongoose.Schema({
  genre_id: { type: Number, required: true, unique: true },
  name: { type: String, required: true, trim: true }
});

module.exports = mongoose.model('Genre', genreSchema);
