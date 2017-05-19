"use strict";
// AirNow (Air Quality Sensor) Accessory for HomeBridge
//
// Remember to add accessory to config.json. Example:
// "accessories": [
//     {
//         "accessory": "AirNow",				// required
//         "name": "AirNow",					// Optional - defaults to AirNow
//         "airnow_api": "XXXXXX",				// required - YOUR API key from AirNow
//         "zipcode": "02860",					// required - Zip code for area being checked
//         "distance": "25",					// Optional - defaults to 25 miles from zip
//         "polling": "5"						// Optional - defaults to OFF or 0. Time in seconds.
//     }
// ], 
//
//

var airnow = require("airnow");
var Service, Characteristic;

var airQualityService;

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-airnow", "airnow", AirNowAccessory);
}

function AirNowAccessory(log, config) {
    this.log = log;
    this.name = config['name'] || 'AirNow';
    this.zip = config['zipcode'];
    this.distance = config['distance'] || '25';
    this.airnow_api = config['airnow_api'];
    this.polling = config['polling'] || '0'; // Default is no polling.
	
	if (!this.zip) throw new Error("AirNow - You must provide a config value for 'zipcode'.");
	if (!this.airnow_api) throw new Error("AirNow - You must provide a config value for 'airnow_api'.");

	this.client = airnow({ apiKey: this.airnow_api });

	this.options = {
		zipCode: this.zip,
		distance: this.distance,
		format: "application/json"
	};
	
	if (this.polling > 0) {
		var that = this;
		this.polling *= 60000;
		setTimeout(function() {
			that.servicePolling();
		}, this.polling);
	};

	this.log.info("AirNow Polling (minutes) is: %s", (this.polling == '0') ? 'OFF' : this.polling/60000);
	
}

AirNowAccessory.prototype = {
	
	servicePolling: function(){
		this.log.info('AirNow Polling...');
		this.getObservation(function(p) {
			var that = this;
			that.airQualityService.setCharacteristic(Characteristic.AirQuality, p);
			setTimeout(function() {
				that.servicePolling();
			}, that.polling);
		}.bind(this));
	},

    getAirQuality: function(callback){
        this.getObservation(function(a) {
            callback(null, a);
        });
    },

    getObservation: function (callback) {
    	var that = this;

		this.client.getObservationsByZipCode(this.options, function(err, observations){
			if (err){
				that.log.error('Error! An error calling getObservationsByZipCode: ' + err);
				callback(0);
			} else {
				that.log.info("AirNow air quality is: %s - %s", observations[0]["Category"]["Number"], observations[0]["Category"]["Name"]);
				if (observations[0]["Category"]["Number"] == "6") {
					callback(5); // Homekit only has 5 states, so if AirNow returns Hazardous, return max of 5.
				} else if (observations[0]["Category"]["Number"] == "7") {
					callback(0); // Homekit 0 state is unknown, AirNow unknown is 7.
				} else {
					callback(observations[0]["Category"]["Number"]);
				}
			}
		});
    },

    identify: function (callback) {
        this.log("Identify requested!");
        callback(); // success
    },
	
    getServices: function () {
        var services = []
        var informationService = new Service.AccessoryInformation();

        informationService
                .setCharacteristic(Characteristic.Manufacturer, "AirNow")
                .setCharacteristic(Characteristic.Model, "ZipCode")
                .setCharacteristic(Characteristic.SerialNumber, this.zip);
		services.push(informationService);
		
        this.airQualityService = new Service.AirQualitySensor(this.name);
        this.airQualityService
                .getCharacteristic(Characteristic.AirQuality)
                .on('get', this.getAirQuality.bind(this));
		services.push(this.airQualityService);
		
        return services;
    }
};