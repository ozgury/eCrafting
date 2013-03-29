// Copyright (c) 2013 ecrafting.org, all rights reserved.
// http://www.ecrafting.org/
"use strict";

if (typeof (ecr) == 'undefined') {
	ecr = {};
}

ecr.ApiWrapper = function () {
	var apiRootPath = "/api/";
	var that = this;

	this.apiCall = function (command, parameters, type, successFunction) {
		return this.call(apiRootPath + command + '?apikey=webclient', parameters, type, successFunction);
	};

	this.ajaxifyFormSubmission = function ($form, successFunction, errorFunction) {
		$form.submit(function () {
			$('html, body').animate({ scrollTop: 0 }, 'slow');
			new that.postForm(this, this.action, successFunction, (errorFunction != null) ? errorFunction : function (result, other, exception) {
				if (result.status == 400) {
					// We have some error here
					ecr.app.userError('Form post ' + result.status);
				}
			});
			return false;
		});
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