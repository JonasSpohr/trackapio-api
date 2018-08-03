var mongoose = require('mongoose');

var RouteSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  employee: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }],
  packages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package'
  }],
  dateSchedule: { type: Date, required: true },
  dateProcessed: { type: Date, required: false },
  active: { type: Boolean, required: true },
  urlNotificaton: { type: String, required: false },
  processed: { type: Boolean, required: false },
});

module.exports = mongoose.model('Route', RouteSchema);