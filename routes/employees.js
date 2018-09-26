const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const SHA256 = require("crypto-js/sha256");

const User = require('../models/User.js');
const Company = require('../models/Company.js');
const Employee = require('../models/Employee.js');
const Route = require('../models/Route.js');

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
  newUser.type = req.body.type;
  await newUser.save();

  let newEmployee = new Employee(req.body);
  newEmployee.active = true;
  newEmployee.user = newUser._id;
  newEmployee.type = req.body.type;
  newEmployee.company = req.body.type;

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
  employee.type = req.body.type;

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

router.get('/routes/today/:employeeId', asyncHandler(async (req, res) => {
  let page = 1;
  let maxItems = 100000;
  let start = new Date();
  start.setHours(0, 0, 0, 0);

  let end = new Date();
  end.setHours(23, 59, 59, 999);

  if (req.query.page) {
    page = req.query.page;
  }

  if (req.query.maxItems) {
    maxItems = req.query.maxItems;
  }

  let schedules = await Route.find({ employee: req.params.employeeId, dateSchedule: { $gte: start, $lt: end } })
    .populate("employee")
    .populate({
      path: 'packages',
      model: 'Package',
      populate: {
        path: 'statusHistory',
        model: 'Status'
      }
    })
    .populate({
      path: 'packages',
      model: 'Package',
      populate: {
        path: 'client',
        model: 'Client'
      }
    })
    .sort({ "dateSchedule": "descending" })
    .limit(maxItems)
    .skip(page == 1 ? 0 : (page - 1) * maxItems);

  return res.send({ success: true, result: schedules });
}));

module.exports = router;
