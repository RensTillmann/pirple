/*
 * Request handlers (or in other words, these functions will handle the API requests)
 *
 */

// Dependencies
var data = require('./data');
var helpers = require('./helpers');
var config = require('./config');

// Define all the handlers
var handlers = {};

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

// User - post
// Required data: first_name, last_name, phone, password, tos
handlers._users.post = function(data,callback){
	// Check that all require dfields are filled out
	var first_name = typeof(data.payload.first_name) == 'string' && data.payload.first_name.trim().length > 0 ? data.payload.first_name.trim() : false;
	var last_name = typeof(data.payload.last_name) == 'string' && data.payload.last_name.trim().length > 0 ? data.payload.last_name.trim() : false;
	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
	var tos = typeof(data.payload.tos) == 'boolean' && data.payload.tos == true ? true : false;

	if(first_name && last_name && phone && password && tos){
		// Make sure the user doesn't already exist
		_data.read('users',phone,function(err,data){
			if(err){
				// Hash the password
				var hashed_pass = helpers.hash(password);

				// Create the user object
				if(hashed_pass){
					var user = {
						'first_name' : first_name,
						'last_name' : last_name,
						'phone' : phone,
						'hashed_pass' : hashed_pass,
						'tos' : true
					};

					// Store the user
					_data.create('users',phone,user,function(err){
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
				callback(500, {'Error' : 'A user with that phone number already exists'}); // 500 Internal Server Error
			}

		});
	
	}else{
		callback(400, {'Error' : 'Missing required fields'}); // 400 Bad Request Error
	}
}

// User - get
// Required data: phone
handlers._users.get = function(data,callback){
	// Check that the phone number is valid
	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	if(phone){

		// Get token from headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

		// Verify that the given token is valid for the phone number
		handlers._tokens.verify(token,phone,function(valid){
			if(valid){
				// Lookup the user
				_data.read('users',phone,function(err,data){
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

// User - put
// Required data: phone
// Optional data: first_name, last_name, password (at least one must be specified)
handlers._users.put = function(data,callback){
	// Check for required field
	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	if(phone){	

		// Check for optional fields
		var first_name = typeof(data.payload.first_name) == 'string' && data.payload.first_name.trim().length > 0 ? data.payload.first_name.trim() : false;
		var last_name = typeof(data.payload.last_name) == 'string' && data.payload.last_name.trim().length > 0 ? data.payload.last_name.trim() : false;
		var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    	
    	// Error if nothing is sent to update
    	if(firstName || lastName || password){
    		// Get token from headers
    		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
			// Verify that the given token is valid for the phone number
			handlers._tokens.verify(token,phone,function(valid){
				if(valid){
					// Lookup the user
					_data.read('users',phone,function(err,data){
						if(!err && data){
							// Update data only if necessary
							if(first_name) data.first_name = first_name;
							if(last_name) data.last_name = last_name;
							if(password) data.password = helpers.hash(password);

							// Store the new data
							_data.update('users',phone,data,function(err){
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

// Users - delete
// Required data: phone
// Cleanup old checks associated with the user
handlers._users.delete = function(data,callback){
	// Check for required field
	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	if(phone){	

		// Get token from headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
		// Verify that the given token is valid for the phone number
		handlers._tokens.verify(token,phone,function(valid){
			if(valid){
				// Lookup the user
				_data.read('users',phone,function(err,data){
					if(!err && data){
						// Delete the user's data
						_data.delete('users',phone,function(err){
							if(!err){
								// Delete each of the checks associated with the user
								var checks = typof(data.checks) == 'object' && data.checks instanceof Array ? data.checks : [];
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

// Tokens - post
// Required data: phone, password
handlers._tokens.post = function(data,callback){
	// Check for required field
	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
	if(phone && password){
		// Lookup the user
		_data.read('users',phone,function(err,data){
			if(!err && data){
				// Hash the password and compare it
				var hashed_pass = helpers.hash(password);
				if(hashed_pass == data.hashed_pass){
					// If valid, create a new token with a random name. 
					// Set an expiration date 1 hour in the future.
					var token_id = helpers.createRandomString(20);
					var expires = Date.now() + 1000 * 60 * 60;
					var token = {
						'phone' : phone,
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

// Tokens - get
// Required data: id, extend
handlers._tokens.get = function(data,callback){
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

// Toekens - delete
// Required data: id
handlers._tokens.delete = function(data,callback){
	// Check that the token id is valid
	var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
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
handlers._tokens.verify = function(id,phone,callback){
	// Lookup the token
	_data.read('tokens',id,function(err,token){
		if(!err && token){
			// Check that the token is for the given user and has not expired
			if(token.phone == phone && token.expires > Date.now()){
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
			// Lookup the user phone by reading the token
			_data.read('tokens',token,function(err,token){
				if(!err && token){
					// Lookup the user
					_data.read('users',token.phone,function(err,user){
						var checks = typeof(user.checks) == 'object' && user.checks instanceof Array ? user.checks : [];
						// Verify that the user has less than the number of max-checks per user
						if(checks.length < config.max_checks){
							// Create a random ID for this check
							var check_id = helpers.createRandomString(20);

							// Create check object including the phone of the user
							var check = {
								'id' : check_id,
								'user' : phone,
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
									_data.update('users',phone,user,function(err){
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
	var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
	if(id){
		// Lookup the check
		_data.read('checks',id,function(err,check){
			if(!err && check){
				// Get the token from the header
				var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
				// Verify that the given token is valid and belongs to the user who created the check
				handlers._tokens.verify(token,check.phone,function(valid){
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
					handlers._tokens.verify(token,check.phone,function(valid){
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
	var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

  	// Error if id is invalid
  	if(id){

  		// Lookup the check
  		_data.read('checks',id,function(err,check){
  			if(!err && token){
				// Get the token from the header
				var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
				// Verify that the given token is valid and belongs to the user who created the check
				handlers._tokens.verify(token,check.phone,function(valid){
					if(valid){
						// Delete the check
						_data.delete('checks',id,function(err){
							if(!err){
								// Lookup the user's object to get all their checks
								_data.read('users',check.phone,function(err,user){
									if(!err){
										var checks = typeof(user.checks) == 'object' && user.checks instanceof Array ? user.checks : [];
										// Remove the deleted check from their list of checks
										var index = checks.indexOf(id);
										if(index > -1){
											// Remove the check from the array
											checks.splice(index, 1);
											// Update the checks on the user data
											user.checks = checks;
											_data.update('users',check.phone,user,function(err){
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