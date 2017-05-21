var request = require("request");
var striptags = require("striptags");

var zip = "55343";
var distance = "25";
var airnow_api = "YOUR API KEY";

var url = "http://www.airnowapi.org/aq/observation/zipCode/current/?format=application/json&zipCode=" + zip +
		"&distance=" + distance + "&API_KEY=" + airnow_api;

		request({
			url: url,
			json: true
		}, function (err, response, observations) {
			if (!err && response.statusCode === 200){
				if (typeof observations[0] === 'undefined'){
					console.log("ERROR - Invalid ZipCode");
				} else if (typeof observations[0]["AQI"] === 'undefined') {
					console.log("ERROR - %s", striptags(observations));
				} else {
					for (var key in observations) {
						console.log("AirNow air quality AQI %s is: %s", observations[key]["ParameterName"], observations[key]["AQI"]);
					}
				}
			} else {
				console.log("Response Code %s Error: %s", response.code, err);
			}
		});
