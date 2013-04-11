// Copyright (c) 2013 ecrafting.org, all rights reserved.
// http://www.ecrafting.org/

if (typeof (ecr) == 'undefined') {
	ecr = {};
};

if (typeof (ecr.page) == 'undefined') {
	ecr.page = {};
};


function setFileUpload() {
	var apiWrapper = new ecr.ApiWrapper();

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
				var html = '<li class="span4">'+
										'<a href="#" class="thumbnail">'+
										'<img src="/api/media/' + value._id + '" style="width: 300px; height: 200px" alt=""></a>'+
										'<input type="hidden" id="project[media][' + (count + index) + ']" name="project[media][' + (count + index) + ']" value="' + value._id + '" />'+
										'<a href="#" class="thumbnail">Delete</a></li>'
				$('.thumbnails').append(html);			  
			});
		}
	});

	$('.somebutton').click(function(event){
		var command = 'media/' + $idInput.val();

		apiWrapper.apiCall(command, null, 'DELETE', function (response, jqXhr) {
			$('.fileupload').addClass('fileupload-new').removeClass('fileupload-exists');			
			$('.fileupload').find('span.fileupload-preview').html('');
			$idInput.val('');
			that.setFileUpload($fileUpload, $idInput, $removeButton);
		}, ecr.app.userMessage('Problem deleting file.'));
	});
}

ecr.page.Page = function () {
	this.initialize = function () {
		setFileUpload();
	}
};