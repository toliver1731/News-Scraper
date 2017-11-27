const cheerio = require('cheerio');
const express = require('express');
const mongojs = require('mongojs');
const request = require('request');

 const app = express();
 
var databaseUrl = "news";
var articles = ["headlines"];

var db = mongojs(databaseUrl, articles);
db.on("error", function(error) {
	console.log("Database Error:", error);
});

app.get("/", function (req, res) {
	res.send("Hello World");
});

app.get("/all", function(req, res) {
	db.news.find({}, function (err, found) {
		if (err) {
			console.log(err);
		}

		else {
			res.json(found);
		}
	});
});

app.get("/scrape", function(req, res){

	request("https://www.npr.org", function(error, response, html){
		var $ = cheerio.load(html);

		$(".title").each(function (i, element) {
			var title = $(this).children("a").text();
			var link = $(this).children("a").attr("href");

			if (title && link) {
				db.headlines.save({
					title: title,
					link: link
				},
				function(error, saved) {
					if (error) {
						console.log(error);
					}
					else {
						console.log(saved);
					}
				

				});

			}
		});
	});

	res.send("Scrape Complete");

});


// request("https://www.npr.org", (error, response, html)=> {
// 	var $ = cheerio.load(html);

// 	$(".title").each(function (i, element) {
// 		console.log('-------------------');
// 		console.log($(element).text());
// 		var link = $(element).children().attr("href");
// 	});
// });

// ]

app.listen (3000, function() {
	console.log("App running on port 3000!");
});