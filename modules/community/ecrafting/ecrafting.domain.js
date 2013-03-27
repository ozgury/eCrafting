/**
 * This is sub module called by user, to allow management of circles.
 */
var rootpath = process.cwd() + '/',
   path = require('path'),
   Query = require("mongoose").Query,
   calipso = require(path.join(rootpath, 'lib/calipso')),
   mongooseTypes = require("mongoose-types"),
   mongooseValidate = require('mongoose-validate'),
   extensions = require('./lib/schema.extensions');

   module.exports = {
      init: init,
      install: install
   }

   /**
    * Initialization
    */
   function init(module, app, next) {
      function initEntities(module, app, next) {
         mongooseTypes.loadTypes(calipso.lib.mongoose);
      
         var Project = new calipso.lib.mongoose.Schema({
            owner: {
               type: calipso.lib.mongoose.SchemaTypes.Email,
               required: true
            },
            name: {
               type: String,
               required: true
            },
            description: {
               type: String,
            },
            approved: {
               type:Boolean
            },
            // Media
            updated: {
               type: Date
            },
            created: {
               type: Date
            }
         });

         var Call = new calipso.lib.mongoose.Schema({
               // Image
               name: {
                  type: String,
               },
               description: {
                  type: String,
               },
               date: {
                  type: Date,
                  required: true
               },
               location: {
                  type:String
               },
               projects: [Project],
               updated: {
                  type: Date
               },
               created: {
                  type: Date
               }
         });

         var Circle = new calipso.lib.mongoose.Schema({
            owner: {
               type: calipso.lib.mongoose.SchemaTypes.Email,
               required: true
            },
         // Image
            name: {
               type: String,
               required: true
            },
            description: {
               type: String,
               "default": ""
            },
            tags: [String],
            members: [calipso.lib.mongoose.SchemaTypes.Email],
            links: [calipso.lib.mongoose.SchemaTypes.Url],
            location: {
               type:String
            },
            calls: [Call],
            updated: {
               type: Date
            },
            created: {
               type: Date
            }
         });

         Circle.path('name').validate(function (v) {
            return v && v.length > 4 && v.length < 20;
         }, 'Circle name should be more than 4 and less than 20 characters');
         Circle.path('name').validate(function (v) {
            return v && v.length > 4 && v.length < 20;
         }, 'Circle name should be more than 4 and less than 20 characters');
         Project.plugin(extensions, { index: true });
         Call.plugin(extensions, { index: true });
         Circle.plugin(extensions, { index: true });

         calipso.db.model('Circle', Circle);
      }

      function initCalipsoBindings () {
         calipso.e.addEvent('CIRCLE_CREATE');
         calipso.e.addEvent('CIRCLE_UPDATE');
         calipso.e.addEvent('CIRCLE_DELETE');

         calipso.e.addEvent('CALL_CREATE');
         calipso.e.addEvent('CALL_UPDATE');
         calipso.e.addEvent('CALL_DELETE');

         calipso.e.addEvent('PROJECT_CREATE');
         calipso.e.addEvent('PROJECT_UPDATE');
         calipso.e.addEvent('PROJECT_DELETE');

         calipso.permission.Helper.addPermission("admin:circles", "Circles", true);
         calipso.permission.Helper.addPermission("admin:calls", "Calls", true);
      }

      initEntities();
      initCalipsoBindings();
   }

/**
 * Installation process - asynch
 */
function install(next) {}