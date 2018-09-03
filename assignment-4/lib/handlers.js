/*
 * Request handlers (or in other words, these functions will handle the API requests)
 *
 */

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');
var stripe = require("stripe")(config.stripe_key);
var mailgun = require('mailgun-js')({apiKey: config.mailgun_key, domain: config.mailgun_domain});

// Define all the handlers
var handlers = {};

/*
 * HTML Handlers
 *
 */

// Index handler
handlers.index = function(data,callback){
	// Only accept GET requests
	if(data.method == 'get'){

		// Prepare {tags} for interpolation
		var template_tags = {
			'head.title' : 'WebRehab',
			'head.description' : 'WordPress maintenance, plugin development and security',
			'content.title' : 'Uptime monitoring',
			'content.tagline' : 'Made simple',
			'content.blurb' : 'We ofer free, simple uptime monitoring for HTTP/HTTPS sites of all kinds. When your site goes down, we\'ll send you a text to let you know.',
			'body.class' : 'index'
		}

		// Read in a template as a string
		helpers.get_template('index',template_tags,function(err,str){
			if(!err && str){
				// Add the universal header and footer
				helpers.process_template(str,template_tags,function(err,str){
					if(!err && str){
						callback(200,str,'html');
					}else{
						callback(500,undefined,'html');
					}
				});
			}else{
				callback(500,undefined,'html');
			}
		});
	}else{
		callback(405,undefined,'html');
	}
}

// Create Account
handlers.account_create = function(data,callback){
	// Only accept GET requests
	if(data.method == 'get'){

		// Prepare {tags} for interpolation
		var template_tags = {
			'head.title' : 'WebRehab - Create an Account',
			'head.description' : 'Signup is easy and only takes a few seconds.',
			'body.class' : 'account-create',
			'content.title' : 'Create Your Account',
			'content.tagline' : 'Signup is easy and only takes a few seconds',

		}

		// Read in a template as a string
		helpers.get_template('account_create',template_tags,function(err,str){
			if(!err && str){
				// Add the universal header and footer
				helpers.process_template(str,template_tags,function(err,str){
					if(!err && str){
						callback(200,str,'html');
					}else{
						callback(500,undefined,'html');
					}
				});
			}else{
				callback(500,undefined,'html');
			}
		});
	}else{
		callback(405,undefined,'html');
	}
};

// Edit Account
handlers.account_edit = function(data,callback){
	// Only accept GET requests
	if(data.method == 'get'){

		// Prepare {tags} for interpolation
		var template_tags = {
			'head.title' : 'WebRehab - Edit your Account',
			'body.class' : 'account-edit',
			'content.title' : 'Edit Your Account',
			'content.tagline' : 'Change your account info'
		}

		// Read in a template as a string
		helpers.get_template('account_edit',template_tags,function(err,str){
			if(!err && str){
				// Add the universal header and footer
				helpers.process_template(str,template_tags,function(err,str){
					if(!err && str){
						callback(200,str,'html');
					}else{
						callback(500,undefined,'html');
					}
				});
			}else{
				callback(500,undefined,'html');
			}
		});
	}else{
		callback(405,undefined,'html');
	}
};

// Account has been deleted
handlers.account_deleted = function(data,callback){
	// Only accept GET requests
	if(data.method == 'get'){

		// Prepare {tags} for interpolation
		var template_tags = {
			'head.title' : 'Account Deleted',
			'head.description' : 'Your account has been deleted.',
			'body.class' : 'account-deleted',
			'content.title' : 'Account Deleted',
			'content.tagline' : 'Your account has been deleted'
		}

		// Read in a template as a string
		helpers.get_template('account_deleted',template_tags,function(err,str){
			if(!err && str){
				// Add the universal header and footer
				helpers.process_template(str,template_tags,function(err,str){
					if(!err && str){
						callback(200,str,'html');
					}else{
						callback(500,undefined,'html');
					}
				});
			}else{
				callback(500,undefined,'html');
			}
		});
	}else{
		callback(405,undefined,'html');
	}
};	


