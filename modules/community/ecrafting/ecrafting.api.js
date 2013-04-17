/**
 * This is sub module called by eCrafting, to create the api.
 */
var rootpath = process.cwd() + '/',
	path = require('path'),
	Query = require("mongoose").Query,
	calipso = require(path.join(rootpath, 'lib/calipso')),
	media = require('./ecrafting.media'),
	utilities = require('./lib/utilities');

module.exports = {
	init:init,
	route:route
}

/**
 * Define the routes that this module will respond to.
 */
var routes = [
		{ path: 'GET /api', fn: apiDefault },

		// Circles
		{ path: 'GET /api/circles/:id?', fn: listCircles },
		{ path: 'POST /api/circles/:id?', fn: updateCircle, permit: calipso.permission.Helper.hasPermission("ecrafting:circle:update") },
		{ path: 'DELETE /api/circles/:id', fn: deleteCircle, permit: calipso.permission.Helper.hasPermission("ecrafting:circle:delete") },

		// Circle Calls
		{ path: 'GET /api/calls/:id?', fn: listCalls },
		{ path: 'GET /api/circles/:id/calls/:cid?', fn: listCircleCalls },
		{ path: 'POST /api/circles/:id/calls/:cid?', fn: updateCircleCall, permit: calipso.permission.Helper.hasPermission("ecrafting:call:update") },
		{ path: 'DELETE /api/circles/:id/calls/:cid', fn: deleteCircleCall, permit: calipso.permission.Helper.hasPermission("ecrafting:call:delete")  },

		// Project Calls
		{ path: 'GET /api/projects/:id?', fn: listProjects },
		{ path: 'GET /api/circles/:id/calls/:cid/projects/:pid?', fn: listCallProjects },
		{ path: 'POST /api/circles/:id/calls/:cid/projects/:pid?', fn: updateCallProject, permit: calipso.permission.Helper.hasPermission("ecrafting:project:update") },
		{ path: 'DELETE /api/circles/:id/calls/:cid/projects/:pid', fn: deleteCallProject, permit: calipso.permission.Helper.hasPermission("ecrafting:project:delete") },

		// Media Calls
		{ path: 'GET /api/media/:id?', fn: listMedia },
		{ path: 'POST /api/media', fn: createMedia },
		{ path: 'POST /api/media/:id', fn: updateMedia },
		{ path: 'DELETE /api/media/:id', fn: deleteMedia },

		// Activities
		{ path:'GET /api/activities', fn:listActivities }
]

/**
 * Router - not async
 */
function route(req, res, module, app) {
}

function apiDefault(req, res, template, block, next) {
	res.send('eCrafting API is running');
}

function responseOk(res, body) {
	return res.send(200, body);
}

function responseError(res, code, error) {
	calipso.error("Error", (error) ? error.stack : null);
	res.send(code, error);
}

/**
 * Simple object mapper, used to copy over form values to schemas
 */
function mapFields (fields, record) {
  var props = Object.getOwnPropertyNames(fields);

  props.forEach(function (name) {
	 // If not private (e.g. _id), then copy
	 if (!name.match(/^_.*/)) {
		record.set(name, fields[name]);
	 }
  });
};

function readCircleFromBody(req, body, existingCircle) {
	if ((body.image != null) && (body.image == '')) {
		body.image = null;
	}
	if (!existingCircle) {
		var Circle = calipso.db.model('Circle');

		existingCircle = new Circle(req.body);
		existingCircle.owner = req.session.user.username;
	}
	mapFields(body, existingCircle);
	existingCircle.members = body.members instanceof Array ? body.members : utilities.commaSeparatedtoArray(body.members, existingCircle.members);
	existingCircle.links = body.links instanceof Array ? body.links : utilities.commaSeparatedtoArray(body.links, existingCircle.links);
	existingCircle.tags = body.tags instanceof Array ? body.tags : utilities.commaSeparatedtoArray(body.tags, existingCircle.tags);
	return existingCircle;
}

function readCallFromBody(req, body, existingCall) {
	if ((body.image != null) && (body.image == '')) {
		body.image = null;
	}
	if (!existingCall) {
		var Call = calipso.db.model('Call');

		existingCall = new Call(req.body);
		existingCall.owner = req.session.user.username;
	}
	mapFields(body, existingCall);
	return existingCall;
}

