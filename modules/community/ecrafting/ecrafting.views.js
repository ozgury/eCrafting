/**
* This is sub module called by user, to allow management of circles.
*/
var rootpath = process.cwd() + '/',
path = require('path'),
Query = require("mongoose").Query,
calipso = require(path.join(rootpath, 'lib/calipso')),
mongooseTypes = require("mongoose-types"),
mongooseValidate = require('mongoose-validate'),
extensions = require('./lib/schema.extensions'),
utilities = require('./lib/utilities');

module.exports = {
	init: init,
	route: route,
	install: install
}

/**
* Define the routes that this module will respond to
*/
var routes = [{
	path: 'GET /admin/circles',
	fn: listCircle,
	admin: true,
	permit: calipso.permission.Helper.hasPermission("admin:ecrafting:circle:view"),
	template: 'admin.circle.list',
	block: 'content.circle.show'
}, {
	path: 'GET /circles',
	fn: listCircle,
//	permit: calipso.permission.Helper.hasPermission("admin:circle:view"),
	template: 'circle.list',
	block: 'content.circle.show'
}, {
	path: 'GET /circles/list.:format?',
	fn: listCircle,
	admin: false,
//	permit: calipso.permission.Helper.hasPermission("admin:circle:view"),
	template: 'circle.list',
	block: 'content.circle.list'
}, {
	path: 'GET /circles/show/:id.:format?',
	fn: showCircle,
	admin: false,
//		permit: calipso.permission.Helper.hasPermission("admin:circle:view"),
	template: 'circle.show',
	block: 'content.circle.show'
}, {
	path: 'GET /circles/edit/:id?',
	fn: editCircleForm,
	admin: false,
	permit: calipso.permission.Helper.hasPermission("ecrafting:circle:update"),
	block: 'content.circle.edit',
	template: 'circle.edit'
}, {
	path: 'GET /circles/:id/calls/edit/:cid?',
	fn: editCircleCallForm,
	admin: false,
	permit: calipso.permission.Helper.hasPermission("ecrafting:call:update"),
	template: 'call.edit',
	block: 'content.call.edit'
}, {
	path: 'GET /circles/:id/calls/:cid/projects/edit/:pid?',
	fn: editCallProjectForm,
	admin: false,
	permit: calipso.permission.Helper.hasPermission("ecrafting:project:update"),
	template: 'project.edit',
	block: 'content.project.edit'
}, {
	path: 'GET /calls/list.:format?',
	fn: listCall,
	admin: false,
//	permit: calipso.permission.Helper.hasPermission("admin:circle:view"),
	template: 'call.list',
	block: 'content.call.list'
}, {
	path: 'GET /projects/list.:format?',
	fn: listProject,
	admin: false,
//	permit: calipso.permission.Helper.hasPermission("admin:circle:view"),
	template: 'project.list',
	block: 'content.project.list'
}]

function allPages(req, res, template, block, next) {
	calipso.theme.renderItem(req, res, template, block, {}, next);
};

/**
* Router - not async
*/
function route(req, res, module, app) {
	var aPerm = calipso.permission.Helper.hasPermission("admin:ecrafting:circles:view");

		// Menu
		res.menu.admin.addMenuItem(req, {
			name: 'Circles',
			path: 'ecrafting/circles',
			weight: 10,
			url: '/circles',
			description: 'Manage circles ...',
			permit: aPerm
		});
	}

 /**
	* Initialization
	*/
	function init(module, app, next) {
		module.router.addRoute(/.*/, allPages, {
			end:false,
			template:'ecrafting.script',
			block:'scripts.aloha'
		}, next);
		module.router.addRoute(/.*/, allPages, {
			end:false,
			template:'ecrafting.style',
			block:'styles.aloha'
		}, next);
		calipso.lib.async.map(routes, function (options, next) {
			module.router.addRoute(options, next)
		},

		function (err, data) {
		});
	}

/**
* Edit circle
*/
function editCircleForm(req, res, template, block, next) {

	var Circle = calipso.db.model('Circle');
	var id = req.moduleParams.id;
	var item;
/*
	res.menu.adminToolbar.addMenuItem(req, {
		name: 'List',
		path: 'list',
		url: '/circles/',
		description: 'List all ...',
		permit: calipso.permission.Helper.hasPermission("admin:circle:view")
	});
	res.menu.adminToolbar.addMenuItem(req, {
		name: 'View',
		path: 'show',
		url: '/circles/show/' + id,
		description: 'Current item ...',
		permit: calipso.permission.Helper.hasPermission("admin:circle:view")
	});
	res.menu.adminToolbar.addMenuItem(req, {
		name: 'Edit',
		path: 'edit',
		url: '/circles/edit/' + id,
		description: 'Edit circle ...',
		permit: calipso.permission.Helper.hasPermission("admin:circle:edit")
	});
*/
	if (id) {
		Circle.findById(id, function (err, c) {
			if (err || c === null) {
				res.statusCode = 404;
				next();
			} else {
				var values = {
					circle: c,
					action: '/api/circles/' + c.id
				}
				calipso.theme.renderItem(req, res, template, block, values, next);
				/*
				calipso.theme.renderItem(req, res, template, block, {
					item: c
				}, next);
				*/
			}
		}).populate('calls').exec();
	} else {
		var Circle = calipso.db.model('Circle');
		var c = new Circle();

		calipso.theme.renderItem(req, res, template, block, { circle: c, action: "/api/circles/" }, next);
	}
}

