/*
Homework Assignment #2

You are building the API for a pizza-delivery company. Don't worry about a frontend, just build the API. Here's the spec from your project manager: 

1. New users can be created, their information can be edited, and they can be deleted. We should store their name, email address, and street address.

2. Users can log in and log out by creating or destroying a token.

3. When a user is logged in, they should be able to GET all the possible menu items (these items can be hardcoded into the system). 

4. A logged-in user should be able to fill a shopping cart with menu items

5. A logged-in user should be able to create an order. You should integrate with the Sandbox of Stripe.com to accept their payment. Note: Use the stripe sandbox for your testing. Follow this link and click on the "tokens" tab to see the fake tokens you can use server-side to confirm the integration is working: https://stripe.com/docs/testing#cards

6. When an order is placed, you should email the user a receipt. You should integrate with the sandbox of Mailgun.com for this. Note: Every Mailgun account comes with a sandbox email account domain (whatever@sandbox123.mailgun.org) that you can send from by default. So, there's no need to setup any DNS for your domain for this task https://documentation.mailgun.com/en/latest/faqs.html#how-do-i-pick-a-domain-name-for-my-mailgun-account
*/


/*
Define the API queries that will be made by the application

// Create a new user
// The user id will be generated on the fly, and will not be included in the http request
URL: domain.com/user/add
DATA: {id: "1234", username: "johnmiller", password: "anypass", name: "John Miller", email: "john@miller.com", street: "458 Ridgeview St."}

// Login users
URL: domain.com/users/login
DATA: {username: "johnmiller", password: "anypass" }

// Logout users
// We will logout the user based on the parsed token
// The tokens are connected with a user ID
URL: domain.com/users/logout
DATA: {token: "1a48Bxl......."}

// Retrieve all menu items via http GET request
// Only logged in users can get menu items with a valid token
URL: domain.com/items/list
DATA: {token: "1a48Bx1......."}

// Add menu items to the shopping cart
// Only allow this action with a valid token, and parse the item ID's that the user had chosen from
// When processed it will create a new order with a unique ID
URL: domain.com/cart/add
DATA: {token: "1a48Bx1.......", items: "123,124,125"}

// Submit order to Stripe API
// Parse the order ID to the Stripe API for later processing (when payment was completed, to update order history for users, or to send confirmation emails etc.)
URL: domain.com/cart/checkout
DATA: {token: "1a48Bx1.......", order: "123456"}
*/


var http = require('http');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var helpers = require('./lib/helpers');
var fs = require('fs');

// init HTTP server
var server = http.createServer(function(req, res){
	
	// Parse the requested URL
	var parsed_url = url.parse(req.url);

	// Strip all slashes from start and end of the URL, plus any duplicate slashes
	var api_path = parsed_url.pathname.replace(/^\/+|\/+$/g, '');

	// Split the URL by slashes to return the API method that is being requested	
	var paths = api_path.split('/');

	// Set default status code to 404 (not found)
	var status_code = 404;

	// Return object to user
	var result = {};

	// Get HTTP method
	var method = req.method.toLowerCase();

	// Get the headers as an object
	var headers = req.headers;

	// Get the payload (this will contain the submitted data that was posted through the API request)
	var decoder = new StringDecoder('utf-8');
	var buffer = '';
	req.on('data', function(data){
		buffer += decoder.write(data);
	});
	req.on('end', function(){
		buffer += decoder.end();

		

		// Check if the first query string was set for this request
		if( paths[0] ) {

			// Set the route of the request e.g: users, items or cart 
			var route = paths[0];
			
			// Set the action of the request
			var action = '';
			if( paths[1] ) {
				action = paths[1];
			}

			// Log query strings to console
			console.log('Method:', method, 'Route:', route, 'Action:', action);

			// Users route
			if( route=='users') {

				// Create a new user
				if( action=='add' && method=='post' ) {
					// @TODO create a user

					// Validate data
					buffer = JSON.parse(buffer);
					var error_msg = '';
					if( buffer.username.length < 2 ) {
						error_msg = 'Username to short!';
					}
					if( buffer.password.length < 6 ) {
						error_msg = 'Password is not strong enough!';
					}
					if( buffer.name.length < 2 ) {
						error_msg = 'Please enter your name!';
					}
					if( buffer.street.length < 6 ) {
						error_msg = 'Please provide your street address!';
					}
					if(error_msg!=''){
						console.log(error_msg);
					}else{
						// No errors where found, we can proceed creating the user
						
						// Check if the username already exists, if so, we must return an error and also delete the previously generated user ID because it's now obsolete
						fs.open('.data/users/'+buffer.username+'.json', 'r', (err, fd) => {
							if (err) {
								if (err.code === 'ENOENT') { // Error, No Entity/Entry

									// First generate a unique user ID
									// Generate a unique ID, then check if it already exists, if it does exists, regenerate, until we have a unique ID that does not exist yet
									helpers.users.generate_id(buffer.username, false, false, true, 10, function(user_id){

										// Add the ID to the buffer, to connect the user with the ID
										// This way we can lookup users by their username as well as their user ID
										buffer.id = user_id;

										// Create the user file
										fs.writeFile('.data/users/'+buffer.username+'.json', JSON.stringify(buffer), (err) => {
											if(!err){
												console.log('The user has been created!');
											} else{
												console.log('Error creating new user!');
											}
										});

									});
								}
							}else{

								console.error('This username already exists!');

								// Close the file descriptor
								fs.close(fd, function(err){
									if(err){
										console.log('Error closing file!');
									}
								});

							}
						});

					}

					// If .data/users folder exists, check if the username exists, if not create a new user

						// If user was created, automatically create a new token for the user, so that the user can instantly order from the menu
						// Normally we would of course validate the user account via either e-mail confirmation or any other method... this is just a demo

				}

				// Login users
				if( action=='login' && method=='post' ) {
					// @TODO create token

					// Validate that the user exists

					// If users exists check if the username and passwords are correct

					// If validation passed, we can create a new token for this user


				}

				// Logout users
				if( action=='logout' && method=='post' ) {
					// @TODO remove token

					// Remove token from user

				}

			}

			// Menu items route
			if( route=='items') {

				// Retrieve all menu items via http GET request
				if( action=='list' && method=='get' ) {
					// @TODO return list of menu items

					// Check if token is valid

					// If token is valid, return the menu list

				}

			}

			// Shopping cart route
			if( route=='cart') {
				
				// Add menu items to the shopping cart
				if( action=='add' && method=='post' ) {
					// @TODO add menu items to new order, append new items if order exists

					// Check if token is valid

					// If token is valid, add menu item to the shopping cart (e.g: order)
					// If no order exists, create a new order
					// If order already exists, append the items to the existing order

				}

				// Submit order to Stripe API
				if( action=='checkout' && method=='post' ) {
					// @TODO save order, and send user to Stripe

					// Check if token is valid

					// The order is already saved at this stage, but we can change it's status to "awaiting payment".

					// Send the user to Stripe payment processor

					// Wait for Stripe callback, and process the order in our system, and change the status to "completed" or any other status depending on Stripe's callback

					// If payment was completed, send user a receipt via email trhough Mailgun.com API

				}
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


});

server.listen(3005, function(){
	console.log('The server is listening on port 3005');
});
