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
	path: 'GET /circle',
	fn: listCircle,
	admin: false,
	permit: calipso.permission.Helper.hasPermission("admin:circle:view"),
	template: 'circle.list',
	block: 'content.circle.show'
}, {
	path: 'GET /circle/list.:format?',
	fn: listCircle,
	admin: false,
//	permit: calipso.permission.Helper.hasPermission("admin:circle:view"),
	template: 'circle.list',
	block: 'content.circle.list'
}, {
	path: 'GET /circle/show/:id.:format?',
	fn: showCircle,
	admin: false,
//		permit: calipso.permission.Helper.hasPermission("admin:circle:view"),
	template: 'circle.show',
	block: 'content.circle.show'
}, {
	path: 'GET /circle/edit/:id?',
	fn: editCircleForm,
	admin: false,
//		permit: calipso.permission.Helper.hasPermission("admin:circle:update"),
	block: 'content.circle.edit',
	template: 'circle.edit'
}, {
	path: 'GET /circle/delete/:id',
	fn: deleteCircle,
	admin: false,
//		permit: calipso.permission.Helper.hasPermission("admin:circle:delete")
}, {
	path: 'GET /circle/:id/call/edit/:cid?',
	fn: editCircleCallForm,
	admin: false,
//		permit: calipso.permission.Helper.hasPermission("admin:call:edit"),
	template: 'call.edit',
	block: 'content.call.edit'
}, {
	path: 'POST /circle/:id/call/edit/:cid?',
	fn: updateCircleCall,
	admin: false
//		permit: calipso.permission.Helper.hasPermission("admin:call:update")
}, {
	path: 'GET /circle/:id/call/:cid/project/edit/:pid?',
	fn: editCallProjectForm,
	admin: false,
//		permit: calipso.permission.Helper.hasPermission("admin:project:edit"),
	template: 'project.edit',
	block: 'content.project.edit'
}, {
	path: 'POST /circle/:id/call/:cid/project/edit/:pid?',
	fn: updateCallProject,
	admin: false
//		permit: calipso.permission.Helper.hasPermission("admin:project:update")
}, {
	path: 'GET /call/list.:format?',
	fn: listCall,
	admin: false,
//	permit: calipso.permission.Helper.hasPermission("admin:circle:view"),
	template: 'call.list',
	block: 'content.call.list'
}, {
	path: 'GET /project/list.:format?',
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
	var aPerm = calipso.permission.Helper.hasPermission("admin:user");

		// Menu
		res.menu.admin.addMenuItem(req, {
			name: 'Circles',
			path: 'ecrafting/circles',
			weight: 10,
			url: '/circle',
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
* Content type create / edit form
*/
var circleForm = {
	id: 'FORM',
	title: 'Circle',
	type: 'form',
	method: 'POST',
	tabs: true,
	action: '/circle',
	sections: [{
		id: 'type-section',
		label: 'Circle',
		fields: [{
			label: 'Name',
			name: 'circle[name]',
			type: 'text',
			description: 'Enter the name of the circle, it must be unique.'
		}, {
			label: 'Image',
			name: 'circle[image]',
			type: 'file',
			description: 'Enter an image for circle.'
		}, {
			label: 'Description',
			name: 'circle[description]',
			type: 'textarea',
			description: 'Enter a description.'
		}, {
			label: 'Location',
			name: 'circle[location]',
			type: 'text',
			description: 'Enter the circle location.'
		}, {
			label:'Members', 
			name:'circle[members]', 
			type:'text', 
			description:'Enter circle members delimited by comma.'
		}, {
			label:'Links', 
			name:'circle[links]', 
			type:'text', 
			description:'Enter circle links delimited by comma.'
		}, {
			label:'Tags', 
			name:'circle[tags]', 
			type:'text', 
			description:'Enter comma delimited tags for this circle.'
		}
		]
	}],
	buttons: [{
		name: 'submit',
		type: 'submit',
		value: 'Save Circle'
	}, {
		name: 'cancel',
		type: 'button',
		href: '/circle',
		value: 'Cancel'
	}]
};

function readCircleFromForm(req, form, existingCircle) {
	var c = existingCircle;

	if (form.circle.image === '') {
		form.circle.image = null;
	}
	if (c) {
		calipso.form.mapFields(form.circle, existingCircle);
		c.members = utilities.commaSeparatedtoArray(form.circle.members, c.members);
		c.links = utilities.commaSeparatedtoArray(form.circle.links, c.links);
		c.tags = utilities.commaSeparatedtoArray(form.circle.tags, c.tags);
	} else {
		var Circle = calipso.db.model('Circle');

		c = new Circle(form.circle);
		c.owner = req.session.user.username;
		c.members = utilities.commaSeparatedtoArray(form.circle.members, []);
		c.links = utilities.commaSeparatedtoArray(form.circle.links, []);
		c.tags = utilities.commaSeparatedtoArray(form.circle.tags, []);
	}
	return c;
}

function readCallFromForm(req, form, existingCall) {
	var call = existingCall;

	if (form.call.image === '') {
		form.call.image = null;
	}
	if (call) {
		calipso.form.mapFields(form.call, existingCall);
	} else {
		call = form.call;
		call.owner = req.session.user.username;
	}
	return call;
}

function readProjectFromForm(req, form, existingProject) {
	var p = existingProject;

	if (p) {
		console.log('Form: ', form);
		calipso.form.mapFields(form.project, existingProject);
	} else {
		console.log('Form: ', form);
		p = form.project;
		p.owner = req.session.user.username;
	}
	var media = form.media;
	var toDelete = [];
	
	p.media.forEach(function(savedMedia) {
		if (media === undefined || media.indexOf(savedMedia) == 0) {
			toDelete.push(savedMedia);
		}
	});
	p.media = [];
	if (media != undefined) {
		media.forEach(function(m) {
			p.media.push(m);
		});
	}
	/*
	toDelete.forEach(function(m) 
		p.media.push(m);
	});
	*/
	console.log('Project: ', p);
	console.log('ToDelete: ', toDelete);
	return p;
}

/**
* Edit circle
*/
function editCircleForm(req, res, template, block, next) {

	var Circle = calipso.db.model('Circle');
	var id = req.moduleParams.id;
	var item;

	res.menu.adminToolbar.addMenuItem(req, {
		name: 'Add Call',
		path: 'addcall',
		url: '/circle/' + id + '/addcall',
		description: 'Add Call ...',
		permit: calipso.permission.Helper.hasPermission("admin:circle:edit")
	});

	res.menu.adminToolbar.addMenuItem(req, {
		name: 'List',
		path: 'list',
		url: '/circle/',
		description: 'List all ...',
		permit: calipso.permission.Helper.hasPermission("admin:circle:view")
	});
	res.menu.adminToolbar.addMenuItem(req, {
		name: 'View',
		path: 'show',
		url: '/circle/show/' + id,
		description: 'Current item ...',
		permit: calipso.permission.Helper.hasPermission("admin:circle:view")
	});
	res.menu.adminToolbar.addMenuItem(req, {
		name: 'Edit',
		path: 'edit',
		url: '/circle/edit/' + id,
		description: 'Edit circle ...',
		permit: calipso.permission.Helper.hasPermission("admin:circle:edit")
	});
	res.menu.adminToolbar.addMenuItem(req, {
		name: 'Delete',
		path: 'delete',
		url: '/circle/delete/' + id,
		description: 'Delete circle ...',
		permit: calipso.permission.Helper.hasPermission("admin:circle:delete")
	});

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
				calipso.form.render(circleForm, values, req, function (form) {
					calipso.theme.renderItem(req, res, template, block, values, next);
				});
				/*
				calipso.theme.renderItem(req, res, template, block, {
					item: c
				}, next);
				*/
	}
});
	} else {
		var Circle = calipso.db.model('Circle');
		var c = new Circle();

		calipso.theme.renderItem(req, res, template, block, { circle: c, action: "/api/circles/" }, next);
	}
}

