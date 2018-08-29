/*
 * Server related tasks
 *
 */

// Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');
var handlers = require('./handlers');
var helpers = require('./helpers');
var path = require('path');
var util = require('util');
var debug = util.debuglog('server');


// Instantiate the server module object
var server = {}

// Instantiate the HTTP server
server.http_server = http.createServer(function(req,res){
	server.unifiedServer(req,res);
});

// Instantiate the HTTPS server
// Define HTTPS server options
server.https_server_options = {
	'key' : fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
	'cert' : fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};
server.https_server = https.createServer(server.https_server_options,function(req,res){
	server.unifiedServer(req,res);
});

// Run the script
server.init = function(){
	// Start the HTTP server
	server.http_server.listen(config.http_port, function(){
		console.log('\x1b[36m%s\x1b[0m','The HTTP server is running on port '+config.http_port);
	});
	// Start the HTTPS server
	server.https_server.listen(config.https_port, function(){
		console.log('\x1b[35m%s\x1b[0m','The HTTPS server is running on port '+config.https_port);
	});
}

// All the server logic for both the HTTP and HTTPS server
server.unifiedServer = function(req,res){

	// Parse the URL
	var parsed_url = url.parse(req.url, true);

	// Get the path
	var path = parsed_url.pathname;
	var trimmed_path = path.replace(/^\/+|\/+$/g, '');

	// Get the query string as an object
	var query_string_object = parsed_url.query;

	// Get the HTTP method in lowercase
	var method = req.method.toLowerCase();

	// Get the headers as an object
	var headers = req.headers;

	// Get the payload, if any
	var decoder = new StringDecoder('utf-8');
	var buffer = '';
	req.on('data', function(data){
		buffer += decoder.write(data);
	});
	req.on('end', function(){
		buffer += decoder.end();

		// Check if a handler exist for the request defined in our router, if one is not found use the not_found handler instead.
		var handler = typeof(server.router[trimmed_path]) !== 'undefined' ? server.router[trimmed_path] : handlers.not_found;

		// If the request is within the public directory, use the public handler instead
		handler = trimmed_path.indexOf('public/') != -1 ? handlers.public : handler;

		// Construct the data object that will be send to the handler
		var data = {
			'trimmed_path' : trimmed_path,
			'query_string_object' : query_string_object,
			'method' : method,
			'headers' : headers,
			'payload' : helpers.parseJsonToObject(buffer) // We need to do this via custom function to avoid throwing any errors that could occur when doing a JSON.parse() which would stop our application!
		}

		// Send the request to the handler specified in the router
		handler(data, function(status, payload, type){

			// Determine the type of response (fallback to JSON)
			type = typeof(type) == 'string' ? type : 'json';

			// Use the status code returned from the handler, or set the default status code to 200
			status = typeof(status) == 'number' ? status : 200;

			// Return the response-parts that are content specific
			var payload_string = '';
			if(type=='json'){
				payload = typeof(payload) == 'object' ? payload : {};
				var payload_string = JSON.stringify(payload);
				res.setHeader('Content-Type', 'application/json');
			}
			if(type=='html'){
				payload_string = typeof(payload) == 'string' ? payload : '';
				res.setHeader('Content-Type', 'text/html');
			}
			if(type=='favicon'){
				payload_string = typeof(payload) !== 'undefined' ? payload : '';
				res.setHeader('Content-Type', 'image/x-icon');
			}
			if(type=='css'){
				payload_string = typeof(payload) !== 'undefined' ? payload : '';
				res.setHeader('Content-Type', 'text/css');
			}
			if(type=='png'){
				payload_string = typeof(payload) !== 'undefined' ? payload : '';
				res.setHeader('Content-Type', 'image/png');
			}
			if(type=='jpg'){
				payload_string = typeof(payload) !== 'undefined' ? payload : '';
				res.setHeader('Content-Type', 'image/jpeg');
			}
			if(type=='plain'){
				payload_string = typeof(payload) !== 'undefined' ? payload : '';
				res.setHeader('Content-Type', 'text/plain');
			}


			// Return the response-parts that are common to all content types
			res.writeHead(status);
			res.end(payload_string);

			// If response is 200, print green, otherwise print red
			if(status==200){
				debug('\x1b[32m%s\x1b[0m',method.toUpperCase()+' /'+trimmed_path+' '+status);
			}else{
				debug('\x1b[31m%s\x1b[0m',method.toUpperCase()+' /'+trimmed_path+' '+status);
			}

		});

	});

}

// Define the request router 
// This will route all the API request to the correct handler
server.router = {
	'' : handlers.index,

	'account/create' : handlers.accountsCreate,
	'account/edit' : handlers.accountsEdit,
	'account/delete' : handlers.accountsDelete,

	'session/create' : handlers.sessionsCreate,
	'session/deleted' : handlers.sessionsDeleted,
	
	'checks/all' : handlers.checksAll,
	'checks/create' : handlers.checksCreate,
	'checks/edit' : handlers.checksEdit,

	'ping' : handlers.ping,

	'api/checkout' : handlers.checkout,
	'api/cart' : handlers.cart,
	'api/menu' : handlers.menu,
	'api/users' : handlers.users,
	'api/tokens' : handlers.tokens,
	'api/checks' : handlers.checks,
	'favicon.ico' : handlers.favicon,
	'public' : handlers.public
};


// Export the module
module.exports = server;