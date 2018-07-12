var mongoose = require('mongoose');

var ClientSchema = new mongoose.Schema({
  name: { type: String, require: true },
  phone: { type: String, require: true },
  socialNumber: { type: String, require: false },
  address: [{
    street: { type: String, require: false },
    number: { type: String, require: false },
    complement: { type: String, require: false },
    zipCode: { type: String, require: false },
    city: { type: String, require: false },
    state: { type: String, require: false },
    country: { type: String, require: false }
  }],
  email: { type: String, require: false },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

module.exports = mongoose.model('Client', ClientSchema);