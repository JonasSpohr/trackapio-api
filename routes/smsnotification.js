const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const moment = require('moment');

const Package = require('../models/Package.js');
const Status = require('../models/Status.js');

router.post('/answer', asyncHandler(async (req, res) => {
  let pkg = await Package.findOne({ smsSID: req.body.sms_id });

  let newStatus = new Status();

  if (pkg != null) {
    newStatus.status = parseTextAnswer(req.body.resposta);
    newStatus.date = new Date();
    newStatus.description = 'A resposta do cliente foi: ' + newStatus.status;

    await newStatus.save();

    pkg.statusHistory.push(newStatus._id) /
      await pkg.save();
  }

  console.log(newStatus);

  return res.send({ success: true, result: "OK" });
}));

router.post('/fail', asyncHandler(async (req, res) => {
  return res.send({ success: true, result: req.body });
}));

function parseTextAnswer(text) {
  if (text.toString().toUpperCase() == 'SIM') {
    return "CONFIRMADO"
  }

  if (text.toString().toUpperCase() == 'NÃO' || text.toString().toUpperCase() == 'NAO') {
    return "CANCELADO"
  }

  return text;
}

module.exports = router;