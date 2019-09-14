// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var mongo = require('mongodb');
var mongoose = require('mongoose');


var multer = require('multer');
// here on HyperDev the fs is read only, 
// You have to upload the file to memory
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

var bodyParser = require('body-parser');
//var urlHandler = require('./urlHandler.js');
var mongoURL = process.env.MONGO_URI;
//var port = process.env.PORT || 3000;
var port = process.env.PORT;

//mongoose.connect(mongoURL);
mongoose.connect(mongoURL);
//mongoose.connect(process.env.mongoURL);

//app.use(cors());
app.use(bodyParser.urlencoded({'extended': false}));



// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});


// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  //res.json({greeting: 'hello API'});
  res.json(JSON.stringify(req.headers));
  //console.log();
});


var protocolRegExp = /^https?:\/\/(.*)/i;
var hostnameRegExp = /^([a-z0-9\-_]+\.)+[a-z0-9\-_]+/i;

//var newCounter = require('./urlHandler.js').Counters;
var dns = require('dns');
//var newUrlEntries = require('./urlHandler.js').UrlEntries;
var Schema = mongoose.Schema;
var urlEntriesSchema = new Schema ({
  url : {type: String, required: true},
  index : {type: Number, required: true}
});

var newUrlEntries = mongoose.model('UrlEntries', urlEntriesSchema);

var countersSchema = new Schema ({
  count : {type: Number, default: 1}
});

var Counters = mongoose.model('Counters', countersSchema);


var increaseCount = function (req, res, callback) {
  Counters
    .findOneAndUpdate({}, {$inc:{'count': 1}},function(err, data) {
      if (err) return;
      if (data) {
        callback(data.count);
      } else {
        var newCounter = new Counters();
        newCounter
          .save(function(err) {
            if (err) return;
            Counters
              .findOneAndUpdate({}, {$inc:{'count': 1}},function(err, data) {
                if (err) return;
                callback(data.count);
              });
          });
      }
    });
};


//var increaseCount = require('./urlHandler.js').getCountAndIncrease;

app.post('/api/shorturl/new', function (req, res) {
  var url = req.body.url;
    
    // "www.example.com/test/" and "www.example.com/test" are the same URL
    if ( url.match(/\/$/i))
      url = url.slice(0,-1);
    
    var protocolMatch = url.match(protocolRegExp);
    if (!protocolMatch) {
      return res.json({"error": "invalid URL"});
    }
    
    // remove temporarily the protocol, for dns lookup
    var hostAndQuery = protocolMatch[1];

    // Here we have a URL w/out protocol
    // DNS lookup: validate hostname
  var hostnameMatch = hostAndQuery.match(hostnameRegExp);
  console.log('Your app is listening on port ' + hostnameMatch[0]);
    if (hostnameMatch) {
      // the URL has a valid www.whaterver.com[/something-optional] format
      dns.lookup(hostnameMatch[0], function(err) {
        if(err) {
          // no DNS match, invalid Hostname, the URL won't be stored
          res.json({"error": "invalid Hostname"});
        } else {
          // URL is OK, check if it's already stored
          newUrlEntries
            .findOne({"url": url}, function(err, storedUrl) {
              if (err) {
                console.log('error 1');
                return;
              }
              if (storedUrl) {
                // URL is already in the DB, return the matched one
                res.json({"original_url": url, "short_url": storedUrl.index});
              } else {
                // Increase Counter and store the new URL,
                increaseCount(req, res, function(cnt) {
                  var localUrlEntry = new newUrlEntries({
                    'url': url,
                    'index': cnt
                  });
                  // then return the stored data.
                  localUrlEntry
                  .save(function(err) {
                    if (err) {
                      console.log('error 2');
                      return;
                    }
                    res.json({"original_url": url, "short_url": cnt});
                  });
                });
              }
            });
          }
        });
      } else {
        // the URL has not a www.whatever.com format
        res.json({"error": "invalid URL"});
      }
    
    
  
  
});

//var lookupShortUrl = require('./urlHandler.js').processShortUrl;
//app.get("/api/shorturl/:shurl", lookupShortUrl);


app.get('/api/shorturl/:shurl', function (req, res) {
  var shurl = req.params.shurl;
  if (!parseInt(shurl,10)) {
    // The short URL identifier is not a number
    res.json({"error":"Wrong Format"});
    return;
  }
  newUrlEntries
      .findOne({"index": shurl}, function (err, data) {
        if (err) return;
        if (data){
          // redirect to the stored page
          res.redirect(data.url);
        } else {
          res.json({"error":"No short url found for given input"});
        }
      });
  
  
  
});

app.post('/api/fileanalyse',upload.single('upfile'), function(req, res){
   res.json({
    'name' : req.file.originalname,
    'type' : req.file.mimetype,
    'size' : req.file.size
   });
});


/** Timestamp Microservice */
app.route("/api/timestamp/:date_string?").get(function(req, res){
    var date = null;
    
    if (undefined !== req.params.date_string) {
      var unixTime = parseInt(req.params.date_string);
      if (isNaN(unixTime)) {
        date = new Date(req.params.date_string);
      } else {
        date = new Date(unixTime);
      }
    } else {
      date = new Date();
    }

    var result = date == null ? 
      { error: "Invalid Date" } :
      { "unix": date.getTime(),
        "utc": date.toUTCString()
      };
    
    res.json(result);
});

app.route('/api/whoami')
  .get(function(req, res){
    res.json({ipaddress: req.ip, language: req.headers['accept-language'], software: req.headers['user-agent']});
  });


// listen for requests :)
var listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});