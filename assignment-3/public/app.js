/*
 * Frontend logic for the application
 *
 */
// Container for the frontend application
var app = {};

// Config
app.config = {
    'token': false,
    'shipping': 2
};

// AJAX Client (for the restful API)
app.client = {};

// Interface for making API calls
app.client.request = function(headers, path, method, query_string, payload, callback) {
    // Set defaults
    headers = typeof(headers) == 'object' && headers !== null ? headers : {};
    path = typeof(path) == 'string' ? path : '/';
    method = typeof(method) == 'string' && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(method) != -1 ? method.toUpperCase() : 'GET';
    query_string = typeof(query_string) == 'object' && query_string !== null ? query_string : {};
    payload = typeof(payload) == 'object' && payload !== null ? payload : {};
    callback = typeof(callback) == 'function' ? callback : false;

    // For each query string parameter send, prepend it to the path
    var url = path + '?';
    var i = 0;
    Object.keys(query_string).forEach(function(index) {
        if (i > 0) url += '&';
        url += index + '=' + query_string[index];
        i++;
    });

    // Form the http request as a JSON type
    var xhr = new XMLHttpRequest()
    xhr.open(method, url);
    xhr.setRequestHeader("Content-Type", "application/json");

    // For each header sent, add it to the request
    Object.keys(headers).forEach(function(index) {
        xhr.setRequestHeader(index, headers[index]);
    });

    // If there is a current session token set, add that as a header
    if (app.config.token) {
        xhr.setRequestHeader('token', app.config.token.id);
    }

    // When the request comes back, handle the response
    xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            var status = xhr.status;
            var response = xhr.responseText;

            // Callback if requested
            if (callback) {
                try {
                    var response = JSON.parse(response);
                    callback(status, response);
                } catch (e) {
                    callback(status, false);
                }
            }
        }
    }

    // Send the payload as JSON
    var payload = JSON.stringify(payload);
    xhr.send(payload);

};

// Bind the logout button
app.bind_logout_button = function() {
    document.getElementById('logoutButton').addEventListener('click', function(e) {
        // Stop it from redirecting anywhere
        e.preventDefault();
        // Log the user out
        app.logout();
    });
};

// Logout the user and redirect them
app.logout = function(redirect) {
  	// Set redirectUser to default to true
  	redirect = typeof(redirect) == 'boolean' ? redirect : true;

	// Get the current token id
    var token_id = typeof(app.config.token.id) == 'string' ? app.config.token.id : false;

    // Send the current token to the tokens endpoint to delete it
    var query_string = {
        'id': token_id
    };
    app.client.request(undefined, 'api/tokens', 'DELETE', query_string, undefined, function(status, response) {
        // Set the app.config token as false
        app.set_token(false);
        // Redirect the user to the logged out page
        if(redirect){
        	window.location = '/session/deleted';
    	}
    });
};

// Bind the forms
app.bind_forms = function() {

    if (document.querySelector('form')) {

        var allForms = document.querySelectorAll('form');
        for (var i = 0; i < allForms.length; i++) {
            allForms[i].addEventListener("submit", function(e) {

                // Stop it from submitting
                e.preventDefault();
                var id = this.id;
                var action = this.action;
                var method = this.method.toUpperCase();

                // Hide the error message (if it's currently shown due to a previous error)
                document.querySelector('#' + id + ' .formError').style.display = 'hidden';

                // Hide the success message (if it's currently shown due to a previous error)
                if (document.querySelector("#" + id + " .formSuccess")) {
                    document.querySelector("#" + id + " .formSuccess").style.display = 'none';
                }

                // Turn the inputs into a payload
                var payload = {};
                var elements = this.elements;
                for (var i = 0; i < elements.length; i++) {
                    if (elements[i].type !== 'submit') {
                        var value = elements[i].type == 'checkbox' ? elements[i].checked : elements[i].value;
                        // Make sure that we set the correct API method if we defined it in our form
                        if (elements[i].name == '_method') {
                            method = value;
                        } else {
                            payload[elements[i].name] = value;
                        }
                    }
                }

        		// If the method is DELETE, the payload should be a queryStringObject instead
        		var query_string = method == 'DELETE' ? payload : {};

                // Call the API
                app.client.request(undefined, action, method, query_string, payload, function(status, response) {
                    // Display an error on the form if needed
                    if (status !== 200) {
                        // Logout the user if status code was 403
                        if (status == 403) {
                            app.logout();
                        } else {
                            // Try to get the error from the API, or set a default error message
                            var error = typeof(response.Error) == 'string' ? response.Error : 'An error has occured, please try again';
                            app.form_validation(id, error, 'block');
                        }
                    } else {
                        // If successful, send to form response processor
                        app.form_processor(id, payload, response);
                    }
                });
            });
        }
    }
};

