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
