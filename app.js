var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const config = require('./config.json');
var cors = require('cors');

var indexRouter = require('./routes/index');

var app = express();

// view engine setup
app.use(express.static(__dirname + '/public'))
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  console.log(err);

  // render the error page
  res.status(err.status || 500);
  res.sendFile('./public/html/error.html', {root: config.root});
});

app.listen(config.port, () => {
  console.log(`Pazaak listening at http://localhost:${config.port}`)
});

module.exports = app;
