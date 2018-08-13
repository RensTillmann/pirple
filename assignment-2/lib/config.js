/*
 * Create and export configuration variables
 *
 */

// Container for all environments
var environments = {};

// Staging (default) environment
environments.staging = {
	'http_port' : 3000,
	'https_port' : 3001,
	'env_name' : 'staging',
	'hashing_secret' : 'thisIsASecret',
	'max_checks' : 5,
	'twilio' : {
    	'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
    	'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
    	'fromPhone' : '+15005550006'
	}
};

// Production environment
environments.production = {
	'http_port' : 5000,
	'https_port' : 5001,
	'env_name' : 'production',
	'hashing_secret' : 'thisIsAlsoASecret',
	'max_checks' : 10,
	'twilio' : {
		'accountSid' : '',
		'authToken' : '',
		'fromPhone' : ''
	}
};

// Determine which environment was passed as a command-line argument
var current_environment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not default to staging
var export_environment = typeof(environments[current_environment]) == 'object' ? environments[current_environment] : environments.staging;


// Export the module
module.exports = export_environment;