// Form processor
app.form_processor = function(id, payload, response) {

    // If account creation was successful, try to log the user in
    if (id == 'accountCreate') {
        // Take the email and password, and use it to log the user in
        var credentials = {
            'email': payload.email,
            'password': payload.password
        }
        app.client.request(undefined, 'api/tokens', 'POST', undefined, credentials, function(status, response) {
            if (status !== 200) {
                app.form_validation(id, 'An error has occured, please try again', 'block');
            } else {
                // If successful, set the token and redirect the user
                app.set_token(response);
                window.location = '/menu';
            }
        });
    }

    // If login was successful, set the token in localstorage and redirect the user
    if (id == 'sessionCreate') {
        app.set_token(response);
        window.location = '/menu';
    }

    // If forms saved successfully and they have success messages, show them
    var formsWithSuccessMessages = ['accountEdit', 'accountEditPassword'];
    if (formsWithSuccessMessages.indexOf(id) > -1) {
        document.querySelector("#" + id + " .formSuccess").style.display = 'block';
    }

    // If the user just deleted their account, redirect them to the account-delete page
    if (id == 'accountDelete') {
        app.logout(false);
        window.location = '/account/deleted';
    }

};

// Get the session toke from localstorage and set it in the app.config object
app.get_token = function() {
    var token = localStorage.getItem('token');
    if (typeof(token) == 'string') {
        try {
            var token = JSON.parse(token);
            app.config.token = token;
            if (typeof(token) == 'object') {
                app.set_login_class(true);
            } else {
                app.set_login_class(false);
            }
        } catch (e) {
            app.config.token = false;
            app.set_login_class(false);
        }
    }
};

// Set (or remove) the logged in class for the body
app.set_login_class = function(add) {
    var body = document.querySelector('body');
    if (add) {
        body.classList.add('loggedIn');
    } else {
        body.classList.remove('loggedIn');
    }
}

// Set the session token in the app.config object as well as localstorage
app.set_token = function(token) {
    app.config.token = token;
    var token_string = JSON.stringify(token);
    localStorage.setItem('token', token_string);
    if (typeof(token) == 'object') {
        app.set_login_class(true);
    } else {
        app.set_login_class(false);
    }
};

// Load form data
app.load_form_data = function() {
    // Get the current page from the body class
    var body_classes = document.querySelector('body').classList;
    var body_class = typeof(body_classes[0]) == 'string' ? body_classes[0] : false;

    // Load form data based on body class
    app.load_form_data_by_class(body_class);
};

