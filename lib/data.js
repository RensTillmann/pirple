/*
 * Library for storing and editing data
 *
 */

// Dependencies
var fs = require('fs'); // File system
var path = require('path'); // To normalize the paths to different directories

// Container for the module
var lib = {};

// Define the base directory of the data folder
lib.data_dir = path.join( __dirname, '/../.data/' );


// Write data to a file
lib.create = function( dir, filename, data, callback ) {
	console.log('Point 1',data);
	// Open the file for writing (wx = writing)
	fs.open(lib.data_dir+dir+'/'+filename+'.json', 'wx', function( error, file_id ) {
		console.log('Point 2',data);
		if( !error && file_id ) {
			// Convert content to a flat string
			var json_string = JSON.stringify(data);
			// Write content to the file and close it
			fs.writeFile(file_id, json_string, function( error ) {
				if( !error ) {
					fs.close( file_id, function( error ) {
						if( !error ) {
							callback(false); // Return: error = false (which means there was no error)
						}else{
							callback('Error closing the file');
						}
					});
				}else{
					callback('Error writing to new file');
				}
			})
		}else{
			callback( 'Could not create new file, it may already exist' );
		}
	});
};

// Export the module
module.exports = lib;