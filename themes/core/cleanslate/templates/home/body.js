/**
 * Additional content section / block functions for body.
 */

var rootpath = process.cwd() + '/',
  path = require('path'),
  calipso = require(path.join(rootpath, 'lib/calipso'));

exports = module.exports = function (req, options, callback) {

  /**
   *  Get additional content for blocks in the template
   */
  calipso.lib.step(

    function getContent() {
      options.getContent(req, "welcome", this.parallel());
      options.getContentList({contentType:'Carousel'}, {req:req}, this.parallel());
      options.getContent(req, {alias:'currentcall'}, this.parallel());
    }, function done(err, welcome, carousel, current) {

      carousel.contents.forEach(function(item) {
      });

      callback(err, {
        welcome:welcome,
        carousel:carousel,
        current:current
      });
    });

};
