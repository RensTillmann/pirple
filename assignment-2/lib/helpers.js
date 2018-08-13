/* 
 * Helpers for various tasks/functions
 *
 */

// Dependencies
var config = require('./config');
var crypto = require('crypto');
var https = require('https');
var querystring = require('querystring');

// Container for all the helpers
var helpers = {};


// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(string){
	try{
		return JSON.parse(string);
	}catch(e){
		return {};
	}
};

// Create a SHA256 hash
helpers.hash = function(string){
	if(typeof(string) == 'string' && string.length > 0){
		var hash = crypto.createHmac('sha256', config.hashing_secret).update(string).digest('hex');
		return hash;
	}else{
		return false;
	}
};

// Create a string of random alphanumerice characters, of a given length
helpers.createRandomString = function(strLength){
	strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
	if(strLength){
		// Define all the possible characters that could go into a string
		var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

		// Start the final string
		var str = '';
		for(i = 1; i <= strLength; i++) {
			// Get a random charactert from the possibleCharacters string
			var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
			// Append this character to the string
			str+=randomCharacter;
		}
		// Return the final string
		return str;
	} else {
		return false;
	}
};


// Send SMS through Twilio API
helpers.twilio = function(phone,msg,callback){
	// Validate parameters
	phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
	msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
	if(phone && msg){

		// Configure the request payload
		var payload = {
			'From' : config.twilio.from_phone,
			'To' : '+31'+phone,
			'Body' : msg
		};
		var payload = querystring.stringify(payload);

		// Configure the request details
		var request = {
			'protocol' : 'https:',
			'hostname' : 'api.twilio.com',
			'method' : 'POST',
			'path' : '2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
			'auth' : config.twilio.accountSid+':'+config.twilio.authToken,
			'headers' : {
				'Content-Type' : 'application/x-www-form-urlencoded',
				'Content-Length' : Buffer.byteLength(payload)
			}
		};

		// Instantiate the request object
		var req = https.request(request, function(res){
			// Grab the status of the request
			var status = res.statusCode;
			// Callback successfully if the request went through (and the SMS was send through the Twilio API)
			if(status==200 || status==201){
				callback(false);
			}else{
				callback('Status code returned was '+status);
			}
		});

		// Bind to the error event so it doesn't get thrown
		req.on('error',function(e){
			callback(e);
		})

		// Add the payload
		req.write(payload);

		// End the request
		req.end();

	}else{
		callback('Given parameters were missing or invalid');
	}
};


// Export the module
module.exports = helpers;