/**
* Update a circle
*/
function updateCircle(req, res, template, block, next) {

	calipso.form.process(req, function (form) {

		if (form) {
			var Circle = calipso.db.model('Circle');
			var id = req.moduleParams.id;
			Circle.findById(id, function (err, c) {
				if (!err && c) {
					c = readCircleFromForm(req, form, c)
					calipso.e.pre_emit('CIRCLE_UPDATE', c, function (c) {
						c.save(function (err) {
							if (err) {
								req.flash('error', req.t('Could not update circle because {msg}.', {
									msg: err.message
								}));
								if (res.statusCode != 302) {
									// Don't redirect if we already are, multiple errors
									res.redirect('/circle/edit/' + id);
								}
								next();
							} else {
								calipso.e.post_emit('CIRCLE_UPDATE', c, function (c) {
									res.redirect('/circle/show/' + id);
									next();
								});
							}
						});
					});
				} else {
					req.flash('error', req.t('Could not locate that circle.'));
					res.redirect('/circle');
					next();
				}
			});
		}

	});
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
					url: '/circle/',
					description: 'List all ...',
					permit: calipso.permission.Helper.hasPermission("admin:circle:view")
				});
				res.menu.adminToolbar.addMenuItem(req, {
					name: 'View',
					path: 'show',
					url: '/circle/show/' + id,
					description: 'Current item ...',
					permit: calipso.permission.Helper.hasPermission("admin:circle:view")
				});
				res.menu.adminToolbar.addMenuItem(req, {
					name: 'Edit',
					path: 'edit',
					url: '/circle/edit/' + id,
					description: 'Edit circle ...',
					permit: calipso.permission.Helper.hasPermission("admin:circle:edit")
				});
				res.menu.adminToolbar.addMenuItem(req, {
					name: 'Delete',
					path: 'delete',
					url: '/circle/delete/' + id,
					description: 'Delete circle ...',
					permit: calipso.permission.Helper.hasPermission("admin:circle:delete")
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
	});

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
 	url: '/circle/new',
 	description: 'Create circle ...',
 	permit: calipso.permission.Helper.hasPermission("admin:circle:create")
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
* Delete a circle
* TODO - deal with referential integrity
*/
function deleteCircle(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var id = req.moduleParams.id;

	Circle.findById(id, function (err, c) {
		calipso.e.pre_emit('CRICLE_DELETE', c);
		Circle.remove({
			_id: id
		}, function (err) {
			if (err) {
				req.flash('info', req.t('Unable to delete the circle because {msg}.', {
					msg: err.message
				}));
				res.redirect("/circle");
			} else {
				calipso.e.post_emit('CIRCLE_DELETE', c);
				req.flash('info', req.t('The circle has now been deleted.'));
				res.redirect("/circle");
			}
			next();
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
					call: c.calls.id(cId), 
					action: '/circle/' + c.id + '/call/edit/' + (cId ? cId : "")
				}

				if (values.call == null) {
					var Call = calipso.db.model('Call');
					var c = new Call();
					values.call = c;
				}
				calipso.form.render(circleForm, values, req, function (form) {
					calipso.theme.renderItem(req, res, template, block, values, next);
				});
			}
		});
	} else {
		res.statusCode = 404;
		next();
	}
}

