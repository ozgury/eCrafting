/*!
 * Static content module - Processed last on unmatched GET
 */
 var rootpath = process.cwd() + '/',
	path = require('path'),
	fs = require('fs'),
	mkdirp = require('mkdirp'),
	util = require('util');
	async = require('async');
	calipso = require(path.join(rootpath, 'lib/calipso')),
	im = require('imagemagick'),
	Query = require("mongoose").Query,	
	exports = module.exports = {
		processUploadedFiles : processUploadedFiles,
		deleteMedia : deleteMedia
	};

function createThumbnail(file, next) {
	var im = require('imagemagick');

	im.identify(file, function(err, ident_metadata){
		im.readMetadata(file, function(err, exif_metadata) {
			var metadata = calipso.lib._.extend(ident_metadata, exif_metadata);
		//	var metadata = media.get('metadata');

			var isPortrait = (metadata.width < metadata.height);
			
			var thumbSharpen = '0.2'
			var thumbQuality = '90';

			im.convert([file, '-resize', '250x250^', '-gravity', 'Center',  '-crop', '250x250+0+0', '+repage', '-filter','lagrange','-sharpen',thumbSharpen,'-quality',thumbQuality, file + "small"], function(err, stdout, stderr) {
				if (!err) {
					im.convert([file, '-resize', '50x50^', '-gravity', 'Center',  '-crop', '50x50+0+0', '+repage', '-filter','lagrange','-sharpen',thumbSharpen,'-quality',thumbQuality, file + "mini"], function(err, stdout, stderr) {					
						next(err);
					});
				} else {
					next(err);
				}
			});
		});
	});
}

function copyAndCreateThumbnails(from, to, type, next) {

	mkdirp(path.dirname(to), 0755, function (err) {
		if (err) {
			next(err);
		} else {
			var is = fs.createReadStream(from);
			var os = fs.createWriteStream(to);

			util.pump(is, os, function(err) {
				console.log("type: ", type);
				fs.unlinkSync(from);
				if (type.indexOf("image/") == 0) {
					createThumbnail(to, function(err) {
						next(err);
					});
				} else {
					next(err);
				}

			});
		}
	});
}

function mediaPath(filePath) {
	var max = 3, split = 2;
	var newPath = "";

	for(var i = 1; i <= max; i++) {
		newPath += filePath.substring((i-1)*split, (i-1)*split + split); // + "/";
	}
	filePath = filePath.substring(max*split - 1, filePath.length);
	return newPath + filePath;
}

function processUploadedFiles(req, res, each, next) {
	function processOne(file, next) {
		copyAndCreateThumbnails(file.file.path, file.to, file.file.type, function(err) {
			each(err, file, next);
		});
	}
	var basePath = "uploads";
	var fileQueue = [];

	for(var upload in req.files) {
		var upload = req.files[upload];

		upload.forEach(function(files) {
				if (files instanceof Array) {
					files.forEach(function(file) {        
						if (file.size > 0) {
							var toFile = path.join(rootpath, basePath, mediaPath(path.basename(file.path)));
							fileQueue.push({ file: file, from: file.path, to: toFile });
						}
					});
				} else {
					if (files.size > 0) {
						var toFile = path.join(rootpath, basePath, mediaPath(path.basename(files.path)));
						fileQueue.push({ file: files, from: files.path, to: toFile });
					}
				}
		});
		async.mapSeries(fileQueue, processOne, function (err) {
			next(err);
		});
	}
}

function deleteMedia(path, next) {
	fs.unlink(path, function (err) {
		if (err) {
		  calipso.error('Error deleting file ' + path, err);
		}
	});
	fs.unlink(path + 'small', function (err) {
		if (err) {
		  calipso.error('Error deleting file ' + path + 'small', err);
		}
	});
	fs.unlink(path + 'mini', function (err) {
		if (err) {
		  calipso.error('Error deleting file ' + path + 'mini', err);
		}
	});
	return next();
}