// Load the account edit form with data
app.load_form_data_by_class = function(body_class) {
    // Logic for account settings page
    if (body_class == 'account-edit') {
        // Get the email address from the current token, or log the user out if none is set
        var email = typeof(app.config.token.email) == 'string' ? app.config.token.email : false;
        if (email) {
            // Fetch the user data
            var query_string = {
                'email': email
            };

            app.client.request(undefined, 'api/users', 'GET', query_string, undefined, function(status, response) {
                if (status == 200) {
                    // Put the data into the forms as values where needed
                    document.querySelector('#accountEdit input[name="name"]').value = response.name;
                    document.querySelector('#accountEdit input[name="email"]').value = response.email;
                    document.querySelector('#accountEditPassword input[name="email"]').value = response.email;
                    document.querySelector('#accountDelete input[name="email"]').value = response.email;
                    document.querySelector('#accountEdit input[name="address"]').value = response.address;
                    document.querySelector('#accountEdit input[name="street"]').value = response.street;
                } else {
                    // If the request comes back as something other than 200, log the user out (on the assumption that the API is temporarily down or the users token is invalid)
                    app.logout();
                }
            });
        } else {
            app.logout();
        }
    }

    // Add email field to add cart button page
    if (body_class == 'pizza-menu') {
        // Get the email address from the current token, or log the user out if none is set
        var email = typeof(app.config.token.email) == 'string' ? app.config.token.email : false;
        if (email) {
            // Add the email field to the page
            document.querySelector('input[name="email"]').value = email;
        } else {
            app.logout();
        }
    } 

    // Retrieve cart items for current user
    if (body_class == 'checkout') {
        // Get the email address from the current token, or log the user out if none is set
        var email = typeof(app.config.token.email) == 'string' ? app.config.token.email : false;
        if (email) {
            // Fetch the user data
            var query_string = {
                'email': email
            };

            // Get cart items of current user
            app.client.request(undefined, 'api/cart', 'GET', query_string, undefined, function(status, cart_items) {
                if (status == 200) {
                    // Get menu items (hardcoded menu items from config)
                    app.client.request(undefined, 'api/menu', 'GET', query_string, undefined, function(status, menu_items) {
                        if (status == 200) {
                            // Gather list of cart items
                            var html = '';
                            var total = 0;
                            var shipping = app.config.shipping; // $2 dollar shipping for orders below $20
                            Object.keys(cart_items).forEach(function(index) {
                                var val = cart_items[index];
                                // Only display if the item exists
                                if(menu_items[index]){
                                    var total_price = (menu_items[index].price/100)*val;
                                    total = total+total_price;
                                    html += '<tr class="cart-item" data-id="'+index+'">';
                                    html += '<td align="left"><span class="delete">x</span></td>';
                                    html += '<td align="center"><span class="min">-</span><span class="qty">'+val+'</span><span class="plus">+</span></td>';
                                    html += '<td align="left">'+menu_items[index].name+'</td>';
                                    html += '<td align="center">$'+(menu_items[index].price/100)+'</td>';
                                    html += '<td align="right">$'+total_price+'</td>';
                                    html += '</tr>';
                                }
                            });
                            if(total>=20){
                                shipping = 0; // Free shipping for orders above $20
                            }

                            // First delete all elements
                            var elements = document.getElementsByClassName('cart-item');
                            while(elements.length > 0){
                                elements[0].parentNode.removeChild(elements[0]);
                            };

                            document.querySelector('.checkout .total').innerHTML = 'Total: $'+total;
                            document.querySelector('.checkout .shipping').innerHTML = 'Shipping: $'+shipping;
                            document.querySelector('.checkout .subtotal').innerHTML = 'Subtotal: $'+(total+shipping);
                            document.querySelector('.checkout table tbody').firstChild.outerHTML += html;
                            
                            // Bind delete buttons after items are in place
                            app.delete_buttons();

                            // Bind quantity buttons
                            app.qty_buttons();

                        } else {
                            // If the request comes back as something other than 200, log the user out (on the assumption that the API is temporarily down or the users token is invalid)
                            app.logout();
                        }
                    });
                } else {
                    // If the request comes back as something other than 200, log the user out (on the assumption that the API is temporarily down or the users token is invalid)
                    app.logout();
                }
            });
        } else {
            app.logout();
        }
    }

    // Retrieve cart items for current user
    if (body_class == 'order-history') {
        // Get the email address from the current token, or log the user out if none is set
        var email = typeof(app.config.token.email) == 'string' ? app.config.token.email : false;
        if (email) {
            // Fetch the user data
            var query_string = {
                'email': email
            };

            app.client.request(undefined, 'api/users', 'GET', query_string, undefined, function(status, response) {
                if (status == 200) {
                    // Fill page with orders if any
                    var orders = response.orders;
                    var html = '';
                    Object.keys(orders).forEach(function(index) {
                        var val = orders[index];

                        // Create a new JavaScript Date object based on the timestamp
                        // multiplied by 1000 so that the argument is in milliseconds, not seconds.
                        var date = new Date(val.date);
                        var hours = date.getHours();
                        var minutes = "0" + date.getMinutes();
                        var formattedTime = hours + ':' + minutes.substr(-2);
                        var total = 0;
                        var shipping = app.config.shipping; // $2 dollar shipping for orders below $20
                        html += '<div class="order">';
                            html += '<h2 style="float:left;text-align:left;">#'+(parseFloat(index)+1)+' @ '+date.getDate()+'-'+date.getMonth()+'-'+date.getFullYear()+' | '+formattedTime+'</h2>';
                            html += '<table>';
                                html += '<tr>';
                                    html += '<th style="width:10%;"align="left">Qty.</th><th style="width:20%;" align="left">Pizza</th><th style="width:20%;" align="center">Price</th><th style="width:30%;" align="right">Total price</th>';
                                html += '</tr>';
                                // Loop through the Pizza's
                                for(key in val.items){
                                    var item = val.items[key];
                                    var total_price = (item.price/100)*item.quantity;
                                    total = total+total_price;
                                    html += '<tr>';
                                    html += '<td align="center">'+item.quantity+'</td>';
                                    html += '<td align="center">'+item.name+'</td>';
                                    html += '<td align="center">$'+(item.price/100)+'</td>';
                                    html += '<td align="right">$'+total_price+'</td>';
                                    html += '</tr>';
                                }
                                
                                if(total>=20){
                                    shipping = 0; // Free shipping for orders above $20
                                }

                                // First delete all elements
                                var elements = document.getElementsByClassName('cart-item');
                                while(elements.length > 0){
                                    elements[0].parentNode.removeChild(elements[0]);
                                };

                                html += '<tr>';
                                    html += '<td align="right" colspan="3"></td><td align="right" class="total">Total: $'+total+'</td>';
                                html += '</tr>';
                                html += '<tr>';
                                    html += '<td align="right" colspan="3"></td><td align="right" class="shipping">Shipping: $'+shipping+'</td>';
                                html += '</tr>';
                                html += '<tr>';
                                    html += '<th align="right" colspan="3"></th><th align="right" class="subtotal">Subtotal: $'+(total+shipping)+'</th>';
                                html += '</tr>';
                            html += '</table>';
                        html += '</div>';
                    });
                    document.querySelector('.order-history .orders').innerHTML = html;

                    /*
                    // Put the data into the forms as values where needed
                    document.querySelector('#accountEdit input[name="name"]').value = response.name;
                    document.querySelector('#accountEdit input[name="email"]').value = response.email;
                    document.querySelector('#accountEditPassword input[name="email"]').value = response.email;
                    document.querySelector('#accountDelete input[name="email"]').value = response.email;
                    document.querySelector('#accountEdit input[name="address"]').value = response.address;
                    document.querySelector('#accountEdit input[name="street"]').value = response.street;
                    */
                } else {
                    // If the request comes back as something other than 200, log the user out (on the assumption that the API is temporarily down or the users token is invalid)
                    app.logout();
                }
            });
        } else {
            app.logout();
        }
    }    

    // Get total cart items for current user and update cart counter on menu
    app.get_cart_items(function(status, items, email) {
        var counter = 0;
        if(status==200){
            Object.keys(items).forEach(function(index) {
                counter++;
            });
        }
        // Update cart counter in menu
        document.querySelector('.cart-counter').innerHTML = 'Cart ('+counter+')';
    });

};

