var https = require("https");
var querystring = require("querystring");

var sessionId = "";

exports.login = function (username, password) {
    return new Promise(function (resolve, reject) {
        if (sessionId) {
            return resolve(true);
        }

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
                resolve(buffer);
            });
        });
        req.end();
    });
};
