# Chargepoint Notifier

A very simple nodejs program that keeps scraping charge point station status and notify when there is avalaible charge station using boxcar.

## Install

```sh
$ npm install -g chargepoint-notifier
```

Chargepoint notifier depends on [Node.js](http://nodejs.org/) and [npm](http://npmjs.org/).

## Usage

You need to register a chargepoint account and obtain a boxcar access token before using this app. Then create a .chargepoint.json in the user home directory with the following content.

```json
{
    "username": "<chargepoint_username>",
    "password": "<chargepoint_password>",
    "lat": <latitude>,
    "lng": <longitude>,
    "latDelta": <latitude_delta>,
    "lngDelta": <longitude_delta>,
    "boxcarToken": "<boxcar_token>",
    "boxcarUrl": "<boxcar_notification_url>"
}
```

Start the application by running the following command.

```sh
$ chargepoint-notifier
```

You can access the chargepoint notifier webapp by browsing http://localhost:3000.

## License

Licensed under the MIT License
