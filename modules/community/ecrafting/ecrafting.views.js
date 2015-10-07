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
	path: 'GET /circles/add/:id/:uName/:uId?',
	fn: addUserToCircle,
	admin: false,
	permit: calipso.permission.Helper.hasPermission("ecrafting:circle:update"),
	template: 'circle.show',
	block: 'content.circle.show'
}, {
	path: 'GET /calls',
	fn: listCall,
//	permit: calipso.permission.Helper.hasPermission("admin:circle:view"),
template: 'call.list',
block: 'content.circle.show'
}, {
	path: 'GET /calls/show/:id.:format?',
	fn: showCall,
	admin: false,
//		permit: calipso.permission.Helper.hasPermission("admin:circle:view"),
template: 'call.show',
block: 'content.circle.show'
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
	path: 'GET /projects',
	fn: listProject,
//	permit: calipso.permission.Helper.hasPermission("admin:circle:view"),
template: 'project.list',
block: 'content.circle.show'
}, {
	path: 'GET /projects/show/:id.:format?',
	fn: showProject,
	admin: false,
//		permit: calipso.permission.Helper.hasPermission("admin:circle:view"),
template: 'project.show',
block: 'content.circle.show'
}, {
	path: 'GET /projects/list.:format?',
	fn: listProject,
	admin: false,
//	permit: calipso.permission.Helper.hasPermission("admin:circle:view"),
template: 'project.list',
block: 'content.project.list'
}, {
	path: 'GET /search/list/:query.:format?',
	fn: listProject,
	admin: false,
//	permit: calipso.permission.Helper.hasPermission("admin:circle:view"),
	template: 'search.list',
	block: 'content.search.list'
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
	//		var Circle = calipso.db.model('Circle');
	//		var c = new Circle();

	calipso.theme.renderItem(req, res, template, block, { circle: {}, action: "/api/circles/" }, next);
}
}

function addUserToCircle(req, res, template, block, next) {
	function content (c)
	{
		calipso.theme.renderItem(req, res, template, block, {
			circle: c,
			canEdit: utilities.isAdminOrDataOwner(req, c),
			canJoinCircle: req.session.user && !utilities.isUserCircleMember(req.session.user.username, c)
		}, next);
	}
	var Circle = calipso.db.model('Circle');
	var User = calipso.db.model('User');
	var id = req.moduleParams.id;
	var uId = req.moduleParams.uId;
	var uName = req.moduleParams.uName;

	Circle.findById(id, function (err, c) {
		if (err || c === null) {
			res.statusCode = 404;
			return next();
		}
		var dontAdd = false;
		if (!utilities.isAdminOrDataOwner(req, c)) {
			req.flash('error', req.t('Only administrators and circle owners can approve users.'));
			return content (c);
 		}
		calipso.e.pre_emit('CIRCLE_ADDED_USER', {
				circle: c,
				user: uName
			});
		if (utilities.isUserCircleMember(uId, c)) {
			req.flash('info', req.t('User' + uId + 'already in the circle.'));
			return content (c);
		}
		c.members.push(uName);
		c.save(function (err) {
			if (err) {
				calipso.error("Error updating circle", err);
				return responseError(res, 400, err);
			}
			calipso.e.post_emit('CIRCLE_ADDED_USER', {
				circle: c,
				user: uName
			});
			req.flash('success', req.t('New user added to circle.'));
			return content (c);
		});
	}).populate('calls').exec();
}

/**
* Show circle
*/
function showCircle(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var id = req.moduleParams.id;
	format = req.moduleParams.format || 'html';

	Circle.findById(id, function (err, circle) {
		if (err || circle === null) {
			 // item = {id:'ERROR',type:'content',meta:{title:"Not Found!",content:"Sorry, I couldn't find that circle!"}};
			 // res.redirect
			 next();
			} else {
			// Set the page layout to the circle
			if (format === "html") {
				calipso.theme.renderItem(req, res, template, block, {
					circle: circle,
					canEdit: utilities.isAdminOrDataOwner(req, circle),
					canJoinCircle: req.session.user && !utilities.isUserCircleMember(req.session.user.username, circle)
				}, next);
			}
			if (format === "json") {
				res.format = format;
				res.send(circle.toObject());
				next();
			}
		}
	}).populate('calls').exec();
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
	.sort('circle')
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
	var Call = calipso.db.model('Call');
	var id = req.moduleParams.id;
	var cId = req.moduleParams.cid;

	if (id) {
		Circle.findById(id, function (err, c) {
			var call = null;

			if (err || c === null) {
				res.statusCode = 404;
				return next();
			}
			if (!cId) {
				var values = {
					circle: c,
					call: {},	
					action: '/api/circles/' + c.id + '/calls/' + (cId ? cId : "")
				}
				calipso.theme.renderItem(req, res, template, block, values, next);
			}
			c.calls.forEach(function (c) {
				if (c.id === cId) {
					call = c;
				}
			});
			if (cId && call === null) {
				res.statusCode = 404;
				return next();
			}
			Call.findById(cId, function (err, call) {
				var values = {
					circle: c,
					call: call,	
					action: '/api/circles/' + c.id + '/calls/' + (cId ? cId : "")
				}
				calipso.theme.renderItem(req, res, template, block, values, next);
			}).populate('projects').exec();
		}).populate('calls').exec();
	} else {
		res.statusCode = 404;
		next();
	}
}

