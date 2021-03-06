var https = require("https");
var querystring = require("querystring");

exports.publish = function (accessToken, title, message, url) {
    var postData = querystring.stringify({
        "user_credentials": accessToken,
        "notification[title]": title,
        "notification[long_message]": title + "\n" + message,
        "notification[open_url]": url
    });
   
    var options = {
        hostname: "new.boxcar.io",
        path: "/api/notifications",
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    };
    var req = https.request(options, function(res) {
        // We just try to send a notif and it does not really matter if it fails.
        // Just fire and forget the request.
    });
    req.write(postData);
    req.end();
};