// Loop to renew tokens
app.renew_tokens = function() {
    setInterval(function() {
        app.renew_token(function(err) {
            if (!err) {
                console.log("Token renewed successfully @ " + Date.now());
            }
        });
    }, 1000 * 60); // Renew tokens every minute
};
app.renew_token = function(callback) {
    var token = typeof(app.config.token) == 'object' ? app.config.token : false;
    if (token) {
        // Update the token with a new expiration
        var payload = {
            'id': token.id,
            'extend': true,
        };
        app.client.request(undefined, 'api/tokens', 'PUT', undefined, payload, function(status, response) {
            if (status == 200) {
                // Get the new token details
                var query_string = {
                    'id': token.id
                };
                app.client.request(undefined, 'api/tokens', 'GET', query_string, undefined, undefined, function(status, response) {
                    if (status == 200) {
                        app.set_token(response);
                        callback(false);
                    } else {
                        app.set_token(false);
                        callback(true);
                    }
                });
            } else {
                app.set_token(false);
                callback(true);
            }
        });
    } else {
        app.set_token(false);
        callback(true);
    }
};

// Show/hide form errors
app.form_validation = function(id, msg, display) {
    // Set the formError field with the error text
    document.querySelector('#' + id + ' .formError').innerHTML = msg;
    // Show (unhide) the form error field on the form
    document.querySelector('#' + id + ' .formError').style.display = display;
};

