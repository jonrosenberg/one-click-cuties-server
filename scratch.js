var config = require('./config');
var express = require('express');
var router = express.Router();
var io = require('socket.io')(80);

var Twit = require('twit')

var T = new Twit({
    consumer_key:         config.twitter.consumer_key
  , consumer_secret:      config.twitter.consumer_secret
  , access_token:         config.twitter.access_token
  , access_token_secret:  config.twitter.access_token_secret
});

var stream = T.stream('user', 'CuteEmergency')

/*
  stream.on('tweet', function (tweet) {
    console.log(tweet)
  });
*/
module.exports = router;
