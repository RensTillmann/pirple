/*
 * Primary file for API
 *
 */

// Dependencies
var server = require('./lib/server');
var workers = require('./lib/workers');

// Declare the app
var app = {};

// Init function
app.init = function(){

	// Start the server
	server.init();

	// Start the workers
	workers.init();

}

// Start the app
app.init();

// Export the app
module.exports = app;
