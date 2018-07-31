/*
 * Request handlers
 *
 */

// Dependencies


// Define the handlers
var handlers = {};

// Users
handlers.users = function( data, callback ) {
	// CRUD (Create, Read, Update, Delete)
	var methods = ['post','get','put','delete'];
	
	// If the method exists data array
	if( methods.indexOf( data.method ) != -1 ) {
		handlers._users[data.method](data,callback);
	}else{
		callback(405); // method not allowed
	}
}

// Container for the users submethods
handlers._users = {};

// Users - post
// Required data: first_name, last_name, mobile, password, tos
// Optional data: none
handlers._users.post = function( data, callback ) {
	// Validate all fields
	var v = data.payload;

	var value = v.first_name.trim();
	var first_name = typeof(value) == 'string' && value.length > 1 ? value : false;

	var value = v.last_name.trim();
	var last_name = typeof(value) == 'string' && value.length > 1 ? value : false;

	var value = v.mobile.trim();
	var mobile = typeof(value) == 'string' && value.length > 9 ? value : false;

	var value = v.password; // Do not remove spaces from password
	var password = typeof(value) == 'string' && value.length > 0 ? value : false;

	var value = v.tos; // We don't need to trim this field
	var tos = typeof(value) == 'boolean' && value == true ? true : false;

	if( first_name && last_name && mobile && password && tos ) {
		// Make sure that the user doesn't already exists (based on the mobile number);
		_data.read( 'users', phone, function( error, data ) {
			
			// If error exists it means that the file doesn't exist yet
			if( error ) {
				// Hash the password, because we do not want to save it as plain text (obviously)
								
			}else{
				// User with this mobile number already exists
				callback( 400, {'Error' : 'A user with that number already exists'} );
			}
		})
	}else{
		callback( 400, {'Error' : 'Missing required fields!'} );
	}

};
handlers._users.get = function( data, callback ) {
	
};
handlers._users.put = function( data, callback ) {
	
};
handlers._users.delete = function( data, callback ) {
	
};

// Ping handler
handlers.ping = function( data, callback ) {
	callback(200);
}

// Not found handler
handlers.not_found = function( data, callback ) {
	callback(404);
}

// Export the module
module.exports = handlers