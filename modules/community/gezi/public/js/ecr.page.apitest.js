// Copyright (c) 2013 ecrafting.org, all rights reserved.
// http://www.ecrafting.org/

if (typeof (ecr) == 'undefined') {
	ecr = {};
};

if (typeof (ecr.page) == 'undefined') {
	ecr.page = {};
};

ecr.page.ApiTest = function () {
	var apiWrapper = new ecr.ApiWrapper();

	this.initialize = function () {
		ecr.util.setFileUpload($(':file'), $('#imageid'), $('.removebutton'));
	}

	function showResponse(response, jqXhr, idIndex) {
		$('#status').html(jqXhr.status);
		$('#output').html(JSON.stringify(response));

		if (jqXhr.getResponseHeader('Location')) {
			$('#location').html(jqXhr.getResponseHeader('Location')).show();
		} else {
			$('#location').hide();          
		}
		if (response._id) {
			$('#id' + (idIndex != undefined ? idIndex : '')).html(response._id).show();
		} else {
			$('#id' + (idIndex != undefined ? idIndex : '')).hide();          
		}
	}

	function showError(jqXhr, textStatus, errorThrown) {
		$('#status').html(jqXhr.status);
		$('#output').html(JSON.stringify(response));

		if (jqXhr.getResponseHeader('Location')) {
			$('#location').html(jqXhr.getResponseHeader('Location')).show();
		} else {
			$('#location').hide();          
		}
	}

	this.create = function () {
		var command = 'circles';
		var parameters = {
			name: "The Franklin Makers",
			description: "We are a crafting group from the Franklin Institute interested in teaching and learning electronics.",
			location: "Philadelphia, 19103",
			tags: ["some", "circle"],
			members: ["ke@fi.edu", "otelhan@gmail.com"],
			links: ["www.fi.edu"],
			image: null
		};
		apiWrapper.apiCall(command, JSON.stringify(parameters), 'POST', showResponse, showError);
	};

	this.list = function () {
		var command = 'circles';
		var parameters = null;

		apiWrapper.apiCall(command, parameters, null, showResponse, showError);
	};

	this.read = function () {
		var command = 'circles/' + $('#id').html();
		var parameters = null;

		apiWrapper.apiCall(command, parameters, null, showResponse, showError);
	};

	this.update = function () {
		var command = 'circles/' + $('#id').html();
		var parameters = {
			name: "The Franklin Makers Updated",
			description: "Update: We are a crafting group from the Franklin Institute interested in teaching and learning electronics.",
			location: "Philadelphia, 19103",
			tags: ["some", "circle"]
		};

		if ($('#imageid').html()) {
			parameters.image = $('#imageid').html();
		}
		apiWrapper.apiCall(command, JSON.stringify(parameters), 'POST', showResponse, showError);
	};

	this.delete = function () {
		var command = 'circles/' + $('#id').html();

		apiWrapper.apiCall(command, null, 'DELETE', showResponse, showError);
	};

	this.createCall = function () {
		var command = 'circles/' + $('#id').html() + '/calls';
		var parameters = {
			name: "Astronomy Night",
			description: "We invite everyone from eight to eighty to join our Astronomy night workshop. We will be making t-shirts with different constellation themes and use electronic textiles to create interactive t-designs.",
			date: new Date("4/26/2013"),
			location: "The Franklin Institute"
		};

		apiWrapper.apiCall(command, JSON.stringify(parameters), 'POST', function (response, jqXhr) {
			showResponse(response, jqXhr, 2);
		}, showError);
	};

	this.listCall = function () {
		var command = 'circles/' + $('#id').html() + '/calls';
		var parameters = null;

		apiWrapper.apiCall(command, parameters, null, function (response, jqXhr) {
			showResponse(response, jqXhr, 2);
		}, showError);
	};

	this.readCall = function () {
		var command = 'circles/' + $('#id').html() + '/calls/' + $('#id2').html();
		var parameters = null;

		apiWrapper.apiCall(command, parameters, null, function (response, jqXhr) {
			showResponse(response, jqXhr, 2);
		}, showError);
	};

	this.updateCall = function () {
		var command = 'circles/' + $('#id').html() + '/calls/' + $('#id2').html();
		var parameters = {
			name: "Astronomy Night Updated",
			description: "We invite everyone from eight to eighty to join our Astronomy night workshop. We will be making t-shirts with different constellation themes and use electronic textiles to create interactive t-designs.",
			date: new Date("4/26/2013"),
			location: "The Franklin Institute"
		};

		apiWrapper.apiCall(command, JSON.stringify(parameters), 'POST', function (response, jqXhr) {
			showResponse(response, jqXhr, 2);
		}, showError);
	};

	this.deleteCall = function () {
		var command = 'circles/' + $('#id').html() + '/calls/' + $('#id2').html();

		apiWrapper.apiCall(command, null, 'DELETE', function (response, jqXhr) {
			showResponse(response, jqXhr, 2);
		}, showError);
	};

	this.createProject = function () {
		var command = 'circles/' + $('#id').html() + '/calls/' + $('#id2').html() + '/projects';
		var parameters = {
			name: "Some new project",
			description: "Some project description"
		};

		apiWrapper.apiCall(command, JSON.stringify(parameters), 'POST', function (response, jqXhr) {
			showResponse(response, jqXhr, 3);
		}, showError);
	};

	this.listProject = function () {
		var command = 'circles/' + $('#id').html() + '/calls/' + $('#id2').html() + '/projects';
		var parameters = null;

		apiWrapper.apiCall(command, parameters, null, function (response, jqXhr) {
			showResponse(response, jqXhr, 3);
		}, showError);
	};

	this.readProject = function () {
		var command = 'circles/' + $('#id').html() + '/calls/' + $('#id2').html() + '/projects/' + $('#id3').html();
		var parameters = null;

		apiWrapper.apiCall(command, parameters, null, function (response, jqXhr) {
			showResponse(response, jqXhr, 3);
		}, showError);
	};

	this.updateProject = function () {
		var command = 'circles/' + $('#id').html() + '/calls/' + $('#id2').html() + '/projects/' + $('#id3').html();
		var parameters = {
			name: "Updated project",
			description: "Some updated project description",
			approved: true
		};

		apiWrapper.apiCall(command, JSON.stringify(parameters), 'POST', function (response, jqXhr) {
			showResponse(response, jqXhr, 3);
		}, showError);
	};

	this.deleteProject = function () {
		var command = 'circles/' + $('#id').html() + '/calls/' + $('#id2').html() + '/projects/' + $('#id3').html();

		apiWrapper.apiCall(command, null, 'DELETE', function (response, jqXhr) {
			showResponse(response, jqXhr, 3);
		}, showError);
	};

	this.listActivity = function () {
		var command = 'activities/';
		var parameters = null;

		apiWrapper.apiCall(command, parameters, null, function (response, jqXhr) {
			showResponse(response, jqXhr);
		}, showError);
	};
};