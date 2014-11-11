var config = require('./config');
var express = require('express');
var router = express.Router();
var Twit = require('twit');


var T = new Twit({
    consumer_key:         config.twitter.consumer_key
  , consumer_secret:      config.twitter.consumer_secret
  , access_token:         config.twitter.access_token
  , access_token_secret:  config.twitter.access_token_secret
});

var ratelimitFromResonse= function(response){

  var data= {
    remaining: response.headers['x-rate-limit-remaining'],
    reset: new Date(response.headers['x-rate-limit-reset'] * 1000)
  };

  return data;
};

//The tracklist will be feed to the stream. It's word specific and not user specific so
//don't throw common phrases in there
var TWEET_CACHE_LIMIT = 500;
var TRACKLIST = ['CuteEmergency'];
var USERCACHE = {};
var RESETTIME = new Date();
var REMAINING = 180;

var addTweetToUserCache = function(tweet){

  if(!USERCACHE[tweet.user.screen_name]){
      USERCACHE[tweet.user.screen_name] = { tweets: [tweet],
                                            lastupdate: new Date().getTime()
                                          }
  }else{

    if(USERCACHE[tweet.user.screen_name].tweets.length >= TWEET_CACHE_LIMIT){
      USERCACHE[tweet.user.screen_name].tweets.pop();
    }

    USERCACHE[tweet.user.screen_name].tweets.unshift(tweet);
  }
}

var getTimelineFromTwitter = function(handle, callback){




  T.get('statuses/user_timeline', { screen_name: handle, count: 200 }, function(err, data, response) {

    var info = ratelimitFromResonse(response);

    REMAINING = info.remaining;
    RESETTIME  = info.reset;

    if(err){
      //find out what rate limit error is
      //if it's rate limit we should return the cache instead of an error
      callback({error: err});

    }else{

      USERCACHE[handle] = {
        tweets: data,
        lastupdate: new Date().getTime()
      };

      callback(data);
    }
  });
}

var getApiTweetsHandle = function(handle, req, callback){
  //first things first, if we can't make an api call then send the cache
  if(!REMAINING){
    if(USERCACHE[handle]){
      callback( USERCACHE[handle] );
      return;
    }
    //if we don't have a cache send an error
    callback( {error: "rate limit exceeded, and nothing in cache for user: "+handle} );
    return;
  }

  //The cache exists if it's been less than a minute then send the cache
  if(USERCACHE[handle] && USERCACHE[handle].tweets.length){

    var now = new Date();
    var diff = (now.getTime() - USERCACHE[handle].lastupdate)/1000;

    if(diff < 60){
      callback( USERCACHE[handle] );
      return;
    }
  }

  //send updated data
  getTimelineFromTwitter(handle, function(data){
    callback( USERCACHE[handle] );
  });
}

router.get('/', function(req, res){

  var obj= {STATIC_SERVER:process.env.STATIC_SERVER};
  res.render('index', obj);
});

router.get('/api/usercache', function(req, res){
  res.json({usercache: USERCACHE,
            REMAINING: REMAINING,

           });
});

router.get('/api/limit_status', function(req, res){

  T.get('application/rate_limit_status',{}, function(err, data, response) {
    if(err){
      res.json({error: err});
    }else{
      res.json(data.resources.statuses["/statuses/user_timeline"]);
    }
  });
});

router.get('/api/tweets/:handle', function(req, res){

  var handle = req.param('handle');

  if(!handle){
    res.json({error: "no twitter handle"});
    return;
  }

  res.json( getApiTweetsHandle(handle, req) );
  
});

router.get('/api/tweetsmedia/:handle', function(req, res){

  
  var handle = req.param('handle');

  if(!handle){
    res.json({error: "no twitter handle"});
    return;
  }

  getApiTweetsHandle(handle, req, function(results){
    var tweets = results.tweets;

    debugger;


    var media = [];
    var m;

    for (var i = 0; i < tweets.length; i++) {
      if(tweets[i].entities.media){
        m = tweets[i].entities.media;

        console.log(i);
        console.log(m);

        for (var j = 0; j < m.length; j++) {
          media.push(m[j].media_url);
        };
        console.log(media);
      } 
    };

    debugger;

    if(media.length) {
      res.json( {"size": media.length, "media": media} );
    } else {
      res.json({error: "no media for this twitter handle"});
    }    
  });

});



var stream = T.stream('statuses/filter', { track: TRACKLIST })
  stream.on('tweet', function (tweet) {
    if(tweet.user.screen_name){
      addTweetToUserCache(tweet);
    }
});

module.exports = router;
