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
	{ path: 'POST /api/circles/:id/join', fn: joinCircle },
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
	{ path: 'POST /api/circles/:id/calls/:cid/projects/:pid/date/:dt/mediarray/:ary/iterate', fn: iterateProject, permit: calipso.permission.Helper.hasPermission("ecrafting:project:update") },

	// Media Calls
	{ path: 'GET /api/media/:id?.:size?', fn: listMedia },
	{ path: 'POST /api/media', fn: createMedia },
	{ path: 'POST /api/media/:id', fn: updateMedia },
	{ path: 'DELETE /api/media/:id', fn: deleteMedia },
	{ path: 'DELETE /api/projectMedia/:id/project/:pid?', fn: deleteMedia },

	// Activities
	{ path:'GET /api/activities', fn:listActivities },

	//Search
	{ path:'GET /api/search/list', fn:searchElement },

	// Users
	{ path:'GET /api/users', fn:listUsers, permit: calipso.permission.Helper.hasPermission("ecrafting:circle:update") }
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
	return res.json(200, body);
}

function responseError(res, code, error) {
	calipso.error("Error", (error) ? error : null);
	res.send(code, error);
}

/**
 * Simple object mapper, used to copy over form values to schemas
 */
function mapFields (fields, record) {
	var props = Object.getOwnPropertyNames(fields);

	props.forEach(function (name) {
		// If not private (e.g. _id), then copy
		// OY Don't copy the media
		if (name != "media" && !name.match(/^_.*/)) {
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
	if ((body.attachment != null) && (body.attachment == '')) {
		body.attachment = null;
	}
	if (!existingCall) {
		var Call = calipso.db.model('Call');

		existingCall = new Call(req.body);
		existingCall.owner = req.session.user.username;
	}
	mapFields(body, existingCall);
	existingCall.materials = body.materials instanceof Array ? body.materials : utilities.commaSeparatedtoArray(body.materials, existingCall.materials);
	return existingCall;
}

function readProjectFromBody(req, body, existingProject) {
	if (!existingProject) {
		var Project = calipso.db.model('Project');

		existingProject = new Project(req.body);
		existingProject.owner = req.session.user.username;
	}
	mapFields(body, existingProject);

	existingProject.materials = body.materials instanceof Array ? body.materials : utilities.commaSeparatedtoArray(body.materials, existingProject.materials);

	var media = body.media;
	var toDelete = [];
	var toAdd = [];

	existingProject.media.forEach(function(m) {
		if (media === undefined || media.indexOf(m.toString()) < 0) {
			toDelete.push(m);
		}
	});

	if (media != undefined) {
		media.forEach(function(m) {
			if (existingProject.media.indexOf(m) < 0) {
				toAdd.push(m);
			}
		});
	}

	toDelete.forEach(function(m) {
		existingProject.media.remove(m);
	});

	toAdd.forEach(function(m) {
		existingProject.media.push(m);
	});

	var Media = calipso.db.model('Media');

	Media.remove({
		'_id': { $in: toDelete}
	}, function(err, docs){
		if (err) {
			calipso.error("Error ", err);
		} else {
		}
	});
	return existingProject;
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

function joinCircle(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var User = calipso.db.model('User');
	var id = req.moduleParams.id;

	Circle.findById(id, function (err, circle) {
		data = {
			circle: circle,
			user: req.session.user,
			username: circle.owner
		}
		calipso.e.pre_emit('CIRCLE_JOIN_REQUEST', data);

		User.findOne({username: circle.owner}, function (err, owner) {
			if (err || !owner) {
				return responseError(res, 404, err);
			}
			data.owner = owner;
			calipso.e.post_emit('CIRCLE_JOIN_REQUEST', data);
			return responseOk(res, data);
		});
	});
}

function updateCircle(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var id = req.moduleParams.id;

	if (!id) {
		var newCircle = readCircleFromBody(req, req.body);

		calipso.e.pre_emit('CIRCLE_CREATE', { circle: newCircle, user: req.session.user});
		newCircle.save(function (err) {
			if (err) {
				return responseError(res, 400, err);
			}
			calipso.e.post_emit('CIRCLE_CREATE', { circle: newCircle, user: req.session.user});
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
				calipso.e.pre_emit('CIRCLE_UPDATE', { circle: newCircle, user: req.session.user});

				newCircle.save(function (err) {
					if (err) {
						calipso.error("Error updating circle", err);
						return responseError(res, 400, err);
					}
					calipso.e.post_emit('CIRCLE_UPDATE', { circle: newCircle, user: req.session.user});
					return responseOk(res, newCircle);
				});
			}
		});
	}
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
		c.remove(function (err, c) {

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
		Call.findById(id, function (err, circle) {
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
			date: -1 //Sort by Date Added DESC
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

			calipso.e.pre_emit('CALL_CREATE', { call: newCall, user: req.session.user});
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
					calipso.e.post_emit('CALL_CREATE', { call: newCall, user: req.session.user});
					return responseOk(res, newCall);
				});
			});
		});
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
					calipso.e.pre_emit('CALL_UPDATE', { call: call, user: req.session.user});
					call = readCallFromBody(req, req.body, call);
					call.save(function (err) {
						if (err) {
							calipso.error("Error updating call", err);
							return responseError(res, 400, err);
						}
						calipso.e.post_emit('CALL_UPDATE', { call: call, user: req.session.user});
						return responseOk(res, call);
					});
				}
			});
		}).populate('calls').exec();
	}
}