function readProjectFromBody(req, body, existingProject) {
	if (!existingProject) {
		var Project = calipso.db.model('Project');

		existingProject = new Project(req.body);
		existingProject.owner = req.session.user.username;
	}
	mapFields(body, existingProject);
	return existingProject;

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
 * Circles
 */

function listCircles(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var id = req.moduleParams.id;

	if (id) {
		Circle.findById(id, function (err, circle) {
			if (err) {
				return responseError(res, 404, err);
			}
			return responseOk(res, circle);
		}).populate('calls').populate('calls.projects').exec();
		return;
	}
	var order = req.moduleParams.order;
	var skip = parseInt(req.moduleParams.skip);
	var take = parseInt(req.moduleParams.take);
	var options = {
		skip: (skip === NaN) ? 0 : skip, // Starting Row
		limit: (take === NaN) ? 50 : take, // Ending Row
		sort: {
			created: -1 //Sort by Date Added DESC
		}
	};

	if (order) {
		options.sort = {};
		options.sort[order] = 1;
	}

	Circle.find({}, {}, options, function (err, circles) {
		if (err) {
			return responseError(res, 404, err);
		}
		return responseOk(res, circles);
	});
}

function updateCircle(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var id = req.moduleParams.id;

	if (!id) {
		var newCircle = readCircleFromBody(req, req.body);

		calipso.e.pre_emit('CIRCLE_CREATE', newCircle);
		newCircle.save(function (err) {
			if (err) {
				return responseError(res, 400, err);
			}
			calipso.e.post_emit('CIRCLE_CREATE', newCircle);
			return responseOk(res, newCircle);
		});
		return next();
	} else {
		Circle.findById(id, function (err, oldCircle) {
			if (!oldCircle) {
				return responseError(res, 404, err);
			} else if (!utilities.isAdminOrDataOwner(req, oldCircle)) {
				return responseError(res, 401);
			} else {
				var newCircle = readCircleFromBody(req, req.body, oldCircle);
				calipso.e.pre_emit('CIRCLE_UPDATE', newCircle);
				console.log("newCircle: ", newCircle);
				newCircle.save(function (err) {
					if (err) {
						calipso.error("Error updating circle", err);
						return responseError(res, 400, err);
					}
					calipso.e.post_emit('CIRCLE_UPDATE', oldCircle);
					return responseOk(res, oldCircle);
				});
			}
		});
	}
	next();
}

function deleteCircle(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var id = req.moduleParams.id;

	Circle.findById(id, function (err, c) {
		if (err)  {
			return responseError(res, 404, err);
		} else if (!utilities.isAdminOrDataOwner(req, c)) {
			return responseError(res, 401, err);			
		}
		calipso.e.pre_emit('CIRCLE_DELETE', c);
		Circle.remove({
			_id: id
		}, function (err) {
			if (err) {
				calipso.error("Error deleting circle", err);
				return responseError(res, 400, err);
			}
			calipso.e.post_emit('CIRCLE_DELETE', c);
			return responseOk(res, c);
		});
	});
}

function listCalls(req, res, template, block, next) {
	var Call = calipso.db.model('Call');
	var id = req.moduleParams.id;

	if (id) {
		Circle.findById(id, function (err, circle) {
			if (err) {
				return responseError(res, 404, err);
			}
			return responseOk(res, circle);
		});
		return next();
	}
	var order = req.moduleParams.order;
	var skip = parseInt(req.moduleParams.skip);
	var take = parseInt(req.moduleParams.take);
	var options = {
		skip: (skip === NaN) ? 0 : skip, // Starting Row
		limit: (take === NaN) ? 50 : take, // Ending Row
		sort: {
			created: -1 //Sort by Date Added DESC
		}
	};

	if (order) {
		options.sort = {};
		options.sort[order] = 1;
	}
	Call.find({}, {}, options, function (err, calls) {
		if (err) {
			return responseError(res, 404, err);
		}
		return responseOk(res, calls);
	});
}

function listCircleCalls(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var id = req.moduleParams.id;
	var cId = req.moduleParams.cid;

	if (id) {
		return Circle.findById(id, function (err, circle) {
			if (err) {
				return responseError(res, 400, err);
			}
			if (circle == null) {
				return responseError(res, 404);
			}
			if (cId) {
				return responseOk(res, circle.calls.id(cId));
			} else {
				return responseOk(res, circle.calls);
			}
		}).populate('projects').exec();
	} else {
		return responseError(res, 400, err);
	}
}

function updateCircleCall(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var Call = calipso.db.model('Call');
	var id = req.moduleParams.id;
	var cId = req.moduleParams.cid;

	if (!cId) {
		Circle.findById(id, function (err, circle) {
			if (!circle) {
				return responseError(res, 404, err);
			}
			var newCall = readCallFromBody(req, req.body);

			calipso.e.pre_emit('CALL_CREATE', newCall);
			newCall.save(function (err) {
				if (err) {
					calipso.error("Error creating call", err);
					return responseError(res, 400, err);
				}
				circle.calls.push(newCall.id);
				circle.save(function (err) {
					if (err) {
						calipso.error("Error creating call", err);
						return responseError(res, 400, err);
					}
					calipso.e.post_emit('CALL_CREATE', newCall);
					return responseOk(res, newCall);
				});
			});
		});
		return next();
	} else {
		Circle.findOne({ '_id': id, 'calls': cId }, function (err, circle) {
			if (!circle) {
				return responseError(res, 404, err);
			}
			circle.calls.forEach(function (call) {
				if (call.id == cId) {
					if (!utilities.isAdminOrDataOwner(req, call)) {
						return responseError(res, 401);			
					}
					calipso.e.pre_emit('CALL_UPDATE', call);
					call = readCallFromBody(req, req.body, call);
					call.save(function (err) {
						if (err) {
							calipso.error("Error updating call", err);
							return responseError(res, 400, err);
						}
						calipso.e.post_emit('CALL_UPDATE', call);
						return responseOk(res, call);
					});
				}
			});
		}).populate('calls').exec();
	}
	next();
}

function deleteCircleCall(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var id = req.moduleParams.id;
	var cId = req.moduleParams.cid;

	Circle.findById(id, function (err, circle) {
		if (!circle) {
			return responseError(res, 404, err);
		} else {
			var call = circle.calls.id(cId);

			if (!call) {
				return responseError(res, 404, err);
			} else if (!utilities.isAdminOrDataOwner(req, call)) {
				return responseError(res, 401);			
			}
			calipso.e.pre_emit('CALL_DELETE', call);
			circle.calls.pull({ _id: cId });
			circle.save(function (err) {
				if (!err) {
					calipso.e.post_emit('CALL_DELETE', call);
					return responseOk(res, call);
				} else {
					calipso.error("Error deleting call", err);
					return responseError(res, 400, err);
				}
			});
		}
	});
}

function listProjects(req, res, template, block, next) {
}

function listCallProjects(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var id = req.moduleParams.id;
	var cId = req.moduleParams.cid;
	var pId = req.moduleParams.pid;

	if (id) {
		return Circle.findById(id, function (err, circle) {
			if (err) {
				return responseError(res, 404, err);
			}
			var call = circle.calls.id(cId);

			if (!call) {
				return responseError(res, 404, err);
			}
			if (pId) {
				return responseOk(res, call.projects.id(pId));
			} else {
				return responseOk(res, call.projects);
			}
		});
	} else {
		return responseError(res, 400, err);
	}
}

function updateCallProject(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var Call = calipso.db.model('Call');
	var id = req.moduleParams.id;
	var cId = req.moduleParams.cid;
	var pId = req.moduleParams.pid;

	if (!pId) {
		Circle.findOne({ '_id': id, 'calls': cId }, function (err, circle) {
			if (!circle) {
				return responseError(res, 404, err);
			}
			var newProject = readProjectFromBody(req, req.body);

			calipso.e.pre_emit('PROJECT_CREATE', newProject);
			newProject.save(function (err) {
				if (err) {
					calipso.error("Error creating project", err);
					return responseError(res, 400, err);
				}
				circle.calls.forEach(function (call) {
					if (call.id == cId) {

						call.projects.push(newProject.id);
						call.save(function (err) {
							if (err) {
								calipso.error("Error creating project", err);
								return responseError(res, 400, err);
							}
							calipso.e.post_emit('PROJECT_CREATE', newProject);
							return responseOk(res, newProject);
						});
					}
				});
			});
		}).populate('calls').exec();
	} else {
		Call.findOne({ '_id': cId, 'projects': pId }, function (err, call) {
			if (!call) {
				return responseError(res, 404, err);
			}
			call.projects.forEach(function (project) {
				if (project.id == pId) {
					if (!utilities.isAdminOrDataOwner(req, project)) {
						return responseError(res, 401);			
					}
					calipso.e.pre_emit('PROJECT_UPDATE', project);
					project = readCallFromBody(req, req.body, project);
					project.save(function (err) {
						if (err) {
							calipso.error("Error updating project", err);
							return responseError(res, 400, err);
						}
						calipso.e.post_emit('PROJECT_UPDATE', project);
						return responseOk(res, project);
					});
				}
			});
			return next();		
		}).populate('projects').exec();
	}
	next();
}

function deleteCallProject(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var id = req.moduleParams.id;
	var cId = req.moduleParams.cid;
	var pId = req.moduleParams.pid;

	Circle.findById(id, function (err, circle) {
		if (!circle) {
			return responseError(res, 404, err);
		}
		var call = circle.calls.id(cId);

		if (!call) {
			return responseError(res, 404, err);
		}
		var project = call.projects.id(pId);
		if (!project) {
			return responseError(res, 404, err);
		} else if (!utilities.isAdminOrDataOwner(req, project)) {
			return responseError(res, 401);			
		}

		calipso.e.pre_emit('PROJECT_DELETE', project);
		call.projects.pull({ _id: pId });
		circle.save(function (err) {
			if (err) {
				calipso.error("Error deleting project", err);
				return responseError(res, 400, err);
			}
			calipso.e.post_emit('PROJECT_DELETE', project);
			return responseOk(res, project);
		});
	});
}

/**
 * Media
 */

function createMedia(req, res, template, block, next) {
	var Media = calipso.db.model('Media');  
	var author;
	var results = [];

	if(req.session && req.session.user) {      
		author = req.session.user.username;
	} else {
		author = 'Unknown';
	}

	media.processUploadedFiles(req, res, function(err, file, next) {
		if (err) {
			returnError();
			return responseError(res, 400, err);
		}
		var m = new Media();

		m.name = ''; // path.basename(file.file.name, path.extname(file.file.name)); TODO make configurable
		m.fileName = file.file.name;
		m.mediaType = file.file.type;
		m.path = file.to;
		m.author = author;
		calipso.e.pre_emit('MEDIA_CREATE', m);
		m.save(function(err) {
			if (err) {
				responseError(res, 400, err);
			}
			calipso.e.post_emit('MEDIA_CREATE', m);
			next(err);
		});
		results.push(m);
	}, function(err) {
		if (err) {
			responseError(res, 400, err);
		}
		responseOk(res, results);
	});
}

function listMedia(req, res, template, block, next) {
	var Media = calipso.db.model('Media');
	var id = req.moduleParams.id;

	if (id) {
		Media.findById(id, function (err, m) {
			if (err || !m) {
				return responseError(res, 404, err);
			}
			var data = fs.readFile(m.path, function (err, data) {
				if (err) {
					return responseError(res, 404, err);
				};
				// Below line somehow kills the login.
				//res.writeHead(200, {'Content-Type': m.mediaType });
				return res.end(data, 'binary');
			});
		});
	} else {
		return responseError(res, 404);
	}
}

function updateMedia(req, res, template, block, next) {
	var Media = calipso.db.model('Media');
	var id = req.moduleParams.id;

	if (!id) {
		return responseError(res, 404);
	}
	Media.findById(id, function (err, m) {
		if (err) {
			return responseError(res, 404, err);
		}

		var author;
		var results = [];

		if(req.session && req.session.user) {      
			author = req.session.user.username;
		} else {
			author = 'Unknown';
		}
		if (m && m.path) {
			fs.unlink(m.path, function (err) {
				calipso.error('Error deleting file ', m.path, err);
			});			
		}
		media.processUploadedFiles(req, res, function(err, file, next) {
			if (err) {
				returnError();
				return responseError(res, 400, err);
			}
			if (m === null) {
				m = new Media();
			}
			m.fileName = file.file.name;
			m.mediaType = file.file.type;
			m.path = file.to;
			m.author = author;
			calipso.e.pre_emit('MEDIA_UPDATE', m);
			m.save(function(err) {
				if (err) {
					responseError(res, 400, err);
				}
				calipso.e.post_emit('MEDIA_UPDATE', m);
				next(err);
			});
			results.push(m);
		}, function(err) {
			if (err) {
				responseError(res, 400, err);
			}
			responseOk(res, results);
		});

	});
}

function deleteMedia(req, res, template, block, next) {
	var Media = calipso.db.model('Media');
	var id = req.moduleParams.id;

	if (!id) {
		return responseError(res, 404);
	}
	Media.findById(id, function (err, m) {
		if (err || m === null) {
			return responseError(res, 404, err);
		}
		calipso.e.pre_emit('MEDIA_DELETE', m);
		fs.unlink(m.path, function (err) {
			if (err) {
			  calipso.error('Error deleting file ' + m.path, err);
			}
		});
		Media.remove({
			_id: id
		}, function (err) {
			if (err) {
				calipso.error("Error deleting media", err);
				return responseError(res, 400, err);
			}
			calipso.e.post_emit('MEDIA_DELETE', m);
			return responseOk(res, m);
		});
	});
}

function listActivities(req, res, template, block, next) {
	var Activity = calipso.db.model('Activity');

	Activity.find({}, {}, {
		skip:0, // Starting Row
		limit:20, // Ending Row
		sort:{
			created: -1 //Sort by Date Added DESC
		}
	}, function (err, activities) {
		if (err) {
			return responseError(res, 404, err);
		}
		return responseOk(res, activities);
	});
}

/**
 * Initialisation
 */
function init(module, app, next) {
	calipso.lib.async.map(routes, function (options, next) {
			module.router.addRoute(options, next)
		},
		function (err, data) {
	});
}