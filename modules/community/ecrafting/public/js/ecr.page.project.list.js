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

	this.addCalls = function () {
		var command = 'projects';
		var parameters = null;

		apiWrapper.apiCall(command, parameters, null, function (data, jqXhr) {
			$.each(data, function(index, call) {
				$('#projectsList').append(Mustache.to_html($('#projectsListItem').val(), call));
			});
		});
	}

	this.initialize = function () {
		this.addCalls();
	}
};