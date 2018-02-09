"use strict";
// AirNow (Air Quality Sensor) Accessory for HomeBridge
//
// Remember to add accessory to config.json. Example:
// "accessories": [
//     {
//         "accessory": "airnow",				// required (all lowercase)
//         "name": "AirNow",					// required - For homebridge and logging
//         "provider": "airnow",				// Optional - Service Provider - defaults to airnow. Valid options are: airnow, aqicn.
//
//         "airnow_api": "XXXXXX",				// Optional - Required for AirNow.gov YOUR_API key from AirNowapi.org OR Aqicn (waqi)
//         "zipcode": "90210",					// Optional - Required for AirNow.gov - Zip code for area being checked
//         "distance": "25",					// Optional - Only used for AirNow.gov - Defaults to 25 miles from zip
//
//         "aqicn_api": "XXXXXXX"       // Optional - Required for Aqicn.org YOUR_API key from aqcin.org (Provided by api.waqi.info)
//         "aqicn_city": "@245",				// Optional - Only For Aqicn.org - Valid city @code from http://aqicn.org/city/all/ OR defaults to 'here' which will use Geolocation based on your IP.
//
//         "polling": "30"        // Optional - defaults to OFF or 0. Time in minutes.
//     }
// ],
//
//
var lowerCase = require('lower-case');
var request = require("request");
var striptags = require("striptags");
var Service, Characteristic;

var airQualityService;

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-airnow", "airnow", AirNowAccessory);
}

function AirNowAccessory(log, config) {
    this.log = log;
    this.name = config['name'];
    this.provider = lowerCase(config['provider']) || "airnow";
    this.zip = config['zipcode'];
    this.distance = config['distance'] || '25';
    this.airnow_api = config['airnow_api'];
    this.aqicn_api = config['aqicn_api'];
    this.aqicn_city = config['aqicn_city'] || 'here';
    this.mpolling = config['polling'] || '0'; // Default is no polling.
    this.polling = this.mpolling;

	if (!this.provider) throw new Error("AirNow - You must provide a config value for 'provider'.");
	if (this.provider == "airnow" && !this.zip) throw new Error("AirNow - You must provide a config value for 'zipcode' if using provider Airnow.com.");
	if (this.provider == "airnow" && !this.airnow_api) throw new Error("AirNow - You must provide a config value for 'airnow_api' if using provider Airnow.gov.");
	if (this.provider == "aqicn" && !this.aqicn_api) throw new Error("AirNow - You must provide a config value for 'aqicn_api' if using provider Aqicn.org.");

	if (this.polling > 0) {
		var that = this;
		this.polling *= 60000;
		setTimeout(function() {
			that.servicePolling();
		}, this.polling);
	};

	this.log.info("AirNow using provider %s and Polling (minutes) is: %s", this.provider, (this.polling == '0') ? 'OFF' : this.mpolling);

}

