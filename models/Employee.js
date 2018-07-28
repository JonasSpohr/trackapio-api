var mongoose = require('mongoose');

var EmployeeSchema = new mongoose.Schema({
  name: { type: String, require: true },
  phone: { type: String, require: true },
  socialNumber: { type: String, require: true },
  driverLicenseNumber: { type: String, require: true },
  address: {
    street: { type: String, require: true },
    number: { type: String, require: true },
    complement: { type: String, require: false },
    zipCode: { type: String, require: true },
    city: { type: String, require: true },
    state: { type: String, require: true },
    district: { type: String, require: true },
    country: { type: String, require: false }
  },
  email: { type: String, require: false },
  active: { type: Number, require: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
});

module.exports = mongoose.model('Employee', EmployeeSchema);