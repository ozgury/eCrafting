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
	 eCrafting = {},
	 eCrafting.domain = module.exports = {
			init: init,
			install: install,
			route: route
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
							 projects: [Project]
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
						},
						tags: [String],
						members: [calipso.lib.mongoose.SchemaTypes.Email],
						links: [calipso.lib.mongoose.SchemaTypes.Url],
						location: {
							 type:String
						},
						calls: [Call]
				 });

				 Circle.path('name').validate(function (v) {
						return v && v.length > 4 && v.length < 20;
				 }, 'Circle name should be more than 4 and less than 20 characters');
				 Call.path('name').validate(function (v) {
						return v && v.length > 4 && v.length < 20;
				 }, 'Call name should be more than 4 and less than 20 characters');
				 Project.path('name').validate(function (v) {
						return v && v.length > 4 && v.length < 20;
				 }, 'Project name should be more than 4 and less than 20 characters');

				 Project.plugin(extensions, { index: true });
				 Call.plugin(extensions, { index: true });
				 Circle.plugin(extensions, { index: true });

				 calipso.db.model('Circle', Circle);

				 var Media = new calipso.lib.mongoose.Schema({
					 name:{type: String, "default":""},
					 fileName:{type: String},
					 mediaType:{type: String, required: true},
					 path:{type: String, required: true},
					 author:{type: String, required: true},
					 ispublic:{type: Boolean, required: true, "default": false},
					 gallery:{type: String},
					 thumb:{type: String},
					 prevId:{type: String},
					 nextId:{type: String},
					 sort:{type: Number,"default":0},          
					 tags:[String],
					 description:String,          
					 created: { type: Date, "default": Date.now },
					 updated: { type: Date, "default": Date.now }
				 });

				 Media.plugin(extensions, { index: true });

				 calipso.db.model('Media', Media);


				 eCrafting.domain.project = Project;
				 eCrafting.domain.call = Call;
				 eCrafting.domain.circle = Circle;
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

	 function route(req, res, module, app) {
			eCrafting.domain.circle.pre("validate", function (next) {
				 //console.log("Circle pre validate");
				 next();
			});

			eCrafting.domain.circle.pre('save', function (next) {
				//console.log("Circle pre save");
				next();
			});
	 }

/**
 * Installation process - asynch
 */
function install(next) {}