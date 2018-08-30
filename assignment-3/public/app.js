/*
 * Frontend logic for the application
 *
 */

// Container for the frontend application
var app = {};

// Config
app.config = {
	'session_token' : false
};

// AJAX Client (for the restful API)
app.client = {};

// Interface for making API calls
app.client.request = function(headers,path,method,query_string,payload,callback){
	// Set defaults
	headers = typeof(headers) == 'object' && headers !== null ? headers : {};
	path = typeof(path) == 'string' ? path : '/';
	method = typeof(method) == 'string' && ['POST','GET','PUT','DELETE'].indexOf(method) != -1 ? method.toUpperCase() : 'GET';
	query_string = typeof(query_string) == 'object' && query_string !== null ? query_string : {};
	payload = typeof(payload) == 'object' && payload !== null ? payload : {};
	callback = typeof(callback) == 'function' ? callback : false;

	// For each query string parameter send, prepend it to the path
	var url = path+'?';
	var i = 0;
	Object.keys(query_string).forEach(function(index) {
		if(i>0) url += '&';
		url += index+'='+query_string[index];
		i++;
	});

	// Form the http request as a JSON type
	var xhr = new XMLHttpRequest()
	xhr.open(method,url);
	xhr.setRequestHeader("Content-Type","application/json");

	// For each header sent, add it to the request
	Object.keys(headers).forEach(function(index) {
		xhr.setRequestHeader(index, headers[index]);
	});

	// If there is a current session token set, add that as a header
	if(app.config.token){
		xhr.setRequestHeader("token",app.config.token.id);
	}

	// When the request comes back, handle the response
	xhr.onreadystatechange = function(){
		if(xhr.readyState == XMLHttpRequest.DONE){
			var status = xhr.status;
			var response = xhr.responseText;

			// Callback if requested
			if(callback){
				try{
					var response = JSON.parse(response);
					callback(status,response);
				} catch(e){
					callback(status,false);
				}
			}
		}
	}

	// Send the payload as JSON
	var payload = JSON.stringify(payload);
	xhr.send(payload);

};

// Bind the forms
app.bind_forms = function(){
	if(document.querySelector('form')){
		document.querySelector('form').addEventListener('submit',function(e){

			// Stop it from submitting
			e.preventDefault();
			var id = this.id;
			var action = this.action;
			var method = this.method.toUpperCase();

			// Hide the error message (if it's currently shown due to a previous error)
			document.querySelector('#'+id+' .formError').style.display = 'hidden';

			// Turn the inputs into a payload
			var payload = {};
			var elements = this.elements;
			for(var i = 0; i < elements.length; i++){
				if(elements[i].type !== 'submit'){
					payload[elements[i].name] = elements[i].type == 'checkbox' ? elements[i].checked : elements[i].value;
				}
			}

			// Call the API
			app.client.request(undefined,action,method,undefined,payload,function(status,response){
					// Display an error on the form if needed
					if(status !== 200){

						// Try to get the error from the API, or set a default error message
						var error = typeof(respons.Error) == 'string' ? response.Error : 'An error has occured, please try again';
						app.form_validation(id,error,'block');

					}else{
						// If successful, send to form response processor
						app.form_processor(id,payload,response);
					}
			});
		});
	}
};

// Form processor
app.form_processor = function(id,payload,response){

	// If account creation was successful, try to log the user in
	if(id == 'accountCreate'){
		// Take the email and password, and use it to log the user in
		var credentials = {
			'email' : payload.email,
			'password' : payload.password
		}
		app.client.request(undefined,'api/tokens','POST',undefined,credentials,function(status,response){
				if(status !== 200){
						app.form_validation(id,'An error has occured, please try again','block');
				}else{
					// If successful, set the token and redirect the user
					app.set_session_token(response);
					window.location = '/checks/all';
				}
		});
	}

	// If login was successful, set the token in localstorage and redirect the user
	if(id == 'sessionCreate'){
		app.set_session_token(response);
		window.location = '/checks/all';
	}
};

// Get the session toke from localstorage and set it in the app.config object
app.get_session_token = function(){
	var token = localStorage.getItem('token');
	if(typeof(token) == 'string'){
		try{
			var token = JSON.parse(token);
			app.config.token = token;
			if(typeof(token) == 'object'){
				app.set_login_class(true);
			}else{
				app.set_login_class(false);
			}
		}catch(e){
			app.config.token = false;
			app.set_login_class(false);
		}
	}
};

// Set (or remove) the logged in class for the body
app.set_login_class = function(add){
	var body = document.querySelector('body');
	if(add){
		body.classList.add('loggedIn');
	}else{
		body.classList.remove('loggedIn');
	}
}

// Set the session token in the app.config object as well as localstorage
app.set_session_token = function(token){
		app.config.token = token;
		var token_string = JSON.stringify(token);
		localStorage.setItem('token',token_string);
		if(typeof(token) == 'object'){
			app.set_login_class(true);
		}else{
			app.set_login_class(false);
		}
};

// Loop to renew tokens
app.renew_tokens = function(){
	setInterval(function(){
		app.renew_token(function(err){
			if(!err){
				console.log("Token renewed successfully @ "+Date.now());
			}
		});
	},1000 * 60); // Renew tokens every minute
};
app.renew_token = function(callback){
	var token = typeof(app.config.token) == 'object' ? app.config.token : false;
	if(token){
		// Update the token with a new expiration
		var payload = {
				'id' : token.id,
				'extend' : true,
		};
		app.client.request(undefined,'api/tokens','PUT',undefined,payload,function(status,response){
			if(status==200){
				// Get the new token details
				var query_string = {'id' : token.id};
				app.client.request(undefined,'api/tokens','GET',query_string,undefined,undefined,function(status,response){
					if(status==200){
							app.set_session_token(response);
							callback(false);
					}else{
							app.set_session_token(false);
							callback(true);
					}
				});
			}else{
				app.set_session_token(false);
				callback(true);
			}
		});
	}else{
		app.set_session_token(false);
		callback(true);
	}
}



// Show/hide form errors
app.form_validation = function(id,msg,display){
	// Set the formError field with the error text
	document.querySelector('#'+id+' .formError').innerHTML = msg;
	// Show (unhide) the form error field on the form
	document.querySelector('#'+id+' .formError').style.display = display;
};

// Init (bootstrapping)
app.init = function(){
	// Bind all form submissions
	app.bind_forms();
};

// Call the init processes after the window loads
window.onload = function(){
	app.init();
};