// Create new session
handlers.session_create = function(data,callback){
	// Only accept GET requests
	if(data.method == 'get'){

		// Prepare {tags} for interpolation
		var template_tags = {
			'head.title' : 'WebRehab - Login to your Account',
			'head.description' : 'Please enter your email address and password.',
			'body.class' : 'session-create',
			'content.title' : 'Login to your Account',
			'content.tagline' : 'Enter your email address and password',

		}

		// Read in a template as a string
		helpers.get_template('session_create',template_tags,function(err,str){
			if(!err && str){
				// Add the universal header and footer
				helpers.process_template(str,template_tags,function(err,str){
					if(!err && str){
						callback(200,str,'html');
					}else{
						callback(500,undefined,'html');
					}
				});
			}else{
				callback(500,undefined,'html');
			}
		});
	}else{
		callback(405,undefined,'html');
	}
}

// Delete a session
handlers.session_deleted = function(data,callback){
	// Only accept GET requests
	if(data.method == 'get'){

		// Prepare {tags} for interpolation
		var template_tags = {
			'head.title' : 'WebRehab - Logged Out',
			'head.description' : 'You have been logged out of your account.',
			'body.class' : 'session-deleted',
			'content.title' : 'Logged Out',
			'content.tagline' : 'You have been logged out of your account',

		}

		// Read in a template as a string
		helpers.get_template('session_deleted',template_tags,function(err,str){
			if(!err && str){
				// Add the universal header and footer
				helpers.process_template(str,template_tags,function(err,str){
					if(!err && str){
						callback(200,str,'html');
					}else{
						callback(500,undefined,'html');
					}
				});
			}else{
				callback(500,undefined,'html');
			}
		});
	}else{
		callback(405,undefined,'html');
	}
}


// Favicon handler
handlers.favicon = function(data,callback){
	// Only accept GET requests
	if(data.method == 'get'){
		// Read in the favicon's data
		helpers.get_static_asset('favicon.ico',function(err,data){
			if(!err && data){
				callback(200,data,'favicon');
			}else{
				callback(500);
			}
		});
	}else{
		callback(405);
	}
}

// Public assets handler
handlers.public = function(data,callback){
	// Only accept GET requests
	if(data.method == 'get'){
		// Get the filename being requested
		var name = data.trimmed_path.replace('public/','').trim();
		if(name.length > 0){
			// Read in the asset's data
			helpers.get_static_asset(name,function(err,data){
				if(!err && data){
					// Determine the content type (default to plain text)
					var content_type = 'plain';
					if(name.indexOf('.css') != -1){
						content_type = 'css';
					}
					if(name.indexOf('.png') != -1){
						content_type = 'png';
					}
					if(name.indexOf('.jpg') != -1){
						content_type = 'jpg';
					}
					if(name.indexOf('.ico') != -1){
						content_type = 'favicon';
					}
					callback(200,data,content_type);
				}else{
					callback(404);
				}
			})
		}else{
			callback(404);
		}
	}else{
		callback(405);
	}
}

/*
 * JSON API Handlers
 *
 */

// Ping
handlers.ping = function(data,callback){
	setTimeout(function(){
		callback(200); // 200 implies that the response contains a payload
	},5000);
};

// Not found
handlers.not_found = function(data,callback){
	callback(404); // 404 Not Found
};


// Checkout cart / create order
handlers.checkout = function(data,callback){
	var accepted_methods = ['put'];
	if(accepted_methods.indexOf(data.method) != -1){
		handlers._checkout[data.method](data,callback);
	}else{
		callback(405); // 405 Method Not Allowed
	}
};

// Container for the checkout
handlers._checkout = {};

