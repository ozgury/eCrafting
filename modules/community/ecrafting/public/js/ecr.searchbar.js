
// Copyright (c) 2013 ecrafting.org, all rights reserved.
// http://www.ecrafting.org/
if (typeof (ecr) == 'undefined') {
    ecr = {};
}
if (typeof (ecr.page) == 'undefined') {
    ecr.page = {};
}
ecr.page.Page = function () {
    var apiWrapper = new ecr.ApiWrapper();
    this.initialize = function () {


        $("#search_query_element").autocomplete({
            source: function( request, response ) {
                var command = 'search_member';
                var parameters = {q: request.term};
                apiWrapper.apiCall(command, parameters, null, function (response, jqXhr) {
                    var elements = response;
                    $('#search_results').empty()
                    for (var i=0; i<elements.length; i++) {
                        var li = '<li><a href="/projects/show/' + elements[i]._id + '">' +
                            '<div class="activity-text">' + elements[i].name + '</div></a>' +'</li>';

                        $('#search_results').append(li);
                    }
                });
            },
            minLength: 4
        });
    }
}