/**
* Show call
*/
function showCall(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var Call = calipso.db.model('Call');
	var id = req.moduleParams.id;
	format = req.moduleParams.format || 'html';
	Circle.findOne({ 'calls': id }, function (err, circle) {
		if (err || circle === null) {
			 // item = {id:'ERROR',type:'content',meta:{title:"Not Found!",content:"Sorry, I couldn't find that circle!"}};
			 // res.redirect
			 res.statusCode = 404;
			 next();
			} else {
				Call.findById(id, function (err, call) {
					if (err || call === null) {
					 // item = {id:'ERROR',type:'content',meta:{title:"Not Found!",content:"Sorry, I couldn't find that circle!"}};
					 // res.redirect
					 next();
					} else {
						// Set the page layout to the circle
						if (format === "html") {
							calipso.theme.renderItem(req, res, template, block, {
								circle: circle,
								call: call,
								canEdit: utilities.isAdminOrDataOwner(req, call)
							}, next);
						}
						if (format === "json") {
							res.format = format;
							res.send(call.toObject());
							next();
						}
					}
				}).populate('projects').exec();
			}
		});
}

function listCall(req, res, template, block, next) {
	calipso.theme.renderItem(req, res, template, block, {}, next);
}

function editCallProjectForm(req, res, template, block, next) {
	var Call = calipso.db.model('Call');
	var id = req.moduleParams.id;
	var cId = req.moduleParams.cid;
	var pId = req.moduleParams.pid;

	if (cId) {
		Call.findById(cId, function (err, call) {
			if (err || call === null) {
				res.statusCode = 404;
				return next();
			}
			var project = null;

			call.projects.forEach(function (p) {
				if (p.id === pId) {
					project = p;
				}
			});
			if (project == null) {
				project  = {};
			}
			var values = {
				call: call,
				project: project,	
				action: '/api/circles/' + id + '/calls/' + cId + '/projects/' + (pId ? pId : "")
			}
			calipso.theme.renderItem(req, res, template, block, values, next);
		}).populate('projects').exec();
	} else {
		res.statusCode = 404;
		next();
	}
}

/**
* Show project
*/
function showProject(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var Call = calipso.db.model('Call');
	var Project = calipso.db.model('Project');
	var id = req.moduleParams.id;
	format = req.moduleParams.format || 'html';

	Call.findOne({ 'projects': id }, function (err, call) {
		if (err || call === null) {
			 // item = {id:'ERROR',type:'content',meta:{title:"Not Found!",content:"Sorry, I couldn't find that circle!"}};
			 // res.redirect
			 res.statusCode = 404;
			 next();
			} else {

				Circle.findOne({ 'calls': call._id }, function (err, circle) {
					if (err || call === null) {
				 // item = {id:'ERROR',type:'content',meta:{title:"Not Found!",content:"Sorry, I couldn't find that circle!"}};
				 // res.redirect
				 res.statusCode = 404;
				 next();
				} else {

					Project.findById(id, function (err, project) {
						if (err || project === null) {
						 // item = {id:'ERROR',type:'content',meta:{title:"Not Found!",content:"Sorry, I couldn't find that circle!"}};
						 // res.redirect
						 next();
						} else {
							var ObjectID = require('mongodb').ObjectID;
							var noGroupID = new ObjectID("000000000000000000000000"); // dummy objectId
							var groupIds = (project.groupID.length != 0) ? project.groupID : noGroupID; //
							Project.find({ groupID: groupIds }, function (err, group) {
								if (err) {
									console.log(err);
									// item = {id:'ERROR',type:'content',meta:{title:"Not Found!",content:"Sorry, I couldn't find that circle!"}};
									// res.redirect
									next();
								} else {
									// Set the page layout to the circle
									if (format === "html") {
										var basePath = calipso.config.get('server:url');

										for (var k = 0; k<group.length; k++){
											if(group[k].id == project.id){
												group.splice(k, 1);
											}
										}
										calipso.theme.renderItem(req, res, template, block, {
											circle: circle,
											call: call,
											project: project,
											group: group,
											canEdit: utilities.isAdminOrDataOwner(req, project),
											basePath: basePath
										}, next);
									}
									if (format === "json") {
										res.format = format;
										res.send(project.toObject());
										next();
									}
								}
							});
					}
				});

				}
			});
			}
		});
}

function listProject(req, res, template, block, next) {
	calipso.theme.renderItem(req, res, template, block, {}, next);
}
/**
* Installation process - asynch
*/
function install(next) {}