// PUT
// Create a new order (update user orders)
// Required payload data: email, items
// Required headers: token
handlers._checkout.put = function(data,callback){
	// Check that all require dfields are filled out
	var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
	var items = typeof(data.payload.items) == 'object' && data.payload.items instanceof Object ? data.payload.items : [];
	if(email && items){

		// Get token from headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
		// Verify that the given token is valid for the email
		handlers._tokens.verify(token,email,function(valid){
			if(valid){
				// Lookup the user
				_data.read('users',email,function(err,data){
					if(!err && data){
						if(items) {

							// Loop through the payload items, and add the menu item information (name, price). and append the quantity
							var amount = 0; // Total order amount
							var order_items = [];
							Object.keys(items).forEach(function(index) {
								var val = items[index];
								if(config.menu_items[index]){
									amount = amount + config.menu_items[index].price * val;
									config.menu_items[index].quantity = val;
									order_items.push(config.menu_items[index]);
								}
							});

							// Update data only if necessary
							if(order_items.length){
								if(typeof data.orders === 'undefined'){
									data.orders = new Array();
								}
								data.orders.push([{
									date: Date.now(),
									items: order_items
								}]);



								_data.update('users',email,data,function(err){
									if(!err){
										stripe.charges.create({
										  	amount: amount,
										  	currency: 'usd',
										    description: 'Pizza order',
										  	source: 'tok_visa',
										  	receipt_email: 'jenny.rosen@example.com',
										}).then((charge) => {

											// Send confirmation email
											var html = 'Order completed, you can view your order below:';
											html += '<table>';
												html += '<tr><th>Quantity</th><th>Item</th><th>Price</th><th>Amount</th></tr>';
												order_items.forEach(function(value){
													html += '<tr><td>'+value.quantity+' x</td><td>'+value.name+'</td><td align="right">$'+(value.price/100)+',-</td><td align="right">$'+((value.price/100)*value.quantity)+',-</td></tr>';
												});
												html += '<tr><td colspan="3" align="right">Total</td><th align="right">$'+(amount/100)+',-</th></tr>';
											html += '</table>';
											var data = {
											  from: 'Pizza Tokio <no-reply@pizza-tokio.com>',
											  to: 'feeling4design@gmail.com',
											  subject: 'Pizza will be delivered shortly!',
											  html: html
											};
											mailgun.messages().send(data, function (err, body) {
												if(!err){
													callback(200);
													console.log(body);
												}else{
													callback(500, {'Error' : err});
													console.log(err);
												}
											});

										}).catch((err) => {
										    callback(500, {'Error' : err});
										});
									}else{
										callback(500, {'Error' : 'Could not create order.'}); // 500 Internal Server Error
									}
								});


							}else{
								callback(500, {'Error' : 'There was nothing to be added to the order, perhaps the menu item no longer exists.'}); // 500 Internal Server Error
							}
						}
					}else{
          				callback(400, {'Error' : 'Specified user does not exist.'}); // 400 Bad Request Error
					}
				});
			}else{
				callback(403, {"Error" : "Missing required token in header, or token is invalid."}); // 403 Forbidden Error
			}
		});

	}else{
		callback(400, {'Error' : 'Missing required fields'}); // 400 Bad Request Error
	}
}


// Shpping cart
handlers.cart = function(data,callback){
	var accepted_methods = ['get', 'put'];
	if(accepted_methods.indexOf(data.method) != -1){
		handlers._cart[data.method](data,callback);
	}else{
		callback(405); // 405 Method Not Allowed
	}
};

// Container for the shopping cart
handlers._cart = {};

// PUT
// Update users shopping cart items
// Required payload data: email
// Required headers: token
// Optional data: items (contains the menu item ID's that need to be added and it's quantity) e.g  {"1": "1", "2": "3", "3": "1"}
handlers._cart.put = function(data,callback){
	// Check for required field
	var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
	if(email){

		// Check for optional fields
		var items = typeof(data.payload.items) == 'string' && data.payload.items.trim().length > 0 ? data.payload.items.trim() : false;

    	// Error if nothing is sent to update
    	if(items){
    		// Get token from headers
    		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
			// Verify that the given token is valid for the email
			handlers._tokens.verify(token,email,function(valid){
				if(valid){
					// Lookup the user
					_data.read('users',email,function(err,data){
						if(!err && data){
							// Update data only if necessary
							if(items) data.cart = items;

							// Store the new data
							_data.update('users',email,data,function(err){
								if(!err){
									callback(200);
								}else{
									callback(500, {'Error' : 'Could not update cart items.'}); // 500 Internal Server Error
								}
							});
						}else{
              				callback(400, {'Error' : 'Specified user does not exist.'}); // 400 Bad Request Error
						}
					});
				}else{
					callback(403, {"Error" : "Missing required token in header, or token is invalid."}); // 403 Forbidden Error
				}
			});

    	}else{
    		callback(400,{'Error' : 'Missing fields to update.'}); // 400 Bad Request Error
    	}

	}else{
		callback(400, {'Error' : 'Missing required field'}); // 400 Bad Request Error
	}

}

