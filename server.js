// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

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
  res.json({greeting: 'hello API'});
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
/*
app.get("/api/timestamp/:date_string", function(req, res, next) {
{
  req.time = new Date(req.params.date_string).toUTCString(); 
  req.now = new Date().getTime();
} 
next();
}, function(req, res) {
res.json({"unix": null, "utc" : req.time});
})
*/



// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});