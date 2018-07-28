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

router.put('/', asyncHandler(async (req, res) => {
  let company = await Company.findById(req.body.companyId);

  if (company == null) {
    return res.send({ success: false, errorMessage: "Empresa informada é inválida." });
  }

  let employee = await Employee.findById(req.body._id);

  if (employee == null) {
    return res.send({ success: false, errorMessage: "Empregado informado é inválido." });
  }

  employee.name = req.body.name;
  employee.phone = req.body.phone;
  employee.socialNumber = req.body.socialNumber;
  employee.driverLicenseNumber = req.body.driverLicenseNumber;
  employee.email = req.body.email;

  employee.address.street = req.body.address.street;
  employee.address.number = req.body.address.number;
  employee.address.complement = req.body.address.complement;
  employee.address.zipCode = req.body.address.zipCode;
  employee.address.city = req.body.address.city;
  employee.address.state = req.body.address.state;
  employee.address.district = req.body.address.district;
  
  await employee.save();

  return res.send({ success: true, result: employee });
}));

router.get('/all/:companyId', asyncHandler(async (req, res) => {
  let company = await Company.findById(req.params.companyId);

  if (company == null) {
    return res.send({ success: false, errorMessage: "Empresa informada é inválida." });
  }

  let employees = await Employee.find({ company: req.params.companyId });

  return res.send({ success: true, result: employees });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  let employee = await Employee.findById(req.params.id);

  if (employee == null) {
    return res.send({ success: false, errorMessage: "Empregado informado é inválido." });
  }

  return res.send({ success: true, result: employee });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  let employee = await Employee.findByIdAndRemove(req.params.id);

  return res.send({ success: true, result: employee });
}));

module.exports = router;
