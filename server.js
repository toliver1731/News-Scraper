var express = require("express");
var request = require("request");
var cheerio = require("cheerio");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var path = require("path");
mongoose.Promise = require('bluebird');

// Initialize Express
var app = express();

// Set up a static folder (public) for our web app
app.use(express.static("public"));

// Database configuration
// Save the URL of our database as well as the name of our collection
var connection = require("./config/connection.js");
app.use(bodyParser.urlencoded({ extended: false }));

// Models
var Article = require("./models/article.js");
var User = require("./models/user.js");
var Comment = require("./models/comment.js");

// Routes
app.get("/scrape", function(req, res) {
  request("https://www.nytimes.com/", function(error, response, html) {
    var $ = cheerio.load(html);
    var entriesList = [];    
    
    var i = 0;
    var p = Promise.resolve();
    $("article.story").each(function(i, element) {
      // each step of the each loop waits for the next to finish, and returns a new promise to continue the chain
      p = p.then(function(){ 
        var result = {};
        result.headline = $(element).find("h1.story-heading").text().trim() || 
        $(element).find("h2.story-heading").text().trim() || 
        $(element).find("h3.story-heading").text().trim();
        result.summary = $(element).children("p.summary").text().trim() || ""
        result.url = $(element).find("a").attr("href")||$(element).children("a.story-link");
        var entry = new Article(result);
        // save to db
        return new Promise(function(resolve, reject){
          entry.save(function(err, doc) {
            if (err) {
              // if duplicate article error, find the existing entry and add it to display list
              if(err.code===11000){
                Article.findOne({ "headline": result.headline })
                .populate("comments")
                .exec(function(err, doc){
                  if(err){
                    console.log(err);
                  } else{
                    if(doc != null){
                      entriesList.push(doc);
                    }
                  }
                  resolve();   
                })
              } 
              else{
                console.log("ERROR SAVING ARTICLE: "+err)
                resolve();
              }
            }
            // If not duplicate, push the entry to the display list
            else {
              if(entry != null){
                entriesList.push(entry);
              }
              resolve();
            }
          });
        });
      });    
    });
    // in the final p, after .each has completed, send back scraped data
    p.then(function(){
      res.send(entriesList);
    }).catch(function(err){
      console.log(err);
    })
  });
  
});

app.post("/write", function(req, res) {
  console.log(req.body)
  var comment = new Comment(req.body);
  comment.save(function(err, commentDoc) {
    if(err){
      console.log(err)
      if(err.code===11000){
        res.send("Sorry, we couldn't submit your comment! Please make sure you've filled out both of the boxes before clicking the submit button.")
      }
      res.send("Sorry, something went wrong with submitting your comment! Please fill out the fields and try again.")
    }
    else{
      // Find the corresponding article and add the comment
      Article.findByIdAndUpdate(
        { "_id": req.body.article }, 
        { "$push": { "comments": commentDoc._id }},
        {"new": true},
        function(err, articleDoc) {
          if(err){
            console.log(err);
            res.send("Sorry, we can't seem to find that article! Please refresh and try commenting again.")
          } else{
            res.send(articleDoc);
          }
        }
       ) 
    }
  })
});

app.get("/comments", function(req, res) {
  res.sendFile(path.join(__dirname, "./public/comments.html"));
});

app.get("/api/comments", function(req, res) {

  Comment.find({})
  .populate("article")
  .exec(function(err, doc){
    res.send(doc);
  });
});

// Set the app to listen on port 3000
app.listen(process.env.PORT || 3000, function() {
  console.log("App is running!");
});