var https = require("https");
var querystring = require("querystring");
var winston = require("winston");
var logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            timestamp: true
        })
    ]
});

var sessionId = "";

exports.login = function (username, password) {
    return new Promise(function (resolve, reject) {
        if (sessionId) {
            return resolve(true);
        }

        logger.info("Login to chargepoint");

        var req = https.request({
            hostname: "na.chargepoint.com",
            method: "POST",
            path: "/users/validate",
            headers: {
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8"
            }
        }, function (res) {
            // We should have HTTP agent that pass along cookies in all requests.
            sessionId = res.headers["set-cookie"][0].split(";")[0];
            res.on("data", function (data) {
                if (JSON.parse(data).auth === true) {
                    resolve(true);
                } else {
                    reject("Failed to login");
                }
            });
        });

        req.write(querystring.stringify({
            user_name: username,
            user_password: password
        }));
        req.end();
    });
};

exports.getChargeSpots = function (lat, lng, latDelta, lngDelta) {
    return new Promise(function (resolve, reject) {

        logger.info("Getting charge spots near (" + lat + ", " + lng + ")");

        var query = querystring.stringify({
            lat: lat,
            lng: lng,
            ne_lat: lat + latDelta,
            ne_lng: lng + lngDelta,
            sw_lat: lat - latDelta,
            sw_lng: lng - lngDelta
        });
        var req = https.request({
            hostname: "na.chargepoint.com",
            method: "GET",
            path: "/dashboard/getChargeSpots?&" + query,
            headers: {
                cookie: sessionId
            }
        }, function (res) {
            var buffer = "";
            res.on("data", function (data) {
                buffer += data;
            });
            res.on("end", function () {
                if (res.statusCode === 200) {
                    try {
                        var result = JSON.parse(buffer)[0];
                        if (result["user_info"]["is_guest"] === 1) {
                            throw new Error("Session expired");
                        }
                        resolve(result["station_list"]["summaries"]);
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    // Reset the session ID so that we can authenticate again.
                    sessionId = null;
                    reject({
                        statusCode: res.statusCode,
                        message: buffer
                    });
                }
            });
        });
        req.end();
    });
};
