const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const moment = require('moment');

router.post('/answer', asyncHandler(async (req, res) => {
  return res.send({ success: true, result: req.body });
}));

router.post('/fail', asyncHandler(async (req, res) => {
  return res.send({ success: true, result: req.body });
}));

module.exports = router;