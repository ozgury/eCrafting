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

	function setFileUpload() {
		$(':file').fileupload({
			url: '/api/media/',
			sequentialUploads: true,
			singleFileUploads: false,
			dataType: 'json',
			progressall: function (e, data) {
				var progress = parseInt(data.loaded / data.total * 100, 10);
				$('#progress').removeClass('hidden');
				$('#progress .bar').css(
					'width',
					progress + '%'
					);
			},
		}).bind('fileuploadalways', function (e, data) {
			if (data && data.xhr() && data.xhr().status === 200 && (JSON.parse(data.xhr().response))[0]) {
				$('#progress').addClass('hidden');

				var files = (JSON.parse(data.xhr().response));
				var count = $('.thumbnails li.span4').length;

				$.each(files, function(index, value) {
					var html = '<li id="media' + (count + index) + '" class="span4">'+
											'<a href="javascript:void(0)" class="thumbnail">'+
											'<img src="/api/media/' + value._id + '" style="width: 300px; height: 200px" alt=""></a>'+
											'<input type="hidden" id="media' + (count + index) + '" name="media' + (count + index) + '" value="' + value._id + '" data-object="project"/>'+
											'<a href="javascript:void(0)" onclick="ecr.page.deleteMedia(' + (count + index) + ', \'' + value._id + '\')" class="thumbnail">Delete</a></li>'

					$('.thumbnails').append(html);			  
				});
			}
		});
	}

	this.initialize = function () {
		setFileUpload();
		$('#FORM').submit(function () {
			$('html, body').animate({ scrollTop: 0 }, 'slow');

			var formJson = apiWrapper.serializeObject($(this));
			var media = [];

			$("input[id^='media']").each(function(index, input) {
				media.push($(input).val());
			});

			formJson.project.media = media;

			apiWrapper.call($(this).attr('action') + '?apikey=webclient', JSON.stringify(formJson.project), 'POST', function (response, jqXHR) {
				ecr.app.userSuccess('Done');
			}, function (result, other, exception) {
				if (result.status === 400) {
					var modelState = eval($.parseJSON(result.responseText));

					ecr.app.userError(modelState.errors.name.type);
					$('#' + modelState.errors.name.path).focus();
				} else if (result.status === 401) {
					ecr.app.userError('Unauthorized.');
				}
			});
			return false;
		});
	}

	this.doDeleteMedia = function (index, mId) {
		var command = 'media/' + mId;

		apiWrapper.apiCall(command, null, 'DELETE', function (response, jqXhr) {
			$('.thumbnails > li#media' + index).remove();
			ecr.app.userMessage('File deleted.');
		}, function (response, jqXhr) {
			$('.thumbnails > li#media' + index).remove();
			ecr.app.userMessage('Problem deleting file.');
		});
	}

	this.deleteMedia = function (index, mId) {
		$('.thumbnails > li#media' + index).remove();
	}
};