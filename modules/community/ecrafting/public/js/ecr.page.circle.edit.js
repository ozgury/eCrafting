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

	function setLocationSearch ($location) {
		var service = new google.maps.places.AutocompleteService();
		var geocoder = new google.maps.Geocoder();
		 
		$('#location').typeahead({
		  source: function(query, process) {
		    service.getPlacePredictions({ input: query }, function(predictions, status) {
		      if (status == google.maps.places.PlacesServiceStatus.OK) {
		        process($.map(predictions, function(prediction) {
		          return prediction.description;
		        }));
		      }
		    });
		  },
		  updater: function (item) {
		    geocoder.geocode({ address: item }, function(results, status) {
				if (status != google.maps.GeocoderStatus.OK) {
					ecr.app.userError("Can't find the address.");
					return;
		    	}
				$('#lat').val(results[0].geometry.location.lat());
				$('#lng').val(results[0].geometry.location.lng());
			});
		    return item;
		  }
		});
	}


	this.initialize = function () {
		ecr.util.setFileUpload($(':file'), $('#image'), $('.removebutton'));

		apiWrapper.ajaxifyFormSubmissionAsJson($('#FORM'), 'circle', function (response, jqXHR) {
			window.location.href = '/circles/show/' + response._id;
		});
		setLocationSearch();
	}
};