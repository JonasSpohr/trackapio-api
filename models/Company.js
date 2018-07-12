var mongoose = require('mongoose');

var CompanySchema = new mongoose.Schema({
  name: { type: String, require: true },
  phone: { type: String, require: true },
  socialNumber: { type: String, require: true },
  address: {
    street: { type: String, require: true },
    number: { type: String, require: true },
    complement: { type: String, require: false },
    zipCode: { type: String, require: true },
    city: { type: String, require: true },
    state: { type: String, require: true },
    country: { type: String, require: true }
  },
  email: { type: String, require: true },
  active: { type: Number, require: true },
  employees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }]
});

module.exports = mongoose.model('Company', CompanySchema);