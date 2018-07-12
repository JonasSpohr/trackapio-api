var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  pwd: { type: String, required: true },
  authToken: { type: String, required: true },
  lastLoginDate: { type: Date, required : false },
  active: Boolean
});

module.exports = mongoose.model('User', UserSchema);
