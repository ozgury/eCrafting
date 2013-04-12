/*!
 * Static content module - Processed last on unmatched GET
 */
 var rootpath = process.cwd() + '/',
	path = require('path'),
	calipso = require(path.join(rootpath, 'lib/calipso')),
	Query = require("mongoose").Query,
	everyauth = require("everyauth")
	domain = require('./ecrafting.domain'),
	circles = require('./ecrafting.circles'),
	api = require('./ecrafting.api'),
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
	var aPerm = calipso.permission.Helper.hasPermission("admin:user");

	// Menu
	res.menu.admin.addMenuItem(req, {name:'eCrafting', path:'ecrafting', weight:5, url:'/ecrafting', description:'eCrafting Management ...', permit:aPerm });
	module.router.route(req, res, next);

	domain.route(req, res, next);
	circles.route(req, res, next);
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
}

function addActivity(event, data, next) {
	//console.log("Event: ", event);
	//console.log("Data: ", data);
	return next();
}


function init(module, app, next) {
	calipso.lib.step(
		function defineRoutes() {
			module.router.addRoute('GET /ecrafting', showMain, {template:'ecrafting', block:'admin.show'}, this.parallel());
			module.router.addRoute('GET /about', showMain, {template:'about', block:'admin.show'}, this.parallel());
			module.router.addRoute('GET /locations', showMain, {template:'locations', block:'admin.show'}, this.parallel());
			module.router.addRoute('GET /timeline', showMain, {template:'timeline', block:'admin.show'}, this.parallel());
			module.router.addRoute('GET /current', showMain, {template:'current', block:'admin.show'}, this.parallel());

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
			circles.init(module, app, next);
			api.init(module, app, next);
			registerEventListeners();
			next();
		});
}

function showMain(req, res, template, block, next) {
	calipso.theme.renderItem(req, res, template, block, {content: { title: "eCrafting Dashboard"} }, next);
//  res.send('eCrafting dashboard.');
}