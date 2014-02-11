// Copyright (c) 2013 ecrafting.org, all rights reserved.
// http://www.ecrafting.org/

if (typeof (ecr) == 'undefined') {
	ecr = {};
};

if (typeof (ecr.page) == 'undefined') {
	ecr.page = {};
};

ecr.page.Page = function () {
	var apiWrapper = new ecr.ApiWrapper();


	function validateEmail(email) { 
	    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	    return re.test(email);
	} 

	this.initialize = function () {
		$('#forgotPassword').click(function () {
			var parameters = null;
			var email = $('#user\\[username\\]').val();

			if (!email && email.length == 0) {
				ecr.app.userError("Please enter your email address to reset your password.");
				return;
			}

			if (!validateEmail(email)) {
				ecr.app.userError("Please enter a valid email address to reset your password.");
				return;
			}

			apiWrapper.call('/user/resetpassword', '{ "username": "' + email + '" }', 'POST', function (result, other, exception) {
				ecr.app.userSuccess("We sent you an email to reset your password.");
			}, null)
			return false;
		});
	}
};