//
var express = require('express');
var fs = require('fs');
var http = require('http');
var async = require('async');
var oauth = require('oauth');
var cookieParser = require('cookie-parser');
var routes = require('./server.routes');
var app = express();

app.set('views', __dirname + '/views');
app.set('views', __dirname + '/views');
app.set('view engine', 'hbs');
app.use(cookieParser());

app.use(express.static(__dirname + '/public'));

app.use('/', routes);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
var server = app.listen(process.env.PORT||3000, function() {
    console.log('Listening on port %d', server.address().port);
});


module.exports = app;