/**
* Show circle
*/
function showCircle(req, res, template, block, next) {

	var item;

	var Circle = calipso.db.model('Circle');
	var id = req.moduleParams.id;
	format = req.moduleParams.format || 'html';

	Circle.findById(id, function (err, circle) {
		if (err || circle === null) {
			 // item = {id:'ERROR',type:'content',meta:{title:"Not Found!",content:"Sorry, I couldn't find that circle!"}};
			 // res.redirect
			 next();
			} else {
				res.menu.adminToolbar.addMenuItem(req, {
					name: 'List',
					path: 'list',
					url: '/circles/',
					description: 'List all ...',
					permit: calipso.permission.Helper.hasPermission("admin:ecrafting:circle:view")
				});
				res.menu.adminToolbar.addMenuItem(req, {
					name: 'View',
					path: 'show',
					url: '/circles/show/' + id,
					description: 'Current item ...',
					permit: calipso.permission.Helper.hasPermission("admin:ecrafting:circle:view")
				});
				res.menu.adminToolbar.addMenuItem(req, {
					name: 'Edit',
					path: 'edit',
					url: '/circles/edit/' + id,
					description: 'Edit circle ...',
					permit: calipso.permission.Helper.hasPermission("admin:ecrafting:circle:edit")
				});
			}
		// Set the page layout to the circle
		if (format === "html") {
			calipso.theme.renderItem(req, res, template, block, {
				circle: circle
			}, next);
		}
		if (format === "json") {
			res.format = format;
			res.send(circle.toObject());
			next();
		}
	}).populate('calls').populate('calls.projects').exec();

}

/**
* List all circles
*/
function listCircle(req, res, template, block, next) {

 // Re-retrieve our object
 var Circle = calipso.db.model('Circle');

 res.menu.adminToolbar.addMenuItem(req, {
 	name: 'New Circle',
 	path: 'new',
 	url: '/circles/edit',
 	description: 'Create circle ...',
 	permit: calipso.permission.Helper.hasPermission("admin:ecrafting:circle:create")
 });

 var format = req.moduleParams.format || 'html';

 var query = new Query();

// Initialise the block based on our content
Circle.count(query, function (err, count) {
	var total = count;

	Circle.find(query)
	.sort('circle', 1)
	.find(function (err, circles) {
			// Render the item into the response
			if (format === 'html') {
				calipso.theme.renderItem(req, res, template, block, {
					items: circles
				}, next);
			}
			if (format === 'json') {
				res.format = format;
				res.send(circles.map(function (u) {
					return u.toObject();
				}));
				next();
			}
		});
});
}

/**
* Edit circle
*/
function editCircleCallForm(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var id = req.moduleParams.id;
	var cId = req.moduleParams.cid;
	var item;

	if (id) {
		Circle.findById(id, function (err, c) {
			if (err || c === null && (cId && c.calls.id(cId) === null)) {
				res.statusCode = 404;
				next();
			} else {
				var values = {
					circle: c, 
//					call: c.calls.id(cId), 
					call: c.calls, 
					action: '/api/circles/' + c.id + '/calls/' + (cId ? cId : "")
				}

				if (values.call == null) {
					var Call = calipso.db.model('Call');
					var c = new Call();
					values.call = c;
				}
				calipso.theme.renderItem(req, res, template, block, values, next);
			}
		}).populate('calls').exec();
	} else {
		res.statusCode = 404;
		next();
	}
}

function listCall(req, res, template, block, next) {
	// Re-retrieve our object
	var Circle = calipso.db.model('Circle');
	var format = req.moduleParams.format || 'html';
	var query = new Query();

	// Initialise the block based on our content
	Circle.count(query, function (err, count) {
		var total = count;

		Circle.find(query)
		.sort('circle', 1)
		.find(function (err, circles) {
			// Render the item into the response
			var calls = [];

			circles.forEach (function(c) {
				c.calls.forEach (function(call) {
					calls.push(call);
				});
			});

			if (format === 'html') {
				calipso.theme.renderItem(req, res, template, block, {
					items: calls
				}, next);
			}
			if (format === 'json') {
				res.format = format;
				res.send(circles.map(function (u) {
					return u.toObject();
				}));
				next();
			}
		});
	});
}

function editCallProjectForm(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var id = req.moduleParams.id;
	var cId = req.moduleParams.cid;
	var pId = req.moduleParams.pid;

	if (id) {
		Circle.findById(id, function (err, c) {
			if (err || c === null || c.calls.id(cId) === null) {
				res.statusCode = 404;
				next();
			} else {
				var values = {
					circle: c, 
					call: c.calls.id(cId),
					project: c.calls.id(cId).projects.id(pId),
					action: '/api/circles/' + c.id + '/calls/' + cId + '/projects/' + (pId ? pId : "")
				}
				/*
				values.project.media.forEach(function(m) {
					m.populate();
				});
				*/
				if (values.project == null) {
					var Project = calipso.db.model('Project');
					var p = new Project();
					values.project = p;
				}
				calipso.theme.renderItem(req, res, template, block, values, next);
			}
		});
	} else {
		res.statusCode = 404;
		next();
	}
}

function listProject(req, res, template, block, next) {
}

/**
* Installation process - asynch
*/
function install(next) {}