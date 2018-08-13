var fs = require('fs');

var helpers = {
	users: {}
};

helpers.users.generate_id = function( username, uppercase=true, lowercase=true, digits=true, length=10, callback ) {
	var number = '';
	var possible = '';
	if(uppercase) possible += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	if(lowercase) possible += 'abcdefghijklmnopqrstuvwxyz';
	if(digits) possible += '0123456789';
	for (var i = 0; i < length; i++) {
		number += possible.charAt(Math.floor(Math.random() * possible.length));
	}

	// Check if the user ID already exists, if not create the file and return the generated number
	fs.open('.data/users/'+number+'.json', 'r', (err, fd) => {
		if (err) {
			if (err.code === 'ENOENT') {

				// Create the user file
				fs.writeFile('.data/users/'+number+'.json', '{"id":"'+number+'","username":"'+username+'"}', (err) => {
					if(!err){
						console.log('The user ID file has been created!');
					} else{
						console.log('Error creating user ID file!');
					}
				});

				callback(number);
			}
		}else{
			console.error('A user with ID '+number+' already exists!');
			
			// Keep generating a unique user ID until it doesn't exist
			helpers.users.generate_id(username, uppercase, lowercase, digits, length, callback);
		}
	});

}

helpers.tokens.generate = function( folder='users', username, uppercase=true, lowercase=true, digits=true, length=20, callback ) {
	var number = '';
	var possible = '';
	if(uppercase) possible += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	if(lowercase) possible += 'abcdefghijklmnopqrstuvwxyz';
	if(digits) possible += '0123456789';
	for (var i = 0; i < length; i++) {
		number += possible.charAt(Math.floor(Math.random() * possible.length));
	}

	// Check if the user ID already exists, if not create the file and return the generated number
	fs.open('.data/'+folder+'/'+number+'.json', 'r', (err, fd) => {
		if (err) {
			if (err.code === 'ENOENT') {

				// Create the user file
				var data = {
					'id' : number,
					'username' : username,
					'expires' : Date.now() + 1000 * 60 * 60
				}
				fs.writeFile('.data/'+folder+'/'+number+'.json', JSON.stringify(data), (err) => {
					if(!err){
						console.log('The token has been created!');
						callback(200, data);
					} else{
						console.log('Error creating token file!');
						callback(500, {'Error' : 'Could not create token'});
					}
				});
			}
		}else{
			console.error('A token with ID '+number+' already exists!');
			
			// Keep generating a unique user ID until it doesn't exist
			helpers.users.generate_id(username, uppercase, lowercase, digits, length, callback);
		}
	});

}

module.exports = helpers;