var mongoose = require('mongoose');

var StatusSchema = new mongoose.Schema({
  status: { type: String, required: true },
  description: { type: String, required: false },
  date: { type: Date, required: true }
});

module.exports = mongoose.model('Status', StatusSchema);