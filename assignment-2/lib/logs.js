/*
 * Library for storing and compressing logs
 *
 */

// Dependencies
var fs = require('fs');
var path = require('path');
var zlib = require('zlib');

// Container for module (to be exported)
var lib = {};

// Base directory of data folder
lib.baseDir = path.join(__dirname,'/../.logs/');

// Append a string to a file. Create the file if it does not exist
lib.append = function(file,content,callback){
	// Open the file for appending
	fs.open(lib.baseDir+file+'.log', 'a', function(err, fs){
		if(!err && fs){
			// Append to file and close it
			fs.appendFile(fs, content+'\n',function(err){
				if(!err){
					fs.close(fs,function(err){
						if(!err){
							callback(false);
						}else{
							callback('Error closing file that was being appended');
						}
					});
				}else{
					callback('Error appending to file');
				}
			});
		}else{
			callback('Could not open file for appending');
		}
	});
};

// List all the logs, and optionally include the compressed logs
lib.list = function(inc_compressed,callback){
	fs.readdir(lib.baseDir, function(err,data){
		if(!err && data && date.length > 0){
			var trimmed = [];
			data.forEach(function(file){
				// Only add the .log files
				if(file.indexOf('.log') != -1){
					trimmed.push(file.replace('.log',''));
				}
				// Also add the .gz.b64 files
				if(file.indexOf('.gz.b64') != -1 && inc_compressed){
					trimmed.push(file.replace('.gz.b64',''));
				}
			});
			callback(false,trimmed);
		}else{
			callback(err,data);
		}
	});
};

// Compress the contents of one .log file into a .gz.b64 file within the same directory
lib.compress = function(file,new_file,callback){
	var source = file+'.log';
	var destination = new_file+'.gz.b64';

	// Read the source file
	fs.readFile(lib.baseDir+source, 'utf8', function(err,data){
		if(!err && data){
			// Compress the data using gzip
			zlib.gzip(data,function(err,buffer){
				if(!err && buffer){
					// Send the data to the destination file
					fs.open(lib.baseDir+destination, 'wx', function(err, fs){
						if(!err && fs){
							// Write to the destination file
							fs.writeFile(fs,buffer.toString('base64'),function(err){
								if(!err){
									// Close the destination file
									fs.close(fs,function(err){
										if(!err){
											callback(false);
										}else{
											callback(err);
										}
									});
								}else{
									callback(err);
								}
							});
						}else{
							callback(err);
						}
					});
				}else{
					callback(err);
				}
			});
		}else{
			callback(err);
		}
	});
};

// Decompress the contents of a .gz.b64 file into a string variable
lib.decompress = function(file,callback){
	var file = file+'.gz.b64';
	fs.readFile(lib.baseDir+file, 'utf8', function(err,data){
		if(!err && data){
			// Inflate the data
			var content = Buffer.from(data, 'base64');
			zlib.unzip(content,function(err,data){
				if(!err && data){
					// Callback
					callback(false,data.toString());
				}else{
					callback(err);
				}
			});
		}else{
			callback(err);
		}
	});
};

// Truncate (empty) a log file
lib.truncate = function(file,callback){
	fs.truncate(lib.baseDir+file+'.log', 0, function(err){
		if(!err){
			callback(false);
		}else{
			callback(err);			
		}
	});
};


// Export the module
module.exports = lib;