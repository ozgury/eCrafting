/*!
 * Static content module - Processed last on unmatched GET
 */
 var rootpath = process.cwd() + '/',
	path = require('path'),
	calipso = require(path.join(rootpath, 'lib/calipso')),
	Query = require("mongoose").Query,
	everyauth = require("everyauth")
	domain = require('./ecrafting.domain'),
	api = require('./ecrafting.api'),
	views = require('./ecrafting.views'),
	ui = require('./lib/ui.extensions'),
	module.name = "eCrafting",
	exports = module.exports = {
		init:init,
		route:route,
		last:true,
		depends:['user']
	};

// Override default Calipso form.
calipso.form = require('./lib/form');
	
function route(req, res, module, app, next) {
	var aPerm = calipso.permission.Helper.hasPermission("admin:ecrafting");

	// Menu
	res.menu.admin.addMenuItem(req, {name:'eCrafting', path:'ecrafting', weight:5, url:'/ecrafting', description:'eCrafting Management ...', permit:aPerm });
	module.router.route(req, res, next);

	domain.route(req, res, next);
	views.route(req, res, next);
	api.route(req, res, next);
}

function registerEventListeners () {
	calipso.e.post('CIRCLE_CREATE', module.name, addActivity);
	calipso.e.post('CIRCLE_UPDATE', module.name, addActivity);
	calipso.e.post('CIRCLE_DELETE', module.name, addActivity);

	calipso.e.post('CALL_CREATE', module.name, addActivity);
	calipso.e.post('CALL_UPDATE', module.name, addActivity);
	calipso.e.post('CALL_DELETE', module.name, addActivity);

	calipso.e.post('PROJECT_CREATE', module.name, addActivity);
	calipso.e.post('PROJECT_UPDATE', module.name, addActivity);
	calipso.e.post('PROJECT_DELETE', module.name, addActivity);

	calipso.e.post('USER_CREATE', module.name, addActivity);
	calipso.e.post('USER_LOGIN', module.name, addActivity);

	calipso.e.post('CIRCLE_ADDED_USER', module.name, addActivity);
}

function addActivity(event, data, next) {
	console.log("Event: ", event);
	console.log("Data: ", data);
	var Activity = calipso.db.model('Activity');
	var activity = new Activity({
		description: null,
		link: null,
		image: null
	});

	switch(event)
	{
		case 'POST_CIRCLE_CREATE':
		case 'POST_CIRCLE_UPDATE':
			var verb = (event === 'POST_CIRCLE_CREATE') ? 'created': 'updated';

			activity.description = data.owner + ' just ' + verb + ' the circle \'' + data.name + '\'';
			activity.link = '/circles/show/' + data.id;
			activity.image = data.image;
			break;

		case 'POST_CALL_CREATE':
		case 'POST_CALL_UPDATE':
			var verb = (event === 'POST_CALL_CREATE') ? 'created': 'updated';

			activity.description = data.owner + ' just ' + verb + ' the call \'' + data.name + '\'';
			activity.link = '/calls/show/' + data.id;
			activity.image = data.image;
			break;

		case 'POST_PROJECT_CREATE':
		case 'POST_PROJECT_UPDATE':
			var verb = (event === 'POST_PROJECT_CREATE') ? 'created': 'updated';

			activity.description = data.owner + ' just ' + verb + ' the project \'' + data.name + '\'';
			activity.link = '/projects/show/' + data.id;
			activity.image = (data.media && data.media[0]) ? data.media[0] : null;
			break;

		case 'POST_USER_CREATE':
			activity.description = data.fullname + ' just registered.';
			activity.link = '/user/profile/' + data.username;
			break;

		case 'POST_USER_LOGIN':
			activity.description = data.fullname + ' logged on to eCrafting.';
			activity.link = '/user/profile/' + data.username;
			break;

		case 'POST_CIRCLE_ADDED_USER':
			activity.description = data.user + ' just joined the circle \'' + data.circle.name + '\'';
			activity.link = '/circles/show/' + data.circle.id;
			activity.image = data.circle.image;
			break;

		default:
			//calipso.error("Unexpected Event: " + event);
			return next();
	}

	activity.save(function (err) {
		if (err) {
			calipso.debug("Err: " + err);
		}
		next();
	});
}


function init(module, app, next) {
	calipso.e.addEvent('CIRCLE_CREATE');
	calipso.e.addEvent('CIRCLE_UPDATE');
	calipso.e.addEvent('CIRCLE_DELETE');
	calipso.e.addEvent('CALL_CREATE');
	calipso.e.addEvent('CALL_UPDATE');
	calipso.e.addEvent('CALL_DELETE');
	calipso.e.addEvent('PROJECT_CREATE');
	calipso.e.addEvent('PROJECT_UPDATE');
	calipso.e.addEvent('PROJECT_DELETE');

	calipso.permission.Helper.addPermission("ecrafting:circle", "eCrafting", true);
	calipso.permission.Helper.addPermission("ecrafting:call", "eCrafting", true);
	calipso.permission.Helper.addPermission("ecrafting:project", "eCrafting", true);
	calipso.permission.Helper.addPermission("admin:ecrafting:circle", "eCrafting Admin", true);
	calipso.permission.Helper.addPermission("admin:ecrafting:call", "eCrafting Admin", true);
	calipso.permission.Helper.addPermission("admin:ecrafting:project", "eCrafting Admin", true);

	calipso.lib.step(
		function defineRoutes() {
			module.router.addRoute('GET /ecrafting', showMain, {template:'ecrafting', admin:true, block:'admin.show'}, this.parallel());
			module.router.addRoute('GET /about', showMain, {template:'about', block:'content.show'}, this.parallel());
			module.router.addRoute('GET /locations', showMain, {template:'locations', block:'content.show'}, this.parallel());
			module.router.addRoute('GET /timeline', showMain, {template:'timeline', block:'content.show'}, this.parallel());
			module.router.addRoute('GET /current', showMain, {template:'current', block:'content.show'}, this.parallel());

	      module.router.addRoute(/.*/, allPages, {
	        end:false,
	        template:'ecrafting.script',
	        block:'scripts.ecrafting'
	      }, this.parallel());
	      module.router.addRoute(/.*/, allPages, {
	        end:false,
	        template:'ecrafting.style',
	        block:'styles.ecrafting'
	      }, this.parallel());

		},
		function done() {
			domain.init(module, app, next);
			views.init(module, app, next);
			api.init(module, app, next);
			registerEventListeners();
			next();
		});
}

function showMain(req, res, template, block, next) {
	calipso.theme.renderItem(req, res, template, block, {content: { title: "eCrafting Dashboard"} }, next);
//  res.send('eCrafting dashboard.');
}