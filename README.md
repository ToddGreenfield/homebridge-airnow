# Homebridge-airnow
[![NPM Version](https://img.shields.io/npm/v/homebridge-airnow.svg)](https://www.npmjs.com/package/homebridge-airnow)

Air Quality Index Sensor Plugin for [Homebridge](https://github.com/nfarina/homebridge)
This plugin allows you to monitor your current AirQuality from HomeKit and Siri.

Currently supports two AQI Services:
1. [AirNow](https://www.airnow.gov) which is limited to the USA. A valid ZipCode is required.
2. [Aqicn](https://www.aqicn.org) which has international support, provided by the [World Air Quality Index Project](http://waqi.info/).

Depending on where exactly you would like to monitor AQI, one service may be more appropriate than the other.

## Installation
1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-airnow`
3. Update your configuration file like the example below.
4. Ensure you have either an AirNow.gov or Aqicn.org API account to use that web service and have a valid API_KEY for that web service.
For assistance visit - https://docs.airnowapi.org/faq or http://aqicn.org/data-platform/token/#/.

This plugin will create an AirQualitySensor element. The Home app works well, but the Eve app seems to show more measurements. Measurements retrieved are PM2.5, PM10, & O3 for AirNow. Aqicn adds NO2, SO2, CO...  

## Configuration
Example config.json:

```js
"accessories": [
	{
		"accessory": "airnow",
		"name": "AirNow",
		"provider": "airnow",
		"airnow_api": "XXXXXX",
		"zipcode": "02860",
		"distance": "25",
		"aqicn_api": "XXXXXX",
		"aqicn_city": "@245",
		"polling": "30"
	}
],
```

## Explanation:

Field           		| Description
------------------------|------------
**accessory**   		| Required - Must be "airnow" (all lowercase).
**name**        		| Required - Name override for logging.
**provider**       		| Required - Name of the AQI provider service. Valid options are: airnow, aqicn. Default is airnow.
**airnow_api** 			| Optional - Required for AirNow.gov. YOUR API key from AirNow.gov.
**zipcode**				| Optional - Required and only for AirNow. This is the Zip code for the area being checked.
**distance**			| Optional - Optional and only used for AirNow.gov - Distance to search for monitoring station from zipcode. Defaults to 25 miles from zip.
**aqicn_api** 			| Optional - Required for Aqicn.org. YOUR API key from Aqicn.org.
**aqicn_city**			| Optional - Optional and only used for Aqicn.org - A valid city @code from http://aqicn.org/city/all/ OR defaults to 'here' which will use Geolocation based on your IP. The correct aqicn_city @code parameter using the below example for Reseda, Los Angeles would be @245. Hover over the search results and use the code at the bottom of the web page.![Example](https://user-images.githubusercontent.com/24653339/33373453-f6b84fb4-d4cf-11e7-9695-0f04a60ffdab.png)
**polling**				| Optional - Poll interval. Default is 0 minute, which is OFF or no polling.
