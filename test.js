var airnow = require('airnow');

var client = airnow({ apiKey: 'YOURAPIKEY' });

// build my options
var options = {
	zipCode: "02860",
	distance: 25,
	format: "application/json"
};

// get the current observations by zip
client.getObservationsByZipCode(options, function(err, observations){
	if (err){
		console.log('derp! an error calling getObservationsByZipCode: ' + err);
	} else {
		console.log(observations);
		// the world is good! start processing the observations
	}
});