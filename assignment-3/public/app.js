/*
 * Frontend logic for the application
 *
 */

// Container for the frontend application
var app = {};

// Config
app.config = {
	'token' : false
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

// Bind the logout button
app.bind_logout_button = function(){
	document.getElementById('logoutButton').addEventListener('click',function(e){
		// Stop it from redirecting anywhere
		e.preventDefault();
		// Log the user out
		app.logout();
	});
};

// Logout the user and redirect them
app.logout = function(){
	// Get the current token id
	var token_id = typeof(app.config.token.id) == 'string' ? app.config.token.id : false;

	// Send the current token to the tokens endpoint to delete it
	var query_string = {
		'id' : token_id
	};
	app.client.request(undefined,'api/tokens','DELETE',query_string,undefined,function(status,response){
		// Set the app.config token as false
		app.set_token(false);
		// Redirect the user to the logged out page
		window.location = '/session/deleted';
	});
};

// Bind the forms
app.bind_forms = function(){

  if(document.querySelector('form')){

    var allForms = document.querySelectorAll('form');
    for(var i = 0; i < allForms.length; i++){
      allForms[i].addEventListener("submit", function(e){

				// Stop it from submitting
				e.preventDefault();
				var id = this.id;
				var action = this.action;
				var method = this.method.toUpperCase();

				// Hide the error message (if it's currently shown due to a previous error)
				document.querySelector('#'+id+' .formError').style.display = 'hidden';

	      // Hide the success message (if it's currently shown due to a previous error)
	      if(document.querySelector("#"+id+" .formSuccess")){
	        document.querySelector("#"+id+" .formSuccess").style.display = 'none';
	      }

	      // Turn the inputs into a payload
	      var payload = {};
	      var elements = this.elements;
	      for(var i = 0; i < elements.length; i++){
	        if(elements[i].type !== 'submit'){
	          var value = elements[i].type == 'checkbox' ? elements[i].checked : elements[i].value;
	          // Make sure that we set the correct API method if we defined it in our form
	          if(elements[i].name == '_method'){
	            method = value;
	          } else {
	            payload[elements[i].name] = value;
	          }
	        }
	      }
				
				// Call the API
				app.client.request(undefined,action,method,undefined,payload,function(status,response){
						// Display an error on the form if needed
						if(status !== 200){
							// Logout the user if status code was 403
							if(status == 403){
								app.logout();
							}else{
								// Try to get the error from the API, or set a default error message
								var error = typeof(response.Error) == 'string' ? response.Error : 'An error has occured, please try again';
								app.form_validation(id,error,'block');
							}
						}else{
							// If successful, send to form response processor
							app.form_processor(id,payload,response);
						}
				});
			});
    }
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
					app.set_token(response);
					window.location = '/checks/all';
				}
		});
	}

	// If login was successful, set the token in localstorage and redirect the user
	if(id == 'sessionCreate'){
		app.set_token(response);
		window.location = '/checks/all';
	}

  // If forms saved successfully and they have success messages, show them
  var formsWithSuccessMessages = ['accountEdit', 'accountEditPassword'];
  if(formsWithSuccessMessages.indexOf(id) > -1){
    document.querySelector("#"+id+" .formSuccess").style.display = 'block';
  }

};

// Get the session toke from localstorage and set it in the app.config object
app.get_token = function(){
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
app.set_token = function(token){
		app.config.token = token;
		var token_string = JSON.stringify(token);
		localStorage.setItem('token',token_string);
		if(typeof(token) == 'object'){
			app.set_login_class(true);
		}else{
			app.set_login_class(false);
		}
};

// Load form data
app.load_form_data = function(){
	// Get the current page from the body class
	var bodyClasses = document.querySelector('body').classList;
	var primaryClass = typeof(bodyClasses[0]) == 'string' ? bodyClasses[0] : false;

	// Logic for account settings page
	if(primaryClass=='account-edit'){
		app.load_account_edit_form_data();
	}
};

// Load the account edit form with data
app.load_account_edit_form_data = function(){
	// Get the email address from the current token, or log the user out if none is set
	var email = typeof(app.config.token.email) == 'string' ? app.config.token.email : false;
	if(email){
		// Fetch the user data
		var query_string = {
			'email' : email
		};

		// Parse the token to the request header
		var headers = {
			'token' : localStorage.getItem('token')
		};
		app.client.request(undefined,'api/users','GET',query_string,undefined,function(status,response){
			if(status==200){
				// Put the data into the forms as values where needed
				document.querySelector('#accountEdit input[name="name"]').value = response.name;
				document.querySelector('#accountEdit input[name="email"]').value = response.email;
				document.querySelector('#accountEditPassword input[name="email"]').value = response.email;
				document.querySelector('#accountEdit input[name="address"]').value = response.address;
				document.querySelector('#accountEdit input[name="street"]').value = response.street;
			}else{
				// If the request comes back as something other than 200, log the user out (on the assumption that the API is temporarily down or the users token is invalid)
				app.logout();
			}
		});
	}else{
		app.logout();
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
							app.set_token(response);
							callback(false);
					}else{
							app.set_token(false);
							callback(true);
					}
				});
			}else{
				app.set_token(false);
				callback(true);
			}
		});
	}else{
		app.set_token(false);
		callback(true);
	}
};

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

	// Bind logout button
	app.bind_logout_button();

	// Get the session toke from localstorage and set it in the app.config object
	app.get_token();

	// Renew token
	app.renew_tokens();

  // Load form data on page
  app.load_form_data();

};

// Call the init processes after the window loads
window.onload = function(){
	app.init();
};