// GET
// Retrieve shopping cart
// Required query string: email
// Required headers: token
handlers._cart.get = function(data,callback){
	var email = typeof(data.query_string_object.email) == 'string' && data.query_string_object.email.trim().length > 0 ? data.query_string_object.email.trim() : false;
	if(email){
		// Get token from headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

		// Verify that the given token is valid for the email
		handlers._tokens.verify(token,email,function(valid){
			if(valid){
				callback(200, config.menu_items);
			}else{
				callback(403, {"Error" : "Missing required token in header, or token is invalid."}); // 403 Forbidden Error
			}
		});
	}
}


// Menu items
handlers.menu = function(data,callback){
	var accepted_methods = ['get'];
	if(accepted_methods.indexOf(data.method) != -1){
		handlers._menu[data.method](data,callback);
	}else{
		callback(405); // 405 Method Not Allowed
	}
};

// Container for all the menu item methods
handlers._menu = {};

// GET
// Retrieve menu items
// Required query string: email
// Required headers: token
handlers._menu.get = function(data,callback){
	var email = typeof(data.query_string_object.email) == 'string' && data.query_string_object.email.trim().length > 0 ? data.query_string_object.email.trim() : false;
	if(email){
		// Get token from headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

		// Verify that the given token is valid for the email
		handlers._tokens.verify(token,email,function(valid){
			if(valid){
				callback(200, config.menu_items);
			}else{
				callback(403, {"Error" : "Missing required token in header, or token is invalid."}); // 403 Forbidden Error
			}
		});
	}
}


// Users
handlers.users = function(data,callback){
	var accepted_methods = ['post', 'get', 'put', 'delete'];
	if(accepted_methods.indexOf(data.method) != -1){
		handlers._users[data.method](data,callback);
	}else{
		callback(405); // 405 Method Not Allowed
	}
};

// Container for all the users methods
handlers._users = {};

// POST
// Create a new users
// Required payload data: name, email address, and street address.
handlers._users.post = function(data,callback){
	// Check that all require dfields are filled out
	var name = typeof(data.payload.name) == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
	var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
	var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
	var street = typeof(data.payload.street) == 'string' && data.payload.street.trim().length > 0 ? data.payload.street.trim() : false;
	var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

	if(name && email && address && street && password){
		// Make sure the user doesn't already exist
		_data.read('users',email,function(err,data){
			if(err){
				// Hash the password
				var hashed_pass = helpers.hash(password);

				// Create the user object
				if(hashed_pass){
					var user = {
						'name' : name,
						'email' : email,
						'address' : address,
						'street' : street,
						'hashed_pass' : hashed_pass
					};

					// Store the user
					_data.create('users',email,user,function(err){
						if(!err){
							callback(200);
						}else{
							callback(500, {'Error' : 'Could not create a new user'}); // 500 Internal Server Error
						}
					});

				}else{
					callback(500, {'Error' : 'Could not hash the user\'s password'}); // 500 Internal Server Error
				}

			}else{
				// User already exists
				callback(500, {'Error' : 'A user with that email already exists'}); // 500 Internal Server Error
			}

		});

	}else{
		callback(400, {'Error' : 'Missing required fields'}); // 400 Bad Request Error
	}
}