// Quantity buttons
app.qty_buttons = function(){
    // Pizza menu quantity buttons
    var elements = document.querySelectorAll('.pizza-menu .min');
    for (var i = 0; i < elements.length; i++) {
        elements[i].addEventListener('click', function(e) {
            var parent = this.parentElement;
            var qty = parseFloat(parent.querySelector('.qty').textContent);
            if(qty==0) return false;
            parent.querySelector('.qty').innerHTML = qty-1;
        });
    }
    var elements = document.querySelectorAll('.pizza-menu .plus');
    for (var i = 0; i < elements.length; i++) {
        elements[i].addEventListener('click', function(e) {
            var parent = this.parentElement;
            var qty = parseFloat(parent.querySelector('.qty').textContent);
            parent.querySelector('.qty').innerHTML = qty+1;
        });
    } 

    // Checkout quantity buttons
    var elements = document.querySelectorAll('.checkout .min');

    for (var i = 0; i < elements.length; i++) {
        elements[i].addEventListener('click', function(e) {
            var parent = this.parentElement.parentElement;
            var id = parent.dataset.id;
            // Decrease item quantity by 1
            app.get_cart_items(function(status, items, email) {
                if(status==200){
                    // Since our handler will increase the quantity if it's above 0 we need to make sure we set the quantity to 0 for all items except for the one we are deleting
                    Object.keys(items).forEach(function(index) {
                        items[index] = 0;
                    });
                    // Decrease quantity by 1
                    items[id] = -1;
                    // Set payload fields required for the API request
                    var payload = {
                        'email' : email,
                        'items' : items
                    };
                    // Now add the item to the cart for the given quantity
                    app.client.request(undefined, 'api/cart', 'PUT', undefined, payload, function(status, response) {
                        if (status == 200) {
                            // Cart was updated, do nothing except reloading with fresh cart items
                            app.load_form_data_by_class('checkout');
                        } else {
                            alert('Could not process your request, please try again!');
                            console.log(status, response);
                        }
                    });
                } else {
                    alert('Could not process your request, please try again!');
                    console.log(status, response);
                }
            });
        });
    } 
    var elements = document.querySelectorAll('.checkout .plus');
    for (var i = 0; i < elements.length; i++) {
        elements[i].addEventListener('click', function(e) {
            var parent = this.parentElement.parentElement;
            var id = parent.dataset.id;
            // Increase item quantity by 1
            app.get_cart_items(function(status, items, email) {
                if(status==200){
                    // Since our handler will increase the quantity if it's above 0 we need to make sure we set the quantity to 0 for all items except for the one we are deleting
                    Object.keys(items).forEach(function(index) {
                        items[index] = 0;
                    });
                    // Increase quantity by 1
                    items[id] = 1;
                    // Set payload fields required for the API request
                    var payload = {
                        'email' : email,
                        'items' : items
                    };
                    // Now add the item to the cart for the given quantity
                    app.client.request(undefined, 'api/cart', 'PUT', undefined, payload, function(status, response) {
                        if (status == 200) {
                            // Cart was updated, do nothing except reloading with fresh cart items
                            app.load_form_data_by_class('checkout');
                        } else {
                            alert('Could not process your request, please try again!');
                            console.log(status, response);
                        }
                    });
                } else {
                    alert('Could not process your request, please try again!');
                    console.log(status, response);
                }
            });
        });
    } 

};

// Function to retrieve cart items for current user
app.get_cart_items = function(callback){
    var email = typeof(app.config.token.email) == 'string' ? app.config.token.email : false;
    if (email) {
        // Fetch the user data
        var query_string = {
            'email': email
        };

        // Get cart items of current user
        app.client.request(undefined, 'api/cart', 'GET', query_string, undefined, function(status, cart_items) {
            if (status == 200) {
                callback(status, cart_items, email);
            } else {
                callback(true);
            }
        });
    } else {
        callback(true);
    }
}

