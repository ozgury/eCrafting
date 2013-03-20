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
    }

    this.list = function () {
      var command = 'circles';
      var parameters = null;

      apiWrapper.apiCall(command, parameters, null, function (response, jqXhr) {
        showResponse(response, jqXhr);
      });
    };

    
	this.create = function () {
        jQuery.post(hostname + "/api/products", {
          "title": "My Awesome T-shirt",  
          "description": "All about the details. Of course it's black.",  
          "images": [  
            {  
              "kind": "thumbnail",  
              "url": "images/products/1234/main.jpg"  
            }  
          ],  
          "categories": [  
              { "name": "Clothes" },
              { "name": "Shirts" } 
          ],  
          "style": "1235",  
          "variants": [  
            {  
              "color": "Black",  
              "images": [  
                {  
                  "kind": "thumbnail",  
                  "url": "images/products/1234/thumbnail.jpg"  
                },
                {  
                  "kind": "catalog",  
                  "url": "images/products/1234/black.jpg"  
                }  
              ],  
              "sizes": [  
                {  
                  "size": "S",  
                  "available": 10,  
                  "sku": "CAT-1234-Blk-S",  
                  "price": 99.99  
                },
                {
                  "size": "M",  
                  "available": 7,  
                  "sku": "CAT-1234-Blk-M",  
                  "price": 109.99  
                }  
              ]  
            }  
          ],
          "catalogs": [
              { "name": "Apparel" }
          ]  
        }, function(data, textStatus, jqXHR) { 
            console.log("Post response:"); console.dir(data); console.log(textStatus); console.dir(jqXHR); 
            $('#output').text(data);
        });
	};

    this.read = function () {
        jQuery.get(hostname + "/api/products/4f34734d21289c1c28000007", function(data, textStatus, jqXHR) { 
            console.log("Post resposne:"); 
            console.dir(data); 
            console.log(textStatus); 
            console.dir(jqXHR); 
        });
    };

    this.update = function () {
        jQuery.ajax({
            url: hostname + "/api/products/4f34734d21289c1c28000007", 
            type: "PUT",
            data: {
              "title": "My Awesome T-shirt",  
              "description": "All about the details. Of course it's black, and longsleeve.",  
              "images": [  
                {  
                  "kind": "thumbnail",  
                  "url": "images/products/1234/main.jpg"  
                }  
              ],  
              "categories": [  
                  { "name": "Clothes" },
                  { "name": "Shirts" } 
              ],  
              "style": "1234",  
              "variants": [  
                {  
                  "color": "Black",  
                  "images": [  
                    {  
                      "kind": "zoom",  
                      "url": "images/products/1234/zoom.jpg"  
                    }
                  ],  
                  "sizes": [  
                    {  
                      "size": "L",  
                      "available": 77,  
                      "sku": "CAT-1234-Blk-L",  
                      "price": 99.99  
                    }
                  ]  
                }  
              ],
              "catalogs": [
                  { "name": "Apparel" }
              ]  
            }, 
            success: function(data, textStatus, jqXHR) { 
                console.log("PUT resposne:"); 
                console.dir(data); 
                console.log(textStatus); 
                console.dir(jqXHR); 
            }
        });
    };

    this.delete = function () {
        jQuery.ajax({url: hostname + "/api/products/4f34734d21289c1c28000007", type: "DELETE", success: function(data, textStatus, jqXHR) { console.dir(data); }});
    };
};