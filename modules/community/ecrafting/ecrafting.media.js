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
	exports = module.exports = {
		processUploadedFiles : processUploadedFiles
	};

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

function moveFile(from, to, next) {

	mkdirp(path.dirname(to), 0755, function (err) {
		if (err) {
			next(err);
		} else {
			var is = fs.createReadStream(from);
			var os = fs.createWriteStream(to);

			util.pump(is, os, function(err) {
				fs.unlinkSync(from);
				next(err);
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

/*

		im.identify(file.to, function(err, ident_metadata){

			// If imagemagick fails (not installed) ignore silently
			if (!err) {    
				
				var thumb = path.join(
						path.dirname(file.to),
						path.basename(file.to, path.extname(file.to)) + "-thumb" + path.extname(file.to));
				
				m.thumb = thumb.replace(path.join(rootpath,"media"),"");
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
			}      

*/

function processUploadedFiles(req, res, each, next) {
	function processOne(file, next) {
		moveFile(file.file.path, file.to, function(err) {
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