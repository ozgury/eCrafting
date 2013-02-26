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
  return Circle.find(function (err, circles) {
    if (!err) {
      return res.send(circles);
    } else {
      return console.log(err);
    }
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