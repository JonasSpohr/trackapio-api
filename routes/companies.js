const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const SHA256 = require("crypto-js/sha256");

const User = require('../models/User.js');
const Company = require('../models/Company.js');

router.post('/', asyncHandler(async (req, res) => {
  let existingUser = await User.findById(req.body.userLoggedId);

  if (existingUser == null) {
    return res.send({ success: false, errorMessage: "Usuário logado inválido." });
  }

  let newCompany = new Company(req.body);
  newCompany.active = true;

  await newCompany.save();

  return res.send({ success: true, result: newCompany });  
}));

module.exports = router;
