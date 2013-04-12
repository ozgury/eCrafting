/**
 * This is sub module called by eCrafting, to create the api.
 */
var rootpath = process.cwd() + '/',
	path = require('path'),
	Query = require("mongoose").Query,
	calipso = require(path.join(rootpath, 'lib/calipso')),
	media = require('./ecrafting.media');

module.exports = {
	init:init,
	route:route
}

/**
 * Define the routes that this module will respond to.
 */
var routes = [
		{ path:'GET /api', fn:apiDefault },

		// Circles
		{ path:'GET /api/circles', fn:listCircles },
		{ path:'GET /api/circles/:id', fn:listCircles },
		{ path: 'POST /api/circles', fn: createCircle, permit: calipso.permission.Helper.hasPermission("admin:circle:create") },
		{ path: 'POST /api/circles/:id', fn: updateCircle, permit: calipso.permission.Helper.hasPermission("admin:circle:update") },
		{ path: 'DELETE /api/circles/:id', fn: deleteCircle, permit: calipso.permission.Helper.hasPermission("admin:circle:delete") },

		// Circle Calls
		{ path:'GET /api/circles/:id/calls', fn:listCircleCalls },
		{ path:'GET /api/circles/:id/calls/:cid', fn:listCircleCalls },
		{ path: 'POST /api/circles/:id/calls', fn: createCircleCall },
		{ path: 'POST /api/circles/:id/calls/:cid', fn: updateCircleCall },
		{ path: 'DELETE /api/circles/:id/calls/:cid', fn: deleteCircleCall },

		// Project Calls
		{ path:'GET /api/circles/:id/calls/:cid/projects', fn:listCallProjects },
		{ path:'GET /api/circles/:id/calls/:cid/projects/:pid', fn:listCallProjects },
		{ path: 'POST /api/circles/:id/calls/:cid/projects', fn: createCallProject },
		{ path: 'POST /api/circles/:id/calls/:cid/projects/:pid', fn: updateCallProject },
		{ path: 'DELETE /api/circles/:id/calls/:cid/projects/:pid', fn: deleteCallProject },

		// Media Calls
		{ path:'GET /api/media', fn:listMedia },
		{ path:'GET /api/media/:id', fn:listMedia },
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
 * Circles
 */
function createCircle(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var newCircle = new Circle(req.body);

	newCircle.owner = req.session.user.username;
	calipso.e.pre_emit('CIRCLE_CREATE', newCircle);
	newCircle.save(function (err) {
		if (err) {
			return responseError(res, 400, err);
		}
		calipso.e.post_emit('CIRCLE_CREATE', newCircle);
		return responseOk(res, newCircle);
	});
}

function listCircles(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var id = req.moduleParams.id;

	if (id) {
		Circle.findById(id, function (err, circle) {
			if (err) {
				return responseError(res, 404, err);
			}
			return responseOk(res, circle);
		});
	} else {
		Circle.find(function (err, circles) {
			if (err) {
				return responseError(res, 404, err);
			}
			return responseOk(res, circles);
		});
	}
}

function updateCircle(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var id = req.moduleParams.id;

	Circle.findById(id, function (err, oldCircle) {
		if (!oldCircle) {
			return responseError(res, 404, err);
		} else {
			calipso.form.mapFields(req.body, oldCircle);
			calipso.e.pre_emit('CIRCLE_UPDATE', oldCircle);
			oldCircle.save(function (err) {
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

function deleteCircle(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var id = req.moduleParams.id;

	Circle.findById(id, function (err, c) {
		if (err)  {
			return responseError(res, 404, err);
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

/**
 * Circle Calls
 */
function createCircleCall(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var id = req.moduleParams.id;

	Circle.findById(id, function (err, circle) {
		if (!circle) {
			return responseError(res, 404, err);
		}
		var newCall = req.body;

		calipso.e.pre_emit('CALL_CREATE', circle);
		circle.calls.push(newCall);
		circle.save(function (err) {
			if (err) {
				calipso.error("Error creating call", err);
				return responseError(res, 400, err);
			}
			calipso.e.post_emit('CALL_CREATE', circle.calls[circle.calls.length - 1]);
			return responseOk(res, circle.calls[circle.calls.length - 1]);
		});
	});
}

function listCircleCalls(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var id = req.moduleParams.id;
	var cId = req.moduleParams.cid;

	if (id) {
		return Circle.findById(id, function (err, circle) {
			if (err) {
				return responseError(res, 404, err);
			}
			if (cId) {
				return responseOk(res, circle.calls.id(cId));
			} else {
				return responseOk(res, circle.calls);
			}
		});
	} else {
		return responseError(res, 400, err);
	}
}

function updateCircleCall(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var id = req.moduleParams.id;
	var cId = req.moduleParams.cid;

	Circle.findById(id, function (err, circle) {
		if (!circle) {
			return responseError(res, 404, err);
		}
		var call = circle.calls.id(cId);

		if (!call) {
			return responseError(res, 404, err);
		}
		calipso.e.pre_emit('CALL_UPDATE', call);
		calipso.form.mapFields(req.body, call);
		circle.save(function (err) {
			if (err) {
				calipso.error("Error updating call", err);
				return responseError(res, 400, err);
			}
			calipso.e.post_emit('CALL_UPDATE', call);
			return responseOk(res, call);
		});
	});
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

/**
 * Call Projects
 */
function createCallProject(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var id = req.moduleParams.id;
	var cId = req.moduleParams.cid;

	Circle.findById(id, function (err, circle) {
		if (!circle) {
			return responseError(res, 404, err);
		}
		var call = circle.calls.id(cId);

		if (!call) {
			return responseError(res, 404, err);
		}
		var newProject = req.body;

		newProject.owner = req.session.user.username;
		calipso.e.pre_emit('PROJECT_CREATE', call);
		call.projects.push(newProject);
		circle.save(function (err) {
			if (err) {
				calipso.error("Error creating project", err);
				return responseError(res, 400, err);
			}
			calipso.e.post_emit('PROJECT_CREATE', call.projects[call.projects.length - 1]);
			return responseOk(res, call.projects[call.projects.length - 1]);
		});
	});
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
		}
		calipso.e.pre_emit('PROJECT_UPDATE', project);
		calipso.form.mapFields(req.body, project);
		circle.save(function (err) {
			if (err) {
				calipso.error("Error updating project", err);
				return responseError(res, 400, err);
			}
			calipso.e.post_emit('PROJECT_UPDATE', project);
			return responseOk(res, project);
		});
	});
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
	},function (err, activities) {
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