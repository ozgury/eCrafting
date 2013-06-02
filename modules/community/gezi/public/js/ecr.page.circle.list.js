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

	this.addCircles = function () {
		var command = 'circles';
		var parameters = null;

		apiWrapper.apiCall(command, parameters, null, function (data, jqXhr) {
			$.each(data, function(index, circle) {
				$('#circleList').append(Mustache.to_html($('#circleListItem').val(), circle));
			});
		});
	}

	this.initialize = function () {
		this.addCircles();
	}
};