// GET
// Retrieve user data
// Required query string: email
// Required headers: token
handlers._users.get = function(data,callback){
	// Check that the email is valid
	var email = typeof(data.query_string_object.email) == 'string' && data.query_string_object.email.trim().length > 0 ? data.query_string_object.email.trim() : false;
	if(email){

		// Get token from headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

		// Verify that the given token is valid for the email
		handlers._tokens.verify(token,email,function(valid){
			if(valid){
				// Lookup the user
				_data.read('users',email,function(err,data){
					if(!err && data){
						// Remove the hashed password from the user object before returning it to the requester
						delete data.hashed_pass;
						callback(200,data);
					}else{
						callback(400, {'Error' : 'Could not find the specified user.'});
					}
				});
			}else{
				callback(403, {"Error" : "Missing required token in header, or token is invalid."}); // 403 Forbidden Error
			}
		})

	}else{
		callback(400, {'Error' : 'Missing required field'}); // 400 Bad Request Error
	}
};

// PUT
// Update user data
// Required payload data: email
// Required headers: token
// Optional data: name, email, address, street, password (at least one must be specified)
handlers._users.put = function(data,callback){
	// Check for required field
	var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
	if(email){

		// Check for optional fields
		var name = typeof(data.payload.name) == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
		var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
		var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
		var street = typeof(data.payload.street) == 'string' && data.payload.street.trim().length > 0 ? data.payload.street.trim() : false;
		var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    	// Error if nothing is sent to update
    	if(name || email || address || street || password){
    		// Get token from headers
    		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
			// Verify that the given token is valid for the email
			handlers._tokens.verify(token,email,function(valid){
				if(valid){
					// Lookup the user
					_data.read('users',email,function(err,data){
						if(!err && data){
							// Update data only if necessary
							if(name) data.name = name;
							if(email) data.email = email;
							if(address) data.address = address;
							if(street) data.street = street;
							if(password) data.hashed_pass = helpers.hash(password);

							// Store the new data
							_data.update('users',email,data,function(err){
								if(!err){
									callback(200);
								}else{
									callback(500, {'Error' : 'Could not update the user.'}); // 500 Internal Server Error
								}
							});
						}else{
              				callback(400, {'Error' : 'Specified user does not exist.'}); // 400 Bad Request Error
						}
					});
				}else{
					callback(403, {"Error" : "Missing required token in header, or token is invalid."}); // 403 Forbidden Error
				}
			});

    	}else{
    		callback(400,{'Error' : 'Missing fields to update.'}); // 400 Bad Request Error
    	}

	}else{
		callback(400, {'Error' : 'Missing required field'}); // 400 Bad Request Error
	}

};

// DELETE
// Delete a user
// Required query strings: email
// Required headers: token
// Cleanup old checks associated with the user
handlers._users.delete = function(data,callback){
	// Check for required field
	var email = typeof(data.query_string_object.email) == 'string' && data.query_string_object.email.trim().length > 0 ? data.query_string_object.email.trim() : false;
	if(email){

		// Get token from headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
		// Verify that the given token is valid for the email
		handlers._tokens.verify(token,email,function(valid){
			if(valid){
				// Lookup the user
				_data.read('users',email,function(err,data){
					if(!err && data){
						// Delete the user's data
						_data.delete('users',email,function(err){
							if(!err){
								// Delete each of the checks associated with the user
								var checks = typeof(data.checks) == 'object' && data.checks instanceof Array ? data.checks : [];
								var total = checks.length;
								if(total > 0){
									var deleted = 0;
									var errors = false;
									// Loop through the checks
									checks.forEach(function(id){
										// Delete the check
										_data.delete('checks',id,function(err){
											if(err){
												errors = true;
											}
											deleted++;
											if(deleted==total){
												if(!errors){
													callback(200);
												}else{
													callback(500, {'Error' : "All checks may not have been deleted from the system successfully."})
												}
											}
										});
									});
								}else{
									callback(200);
								}
							}else{
								callback(500, {'Error' : 'Could not delete the specified user'});
							}
						});
					}else{
          				callback(400, {'Error' : 'Could not find the specified user.'}); // 400 Bad Request Error
					}
				});
			}else{
				callback(403, {"Error" : "Missing required token in header, or token is invalid."}); // 403 Forbidden Error
			}
		});

	}else{
		callback(400, {'Error' : 'Missing required field'}); // 400 Bad Request Error
	}
};


// Tokens
handlers.tokens = function(data,callback){
	var accepted_methods = ['post', 'get', 'put', 'delete'];
	if(accepted_methods.indexOf(data.method) != -1){
		handlers._tokens[data.method](data,callback);
	}else{
		callback(405); // 405 Method Not Allowed
	}
};