// Delete buttons
app.delete_buttons = function(){
    var elements = document.querySelectorAll('.checkout .delete');
    for (var i = 0; i < elements.length; i++) {
        elements[i].addEventListener('click', function(e) {
            var parent = this.parentElement.parentElement;
            var id = parent.dataset.id;

            // Remove item from users cart
            app.get_cart_items(function(status, items, email) {
                if(status==200){
                    
                    // Since our handler will increase the quantity if it's above 0 we need to make sure we set the quantity to 0 for all items except for the one we are deleting
                    Object.keys(items).forEach(function(index) {
                        items[index] = 0;
                    });

                    // Remove the item from the object by setting quantity to -999
                    // This way our handler knows that we wish to delete it from the cart
                    items[id] = -999;

                    // Set payload fields required for the API request
                    var payload = {
                        'email' : email,
                        'items' : items
                    };

                    // Now add the item to the cart for the given quantity
                    app.client.request(undefined, 'api/cart', 'PUT', undefined, payload, function(status, response) {
                        if (status == 200) {
                            // Cart was updated, do nothing except reloading with fresh cart items
                            app.load_form_data_by_class('checkout');
                        } else {
                            alert('Could not process your request, please try again!');
                            console.log(status, response);
                        }
                    });

                } else {
                    alert('Could not process your request, please try again!');
                    console.log(status, response);
                }

            });

        });
    }
};

// Bind add to cart button
app.proceed_to_checkout = function(){

    if(document.querySelector('.pizza-menu .checkout')){
        document.querySelector('.pizza-menu .checkout').addEventListener('click', function(e){
            var parent = this.parentElement;
            var elements = parent.querySelectorAll('.qty');

            // Set payload fields required for the API request
            var payload = {};
            payload['email'] = document.querySelector('input[name="email"]').value;
            payload['items'] = {};
            
            // Loop through all the menu items and find those with a quantity of 1 or higher
            for (var i = 0; i < elements.length; i++) {
                // Only add item to cart if quantity is above 0
                var qty = parseFloat(elements[i].textContent);
                if(qty>0){
                    // Grab the item ID
                    var id = elements[i].parentElement.parentElement.dataset.id;
                    payload['items'][id] = ""+qty+"";
                }
            }

            // Now add the item to the cart for the given quantity
            app.client.request(undefined, 'api/cart', 'PUT', undefined, payload, function(status, response) {
                if (status == 200) {
                    // Redirect user to checkout page
                    window.location = '/checkout';
                } else {
                    alert('Could not process your request, please try again!');
                    console.log(status, response);
                }
            });
        });
    }
}

app.place_order = function(){
    if(document.querySelector('.checkout .place-order')){
        document.querySelector('.checkout .place-order').addEventListener('click', function(e){
            
            // Change class to place-order-loading
            // This should preven a user from being able to click the button twice
            var button = this;
            button.className = "cta green-disabled place-order-loading";

            // Retrieve user cart items
            app.get_cart_items(function(status, items, email) {
                if(status==200){

                    // Set payload fields required for the API request
                    var payload = {
                        'email' : email,
                        'items' : items
                    };

                    // Check if there is anything in the current shopping cart
                    // If nothing is in the cart display error to the user
                    var counter = 0;
                    Object.keys(items).forEach(function(index) {
                        counter++;
                    });
                    if(counter==0){
                        button.className = "cta green place-order";
                        alert('Your cart is empty!');
                    }else{
                        // Create an order
                        app.client.request(undefined, 'api/checkout', 'PUT', undefined, payload, function(status, response) {
                            if (status == 200) {
                                // If order was successfully placed, empty the cart and redirect to order history
                                // Empty current cart
                                Object.keys(items).forEach(function(index) {
                                    payload['items'][index] = -999;
                                });

                                // Now add the item to the cart for the given quantity
                                app.client.request(undefined, 'api/cart', 'PUT', undefined, payload, function(status, response) {
                                    // No matter what the status code is, we will redirect the user to the order history
                                    window.location = '/orders/history';

                                    // If status was not 200 log out to console
                                    if (status != 200) {
                                        console.log('Could not empty cart!');
                                        console.log(status, response);
                                    }
                                });
     
                            } else {
                                // Something went wrong, report back to the user
                                button.className = "cta green place-order";
                                alert('Could not process your request, please try again!');
                                console.log(status, response);
                            }
                        });
                    }
                } else {
                    button.className = "cta green place-order";
                    alert('Could not process your request, please try again!');
                    console.log(status, response);
                }
            });
        });
    }
};

// Init (bootstrapping)
app.init = function() {
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

    // Bind quantity buttons
    app.qty_buttons();

    // Bind place order button
    app.place_order();

    // Bind add to cart buttons
    app.proceed_to_checkout();

};

// Call the init processes after the window loads
window.onload = function() {
    app.init();
};