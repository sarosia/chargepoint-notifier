var fs = require("fs");
var colors = require("colors");
var agent = require("./agent.js");
var boxcar = require("./boxcar.js");
var winston = require("winston");
var logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            timestamp: true
        })
    ]
});

var config = JSON.parse(fs.readFileSync(process.env["HOME"] + "/.chargepoint.json", { encoding: "utf8" }));
var username = config.username;
var password = config.password;
var stations = {};

exports.getStations = function () {
    var ret = [];
    for (var key in stations) {
        ret.push(stations[key]);
    }
    return ret;
};

exports.start = function () {

    var totalAvailable = 0;

    var updateChargeSpots = function () {

        var lat = config.lat;
        var lng = config.lng;
        var latDelta = config.latDelta;
        var lngDelta = config.lngDelta;

        agent.login(username, password).then(function (auth) {

            agent.getChargeSpots(lat, lng, latDelta, lngDelta).then(function (value) {
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

                var availableStations = [];
                var lastTotalAvailable = totalAvailable;
                totalAvailable = 0;
                for (var name in stations) {
                    var station = stations[name];
                    var available = station.available;
                    var total = station.total;
                    totalAvailable += available;

                    logger.info("Available station station for %s: %d/%d", name, available, total);
                    if (available > 0) {
                        availableStations.push(name + ":\t" + available + "/" + total);
                    }
                }

                // Send a notification to boxcar to notify that there is charging
                // station count change.
                if (totalAvailable !== lastTotalAvailable) {
                    boxcar.publish(config.boxcarToken,
                        totalAvailable + " charging stations are available.", 
                        "All available stations:\n" + availableStations.join("\n"),
                        config.boxcarUrl);
                }

                setTimeout(updateChargeSpots, 60 * 1000);
            }, function (error) {
                logger.error(error); 
                setTimeout(updateChargeSpots, 60 * 1000);
            });
        });
    };

    updateChargeSpots();
};
