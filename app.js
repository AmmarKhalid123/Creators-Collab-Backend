var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');

var config = require('./config.js')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

// connecting with database //
const mongoose = require('mongoose');
const url = config.mongoUrl;
const connect = mongoose.connect(url, { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false });

connect.then((db) => {
  console.log("Connected to the server.");
}, (err) => {
  console.log(err);
});
// connected //
var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/projects', require('./routes/projects'));
app.use('/channels', require('./routes/channels'));
app.use('/projectUsers', require('./routes/projectUsers'));
app.use('/channelsData', require('./routes/channelData'));
app.use('/imgUpload', require('./routes/imageUpload'));
app.use('/invites', require('./routes/invitations'));
app.use('/notifications', require('./routes/notifications'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
