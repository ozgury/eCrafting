/**
 * Additional content section / block functions for body.
 */

var rootpath = process.cwd() + '/',
  path = require('path'),
  step = require('step'),
  calipso = require(path.join(rootpath, 'lib/calipso'));

exports = module.exports = function (req, options, callback) {

  /**
   *  Get additional content for blocks in the template
   */
  step(
    function getContent() {
      options.getContent(req, {alias:'welcome'}, this.parallel());
/*      options.getContent(req, 'about-me', this.parallel());

      options.getContentList({contetn:'welcome'}, {req:req}, this.parallel());
*/
    },
    function done(err, welcome, about, content) {
      callback(err, { welcome: welcome });
    }
  );
};

