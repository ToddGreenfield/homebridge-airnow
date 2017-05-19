# Homebridge-airnow
[![NPM Version](https://img.shields.io/npm/v/homebridge-airnow.svg)](https://www.npmjs.com/package/homebridge-airnow)

Air Quality Sensor Plugin for [Homebridge](https://github.com/nfarina/homebridge) leveraging [AirNow](https://www.airnow.gov) and the [airnow-api](https://github.com/Asthmapolis/airnow).

This plugin allows you to monitor your current AirQuality from HomeKit and Siri.

## Installation
1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-airnow`
3. Update your configuration file like the example below.
4. Ensure you have an AirNow account to use the web service and have a valid API_KEY. For assistance visit - https://docs.airnowapi.org/faq.

This plugin will create an AirQualitySensor element.

## Configuration
Example config.json:

```js
"accessories": [
     {
         "accessory": "AirNow",
         "name": "AirNow",
         "airnow_api": "XXXXXX",
         "zipcode": "02860",
         "distance": "25",
         "polling": "5"
     }
], 
```

## Explanation:

Field           		| Description
------------------------|------------
**accessory**   		| Required - Must always be "AirNow".
**name**        		| Optional - Name override for the logging. Default is AirNow. 
**airnow_api** 			| Required - YOUR API key from AirNow.
**zipcode**				| Required - Zip code for area being checked.
**distance**			| Optional - Distance to search for monitoring station from zipcode. Defaults to 25 miles from zip.
**polling**				| Optional - Poll interval. Default is 0 sec, which is OFF or no polling.