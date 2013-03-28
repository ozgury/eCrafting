/**
 * This is sub module called by eCrafting, to create the api.
 */
var rootpath = process.cwd() + '/',
  path = require('path'),
  Query = require("mongoose").Query,
  calipso = require(path.join(rootpath, 'lib/calipso'));

module.exports = {
  init:init,
  route:route
}

/**
 * Define the routes that this module will respond to.
 */
var routes = [
    {path:'GET /api', fn:apiDefault },

    // Circles
    {path:'GET /api/circles', fn:listCircles },
    {path:'GET /api/circles/:id', fn:listCircles },
    {path: 'POST /api/circles', fn: createCircle, permit: calipso.permission.Helper.hasPermission("admin:circle:create") },
    {path: 'POST /api/circles/:id', fn: updateCircle, permit: calipso.permission.Helper.hasPermission("admin:circle:update") },
    {path: 'DELETE /api/circles/:id', fn: deleteCircle, permit: calipso.permission.Helper.hasPermission("admin:circle:delete") },

    // Circle Calls
    {path:'GET /api/circles/:id/calls', fn:listCircleCalls },
    {path:'GET /api/circles/:id/calls/:cid', fn:listCircleCalls },
    {path: 'POST /api/circles/:id/calls', fn: createCircleCall },
    {path: 'POST /api/circles/:id/calls/:cid', fn: updateCircleCall },
    {path: 'DELETE /api/circles/:id/calls/:cid', fn: deleteCircleCall },

    // Project Calls
    {path:'GET /api/circles/:id/calls/:cid/projects', fn:listCallProjects },
    {path:'GET /api/circles/:id/calls/:cid/projects/:pid', fn:listCallProjects },
    {path: 'POST /api/circles/:id/calls/:cid/projects', fn: createCallProject },
    {path: 'POST /api/circles/:id/calls/:cid/projects/:pid', fn: updateCallProject },
    {path: 'DELETE /api/circles/:id/calls/:cid/projects/:pid', fn: deleteCallProject }

//    {path: 'POST /api/circles/:id/calls', fn: createCircleCall, permit: calipso.permission.Helper.hasPermission("admin:call:create") },
//    {path: 'POST /api/circles/:id/calls/:pid', fn: updateCircleCall, permit: calipso.permission.Helper.hasPermission("admin:call:update") },
//    {path: 'DELETE /api/circles/:id/calls/:pid', fn: deleteCircleCall, permit: calipso.permission.Helper.hasPermission("admin:call:delete") }
]

/**
 * Router - not async
 */
function route(req, res, module, app) {
}

function apiDefault(req, res, template, block, next) {
  res.send('eCrafting API is running');
}

/**
 * Calls
 */
function createCircle(req, res, template, block, next) {
  var Circle = calipso.db.model('Circle');
  var newCircle = new Circle(req.body);

  newCircle.owner = req.session.user.username;
  calipso.e.pre_emit('CIRCLE_CREATE', newCircle);
  newCircle.save(function (err) {
    if (err) {
      calipso.error("Error creating circle", err);
      return res.send(400, err);
    }
    calipso.e.post_emit('CIRCLE_CREATE', newCircle);
    return res.send(200, newCircle);
  });
}

function listCircles(req, res, template, block, next) {
  var Circle = calipso.db.model('Circle');
  var id = req.moduleParams.id;

  if (id) {
    Circle.findById(id, function (err, circle) {
      if (err) {
        return res.send(404, err);
      }
      return res.send(200, circle);
    });
  } else {
    Circle.find(function (err, circles) {
      if (err) {
        return res.send(404, err);
      }
      return res.send(200, circles);
    });
  }
}

function updateCircle(req, res, template, block, next) {
  var Circle = calipso.db.model('Circle');
  var id = req.moduleParams.id;

  Circle.findById(id, function (err, oldCircle) {
    if (!oldCircle) {
      return res.send(404, err);
    } else {
      calipso.form.mapFields(req.body, oldCircle);
      calipso.e.pre_emit('CIRCLE_UPDATE', oldCircle);
      oldCircle.save(function (err) {
        if (err) {
          calipso.error("Error updating circle", err);
          return res.send(400, err);
        }
        calipso.e.post_emit('CIRCLE_UPDATE', oldCircle);
        return res.send(200, oldCircle);
      });
    }
  });
}

