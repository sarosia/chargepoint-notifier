var fs = require("fs");
var colors = require("colors");
var agent = require("./agent.js");
var boxcar = require("./boxcar.js");

var config = JSON.parse(fs.readFileSync("config.json", { encoding: "utf8" }));
var username = config.username;
var password = config.password;
var stations = {};

exports.getStations = function () {
    return stations;
};

exports.start = function () {
    agent.login(username, password).done(function (auth, error) {

        var totalAvailable = 0;

        var updateChargeSpots = function () {
            var lat = config.lat;
            var lng = config.lng;
            var latDelta = config.latDelta;
            var lngDelta = config.lngDelta;

            agent.getChargeSpots(lat, lng, latDelta, lngDelta).done(function (value) {
                // Only scrapes for free charging stations.
                var summaries = JSON.parse(value)[0]["station_list"]["summaries"];
                summaries.filter(function (station) {
                    return station["payment_type"] === "free";
                });

                // Clear all stations before updating the stations info with latest
                // data from chargepoint.
                stations = {};

                // Aggregate station that with the same name but different #[0-9]+.
                for (var i = 0; i < summaries.length; i++) {
                    var summary = summaries[i];
                    var name = summary["station_name"].join(" ").split(",")[0];
                    var available = summary["port_count"]["available"];
                    var total = summary["port_count"]["total"];

                    var station = stations[name];
                    if (!station) {
                        station = stations[name] = {
                            name: name,
                            available: 0,
                            total: 0
                        };
                    }
                    station.available += available;
                    station.total += total;
                }

                console.log("Charge station status nearby:".yellow);

                var availableStations = [];
                var lastTotalAvailable = totalAvailable;
                totalAvailable = 0;
                for (var name in stations) {
                    var station = stations[name];
                    var available = station.available;
                    var total = station.total;
                    totalAvailable += available;

                    if (available > 0) {
                        console.log("\t" + (name + "\t\t" + available + "/" + total).green);
                        availableStations.push(name + ":\t" + available + "/" + total);
                    } else {
                        console.log("\t" + (name + "\t\t" + available + "/" + total).red);
                    }
                }

                // Send a notification to boxcar to notify that there is charging
                // station count change.
                if (totalAvailable !== lastTotalAvailable) {
                    boxcar.publish(config.boxcarToken,
                        totalAvailable + " charging stations are available.", 
                        "All available stations:\n" + availableStations.join("\n"),
                        "http://neptune.local:3000/");
                }

                setTimeout(updateChargeSpots, 60 * 1000);
            });
        };

        updateChargeSpots();
    });
};
