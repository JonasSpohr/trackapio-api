var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: false },
  pwd: { type: String, required: false },
  authToken: { type: String, required: false },
  lastLoginDate: { type: Date, required : false },
  active: Boolean
});

module.exports = mongoose.model('User', UserSchema);
