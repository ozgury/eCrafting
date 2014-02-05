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
		var command = 'calls';
		var parameters = null;

		apiWrapper.apiCall(command, parameters, null, function (data, jqXhr) {
			$.each(data, function(index, call) {
				if (!call.image) {
					call.image = "http://placehold.it/100x100/95A5A6/fff/&text=C";
				} else {
					call.image = '/api/media/' + call.image + ".small";
				}
				$('#callsList').append(Mustache.to_html($('#callsListItem').val(), call));
			});
		});
	}

	this.initialize = function () {
		this.addCalls();
	}
};