// Container for all the tokens methods
handlers._tokens = {};

// POST
// Create a token
// Required payload data: email, password
handlers._tokens.post = function(data,callback){
	// Check for required field
	var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
	var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
	if(email && password){
		// Lookup the user
		_data.read('users',email,function(err,data){
			if(!err && data){
				// Hash the password and compare it
				var hashed_pass = helpers.hash(password);
				if(hashed_pass == data.hashed_pass){
					// If valid, create a new token with a random name.
					// Set an expiration date 1 hour in the future.
					var token_id = helpers.createRandomString(20);
					var expires = Date.now() + 1000 * 60 * 60;
					var token = {
						'email' : email,
						'id' : token_id,
						'expires' : expires
					};

					// Store the token
					_data.create('tokens',token_id,token,function(err){
						if(!err){
							callback(200,token);
						}else{
							callback(500, {'Error' : 'Could not create the new token'}); // 500 Internal Server Error
						}
					});
				}else{
					callback(400, {'Error' : 'Password did not match the specified user\'s stored password'}); // 400 Bad Request Error
				}
			}else{
				callback(400, {'Error' : 'Could not find the specified user.'}); // 400 Bad Request Error
			}
		});
	}else{
		callback(400, {'Error' : 'Missing required field(s).'}); // 400 Bad Request Error
	}
};

// GET
// Retrieve token
// Required data: id
handlers._tokens.get = function(data,callback){
	// Check that id is valid
	var id = typeof(data.query_string_object.id) == 'string' && data.query_string_object.id.trim().length == 20 ? data.query_string_object.id.trim() : false;
  	if(id){
  		// Lookup the existing token
  		_data.read('tokens',id,function(err,token){
  			if(!err && token){
				callback(200);
			}else{
				callback(404); // 404 Not found
			}
  		});
  	}else{
  		callback(400, {"Error": "Missing required field(s) or field(s) are invalid."}); // 400 Bad Request Error
  	}
};

// PUT
// Update token
// Required data: id, extend
handlers._tokens.put = function(data,callback){
	var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  	var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
  	if(id && extend){
  		// Lookup the existing token
  		_data.read('tokens',id,function(err,token){
  			if(!err && token){
  				// Check to make sure the token isn't already expired
  				if(token.expires > Date.now()){
  					// Update the expiration an hour from now
  					token.expires = Date.now() + 1000 * 60 * 60;
  					// Update the token
  					_data.update('tokens',id,token,function(err){
  						if(!err){
  							callback(200);
  						}else{
  							callback(500, {'Error' : 'Could not update the token\'s expiration.'}); // 500 Internal Server Error
  						}
  					});
  				}else{
  					callback(400, {"Error" : "The token has already expired, and cannot be extended."}); // 400 Bad Request Error
  				}
  			}else{
  				callback(400,{'Error' : 'Specified user does not exist.'}); // 400 Bad Request Error
  			}
  		});
  	}else{
  		callback(400, {"Error": "Missing required field(s) or field(s) are invalid."}); // 400 Bad Request Error
  	}
};

// DELETE
// Delete a token
// Required data: id
handlers._tokens.delete = function(data,callback){
	// Check that the token id is valid
	var id = typeof(data.query_string_object.id) == 'string' && data.query_string_object.id.trim().length == 20 ? data.query_string_object.id.trim() : false;
	if(id){
		// Lookup the existing token
  		_data.read('tokens',id,function(err,token){
  			if(!err && token){
  				// Delete the token
  				_data.delete('tokens',id,function(err){
  					if(!err){
  						callback(200);
  					}else{
  						callback(500,{'Error' : 'Could not delete the specified token'}); // 500 Internal Server Error
  					}
  				})
  			}else{
  				callback(400,{'Error' : 'Specified user does not exist.'}); // 400 Bad Request Error
  			}
  		});
	}else{
  		callback(400, {"Error": "Missing required field or field is invalid."}); // 400 Bad Request Error
	}
};

