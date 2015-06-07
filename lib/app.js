var express = require("express");
var scraper = require("./scraper.js");

exports.listen = function (port, hostname, backlog, callback) {
    scraper.start();
    var app = express();

    app.get("/stations", function (req, res) {
        res.send(JSON.stringify(scraper.getStations()));
    });

    app.use(express.static(__dirname + "/../static"));

    app.listen.apply(app, arguments);
};
