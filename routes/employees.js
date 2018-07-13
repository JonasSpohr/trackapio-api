const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const SHA256 = require("crypto-js/sha256");

const User = require('../models/User.js');
const Company = require('../models/Company.js');
const Employee = require('../models/Employee.js');

router.post('/', asyncHandler(async (req, res) => {
  let company = await Company.findById(req.body.companyId);

  if (company == null) {
    return res.send({ success: false, errorMessage: "Empresa informada é inválida." });
  }

  let newUser = new User();
  newUser.name = req.body.name;
  newUser.email = req.body.email;
  newUser.phone = req.body.phone;
  newUser.pwd = SHA256('12345678').toString();
  newUser.active = true;
  await newUser.save();

  let newEmployee = new Employee(req.body);
  newEmployee.active = true;
  newEmployee.user = newUser._id;
  newEmployee.company = req.body.companyId;

  await newEmployee.save();

  return res.send({ success: true, result: newEmployee });
}));

module.exports = router;