// Verify that the given token is currently valid for a given user
handlers._tokens.verify = function(id,email,callback){
	// Lookup the token
	_data.read('tokens',id,function(err,token){
		if(!err && token){
			// Check that the token is for the given user and has not expired
			if(token.email == email && token.expires > Date.now()){
				callback(true);
			}else{
				callback(false);
			}
		}else{
			callback(false);
		}
	});
};

// Checks
handlers.checks = function(data,callback){
	var accepted_methods = ['post', 'get', 'put', 'delete'];
	if(accepted_methods.indexOf(data.method) != -1){
		handlers._checks[data.method](data,callback);
	}else{
		callback(405); // 405 Method Not Allowed
	}
};

// Container for all the checks methods
handlers._checks = {};

// Checks - post
// Required data: protocol, url, method, success_codes, timeout
handlers._checks.post = function(data,callback){
	// Validate fields
	var protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
	var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
	var method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
	var success_codes = typeof(data.payload.success_codes) == 'object' && data.payload.success_codes instanceof Array && data.payload.success_codes.length > 0 ? data.payload.success_codes : false;
	var timeout = typeof(data.payload.timeout) == 'number' && data.payload.timeout % 1 === 0 && data.payload.timeout >= 1 && data.payload.timeout <= 5 ? data.payload.timeout : false;
	if(protocol && url && method && success_codes && timeout){
		// Get token from headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

		if(token){
			// Lookup the user email by reading the token
			_data.read('tokens',token,function(err,token){
				if(!err && token){
					// Lookup the user
					_data.read('users',token.email,function(err,user){
						var checks = typeof(user.checks) == 'object' && user.checks instanceof Array ? user.checks : [];
						// Verify that the user has less than the number of max-checks per user
						if(checks.length < config.max_checks){
							// Create a random ID for this check
							var check_id = helpers.createRandomString(20);

							// Create check object including the email of the user
							var check = {
								'id' : check_id,
								'user' : email,
								'protocol' : protocol,
								'url' : url,
								'method' : method,
								'success_codes' : success_codes,
								'timeout' : timout
							};

							// Save the check
							_data.create('checks',check_id,check,function(err){
								if(!err){
									// Add check id to the user's object
									user.checks = checks;
									user.checks.push(check_id);

									// Save the new user data
									_data.update('users',email,user,function(err){
										if(!err){
											// Return the data about the new check
											callback(200, check);
										}else{
											callback(500, {'Error' : 'Could not update the user with the new check.'}); // 500 Internal Server Error
										}
									});
								}else{
									callback(500, {'Error' : 'Could not create the new check'}); // 500 Internal Server Error
								}
							})
						}else{
							callback(400, {'Error' : 'The user already has the maximum number of checks ('+config.max_checks+').'}); // 400 Bad Request Error
						}
					});
				}else{
					callback(403, {"Error" : "Missing required token in header, or token is invalid."}); // 403 Forbidden Error
				}
			});
		}else{
			callback(403, {"Error" : "Missing required token in header, or token is invalid."}); // 403 Forbidden Error
		}
  	}else{
  		callback(400, {'Error' : 'Missing required inputs, or inputs are invalid'}); // 400 Bad Request Error
  	}
};

// Checks - get
// Required data: id
handlers._checks.get = function(data,callback){
	// Check that the token id is valid
	var id = typeof(data.query_string_object.id) == 'string' && data.query_string_object.id.trim().length == 20 ? data.query_string_object.id.trim() : false;
	if(id){
		// Lookup the check
		_data.read('checks',id,function(err,check){
			if(!err && check){
				// Get the token from the header
				var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
				// Verify that the given token is valid and belongs to the user who created the check
				handlers._tokens.verify(token,check.email,function(valid){
					if(valid){
						// Return the check object
						callback(200, check);
					}else{
						callback(403, {"Error" : "Missing required token in header, or token is invalid."}); // 403 Forbidden Error
					}
				});
			}else{
				callback(404); // 404 Not Found
			}
		});
	}else{
		callback(400, {'Error' : 'Missing required field, or field invalid'}); // 400 Bad Request Error
	}
};

