// Include modules
var http = require('http');
var url = require('url');
var handlers = require('./lib/handlers');
var _data = require('./lib/data');


// TESTING
// @TODO delete this
_data.create('test', '7', {'foo' : 'bar'}, function(error){
	console.log('this was the error:', error);
});


// init HTTP server
var server = http.createServer(function(req, res){
	
	// Let's retrieve the requested URL and log it for
	console.log(req.url);
	
	// I wanted to know what the url.parse returns so I log it to the console.
	// library does when it's parsing the raw URL that the server returns so let's log this too
	var parsed_url = url.parse(req.url);
	console.log(parsed_url);

	/*
	The following is returned by url.parse():
	Url {
	  protocol: null,
	  slashes: null,
	  auth: null,
	  host: null,
	  port: null,
	  hostname: null,
	  hash: null,
	  search: '?test=Test%201',
	  query: 'test=Test%201',
	  pathname: '/hello////',
	  path: '/hello////?test=Test%201',
	  href: '/hello////?test=Test%201'
	}
	*/

	// When we would requeste the following url (with parameters) the parse function will return us a pathname that has stripped out the parameters
	// Or so called query strings, since we are not using any of those in our Restful API we simply do not need them.
	// /hello////?test=1234 will return /hello//// as it's pathname.
	// After we have aquired the pathname we only have to strip the leading and trailing slashes with a simple regex function
	var api_path = parsed_url.pathname.replace(/^\/+|\/+$/g, '');
	console.log(api_path);

	// Lets split the API path and execute a function accordingly
	var paths = api_path.split('/');
	
	// First check if we can find the first key
	console.log(paths);

	// Default status code is 404 not found
	var status_code = 404;

	if( paths[0] ) {
		if( paths[0]=='hello' ) {
			var result = {}
			var message = 'Hello: ';
			if( paths[1] ) {
				message += paths[1];
				result['username'] = paths[1];
			}else{
				message += 'World';
			}
			result['message'] = message;
			status_code = 200;
		}
	}else{
		// Return 404
		res.end('404 not found!');
	}

	// Set content typ to JSON
	res.setHeader('Content-Type', 'application/json');

	// Set status code
	res.writeHead(status_code);
	
	// Return json object, that contains a welcome message and holds the username
	// (username is basically the second path of the URL if any)
	res.end(JSON.stringify(result));

});

server.listen(3005, function(){
	console.log('The server is listening on port 3005');
});

// Define a request router
var router = {
	'ping' : handlers.ping,
	'users' : handlers.users
}