function updateCircleCall(req, res, template, block, next) {
	calipso.form.process(req, function (form) {
		if (form) {
			var Circle = calipso.db.model('Circle');
			var id = req.moduleParams.id;
			var cId = req.moduleParams.cid;

			Circle.findById(id, function (err, c) {
				if (!err && c) {
					var call = c.calls.id(cId);

					if (cId && !call) {
						req.flash('error', req.t('Could not locate that call.'));
						res.redirect('/circle');
						next();
						return;
					}
					call = readCallFromForm(req, form, call)
					if (!cId) {
						c.calls.push(call);
					}
					calipso.e.pre_emit('CALL_UPDATE', call, function (call) {
						c.save(function (err) {
							if (err) {
								console.log('Error: ', err);
								req.flash('error', req.t('Could not update call because {msg}.' + err, {
									msg: err.message
								}));
								if (res.statusCode != 302) {
							// Don't redirect if we already are, multiple errors
							res.redirect('/circle/edit/' + id);
						}
						next();
					} else {
						calipso.e.post_emit('CALL_UPDATE', c, function (c) {
							res.redirect('/circle/show/' + id);
							next();
						});
					}
				});
					});
				} else {
					req.flash('error', req.t('Could not locate that circle.'));
					res.redirect('/circle');
					next();
				}
			});
		}
	});
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
					action: '/circle/' + c.id + '/call/' + cId + '/project/edit/' + (pId ? pId : "")
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
				calipso.form.render(circleForm, values, req, function (form) {
					calipso.theme.renderItem(req, res, template, block, values, next);
				});
			}
		});
	} else {
		res.statusCode = 404;
		next();
	}
}

function updateCallProject(req, res, template, block, next) {
	calipso.form.process(req, function (form) {
		if (form) {
			var Circle = calipso.db.model('Circle');
			var id = req.moduleParams.id;
			var cId = req.moduleParams.cid;
			var pId = req.moduleParams.pid;

			Circle.findById(id, function (err, c) {
				if (!err && c) {
					var call = c.calls.id(cId);

					if (cId && !call) {
						req.flash('error', req.t('Could not locate that call.'));
						res.redirect('/circle');
						next();
						return;
					}
					var p = call.projects.id(pId);

					if (pId && !p) {
						req.flash('error', req.t('Could not locate that project.'));
						res.redirect('/circle');
						next();
						return;
					}
					p = readProjectFromForm(req, form, p)
					if (!pId) {
						call.projects.push(p);
					}
					calipso.e.pre_emit('PROJECT_UPDATE', p, function (p) {
						c.save(function (err) {
							if (err) {
								console.log('Error: ', err);
								req.flash('error', req.t('Could not update project because {msg}.' + err, {
									msg: err.message
								}));
								if (res.statusCode != 302) {
									// Don't redirect if we already are, multiple errors
									res.redirect('/circle/edit/' + id);
								}
								next();
							} else {
								calipso.e.post_emit('PROJECT_UPDATE', c, function (c) {
									res.redirect('/circle/show/' + id);
									next();
								});
							}
					});
					});
				} else {
					req.flash('error', req.t('Could not locate that circle.'));
					res.redirect('/circle');
					next();
				}
			});
		}
	});
}

function listProject(req, res, template, block, next) {
}

/**
* Installation process - asynch
*/
function install(next) {}