AirNowAccessory.prototype = {

	servicePolling: function(){
		this.log.debug('AirNow Polling...');
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
      var url, aqi;
      aqi = 0;

		if (this.provider == "airnow") {
			url = "http://www.airnowapi.org/aq/observation/zipCode/current/?format=application/json&zipCode=" + this.zip +
			"&distance=" + this.distance + "&API_KEY=" + this.airnow_api;

			request({
				url: url,
				json: true
			}, function (err, response, observations) {
				if (!err && response.statusCode === 200){
					if (typeof observations[0] === 'undefined'){
						that.log.error("AirNow air quality Configuration Error - Invalid ZipCode for %s.", that.provider);
						that.airQualityService.setCharacteristic(Characteristic.StatusFault,1);
					} else if (typeof observations[0]["AQI"] === 'undefined') {
						that.log.error("AirNow air quality Observation Error - %s for %s.", striptags(observations), that.provider);
						that.airQualityService.setCharacteristic(Characteristic.StatusFault,1);
					} else {
						for (var key in observations) {
							switch (observations[key]["ParameterName"]) {
								case 'O3':
									that.airQualityService.setCharacteristic(Characteristic.OzoneDensity,parseFloat(observations[key]["AQI"]));
									break;
								case 'PM2.5':
									that.airQualityService.setCharacteristic(Characteristic.PM2_5Density,parseFloat(observations[key]["AQI"]));
									break;
								case 'PM10':
									that.airQualityService.setCharacteristic(Characteristic.PM10Density,parseFloat(observations[key]["AQI"]));
									break;
							}
              aqi = Math.max(aqi,parseFloat(observations[key]["AQI"])) // AirNow.gov defaults to MAX returned observation.
						}
            that.log.debug("AirNow air quality AQI is: %s", aqi.toString());
            that.airQualityService.setCharacteristic(Characteristic.StatusFault,0);
					}
				} else {
          that.log.error("AirNow air quality Network or Unknown Error from %s.", that.provider);
          that.airQualityService.setCharacteristic(Characteristic.StatusFault,1);
				}
				callback(that.trans_aqi(aqi));
			});
		} else if (this.provider == "aqicn") {
			url = "http://api.waqi.info/feed/" + this.aqicn_city + "/?token=" + this.aqicn_api;

			request({
				url: url,
				json: true
			}, function (err, response, observations) {
				if (!err && response.statusCode === 200 && observations.status == "ok" && observations.data.idx != "-1"){
					that.log.debug("AirNow air quality AQI is: %s", observations.data.aqi);
					that.airQualityService.setCharacteristic(Characteristic.StatusFault,0);
					(observations.data.iaqi.hasOwnProperty('o3')) ? that.airQualityService.setCharacteristic(Characteristic.OzoneDensity,parseFloat(observations.data.iaqi.o3.v)) : that.airQualityService.setCharacteristic(Characteristic.OzoneDensity,0);
					(observations.data.iaqi.hasOwnProperty('no2')) ? that.airQualityService.setCharacteristic(Characteristic.NitrogenDioxideDensity,parseFloat(observations.data.iaqi.no2.v)) : that.airQualityService.setCharacteristic(Characteristic.NitrogenDioxideDensity,0);
					(observations.data.iaqi.hasOwnProperty('so2')) ? that.airQualityService.setCharacteristic(Characteristic.SulphurDioxideDensity,parseFloat(observations.data.iaqi.so2.v)) : that.airQualityService.setCharacteristic(Characteristic.SulphurDioxideDensity,0);
					(observations.data.iaqi.hasOwnProperty('pm25')) ? that.airQualityService.setCharacteristic(Characteristic.PM2_5Density,parseFloat(observations.data.iaqi.pm25.v)) : that.airQualityService.setCharacteristic(Characteristic.PM2_5Density,0);
					(observations.data.iaqi.hasOwnProperty('pm10')) ? that.airQualityService.setCharacteristic(Characteristic.PM10Density,parseFloat(observations.data.iaqi.pm10.v)) : that.airQualityService.setCharacteristic(Characteristic.PM10Density,0);
					(observations.data.iaqi.hasOwnProperty('co')) ? that.airQualityService.setCharacteristic(Characteristic.CarbonMonoxideLevel,parseFloat(observations.data.iaqi.co.v)) : that.airQualityService.setCharacteristic(Characteristic.CarbonMonoxideLevel,0);
//					(observations.data.iaqi.hasOwnProperty('??')) ? that.airQualityService.setCharacteristic(Characteristic.VOCDensity,parseFloat(observations.data.iaqi.??.v)) : that.airQualityService.setCharacteristic(Characteristic.VOCDensity,0);
//					(observations.data.iaqi.hasOwnProperty('??')) ? that.airQualityService.setCharacteristic(Characteristic.CarbonDioxideLevel,parseFloat(observations.data.iaqi.??.v)) : that.airQualityService.setCharacteristic(Characteristic.CarbonDioxideLevel,0);

					aqi = parseFloat(observations.data.aqi);
				} else if (!err && observations.status == "error") {
					that.log.error("AirNow air quality Observation Error - %s from %s.", observations.data, that.provider);
        } else if (!err && observations.status == "ok" && observations.data.idx == "-1") {
					that.log.error("AirNow air quality Configuration Error - Invalid City Code from %s.", that.provider);
				} else {
					that.log.error("AirNow air quality Network or Unknown Error from %s.", that.provider);
					that.airQualityService.setCharacteristic(Characteristic.StatusFault,1);
				}
				callback(that.trans_aqi(aqi));
			});
		}
	},

    trans_aqi: function (aqi) {
		if (!aqi) {
			return(0); // Error or unknown response
		} else if (aqi <= 50) {
			return(1); // Return EXCELLENT
		} else if (aqi >= 51 && aqi <= 100) {
			return(2); // Return GOOD
		} else if (aqi >= 101 && aqi <= 150) {
			return(3); // Return FAIR
		} else if (aqi >= 151 && aqi <= 200) {
			return(4); // Return INFERIOR
		} else if (aqi >= 201) {
			return(5); // Return POOR (Homekit only goes to cat 5, so combined the last two AQI cats of Very Unhealty and Hazardous.
		} else {
			return(0); // Error or unknown response.
		}
    },


    identify: function (callback) {
        this.log("Identify requested!");
        callback(); // success
    },

    getServices: function () {
        var services = []
        var informationService = new Service.AccessoryInformation();

        informationService
                .setCharacteristic(Characteristic.Manufacturer, this.provider)
                .setCharacteristic(Characteristic.Model, (this.provider == "aqicn") ? ((this.aqicn_city == "here") ? "GeoLocation" : this.aqicn_city) : "Zip:" + this.zip)
                .setCharacteristic(Characteristic.SerialNumber, "Polling: " + this.mpolling);
		services.push(informationService);

        this.airQualityService = new Service.AirQualitySensor(this.name);
        this.airQualityService
                .getCharacteristic(Characteristic.AirQuality)
                .on('get', this.getAirQuality.bind(this));
		this.airQualityService.addCharacteristic(Characteristic.StatusFault); // Used if unable to connect to AQI services
		this.airQualityService.addCharacteristic(Characteristic.OzoneDensity);
		this.airQualityService.addCharacteristic(Characteristic.NitrogenDioxideDensity);
		this.airQualityService.addCharacteristic(Characteristic.SulphurDioxideDensity);
		this.airQualityService.addCharacteristic(Characteristic.PM2_5Density);
		this.airQualityService.addCharacteristic(Characteristic.PM10Density);
		this.airQualityService.addCharacteristic(Characteristic.CarbonMonoxideLevel);
		services.push(this.airQualityService);

        return services;
    }
};
