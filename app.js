const express = require('express');
const cors = require('cors')
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const db = require('./bin/database');
//const fileUpload = require('express-fileupload');

const app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Origin, Origin, X-Requested-With, Content-Type, Accept, user_id, auth_token");
  next();
});

app.use(logger('dev'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(cookieParser());
//app.use(fileUpload());

/* ROUTES */
const auth = require('./routes/auth');
const users = require('./routes/users');
const schedule = require('./routes/schedule');
const companies = require('./routes/companies');
const employees = require('./routes/employees');
const smsnotification = require('./routes/smsnotification');

app.use('/api/auth', auth);
app.use('/api/users', users);
app.use('/api/schedules', schedule);
app.use('/api/companies', companies);
app.use('/api/employees', employees);
app.use('/api/smsnotification', smsnotification);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('URL not found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.send({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.send({
    message: err.message,
    error: {}
  });
});

module.exports = app;
