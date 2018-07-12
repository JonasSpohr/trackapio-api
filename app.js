const express = require('express');
const cors = require('cors')
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const db = require('./bin/database');

const app = express();

const whitelist = ['*']
app.use(cors(whitelist));

app.use(logger('dev'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(cookieParser());

/* ROUTES */
const auth = require('./routes/auth');
const users = require('./routes/users');

app.use('/api/auth', auth);
app.use('/api/users', users);

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
