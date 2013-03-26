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
    {path:'GET /api/circles', fn:listCircles },
    {path:'GET /api/circles/:id', fn:listCircles },
    {path: 'POST /api/circles', fn: createOrUpdateCircle, permit: calipso.permission.Helper.hasPermission("admin:circle:create") },
    {path: 'POST /api/circles/:id', fn: createOrUpdateCircle, permit: calipso.permission.Helper.hasPermission("admin:circle:update") },
    {path: 'DELETE /api/circles/:id', fn: deleteCircle, permit: calipso.permission.Helper.hasPermission("admin:circle:delete") }
  /*
  
  {path:'GET /user/role/list.:format?', fn:listRole, admin:true, permit:calipso.permission.Helper.hasPermission("admin:user:role:view"), template:'role.list', block:'content.user.role.list'},
  {path:'POST /user/role/create', fn:createRole, admin:true, permit:calipso.permission.Helper.hasPermission("admin:user:role:create")},
  {path:'GET /user/role/new', fn:createRoleForm, admin:true, permit:calipso.permission.Helper.hasPermission("admin:user:role:create"), block:'content.user.role.new', template:'role.form'},
  {path:'GET /user/role/show/:id.:format?', fn:showRole, admin:true, permit:calipso.permission.Helper.hasPermission("admin:user:role:view"), template:'role.show', block:'content.user.role.show'},
  {path:'GET /user/role/edit/:id', fn:editRoleForm, admin:true, permit:calipso.permission.Helper.hasPermission("admin:user:role:update"), block:'content.user.role.edit'},
  {path:'GET /user/role/delete/:id', fn:deleteRole, admin:true, permit:calipso.permission.Helper.hasPermission("admin:user:role:delete")},
  {path:'POST /user/role/update/:id', fn:updateRole, admin:true, permit:calipso.permission.Helper.hasPermission("admin:user:role:update")}
  */
]

/**
 * Router - not async
 */
function route(req, res, module, app) {
}

function apiDefault(req, res, template, block, next) {
  res.send('eCrafting API is running');
}

function listCircles(req, res, template, block, next) {
  var Circle = calipso.db.model('Circle');
  var id = req.moduleParams.id;

  if (id) {
    return Circle.findById(id, function (err, circle) {
      if (!err) {
        return res.send(200, circle);
      } else {
        return res.send(400, err);
      }
    });
  } else {
    return Circle.find(function (err, circles) {
      if (!err) {
        return res.send(200, circles);
      } else {
        return res.send(400, err);
      }
    });
  }
}

function createOrUpdateCircle(req, res, template, block, next) {

  function saveCircle(c) {
  }

  var Circle = calipso.db.model('Circle');
  var id = req.moduleParams.id;

  calipso.log("id ", id);
  if (id) {
    calipso.log("Updating: ");
    return Circle.findById(id, function (err, oldCircle) {
      if (!oldCircle) {
        return res.send(400, error);
      } else {
        calipso.form.mapFields(req.body, oldCircle);
        calipso.e.pre_emit('CIRCLE_UPDATE', oldCircle);
        calipso.log("Updating: ");
        oldCircle.save(function (err) {
          if (!err) {
            calipso.log("Updated. ", oldCircle.name);
            calipso.e.post_emit('CIRCLE_UPDATE', oldCircle);
            return res.send(200, oldCircle);
          } else {
            res.status(400)
            error = err;
            calipso.error("Error creating/updating circle", err, c);
            return res.send(400, error);
          }
        });
      }
    });
  } else {
    var newCircle = new Circle(req.body);
  
    calipso.log("Creating: ");
    calipso.e.pre_emit('CIRCLE_CREATE', newCircle);
    newCircle.save(function (err) {
      if (!err) {
        calipso.e.post_emit('CIRCLE_CREATE', newCircle);
        return res.send(200, newCircle);
      } else {
        res.status(400)
        calipso.error("Error creating/updating circle", err, newCircle);
        return res.send(400, error);
      }
    });
  }
  return next();
}

function deleteCircle(req, res, template, block, next) {
   var Circle = calipso.db.model('Circle');
   var id = req.moduleParams.id;

   Circle.findById(id, function (err, c) {
      calipso.e.pre_emit('CIRCLE_DELETE', c);
      Circle.remove({
         _id: id
      }, function (err) {
        if (!err) {
          calipso.e.post_emit('CIRCLE_DELETE', c);
          return res.send(200, c);
        } else {
          res.status(400)
          error = err;
          calipso.error("Error deleting circle", err, c);
          return res.send(400, error);
        }
        next();
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