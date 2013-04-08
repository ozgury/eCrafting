﻿// Copyright (c) 2013 ecrafting.org, all rights reserved.
// http://www.ecrafting.org/

if (typeof (ecr) == 'undefined') {
	ecr = {};
};

ecr.load = function () {
	// Load and set variables. Called initially before Dom ready.
	ecr.logging = true;
	if (ecr.Utilities)
		ecr.util = new ecr.Utilities();
	if (!ecr.user) {
		ecr.user = { };
	}
	ecr.app = new ecr.Application();
	ecr.app.initialize();
	window.ecr = ecr;
};

ecr.Application = function () {
	this.initialize = function () {
		// Reset the forms and other screen related stuff. Called after Dom ready.
		if (ecr.isLoggedOn) {
			ecr.app.startSession();
		}
		ecr.app.initializePage();
	};

	this.sessionTimeout = function () {
		if (logoutTimer)
			clearTimeout(logoutTimer);
		$(document).unbind('mousemove');
		$(document).unbind('keypress');
		ecr.app.log("Timed out.", 'i');
		ecr.app.openDialog("/Registration/Timeout.aspx", { width: 450, height: 284 });
	};

	this.startSession = function () {
		// Only root frame should track the session.
		if (parent != self)
			return;
		if (!ecr.isLoggedOn)
			return;
		$(document).mousemove(ecr.app.renewSession);
		$(document).keypress(ecr.app.renewSession);
		ecr.app.renewSession();
	};

	var lastRenew = 0;
	var logoutTimer = 0;

	this.renewSession = function () {
		var TIMEOUT_TIME = 10 * 60 * 1000;
		var SESSION_REFRESH = 10000;
		var current = new Date().getTime();

		if (current - lastRenew < SESSION_REFRESH)
			return;
		if (logoutTimer)
			clearTimeout(logoutTimer);
		logoutTimer = setTimeout(ecr.app.sessionTimeout, TIMEOUT_TIME);
		lastRenew = current;
		ecr.app.log("Renew session.", 'i');
	};

	this.cancelSession = function () {
		if (logoutTimer)
			clearTimeout(logoutTimer);
		ecr.app.log("Canceled session.", 'i');
	};

	this.log = function (logText, logType) {
		if (!ecr.logging)
			return;
		if (logType == 'i')
			logText = "ecr.I: " + logText;
		else if (logType == 'p')
			logText = "ecr.P: " + logText;
		else if (logType == 'w')
			logText = "ecr.W: " + logText;
		else if (logType == 'e')
			logText = "ecr.E: " + logText;
		else if (logType == null || logType == 'd')
			logText = "ecr.D: " + logText;
		try {
			console.log(logText);
		} catch (err) {
		}
	};

	var processCounter = 0;
	this.longProcessStart = function (name) {
		var timer = new Date().getTime();

		$('#working').show();
		$('#working').animate({ top: '0' }, 500);
		$('.status-panel #busy').show();
		$('.status-panel #status').hide();
		processCounter++;
		ecr.app.log('Process (' + processCounter + ')' + name + ' started ');

		return {
			complete: function (more) {
				ecr.app.log('Process (' + processCounter + ')' + name + 'complete in ' + (new Date().getTime() - timer) + ' ms. ' + more, 'p');
				processCounter--;
				if (processCounter === 0) {
					$('#working').animate({ top: '-26', opacity: 'hide' }, 500);
					//$('#working').hide();
					$('.status-panel #busy').hide();
					$('.status-panel #status').show();
				}
				if (!more)
					more = '';
			}
		};
	};
	this.openBrowserWindow = function (url, name) {
		window.open(url);
		//, name, 'toolbar=0,location=0,directories=0,status=no,menubar=no');
	};

	this.userMessage = function (message, type) {
		// Hide the guides first. Guides and messages are either/or
		$(('[data-ecr-guide]')).hide();
		$('#status').hide().fadeIn('slow');
		if ($('#status').length == 0) {
			var statusHtml = "<div id='status-panel' class='alert-message default fade in' data-alert='alert' style='display: none'><a class='close' href='#'>&times;</a><div id='status'>" +
							message + "</div></div>";
			$('#status-holder').html(statusHtml);
			$('#status').hide().fadeIn('slow');
		} else {
			$('#status').html(message);
		}
		$('#status-panel').removeClass('info success warning error default').addClass(type);
		$('#status-panel').show();
	};
	this.userInfo = function (message) {
		this.userMessage(message, 'info');
	};
	this.userSuccess = function (message) {
		this.userMessage(message, 'success');
	};

	this.userWarning = function (message) {
		this.userMessage(message, 'warning');
	};

	this.guideUser = function (modelstate) {
		for (var i = 0; i < modelstate.length; i++) {
			if (modelstate[i].Key === "_CODE") {
				var $errorGuide = $(('[data-ecr-guide="' + modelstate[1].Errors[0] + '"]'));
				if ($errorGuide.length) {
					$errorGuide.show();
					return true;
				}
			}
		}
		return false;
	};

	this.userError = function (message, modelstate) {
		var stateErrors = "";
		message = message || "";

		if (modelstate) {
			if (modelstate.length === 1 || (modelstate.length === 2 && (modelstate[0].Key === "_CODE" || modelstate[1].Key === "_CODE"))) {
				stateErrors = modelstate[0]['Errors'][0];
				if (message && message.length > 0) {
					message += ' ';
				}
			} else {
				for (var i = 0; i < modelstate.length; i++) {
					$.each(modelstate[i]['Errors'], function (index, error) {
						stateErrors += '<li>' + error + '</li>';
					});
				}
				if (stateErrors.length > 0) {
					stateErrors = '<ul>' + stateErrors + '</ul>';
				}
			}
		}
		this.userMessage(message + stateErrors, 'error');
	};

	this.ajaxifyFormSubmission = function ($form, successFunction, errorFunction) {
		$form.submit(function () {
			$('html, body').animate({ scrollTop: 0 }, 'slow');
			new ecr.ApiWrapper().postForm(this, this.action, successFunction, (errorFunction != null) ? errorFunction : function (result, other, exception) {
				if (result.status == 400) {
					var modelState = eval($.parseJSON(result.responseText));

					if (!ecr.app.guideUser(modelState)) {
						ecr.app.userError(null, modelState);
						ecr.app.formFieldError(modelState);
					}
				} else {
					ecr.app.userError("An unexpected error occured. Please try again.");
				}
			});
			return false;
		});
	};

	this.initializePage = function () {
		// Set the twipsies
		if ($().twipsy) {
			$("[rel=twipsy]").twipsy({
				live: true
			});
		}
		if ($().popover) {
			$("[rel=popover]")
			.popover({
				html: true,
				delayIn: 500,
				delayOut: 100
			})
			.click(function (e) {
				e.preventDefault();
			});
		}
		$(".container").fadeIn(1000);
		if (ecr.page && ecr.page.initialize) {
			ecr.page.initialize();
		}
	};
};

var disqus_developer = 0; // developer mode is on
var disqus_shortname = 'ecrafting';
var disqus_identifier;
var disqus_url;
var disqus_title;

initializeDisqus = function (options) {
	disqus_identifier = options.id;
	disqus_url = options.url;
	disqus_title = options.title;

	/* * * DON'T EDIT BELOW THIS LINE * * */
	(function () {
		var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
		dsq.src = 'http://' + disqus_shortname + '.disqus.com/embed.js';
		(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
	})();
};