// Copyright (c) 2013 ecrafting.org, all rights reserved.
// http://www.ecrafting.org/

if (typeof (ecr) == 'undefined') {
  ecr = {};
};

if (typeof (ecr.page) == 'undefined') {
    ecr.page = {};
};

ecr.page.ApiTest = function () {
    var hostname = "http://localhost:3000";
    var apiWrapper = new ecr.ApiWrapper();

    this.initialize = function () {
    };

    function showResponse(response, jqXhr) {
        $('#status').html(jqXhr.status);
        $('#output').html(JSON.stringify(response));
        
        if (jqXhr.getResponseHeader('Location')) {
          $('#location').html(jqXhr.getResponseHeader('Location')).show();
        } else {
          $('#location').hide();          
        }
        if (response._id) {
          $('#id').html(response._id).show();
        } else {
          $('#id').hide();          
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
          name: "Some new circle",
          description: "Some circle description",
          location: "New York",
          tags: ["some", "circle"]
      };
      apiWrapper.apiCall(command, JSON.stringify(parameters), 'POST', showResponse, showError);
    };

    this.list = function () {
      var command = 'circles';
      var parameters = null;

      apiWrapper.apiCall(command, parameters, null, function (response, jqXhr) {
        showResponse(response, jqXhr);
      });
    };

    this.read = function () {
      var command = 'circles/' + $('#id').html();
      var parameters = null;

      apiWrapper.apiCall(command, parameters, null, function (response, jqXhr) {
        showResponse(response, jqXhr);
      });
    };

    this.update = function () {
      var command = 'circles/' + $('#id').html();
      var parameters = {
          name: "Some updated circle",
          description: "Some updated circle description",
          location: "New York",
          tags: ["some", "circle"]
      };
      apiWrapper.apiCall(command, JSON.stringify(parameters), 'POST', showResponse, showError);
    };

    this.delete = function () {
      var command = 'circles/' + $('#id').html();
      apiWrapper.apiCall(command, null, 'DELETE', showResponse, showError);
    };
};