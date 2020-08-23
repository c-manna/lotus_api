var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');
var logger = require('morgan');
var favicon = require('serve-favicon');
var fileUpload = require('express-fileupload');
var fs = require('fs');

var routes = require('./routes/index');
var socketService = require("./services/socketService");
// var cronController = require("./models/cronController");




var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.engine('ejs', require('ejs').renderFile);
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(cors());
app.options('*', cors());
app.use(logger('dev'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  //console.log("corsssssssssss111111")
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.all("/*", function (req, res, next) {
  //   console.log("corsssssssssss",res)
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

  next();
});


// error handlers

// development error handler
// will print stacktrace
// if (app.get('env') === 'development') {
//   console.log("corsssssssssss222222222")
//   app.use(function (err, req, res, next) {
//     // console.log("corsssssssssss33333333")
//     res.status(err.status || 500);
//     res.render('error', {
//       message: err.message,
//       error: err
//     });
//   });
// }

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  if (typeof err == "string") {
    console.log(typeof err);
    return res.send({
      success: false,
      message: err
    });
  }
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;