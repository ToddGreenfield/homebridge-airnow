var request = require("request");

var airnow_api = "YOUR API KEY";

var url = "http://api.waqi.info/feed/here/?token=" + airnow_api;

		request({
			url: url,
			json: true
		}, function (err, response, observations) {
			if (!err && response.statusCode === 200){
				console.log("AirNow API Result is: %s - %s", observations.status, observations.data);
				console.log("AirNow air quality is: %s", observations.data.aqi);
			} else {
				console.log("Response Code %s Error: %s", response.code, err);
			}
		});
