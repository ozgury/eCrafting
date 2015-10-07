/**
 * This is sub module called by user, to allow management of circles.
 */
 var rootpath = process.cwd() + '/',
 path = require('path'),
 mongoose = require("mongoose"),
 Query = require("mongoose").Query,
 calipso = require(path.join(rootpath, 'lib/calipso')),
 mongooseTypes = require("mongoose-types"),
 mongooseValidate = require('mongoose-validate'),
 extensions = require('./lib/schema.extensions');
 eCrafting = {},
 calipso.domain = module.exports = {
	init: init,
	install: install,
	route: route
 };

/**
* Initialization
*/
function init(module, app, next) {
	function initEntities(module, app, next) {
		mongooseTypes.loadTypes(calipso.lib.mongoose);

		var Media = new calipso.lib.mongoose.Schema({
			name: { type: String, "default":"" },
			fileName: { type: String },
			mediaType: { type: String, required: true },
			path: { type: String, required: true },
			author: { type: String, required: true },
			sort: { type: Number, "default": 0 },
			data: Buffer,
			dataSmall: Buffer,
			dataMini: Buffer,
			description:String
		});

		Media.plugin(extensions, { index: true });

		calipso.db.model('Media', Media);

		var Project = new calipso.lib.mongoose.Schema({
			owner: {
				type: String,
				required: true
			},
			name: {
				type: String,
				required: true
			},
			groupID: [{
				type: calipso.lib.mongoose.Schema.ObjectId,
				ref: 'Project'
			}],
			youtube: {
				type: String
			},
			description: {
				type: String
			},
			date: {
				type: Date
			},
			approved: {
				type:Boolean
			},
			location: {
				type: String
			},
			materials: [String],
			media: [{
				type: calipso.lib.mongoose.Schema.ObjectId,
				ref: 'Media'
			}]
		});

		calipso.db.model('Project', Project);

		var Call = new calipso.lib.mongoose.Schema({
			owner: {
				type: String,
				required: true
			},
			image: {
				type: calipso.lib.mongoose.Schema.ObjectId,
				ref: 'Media'
			},
			name: {
				type: String,
			},
			description: {
				type: String,
			},
			attachment: {
				type: calipso.lib.mongoose.Schema.ObjectId,
				ref: 'Media'
			},
			date: {
				type: Date,
				required: true
			},
			location: {
				type:String
			},
			materials: [String],
			projects: [{
				type: calipso.lib.mongoose.Schema.ObjectId,
				ref: 'Project'
			}]
		});

		calipso.db.model('Call', Call);

		var Circle = new calipso.lib.mongoose.Schema({
			owner: {
				type: String,
				required: true
			},
			image: {
				type: calipso.lib.mongoose.Schema.ObjectId,
				ref: 'Media'
			},
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
			calls: [{
				type: calipso.lib.mongoose.Schema.ObjectId,
				ref: 'Call'
			}]
		});

		calipso.db.model('Circle', Circle);

		Circle.path('name').validate(function (v) {
			return v && v.length > 4 && v.length < 40;
		}, 'Circle name should be more than 4 and less than 40 characters');
		Call.path('name').validate(function (v) {
			return v && v.length > 4 && v.length < 40;
		}, 'Call name should be more than 4 and less than 40 characters');
		Project.path('name').validate(function (v) {
			return v && v.length > 4 && v.length < 40;
		}, 'Project name should be more than 4 and less than 40 characters');

		Project.plugin(extensions, { index: true });
		Call.plugin(extensions, { index: true });
		Circle.plugin(extensions, { index: true });

		var Activity = new calipso.lib.mongoose.Schema({
			description: String,
			link: String,
			image: {
				type: calipso.lib.mongoose.Schema.ObjectId,
				ref: 'Media'
			},
		});

		Activity.plugin(extensions, { index: true });

		calipso.db.model('Activity', Activity);

		calipso.domain.project = Project;
		calipso.domain.call = Call;
		calipso.domain.circle = Circle;
		calipso.domain.media = Media;
		calipso.domain.activity = Activity;

		calipso.domain.circle.pre("validate", function (next) {
			 console.log("Circle pre validate");
			 next();
			});

		calipso.domain.circle.pre('save', function (next) {
			console.log("Circle pre save");
			next();
		});

		calipso.domain.call.pre("remove", function (next) {
			var Project = calipso.db.model('Project');

			Project.remove({
				'_id': { $in: this.projects}
			}, function(err, docs){
				if (err) {
					calipso.error("Error ", err);
				} else {
				}
			});
			next();
		});

		calipso.domain.circle.pre("remove", function (next) {
			var Call = calipso.db.model('Call');

			console.log("Existing calls:", this.calls);

			var i = this.calls.length;
	
			while (i--) {
				var callId = this.calls[i];

				this.calls.remove(callId);
				Call.findById(callId, function (err, call) {
					if (!err && call) {
						call.remove(function(err, docs){
							if (err) {
								calipso.error("Error ", err);
							} else {
								console.log("Deleted call:", call);
							}
						});
					}
				});

			}
			next();
		});
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
		calipso.e.addEvent('PROJECT_ITERATE');


		calipso.permission.Helper.addPermission("admin:circles", "Circles", true);
		calipso.permission.Helper.addPermission("admin:calls", "Calls", true);
	}
	initEntities();
	initCalipsoBindings();
}

function route(req, res, module, app) {
}

/**
 * Installation process - asynch
 */
 function install(next) {}