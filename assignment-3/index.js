/*
 * Primary file for API
 *
 */



/*
Homework Assignment #3

It is time to build a simple frontend for the Pizza-Delivery API you created in Homework Assignment #2. Please create a web app that allows customers to:
1. Signup on the site
2. View all the items available to order
3. Fill up a shopping cart
4. Place an order (with fake credit card credentials), and receive an email receipt

This is an open-ended assignment. You can take any direction you'd like to go with it, as long as your project includes the requirements. It can include anything else you wish as well. 

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