function deleteCircleCall(req, res, template, block, next) {
	var Circle = calipso.db.model('Circle');
	var Call = calipso.db.model('Call');
	var id = req.moduleParams.id;
	var cId = req.moduleParams.cid;

	Circle.findById(id, function (err, circle) {
		if (!circle) {
			return responseError(res, 404, err);
		}
		var i = circle.calls.length;

		while (i--) {
			var call = circle.calls[i];

			if (call == cId) {
				Call.findById(cId, function (err, call) {
					if (err) {
						return responseError(res, 404, err);
					}
					if (!utilities.isAdminOrDataOwner(req, call)) {
						return responseError(res, 401);
					}
					calipso.e.pre_emit('CALL_DELETE', call);

					circle.calls.remove(call);
					circle.save(function (err) {
						if (err) {
							return responseError(res, 400, err);
						}
						call.remove(function (err, c) {
							calipso.e.post_emit('CALL_DELETE', call);
							return responseOk(res, call);
						});
					});
				});
			}
		}
	});
}

function listProjects(req, res, template, block, next) {
	var Project = calipso.db.model('Project');
	var id = req.moduleParams.id;

	if (id) {
		Project.findById(id, function (err, circle) {
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
			date: -1 //Sort by Date Added DESC
		}
	};

	if (order) {
		options.sort = {};
		options.sort[order] = 1;
	}
	Project.find({}, {}, options, function (err, projGroup) {
		if (err) {
			return responseError(res, 404, err);
		}
		var projects = [];
		for(var i=0; i<projGroup.length; i++){

			if(projGroup[i].groupID.length == 0 || projGroup[i].groupID[0].toString() == projGroup[i]._id.toString()){
				projects.push(projGroup[i]);
			};
		};
		return responseOk(res, projects);
	});
}

function listCallProjects(req, res, template, block, next) {
	var Call = calipso.db.model('Call');
	var id = req.moduleParams.id;
	var cId = req.moduleParams.cid;
	var pId = req.moduleParams.pid;

	if (id) {
		return Call.findById(cId, function (err, call) {
			if (err) {
				return responseError(res, 404, err);
			}
			if (!call) {
				return responseError(res, 404, err);
			}
			return responseOk(res, call.projects);
		}).populate('projects').exec();
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

			calipso.e.pre_emit('PROJECT_CREATE', { project: newProject, user: req.session.user});
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
							calipso.e.post_emit('PROJECT_CREATE', { project: newProject, user: req.session.user});
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
					calipso.e.pre_emit('PROJECT_UPDATE', { project: project, user: req.session.user});

					var updatedProject = readProjectFromBody(req, req.body, project);

					updatedProject.save(function (err) {
						if (err) {
							calipso.error("Error updating project", err);
							return responseError(res, 400, err);
						}
						calipso.e.post_emit('PROJECT_UPDATE', { project: updatedProject, user: req.session.user});
						return responseOk(res, updatedProject);
					});
				}
			});
			return next();
		}).populate('projects').exec();
	}
}

