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
};

/**
* Initialization
*/
function init(module, app, next) {
	function initEntities(module, app, next) {
		mongooseTypes.loadTypes(calipso.lib.mongoose);
		
		var Media = new calipso.lib.mongoose.Schema({
			name:{type: String, "default":""},
			fileName:{type: String},
			mediaType:{type: String, required: true},
			path:{type: String, required: true},
			author:{type: String, required: true},
			sort:{type: Number,"default":0},
			description:String
		});

		Media.plugin(extensions, { index: true });

		calipso.db.model('Media', Media);

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
			media: [Media]
		});

		calipso.db.model('Project', Project);

		var Call = new calipso.lib.mongoose.Schema({
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
			date: {
					type: Date,
					required: true
			},
			location: {
					type:String
			},
			projects: [Project]
		});

		calipso.db.model('Call', Call);

		var Circle = new calipso.lib.mongoose.Schema({
			owner: {
				type: calipso.lib.mongoose.SchemaTypes.Email,
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
			calls: [Call]
		});

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

		calipso.db.model('Circle', Circle);

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