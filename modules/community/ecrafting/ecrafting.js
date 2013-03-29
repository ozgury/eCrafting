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
	
	exports = module.exports = {
		init:init,
		route:route,
		last:true
	};
	
function route(req, res, module, app, next) {
	var aPerm = calipso.permission.Helper.hasPermission("admin:user");

	// Menu
	res.menu.admin.addMenuItem(req, {name:'eCrafting', path:'ecrafting', weight:5, url:'/ecrafting', description:'eCrafting Management ...', permit:aPerm });
	module.router.route(req, res, next);

	domain.route(req, res, next);
	circles.route(req, res, next);
	api.route(req, res, next);
}

function init(module, app, next) {
	calipso.lib.step(
		function defineRoutes() {
			module.router.addRoute('GET /ecrafting', showMain, {template:'ecrafting', block:'ecrafting.show'}, this.parallel());
		},
		function done() {
			domain.init(module, app, next);
			circles.init(module, app, next);
			api.init(module, app, next);
			next();
		});
}

function showMain(req, res, template, block, next) {
	calipso.theme.renderItem(req, res, template, block, {content: { title: "eCrafting Dashboard"} }, next);
//  res.send('eCrafting dashboard.');
}