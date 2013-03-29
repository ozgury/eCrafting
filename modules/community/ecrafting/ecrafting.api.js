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
    { path: 'DELETE /api/media/:id', fn: deleteMedia }
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
 * Circles
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
 * Media
 */

function createThumbnail(media, next) {
/*
  var metadata = media.get('metadata');
  var im = require('imagemagick');
  var isPortrait = (metadata.width < metadata.height);
  
  var thumbPortrait = '100' //calipso.config.moduleConfig('media','thumbnails:portrait') || '150x';
  var thumbLandscape = '225' //calipso.config.moduleConfig('media','thumbnails:landscape') || 'x150';
  var thumbSharpen = '0.2' //calipso.config.moduleConfig('media','thumbnails:sharpen') || '0.2';
  var thumbQuality = '90' //calipso.config.moduleConfig('media','thumbnails:quality') || '80';

  var thumbSize = isPortrait ? thumbPortrait : thumbLandscape;

  im.convert([path.join(rootpath,"media", media.path), '-resize', thumbSize,'-filter','lagrange','-sharpen',thumbSharpen,'-quality',thumbQuality, path.join(rootpath,"media", media.thumb)], function(err, stdout, stderr) {
    next(err,media);
  });
*/
}

function mv(from, to, next) {

  var fs = require('fs'),
      mkdirp = require('mkdirp'),
      util = require('util');

  calipso.silly("Moving file " + from + " to " + to + "...");

  mkdirp(path.dirname(to), 0755, function (err) {

    var is = fs.createReadStream(from);
    var os = fs.createWriteStream(to);

    util.pump(is, os, function() {
      fs.unlinkSync(from);
      next(err);
    });
  });
}

function processFile(file, next) {

  var tbHeight = '100';
  var im = require('imagemagick');
  // Create our mongoose object
  var Media = calipso.db.model('Media');  

  // For each file, we need to process it
  mv(file.from, file.to, function() {    
    // Now, create the mongoose object for it
    var m = new Media();

    console.log("file.to: ", file.to);

    m.name = ''; // path.basename(file.file.name, path.extname(file.file.name)); TODO make configurable
    m.fileName = file.file.name;
    m.mediaType = file.file.type;
    m.path = file.to.replace(path.join(rootpath,"media"),"");
    m.author = file.author;
    m.sort = -1;
    if(file.gallery) {
      m.gallery = file.gallery.url;
    }
    console.log("m.path: ", m.path);

    im.identify(file.to, function(err, ident_metadata){

      // If imagemagick fails (not installed) ignore silently
      if (!err) {    
        
        var thumb = path.join(
            path.dirname(file.to),
            path.basename(file.to, path.extname(file.to)) + "-thumb" + path.extname(file.to));
        
        m.thumb = thumb.replace(path.join(rootpath,"media"),"");;

        im.readMetadata(file.to, function(err, exif_metadata) {

          var metadata = calipso.lib._.extend(ident_metadata, exif_metadata);
        
          // Set our metadata
          m.set('metadata',metadata);          

          fixRotation(m, function(err, m) {
              createThumbnail(m, function(err, m) {
                if (err) throw err                
                m.save(function(err) {
                  next(err, m._id);  
                });      
              });              

          });

        });
        
      } else {
        
        calipso.silly("ImageMagick failed, no thumbnail or rotation available ...");

        m.save(function(err) {
          console.log("Err:", err)
          next(err);
        });

      }      

    });
    
  });  

}

function mediaPath(filePath) {
  
  var max = 3, split = 2;
  var newPath = "";

  // Convert the uploaded file guid into a path for saving    
  for(var i = 1; i <= max; i++) {
    newPath += filePath.substring((i-1)*split, (i-1)*split + split); // + "/";
  }
  filePath = filePath.substring(max*split - 1, filePath.length);

  return newPath + filePath;
}

function createMedia(req, res, template, block, next) {
  var async = require('async'),
      basePath = "uploads";
  
  // Set the author
  var author;
  if(req.session && req.session.user) {      
    author = req.session.user.username;
  } else {
    author = 'Unknown';
  }

  var fileQueue = [];

  for(var upload in req.files) {
    var upload = req.files[upload];
    upload.forEach(function(files) {        
      console.log("files: ", files);

      files.forEach(function(file) {        
        if (file.size > 0) {
          console.log("rootpath: ", rootpath);

          console.log("rootpath: ", rootpath);
          console.log("basePath: ", basePath);
          console.log("file.path: ", file.path);
          console.log("path.basename(file.path): ", path.basename(file.path));

          var toFile = path.join(rootpath, basePath, mediaPath(path.basename(file.path)));

          fileQueue.push({ author: author, file: file, from: file.path, to: toFile });
        }
      });
    });
  }

  // Process everything in the queue - do it in series for now
  async.mapSeries(fileQueue, processFile, function(err, results) {            

    console.log("Result: ", err);    
    if(err) {
      console.dir(err);        
      next(err);
    }
    res.end(JSON.stringify({status:"OK"}));
  });
  return;

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

function listMedia(req, res, template, block, next) {
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

function updateMedia(req, res, template, block, next) {
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

function deleteMedia(req, res, template, block, next) {
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
 * Initialisation
 */
function init(module, app, next) {
  calipso.lib.async.map(routes, function (options, next) {
      module.router.addRoute(options, next)
    },
    function (err, data) {
  });
}