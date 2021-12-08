var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const config = require('./config.json');
var cors = require('cors');
var https = require('https');
var http = require('http');
const fs = require('fs');

var indexRouter = require('./routes/index');

var app = express();

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

//HTTPS if ssl is set in config
if(config.sslCertificate && config.sslKey) {
  var privateKey = fs.readFileSync(config.sslKey, 'utf-8');
  var certificate = fs.readFileSync(config.sslCertificate, 'utf-8');

  var sslOptions = {
    key: privateKey,
    cert: certificate,
  }

  if(config.sslKeyphrase) {
    sslOptions.passphrase = config.sslKeyphrase;
  }

  https.createServer({sslOptions}, app).listen(config.port, () => {
    console.log(`Pazaak listening at https://localhost:${config.port}`)
  });

//otherwise fallback to http
} else {
  http.createServer(app).listen(config.port, () => {
    console.log(`Pazaak listening at http://localhost:${config.port}`)
  });
}

module.exports = app;
