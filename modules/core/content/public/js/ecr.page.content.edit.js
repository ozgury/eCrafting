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
		//content[image]
		$('#content_image-wrapper').find('.controls').append($('#imageEdit').val());
		if ($('#content\\[image\\]').val()) {
			$('.fileupload').removeClass('fileupload-new').addClass('fileupload-exists');
			$('.fileupload').find('.fileupload-preview img').attr('src', '/api/media/' + $('#content\\[image\\]').val());
		}

		ecr.util.setFileUpload($(':file'), $('#content\\[image\\]'), $('.removebutton'));
	}
};