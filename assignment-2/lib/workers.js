/*
 * Worker related tasks
 *
 */

// Dependencies
var path = require('path');
var fs = require('fs');
var _data = require('./data');
var http = require('http');
var https = require('https');
var helpers = require('./helpers');
var url = require('url');
var _logs = require('./logs');
var util = require('util');
var debug = util.debuglog('workers');

// Instantiate the worker module object
var workers = {};

// Do all the checks
// Retrieve all the checks for all users from the /.data/checks/ folder
// Get each check data and send it to the validator (do the request, return the status code etc.)
workers.do_checks = function(){
	// Get all the checks
	_data.list('checks',function(err,checks){
		if(!err && checks && checks.length > 0){
			checks.forEach(function(check){
				// Read in the check data
				_data.read('checks',check,function(err,data){
					if(!err && data){
						// Pass it to the check validator, and let that function continue the function or log the error(s) as needed
						workers.validate(data);
					}else{
						debug('Error reading one of the check\'s data: ',err);
					}
				});
			});
		}else{
			debug('Error: Could not find any checks to process');
		}
	});
};

// Sanity check the check data
workers.validate = function(data){
	data = typeof(data) == 'object' && data !== null ? data : {};

	data.id = typeof(data.id) == 'string' && data.id.trim().length == 20 ? data.id.trim() : false;
	data.userPhone = typeof(data.userPhone) == 'string' && data.userPhone.trim().length == 10 ? data.userPhone.trim() : false;
	data.protocol = typeof(data.protocol) == 'string' && ['http','https'].indexOf(data.protocol) > -1 ? data.protocol : false;
	data.url = typeof(data.url) == 'string' && data.url.trim().length > 0 ? data.url.trim() : false;
	data.method = typeof(data.method) == 'string' &&  ['post','get','put','delete'].indexOf(data.method) > -1 ? data.method : false;
	data.success_codes = typeof(data.success_codes) == 'object' && data.success_codes instanceof Array && data.success_codes.length > 0 ? data.success_codes : false;
	data.timeoutSeconds = typeof(data.timeoutSeconds) == 'number' && data.timeoutSeconds % 1 === 0 && data.timeoutSeconds >= 1 && data.timeoutSeconds <= 5 ? data.timeoutSeconds : false;

	// Set the keys that may not be set (if the workers have never seen this check before)
	data.state = typeof(data.state) == 'string' && ['up','down'].indexOf(data.state) > -1 ? data.state : 'down';
	data.last_checked = typeof(data.last_checked) == 'number' && data.last_checked > 0 ? data.last_checked : false;

	// If all checks pass, pass the data along to the next step in the process
	if(data.id && data.userPhone && data.protocol && data.url && data.method && data.success_codes && data.timeoutSeconds){
		workers.check(data);
	}else{
		// If checks fail, log the error and fail silently
		debug('Error: one of the checks is not properly formatted. Skipping.');
	}
};

// Perform the check, send the data and the outcome of the check process to the next step in the process
workers.check = function(data){

	// Prepare the inital check outcome
	var result = {
		'error' : false,
		'response_code' : false
	};

	// Mark that the outcome has not been sent yet
	var send = false;

	// Parse the hostname and path out of the data
	var parsed_url = url.parse(data.protocol+'://'+data.url, true);
	var hostname = parsed_url.hostname;
	var path = parsed_url.path; // Using path not pathname because we also require the query string

	// Configure the request details
	var request = {
		'protocol' : data.protocol+':',
		'hostname' : hostname,
		'method' : data.method.toUpperCase(),
		'path' : path,
		'timeout' : data.timeout * 1000
	};

	// Instantiate the request object (using either the http or https module)
	var module = data.protocol == 'http' ? http : https;
	var req = module.request(request, function(res){
		// Grab the status of the request
		var status = res.statusCode;
		
		// Update the result and pass the data along
		result.response_code = status;
		
		// Only process, if not send yet
		if(!send){
			workers.process_result(data,result);
			send = true;
		}
	});

	// Bind to the error event so it doesn't get thrown
	req.on('error',function(e){
		// Update the result and pass the data along
		result.error = {'error' : true, 'value' : e};
		if(!send){
			workers.process_result(data,result);
			send = true;
		}
	});

	// Bind to the timeout event
	req.on('timeout', function(){
		// Update the result and pass the data along
		result.error = {'error' : true, 'value' : 'timeout'};
		if(!send){
			workers.process_result(data,result);
			send = true;
		}
	});

	// End the request
	req.end();
};


