var mongoose = require('mongoose');

var PackageSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  route: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  }],
  address: {
    street: { type: String, require: true },
    number: { type: String, require: true },
    complement: { type: String, require: false },
    zipCode: { type: String, require: true },
    city: { type: String, require: true },
    state: { type: String, require: true },
    country: { type: String, require: true }
  },
  name: { type: String, required: true },
  estimatedDate: { type: Date, required: true },
  deliveredDate: { type: Date, required: false },
  number: { type: String, required: true },
  quantityItems: { type: Number, required: true },
  order: { type: Number, required: false },
  active: { type: Boolean, required: true },
  statusHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Status'
  }],
  smsSID : { type: String, required: false }
});

module.exports = mongoose.model('Package', PackageSchema);