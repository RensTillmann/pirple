/*
 * Library for storing and editing data
 *
 */

// Dependencies
var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

// Container for the module (to be exported)
var lib = {};

// Base directory of data folder
lib.baseDir = path.join(__dirname,'/../.data/');

// Write data to a file
lib.create = function(dir,file,data,callback){
	// Open the file for writing
	// lib.baseDir == root/.data/
	// dir == users
	// file == 123456
	// wx = write + read
	fs.open(lib.baseDir+dir+'/'+file+'.json', 'wx', function(err, fd){ // Returns error and a file descriptor
		if(!err && fs){
			// Convert data to string
			var json = JSON.strigify(data);

			// Write to file and close it
			fs.writeFile(fs,json,function(err){
				if(!err){
					fs.close(fs,function(err){
						if(!err){
							callback(false);
						}else{
							callback('Error closing new file');
						}
					});
				}else{
					callback('Error writing to new file');
				}
			});
		}else{
			callback('Could not create new file, it may already exist');
		}
	});
};

// Read data from a file
lib.read = function(dir,file,callback){
	fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf8', function(err, data){
		if(!err && data){
			var data = helpers.parseJsonToObject(data);
			callback(false,data);
		}else{
			callback(err,data);
		}
	});
};

// Update data in a file
lib.update = function(dir,file,data,callback){
	// Open the file for writing
	// r+ == Open file for reading and writing. An exception occurs if the file does not exist.
	fs.open(lib.baseDir+dir+'/'+file+'.json', 'r+', function(err, fs){
		if(!err && fs){
			// Convert data to string
			var json = JSON.stringify(data);

			// Truncate the file (delete all contents / empty the file)
			fs.truncate(fs,function(err){
				if(!err){
					// Write to the file and close it
					fs.writeFile(fs, json, function(err){
						if(!err){
							fs.close(fs,function(err){
								if(!err){
									callback(false);
								}else{
									callback('Error closing existing file');
								}
							});
						}else{
							callback('Error writing to existing file');
						}
					});
				}else{
					callback('Error truncating file');
				}
			})
		}else{
			callback('Could not open file for updating, it may not exist yet');
		}
	});
}

// Delete a file
lib.delete = function(dir,file,callback){
	// Unlink the file from the filesystem
	fs.unlink(lib.baseDir+dir+'/'+file+'.json', function(err){
		callback(err);
	});
}

// List all the items in a directory
lib.list = function(dir,callback){
	fs.readdir(lib.baseDir+dir+'/', function(err, data){
		if(!err && data && data.length > 0){
			var trimmed = [];
			data.forEach(function(file){
				trimmed.push(file.replace('.json',''));
			});
			callback(false,trimmed);
		}else{
			callback(err,data);
		}
	});
}

// Export the module
module.exports = lib;