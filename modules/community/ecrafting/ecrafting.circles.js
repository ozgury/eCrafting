/**
 * This is sub module called by user, to allow management of circles.
 */
var rootpath = process.cwd() + '/',
  path = require('path'),
  Query = require("mongoose").Query,
  calipso = require(path.join(rootpath, 'lib/calipso'));

module.exports = {
  init:init,
  route:route,
  install:install
}

/**
 * Define the routes that this module will repsond to.
 */
var routes = [
  {path:'GET /circle', fn:listCircle, admin:true, permit:calipso.permission.Helper.hasPermission("admin:circle:view"), template:'circle.list', block:'content.circle.show'},
  {path:'GET /circle/list.:format?', fn:listCircle, admin:true, permit:calipso.permission.Helper.hasPermission("admin:circle:view"), template:'circle.list', block:'content.circle.list'},
  {path:'POST /circle/create', fn:createCircle, admin:true, permit:calipso.permission.Helper.hasPermission("admin:circle:create")},
  {path:'GET /circle/new', fn:createCircleForm, admin:true, permit:calipso.permission.Helper.hasPermission("admin:circle:create"), block:'content.circle.new', template:'circle.form'},
  {path:'GET /circle/show/:id.:format?', fn:showCircle, admin:true, permit:calipso.permission.Helper.hasPermission("admin:circle:view"), template:'circle.show', block:'content.circle.show'},
  {path:'GET /circle/edit/:id', fn:editCircleForm, admin:true, permit:calipso.permission.Helper.hasPermission("admin:circle:update"), block:'content.circle.edit'},
  {path:'GET /circle/delete/:id', fn:deleteCircle, admin:true, permit:calipso.permission.Helper.hasPermission("admin:circle:delete")},
  {path:'POST /circle/update/:id', fn:updateCircle, admin:true, permit:calipso.permission.Helper.hasPermission("admin:circle:update")}
]

/**
 * Router - not async
 */
function route(req, res, module, app) {
  var aPerm = calipso.permission.Helper.hasPermission("admin:user");

  // Menu
  res.menu.admin.addMenuItem(req, {name:'Circles', path:'ecrafting/circles', weight:10, url:'/circle', description:'Manage circles ...', permit:aPerm });
}

/**
 * Initialisation
 */
function init(module, app, next) {

  calipso.e.addEvent('CIRCLE_CREATE');
  calipso.e.addEvent('CIRCLE_UPDATE');
  calipso.e.addEvent('CIRCLE_DELETE');

  calipso.permission.Helper.addPermission("admin:circles", "Circles", true);

  calipso.lib.async.map(routes, function (options, next) {
      module.router.addRoute(options, next)
    },
    function (err, data) {

      // Done adding routes
      var Circle = new calipso.lib.mongoose.Schema({
        name:{type:String, required:true, unique:true},
        description:{type:String, "default":''},
        created:{ type:Date, "default":Date.now },
        updated:{ type:Date, "default":Date.now }
      });
		Circle.path('name').validate(function (v) {
			return v.length > 4 && v.length < 20 ;
		}, 'Circle name should be more than 4 and less than 20 characters');
      calipso.db.model('Circle', Circle);
    });
}

/**
 * Content type create / edit form
 */
var circleForm = {
  id:'FORM', title:'Circle', type:'form', method:'POST', tabs:true, action:'/circle',
  sections:[
    {id:'type-section', label:'Circle', fields:[
      {label:'Name', name:'circle[name]', type:'text', description:'Enter the name of the circle, it must be unique.'},
      {label:'Description', name:'circle[description]', type:'textarea', description:'Enter a description.'},
    ]
    }
  ],
  buttons:[
    {name:'submit', type:'submit', value:'Save Circle'},
    {name:'cancel', type:'button', href:'/circle', value:'Cancel'}
  ]
};

/**
 * Create new circle
 */
