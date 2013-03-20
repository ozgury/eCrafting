// Copyright (c) 2013 ecrafting.org, all rights reserved.
// http://www.ecrafting.org/
"use strict";

if (typeof (ecr) == 'undefined') {
	ecr = {};
}

ecr.ApiWrapper = function () {
	var apiRootPath = "/api/";

	var getProjectsForBoundsCall = null;

	this.getProjectsForBounds = function (parameters, responseFunction) {
		if (getProjectsForBoundsCall) {
			getProjectsForBoundsCall.abort();
		}
		var command = 'projects';
		getProjectsForBoundsCall = this.apiCall(command, parameters, null, function (response, jqXhr) {
			responseFunction(response, jqXhr);
			getProjectsForBoundsCall = null;
		});
	};

	this.saveProject = function (project, responseFunction) {
		var command = 'projects/';
		this.apiCall(command, JSON.stringify(project), 'POST', function (response, jqXhr) {
			responseFunction(response, jqXhr);
		});
	};

	this.saveIncentive = function (project, responseFunction) {
		var command = 'incentives/';
		this.apiCall(command, JSON.stringify(project), 'POST', function (response, jqXhr) {
			responseFunction(response, jqXhr);
		});
	};

	this.savePowerOut = function (powerData, responseFunction) {
		var command = 'powerdata/';
		this.apiCall(command, JSON.stringify(powerData), 'POST', function (response, jqXhr) {
			responseFunction(response, jqXhr);
		});
	};

	var getPowerDevicesForBounds = null;
	this.getPowerDevicesForBounds = function (parameters, responseFunction) {
		if (getPowerDevicesForBounds) {
			getPowerDevicesForBounds.abort();
		}
		var command = 'powerdata/device';
		getPowerDevicesForBounds = this.apiCall(command, parameters, null, function (response, jqXhr) {
			responseFunction(response, jqXhr);
			getPowerDevicesForBounds = null;
		});
	};

	this.deleteIncentiveLocation = function (incentivesPath, locationId, responseFunction) {
		var command = incentivesPath + '/locations/' + locationId;
		this.call(command, null, 'DELETE', function (response, jqXhr) {
			responseFunction(response, jqXhr);
		});
	};

	this.organizations = function (path, parameters, responseFunction) {
		this.call(path, parameters, 'GET', function (response, jqXhr) {
			responseFunction(response, jqXhr);
		});
	};

	this.apiCall = function (command, parameters, type, successFunction) {
		return this.call(apiRootPath + command + '?apikey=webclient', parameters, type, successFunction);
	};

	this.postForm = function (form, action, successFunction, errorFunction) {
		return this.call(action, $(form).serialize(), 'POST', successFunction, errorFunction, "application/x-www-form-urlencoded");
	};

	this.call = function (url, parameters, type, successFunction, errorFunction, contentType) {
		var ajaxCall = ecr.app.longProcessStart('Ajax call ' + url);
		return jQuery.ajax({
			url: url,
			data: parameters,
			contentType: (contentType == null) ? "application/json; charset=utf-8" : contentType,
			dataType: 'json',
			type: (type) ? type : 'GET',
			success: function (data, textStatus, jqXhr) {
				ajaxCall.complete();
				ajaxCall = null;
				var responseProcess = ecr.app.longProcessStart('Process data ' + url);
				successFunction(data, jqXhr);
				responseProcess.complete();
			},
			error: function (jqXhr, textStatus, errorThrown) {
				if (textStatus == 'abort')
					return;
				if (errorFunction) {
					errorFunction(jqXhr);
				} else {
					ecr.app.userError("An unexpected error occured. Please try again.");
				}
			},
			complete: function () {
				if (ajaxCall) {
					ajaxCall.complete();
				}
			}
		});
	};
};