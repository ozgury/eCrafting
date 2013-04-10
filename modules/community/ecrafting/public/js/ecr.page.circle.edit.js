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

		function beforeSendHandler() {
			//debugger;
		}

		function completeHandler() {
			//debugger;
		}

		function errorHandler(a, b, c) {
			//debugger;
		}

		function progressHandlingFunction(a, b, c) {
		}

		function setFileUpload() {
			$(':file').fileupload({
				url: '/api/media/' + $('#circle\\[image\\]').val(),
				sequentialUploads: true,
				singleFileUploads: false,
				dataType: 'json',
				progressall: function (e, data) {
					var progress = parseInt(data.loaded / data.total * 100, 10);
						$('#progress .bar').css(
							'width',
							progress + '%'
						);
				},
			}).bind('fileuploadalways', function (e, data) {
				if (data && data.xhr() && data.xhr().status === 200 && (JSON.parse(data.xhr().response))[0]) {
					//showResponse((JSON.parse(data.xhr().response))[0], data.xhr());
					$('.fileupload').removeClass('fileupload-new').addClass('fileupload-exists');
					$('.fileupload').find('.fileupload-preview img').attr('src', '/api/media/' + (JSON.parse(data.xhr().response))[0]._id);
					$('.fileupload').find('span.fileupload-preview').html((JSON.parse(data.xhr().response))[0].fileName);
					$('#circle\\[image\\]').val((JSON.parse(data.xhr().response))[0]._id);
					setFileUpload();
				} else {
					ecr.app.userMessage("Can't upload image.");
				}
			}).bind('fileuploadadd', function (e, data) {
			}).bind('fileuploadsubmit', function (e, data) {
			});			
		}

		this.initialize = function () {
			setFileUpload();
		}

		this.deleteMedia = function () {
			debugger; return;
			var command = 'media/' + $('#circle\\[image\\]').val();
debugger;
			apiWrapper.apiCall(command, null, 'DELETE', function (response, jqXhr) {
				$('.fileupload').addClass('fileupload-new').removeClass('fileupload-exists');			
				$('.fileupload').find('span.fileupload-preview').html('');
				$('#circle\\[image\\]').val('');
				setFileUpload();
			}, function(jqXhr, textStatus, errorThrown) {
				ecr.app.userMessage("Can't delete image.");
			});
		};
};