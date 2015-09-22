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

	this.initialize = function () {
		$('#forgotPassword').click(function () {

			bootbox.prompt("Please enter your username to reset your password.", function(result) {
				if (result === null) {
					ecr.app.userError("Please enter your username to reset your password.");
					return;
				} else {
					apiWrapper.call('/user/resetpassword', '{ "username": "' + result + '" }', 'POST', function (result, other, exception) {
						ecr.app.userSuccess("We sent you an email to reset your password.");
					}, null)
				}
			});
		});
	}
};