function createCircle(req, res, template, block, next) {

  calipso.form.process(req, function (form) {

    if (form) {
      var Circle = calipso.db.model('Circle');
      var c = new Circle(form.circle);
      var saved;

      c.created = new Date();
      calipso.e.pre_emit('CIRCLE_CREATE', c, function (c) {
        c.save(function (err) {
          if (err) {
            req.flash('error', req.t('Could not save circle because {msg}.', {msg:err.message}));
            calipso.debug("Err: " + err);
            if (res.statusCode != 302) {
              res.redirect('/circle/new');
            }
            next();
          } else {
            calipso.e.post_emit('CIRCLE_CREATE', c, function (c) {
              res.redirect('/circle');
              next();
            });
          }
        });
      });
    }
  });
}

/**
 * Create new circle
 */
function createCircleForm(req, res, template, block, next) {

  circleForm.title = "Create Circle";
  circleForm.action = "/circle/create";

  calipso.form.render(circleForm, null, req, function (form) {
    calipso.theme.renderItem(req, res, template, block, {form:form}, next);
  });

}

/**
 * Edit circle
 */
function editCircleForm(req, res, template, block, next) {

  var Circle = calipso.db.model('Circle');
  var id = req.moduleParams.id;
  var item;

  res.menu.adminToolbar.addMenuItem(req, {name:'List', path:'list', url:'/circle/', description:'List all ...', permit:calipso.permission.Helper.hasPermission("admin:circle:view")});
  res.menu.adminToolbar.addMenuItem(req, {name:'View', path:'show', url:'/circle/show/' + id, description:'Current item ...', permit:calipso.permission.Helper.hasPermission("admin:circle:view")});
  res.menu.adminToolbar.addMenuItem(req, {name:'Edit', path:'edit', url:'/circle/edit/' + id, description:'Edit circle ...', permit:calipso.permission.Helper.hasPermission("admin:circle:edit")});
  res.menu.adminToolbar.addMenuItem(req, {name:'Delete', path:'delete', url:'/circle/delete/' + id, description:'Delete circle ...', permit:calipso.permission.Helper.hasPermission("admin:circle:delete")});

  Circle.findById(id, function (err, c) {

    if (err || c === null) {
      res.statusCode = 404;
      next();
    } else {
      circleForm.title = "Edit Circle";
      circleForm.action = "/circle/update/" + id;

      var values = {
        circle:c
      }
      calipso.form.render(circleForm, values, req, function (form) {
        calipso.theme.renderItem(req, res, form, block, {}, next);
      });
    }
  });
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
          calipso.form.mapFields(form.circle, c);
          c.updated = new Date();

          calipso.e.pre_emit('CIRCLE_UPDATE', c, function (c) {

            c.save(function (err) {
              if (err) {
                req.flash('error', req.t('Could not update circle because {msg}.', {msg:err.message}));
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
      res.menu.adminToolbar.addMenuItem(req, {name:'List', path:'list', url:'/circle/', description:'List all ...', permit:calipso.permission.Helper.hasPermission("admin:circle:view")});
      res.menu.adminToolbar.addMenuItem(req, {name:'View', path:'show', url:'/circle/show/' + id, description:'Current item ...', permit:calipso.permission.Helper.hasPermission("admin:circle:view")});
      res.menu.adminToolbar.addMenuItem(req, {name:'Edit', path:'edit', url:'/circle/edit/' + id, description:'Edit circle ...', permit:calipso.permission.Helper.hasPermission("admin:circle:edit")});
      res.menu.adminToolbar.addMenuItem(req, {name:'Delete', path:'delete', url:'/circle/delete/' + id, description:'Delete circle ...', permit:calipso.permission.Helper.hasPermission("admin:circle:delete")});
    }
    // Set the page layout to the circle
    if (format === "html") {
      calipso.theme.renderItem(req, res, template, block, {item:circle}, next);
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

  res.menu.adminToolbar.addMenuItem(req, {name:'New Circle', path:'new', url:'/circle/new', description:'Create circle ...', permit:calipso.permission.Helper.hasPermission("admin:circle:create")});

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
          calipso.theme.renderItem(req, res, template, block, {items:circles}, next);
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
    Circle.remove({_id:id}, function (err) {
      if (err) {
        req.flash('info', req.t('Unable to delete the circle because {msg}.', {msg:err.message}));
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
 * Installation process - asynch
 */
function install(next) {
}
