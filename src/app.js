var express = require("express");
var scraper = require("./scraper.js");

scraper.start();
var app = express();

app.get("/stations", function (req, res) {
    res.send(JSON.stringify(scraper.getStations()));
});

app.use(express.static("static"));

app.listen(3000);
