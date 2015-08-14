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
			$.each(data, function(index, project) {
				project.image = "//placehold.it/100x100/95A5A6/fff/&text=P";
				if (project.media && project.media[0]) {
					project.image = '/api/media/' + project.media[0] + ".small";
				}
				$('#projectsList').append(Mustache.to_html($('#projectsListItem').val(), project));
			});
		});
	}

	this.initialize = function () {
		this.addCalls();
	}
};