// Checks - put
// Required data: id
// Optional data: protocol, url, method, success_codes, timeout (one must be set)
handlers._checks.put = function(data,callback){
	// Check for required fields
	var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

  	// Error if id is invalid
  	if(id){

		// Check for optional fields
		var protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
		var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
		var method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
		var success_codes = typeof(data.payload.success_codes) == 'object' && data.payload.success_codes instanceof Array && data.payload.success_codes.length > 0 ? data.payload.success_codes : false;
		var timeout = typeof(data.payload.timeout) == 'number' && data.payload.timeout % 1 === 0 && data.payload.timeout >= 1 && data.payload.timeout <= 5 ? data.payload.timeout : false;

		// Error if nothing is sent to update
	    if(protocol || url || method || success_codes || timeout){

	  		// Lookup the check
	  		_data.read('checks',id,function(err,check){
	  			if(!err && token){

					// Get the token from the header
					var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
					// Verify that the given token is valid and belongs to the user who created the check
					handlers._tokens.verify(token,check.email,function(valid){
						if(valid){
							// Update check data where necessary
							if(protocol) check.protocol = protocol;
							if(url) check.url = url;
							if(method) check.method = method;
							if(success_codes) check.success_codes = success_codes;
							if(timeout) check.timeout = timeout;

							// Store the new updates
							_data.update('checks',id,check,function(err){
								if(!err){
									callback(200);
								} else {
									callback(500, {'Error' : 'Could not update the check.'}); // 500 Internal Server Error
								}
							});
						}else{
							callback(403, {"Error" : "Missing required token in header, or token is invalid."}); // 403 Forbidden Error
						}
					});
	  			}else{
					callback(400, {"Error" : "The check ID specified could not be found"}); // 400 Bad Request Error
	  			}
	  		});
	    }else{
      		callback(400, {'Error' : 'Missing fields to update.'}); // 400 Bad Request Error
	    }
  	}else{
  		callback(400, {'Error' : 'Missing required field.'}); // 400 Bad Request Error
  	}
};


// Checks - delete
// Required data: id
handlers._checks.delete = function(data,callback){
	// Check for required fields
	var id = typeof(data.query_string_object.id) == 'string' && data.query_string_object.id.trim().length == 20 ? data.query_string_object.id.trim() : false;

  	// Error if id is invalid
  	if(id){

  		// Lookup the check
  		_data.read('checks',id,function(err,check){
  			if(!err && token){
				// Get the token from the header
				var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
				// Verify that the given token is valid and belongs to the user who created the check
				handlers._tokens.verify(token,check.email,function(valid){
					if(valid){
						// Delete the check
						_data.delete('checks',id,function(err){
							if(!err){
								// Lookup the user's object to get all their checks
								_data.read('users',check.email,function(err,user){
									if(!err){
										var checks = typeof(user.checks) == 'object' && user.checks instanceof Array ? user.checks : [];
										// Remove the deleted check from their list of checks
										var index = checks.indexOf(id);
										if(index > -1){
											// Remove the check from the array
											checks.splice(index, 1);
											// Update the checks on the user data
											user.checks = checks;
											_data.update('users',check.email,user,function(err){
												if(!err){
													callback(200);
												}else{
													callback(500, {'Error' : 'Could not update the user'}); // 500 Internal Server Error
												}
											});
										}else{
											callback(500,{"Error" : "Check not found in user data, so it couldn't be removed"}); // 500 Internal Server Error
										}
									}else{
										callback(500, {"Error" : "This user does not exist, for that reason the check couldn't be removed from the user data"}); // 500 Internal Server Error
									}
								});
							} else {
								callback(500, {"Error" : "Could not delete the check data."}); // 500 Internal Server Error
							}
						});
					}else{
						callback(403, {"Error" : "Missing required token in header, or token is invalid."}); // 403 Forbidden Error
					}
				});
  			}else{
				callback(400, {"Error" : "The check ID specified could not be found"}); // 400 Bad Request Error
  			}
  		});
  	}else{
  		callback(400, {'Error' : 'Missing required field.'}); // 400 Bad Request Error
  	}
};


// Expor the module
module.exports = handlers;
