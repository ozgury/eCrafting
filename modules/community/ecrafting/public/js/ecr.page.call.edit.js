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
		ecr.util.setFileUpload($(':file'), $('#image'), $('.removebutton'));
		ecr.util.setLocationSearch($('#location'));		
		apiWrapper.ajaxifyFormSubmissionAsJson($('#FORM'), 'call', function (response, jqXHR) {
			window.location.href = '/calls/show/' + response._id;
		});
		ecr.util.setLocationSearch();
	}
};