const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const SHA256 = require("crypto-js/sha256");

const User = require('../models/User.js');

router.post('/', asyncHandler(async (req, res) => {
  let newUser = new User(req.body);
  let existingUser = await User.findOne({ email: { $regex: new RegExp(req.body.email, "i") } });

  if (existingUser != null) {
    return res.send({ success: false, errorMessage: "Já existe um usuário com o email informado." });
  }

  newUser.active = true;
  newUser.pwd = SHA256(req.body.pwd).toString();
  newUser.authToken = SHA256('novo-usuario' + new Date() + req.body.email).toString();
  newUser.lastLogin = new Date();

  await newUser.save();

  let _return = {
    _id: newUser._id,
    authToken: newUser.authToken
  }

  return res.send({ success: true, result: _return });  
}));

module.exports = router;