function deleteCallProject(req, res, template, block, next) {
	var Call = calipso.db.model('Call');
	var Project = calipso.db.model('Project');
	var id = req.moduleParams.id;
	var cId = req.moduleParams.cid;
	var pId = req.moduleParams.pid;

	Call.findById(cId, function (err, call) {
		if (!call) {
			return responseError(res, 404, err);
		}
		var i = call.projects.length;

		while (i--) {
			var project = call.projects[i];

			if (project == pId) {
				Project.findById(pId, function (err, project) {
					if (err) {
						return responseError(res, 404, err);
					}
					if (!utilities.isAdminOrDataOwner(req, project)) {
						return responseError(res, 401);
					}

					if(project.groupID.length != 0 && project.groupID[0].toString() == project._id.toString()){
						Project.find({groupID:project._id}, function(err, projectGroup){
							if (err) {
								return responseError(res, 404, err);
							}
							if (!utilities.isAdminOrDataOwner(req, projectGroup)) {
								return responseError(res, 401);
							}
							projectGroup.forEach(function (proj) {
								calipso.e.pre_emit('PROJECT_DELETE', proj);
								call.projects.remove(proj);
								call.save(function (err) {
									if (err) {
										return responseError(res, 400, err);
									}
									proj.remove();
									next(err);
									calipso.e.post_emit('PROJECT_DELETE', proj);
									return responseOk(res, proj);
								});
							})
						});
					}else{
						calipso.e.pre_emit('PROJECT_DELETE', project);
						call.projects.remove(project);
						call.save(function (err) {
							if (err) {
								return responseError(res, 400, err);
							}
							project.remove();
							next(err);
							calipso.e.post_emit('PROJECT_DELETE', project);
							return responseOk(res, project);
						});
					};
				});
			}
		}
	});
}

