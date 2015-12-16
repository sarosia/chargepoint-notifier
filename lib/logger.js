var winston = require("winston");
var logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            timestamp: function () {
                return (new Date()).toString();
            }
        })
    ]
});

module.exports = logger;