function deleteCircle(req, res, template, block, next) {
  var Circle = calipso.db.model('Circle');
  var id = req.moduleParams.id;

  Circle.findById(id, function (err, c) {
    if (err)  {
      return res.send(404, err);      
    }
    calipso.e.pre_emit('CIRCLE_DELETE', c);
    Circle.remove({
      _id: id
    }, function (err) {
      if (err) {
        calipso.error("Error deleting circle", err);
        return res.send(400, err);
      }
      calipso.e.post_emit('CIRCLE_DELETE', c);
      return res.send(200, c);
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
      return res.send(404, err);
    }
    var newCall = req.body;

    calipso.e.pre_emit('CALL_CREATE', circle);
    circle.calls.push(newCall);
    circle.save(function (err) {
      if (err) {
        calipso.error("Error creating call", err);
        return res.send(400, err);
      }
      calipso.e.post_emit('CALL_CREATE', circle.calls[circle.calls.length - 1]);
      return res.send(200, circle.calls[circle.calls.length - 1]);
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
        return res.send(404, err);
      }
      if (cId) {
        return res.send(200, circle.calls.id(cId));
      } else {
        return res.send(200, circle.calls);
      }
    });
  } else {
    return res.send(400, err);
  }
}

function updateCircleCall(req, res, template, block, next) {
  var Circle = calipso.db.model('Circle');
  var id = req.moduleParams.id;
  var cId = req.moduleParams.cid;

  Circle.findById(id, function (err, circle) {
    if (!circle) {
      return res.send(404, err);
    }
    var call = circle.calls.id(cId);

    if (!call) {
      return res.send(404, err);
    }
    calipso.e.pre_emit('CALL_UPDATE', call);
    calipso.form.mapFields(req.body, call);
    circle.save(function (err) {
      if (err) {
        calipso.error("Error updating call", err);
        return res.send(400, err);
      }
      calipso.e.post_emit('CALL_UPDATE', call);
      return res.send(200, call);
    });
  });
}

function deleteCircleCall(req, res, template, block, next) {
  var Circle = calipso.db.model('Circle');
  var id = req.moduleParams.id;
  var cId = req.moduleParams.cid;

  Circle.findById(id, function (err, circle) {
    if (!circle) {
      return res.send(404, err);
    } else {
      var call = circle.calls.id(cId);

      if (!call) {
        return res.send(404, err);
      }
      calipso.e.pre_emit('CALL_DELETE', call);
      circle.calls.pull({ _id: cId });
      circle.save(function (err) {
        if (!err) {
          calipso.e.post_emit('CALL_DELETE', call);
          return res.send(200, call);
        } else {
          calipso.error("Error deleting call", err);
          return res.send(400, err);
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
      return res.send(404, err);
    }
    var call = circle.calls.id(cId);

    if (!call) {
      return res.send(404, err);
    }
    var newProject = req.body;

    newProject.owner = req.session.user.username;
    calipso.e.pre_emit('PROJECT_CREATE', call);
    call.projects.push(newProject);
    circle.save(function (err) {
      if (err) {
        calipso.error("Error creating project", err);
        return res.send(400, err);
      }
      calipso.e.post_emit('PROJECT_CREATE', call.projects[call.projects.length - 1]);
      return res.send(200, call.projects[call.projects.length - 1]);
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
        return res.send(404, err);
      }
      var call = circle.calls.id(cId);

      if (!call) {
        return res.send(404, err);
      }
      if (pId) {
        return res.send(200, call.projects.id(pId));
      } else {
        return res.send(200, call.projects);
      }
    });
  } else {
    return res.send(400, err);
  }
}

function updateCallProject(req, res, template, block, next) {
  var Circle = calipso.db.model('Circle');
  var id = req.moduleParams.id;
  var cId = req.moduleParams.cid;
  var pId = req.moduleParams.pid;

  Circle.findById(id, function (err, circle) {
    if (!circle) {
      return res.send(404, err);
    }
    var call = circle.calls.id(cId);

    if (!call) {
      return res.send(404, err);
    }
    var project = call.projects.id(pId);

    if (!project) {
      return res.send(404, err);
    }
    calipso.e.pre_emit('PROJECT_UPDATE', project);
    calipso.form.mapFields(req.body, project);
    circle.save(function (err) {
      if (err) {
        calipso.error("Error updating project", err);
        return res.send(400, err);
      }
      calipso.e.post_emit('PROJECT_UPDATE', project);
      return res.send(200, project);
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
      return res.send(404, err);
    }
    var call = circle.calls.id(cId);

    if (!call) {
      return res.send(404, err);
    }
    var project = call.projects.id(pId);
    if (!project) {
      return res.send(404, err);
    }

    calipso.e.pre_emit('PROJECT_DELETE', project);
    call.projects.pull({ _id: pId });
    circle.save(function (err) {
      if (err) {
        calipso.error("Error deleting project", err);
        return res.send(400, err);
      }
      calipso.e.post_emit('PROJECT_DELETE', project);
      return res.send(200, project);
    });
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