// Process the check outcome (result), update the check data as needed, trigger an alert if needed
// Special logic for accomodating a check that has never been tested before (don't alert on that one)
workers.process_result = function(data,result){

	// First decide if the check is considered up or down
	var state = !result.error && result.response_code && data.success_codes.indexOf(result.response_code) != -1 ? 'up' : 'down';

	// Decide if an alert is warranted (when the state was changed from 'up' to 'down', or visa versa)
	var alert = data.last_checked && data.state !== state ? true : false;

	// Log the outcome
	var time = Date.now();
	workers.log(data,result,state,alert,time);

	// Update the check data
	data.state = state;
	data.last_checked = time;

	// Save the updates
	_data.update('checks',data.id,data,function(err){
		if(!err){
			// Send the new check data to the next phase in the process if needed
			if(alert){
				workers.alert(data);
			}else{
				debug('Check outcome has not changed, no alert needed');
			}
		}else{
			debug('Error trying to save updates to one of the checks');
		}
	});
};

// Alert the user when there was a change in their check status
workers.alert = function(data){
	var msg = 'Alert: Your check for '+data.method.toUpperCase()+' '+data.protocol+'://'+data.url+' is currently '+data.state;
	helpers.twilio(data.phone,msg,function(err){
		if(!err){
			debug('Success: User was alerted to a status change in their check, via sms: ',msg);
		}else{
			debug('Error: Could not send SMS alert to user who had a state change in their check',err);
		}
	});
};

// Send check data to a log file
workers.log = function(data,result,state,alert,time){
	// Form the log data
	var content = {
		'check' : data,
		'result' : result,
		'state' : state,
		'alert' : alert,
		'time' : time
	};

	// Convert the content to a string
	content = JSON.stringify(content);

	// Determine the name of the log file
	var file = data.id;

	// Append the log string to the file
	_logs.append(file,content,function(err){
		if(!err){
			debug('Logging to file succeeded');
		}else{
			debug('Logging to file failed');
		}
	});
};

// Timer to execute the worker process once per minute
workers.loop = function(){
	setInterval(function(){
		workers.do_checks();
	}, 1000 * 60); // every 60 seconds
};

// Rotate (compress) the log files
workers.compress_logs = function(){
	// List all the (non compressed) log files
	_logs.list(false,function(err,logs){
		if(!err && logs && logs.length > 0){
			logs.forEach(function(file){
				// Compress the data to a different file
				var file = file.replace('.log','');
				var new_file = file+'-'+Date.now();
				_logs.compress(file,new_file,function(err){
					if(!err){
						// Truncate (empty) the original log file now we have compressed the file successfully
						// However we do want to keep the original file, so we can later on revert compression if required
						_logs.truncate(file,function(erro){
							if(!err){
								debug('Successfully truncated logfile');
							}else{
								debug('Error truncating logfile');
							}
						});
					}else{
						debug('Error compressing one of the log files.',err);
					}
				});
			});
		}else{
			debug('Error: Could not find any logs to rotate');
		}
	});
};

// Timer to execute the log compression process once per day
workers.compression_loop = function(){
	setInterval(function(){
		workers.compress_logs();
	}, 1000 * 60 * 60 * 24); // Every 24 hours (e.g once per day)
}

// Init the script
workers.init = function(){

	// Send to console, in yellow
	console.log('\x1b[33m%s\x1b[0m','Background workers are running');

	// Execute all the checks immediately
	workers.do_checks();

	// Call the loop so the checks will execute later on
	workers.loop();

	// Compress all the logs immediately
	workers.compress_logs();

	// Call the compression loop to compress with a 24 hour interval
	workers.compression_loop();

};


// Export the module
module.exports = workers;