function iterateProject(req, res, template, block, next){
	var Circle = calipso.db.model('Circle');
	var Call = calipso.db.model('Call');
	var Project = calipso.db.model('Project');
	var id = req.moduleParams.id;
	var cId = req.moduleParams.cid;
	var pId = req.moduleParams.pid;
	var new_date = req.moduleParams.dt;
	var mediaAry = req.moduleParams.ary;

	if(pId){

		Circle.findOne({ '_id': id, 'calls': cId }, function (err, circle) {
			if (!circle) {
				return responseError(res, 404, err);
			}

			Project.findOne({ '_id': pId}, function (err, project) {
				if (err) {
					calipso.error("Error creating project", err);
					return responseError(res, 400, err);
				};

				if (!project) {
					return responseError(res, 404, err);
				};

				/*var ObjectID = require('mongodb').ObjectID;
				var mediaID = new ObjectID("000000000000000000000000");*/

				var theDate = new Date(parseInt(new_date));
				var newProject = new Project();
				newProject.date = theDate;
				newProject.owner = project.owner;
				newProject.name = project.name;
				newProject.youtube = project.youtube;
				newProject.description = project.description;
				newProject.approved = project.approved;
				newProject.location = project.location;
				newProject.materials = project.materials;

				var array = mediaAry.split(',');
				for(var a = 0; a<array.length; a++){
					newProject.media.push(array[a]);
				}

				//newProject.media = project.media;
				newProject.lat = project.lat;
				newProject.lng = project.lng;
				if(project.groupID.length != 0){
					newProject.groupID = project.groupID;
				}else{
					newProject.groupID = project._id;
				};

				calipso.e.pre_emit('PROJECT_ITERATE', { project: newProject, user: req.session.user, projectDate:theDate});

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
								if(project.groupID.length == 0){
									project.groupID = project._id;

									project.save(function (err) {
										if (err) {
											calipso.error("Error creating project", err);
											return responseError(res, 400, err);
										}

										calipso.e.post_emit('PROJECT_ITERATE', { project: project, user: req.session.user, projectDate:theDate});
										return responseOk(res, newProject);
									});
								}else {
									calipso.e.post_emit('PROJECT_ITERATE', { project: project, user: req.session.user, projectDate:theDate});
									return responseOk(res, newProject);
								};

							});
						}
					});
				});
			});
		}).populate('calls').exec();
	}
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

		m.data = fs.readFileSync(file.to);
		m.dataSmall = fs.readFileSync(file.to + 'small');
		m.dataMini = fs.readFileSync(file.to + 'mini');

		fs.unlinkSync(file.to);
		fs.unlinkSync(file.to + 'small');
		fs.unlinkSync(file.to + 'mini');


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
	var size = req.moduleParams.size || '';

	if (id) {
		Media.findById(id, function (err, m) {
			if (err || !m) {
				return responseError(res, 404, err);
			}
			res.contentType(m.mediaType);
			if (size == 'mini') {
				res.send(m.dataMini);
			} else if (size == 'small') {
				res.send(m.dataSmall);
			} else {
				res.send(m.data);
			}
			return res.end();
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
			media.deleteMedia(m.path, function (err) {
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

			m.data = fs.readFileSync(file.to);
			m.dataSmall = fs.readFileSync(file.to + 'small');
			m.dataMini = fs.readFileSync(file.to + 'mini');

			fs.unlinkSync(file.to);
			fs.unlinkSync(file.to + 'small');
			fs.unlinkSync(file.to + 'mini');

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
	var pID = req.moduleParams.pid;

	if (!id) {
		return responseError(res, 404);
	}
	Media.findById(id, function (err, m) {
		if (err || m === null) {
			return responseError(res, 404, err);
		}
		calipso.e.pre_emit('MEDIA_DELETE', m);
		media.deleteMedia(m.path, function (err) {
			Media.remove({
				_id: id
			}, function (err) {
				if (err) {
					calipso.error("Error deleting media", err);
					return responseError(res, 400, err);
				}
				calipso.e.post_emit('MEDIA_DELETE', m);
				if(pID !== null && pID !== "" && pID !== undefined){
					var Project = calipso.db.model('Project');
					Project.findById(pID, function (err, project) {
						if (err || project === null) {
							return responseError(res, 404, err);
						}
						if (!utilities.isAdminOrDataOwner(req, project)) {
							return responseError(res, 401);
						}

						project.media.remove(m);
						project.save(function (err) {
							if (err) {
								return responseError(res, 400, err);
							}
							m.remove(function (err, c) {
							});
						});
					});
				}
				return responseOk(res, m);
			});
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
 * Search
 */
function searchElement(req, res, template, block, next){
	var Project = calipso.db.model('Project');

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
	var regex = new RegExp(req.query["q"], 'i');

	Project.find( { $or: [ {name: regex}, {owner: regex}, {materials: regex} ] }, function (err, users) {
		if (err) {
			return responseError(res, 404, err);
		}
		return responseOk(res, users);
	});
}

/**
 * Users
 */

function listUsers(req, res, template, block, next) {
	var User = calipso.db.model('User');
	var id = req.moduleParams.id;

	if (id) {
		User.findById(id, function (err, user) {
			if (err) {
				return responseError(res, 404, err);
			}
			return responseOk(res, user);
		});
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

	User.find({}, {}, options, function (err, users) {
		if (err) {
			return responseError(res, 404, err);
		}
		var emails = [];
		users.forEach(function(user) {
			emails.push(user.username);
		});
		return responseOk(res, emails);
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