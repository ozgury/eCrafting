/*!
 * Static content module - Processed last on unmatched GET
 */
 var rootpath = process.cwd() + '/',
	path = require('path'),
	calipso = require(path.join(rootpath, 'lib/calipso')),
	Query = require("mongoose").Query,
	everyauth = require("everyauth")
	module.name = "eCrafting",
	exports = module.exports = {
		init:init,
		route:route,
		last:true
	};

var Imap = require('imap'),
   inspect = require('util').inspect,
	mimelib = require("mimelib");

var imap = new Imap({
      user: 'direnistanbul@gmx.com',
      password: 'istanbulistanbul',
      host: 'imap.gmx.com',
      port: 993,
      secure: true
    });


var OAuth= require('oauth').OAuth;

oAuth= new OAuth(
  "http://twitter.com/oauth/request_token",
  "http://twitter.com/oauth/access_token", 
  "zUqGWeRVtiMTcn3KO3D3g", "oGqG78KlXpFVCzLXCucdQEQuN9qFjDKOLSzoPpDk", 
  "1.0A", null, "HMAC-SHA1"
);

var geziHash = "#direngeziparki";
var tweetLength = 144;

function route(req, res, module, app, next) {
	var aPerm = calipso.permission.Helper.hasPermission("admin:ecrafting");

	// Menu
	res.menu.admin.addMenuItem(req, {name:'Gezi', path:'gezi', weight:5, url:'/gezi', description:'Gezi Home', permit:aPerm });
	module.router.route(req, res, next);
}

function addTweetLog(user, msg, error) {
	var TweetLog = calipso.db.model('TweetLog');
	var log = new TweetLog({
		user: user,
		msg: msg,
		time: new Date()
	});
	if (error) {
		log.error = error;
	}
	log.save(function (err) {
		if (err) {
			calipso.debug("Err: " + err);
		}
	});
}

function addBatchLog(count) {
	var BatchLog = calipso.db.model('BatchLog');
	var log = new BatchLog({
		count: count,
		time: new Date()
	});
	log.save(function (err) {
		if (err) {
			calipso.debug("Err: " + err);
		}
	});
}

function init(module, app, next) {
	var TweetLog = new calipso.lib.mongoose.Schema({
		user: String,
		msg: String,
		error: String,
		time: Date
	});

	var BatchLog = new calipso.lib.mongoose.Schema({
		count: String,
		time: Date
	});

	calipso.db.model('TweetLog', TweetLog);
	calipso.db.model('BatchLog', BatchLog);

	calipso.lib.step(
		function defineRoutes() {
			module.router.addRoute('GET /gezi', readAndTweet, {template:'gezi', admin:true, block:'admin.show'}, this.parallel());
		},
		function done() {
			next();
		});
}



function tweet(name, address, msg) {
	if (msg.indexOf(geziHash) < 0) {
		msg = msg.substring(0, tweetLength);
		msg += ' ' + geziHash;
	}

	oAuth.post(
		"http://api.twitter.com/1/statuses/update.json",
		"1475852311-OrpgErrVgDhSvumHt3Nq3I79IiliyVAAEKSgQQQ", "MORocFt92siVlIuURGVHNtUTuqAu6uViSWFNUSAM", 
		{"status":msg},

		function(error, data) {
			if (error) {
				console.log(require('sys').inspect(error))
				addTweetLog(name, address, msg, error);
			}
			addTweetLog(name, address, msg);
		}
	);
}

function decodeSubject(subject) {
	if (!(subject.indexOf('=?') == 0)) {
		return subject;
	}
	var subjectArray = subject.split(" ");
	var result = "";

	subjectArray.forEach(function (s) {
		result += mimelib.decodeMimeWord(s);
	})
	return result;
}

function doReadAndTweet(since) {
	var count = 0;

	openInbox(function(err, mailbox) {
		if (err) die(err);
		imap.search([ 'UNSEEN', ['SINCE', since] ], function(err, results) {
	   	if (err) die(err);
	   	imap.fetch(results, { markSeen: true, struct: true },
	      { headers: ['from', 'to', 'subject', 'date'],
	        cb: function(fetch) {
	          fetch.on('message', function(msg) {
	            //console.log('Saw message no. ' + msg.seqno);
	            //console.log('Msg: ', msg);
	            msg.on('headers', function(hdrs) {
						var from = mimelib.parseAddresses(hdrs.from[0]);

						//console.log('Name:', from[0].name);
						//console.log('Address:', from[0].address);

						var subject = hdrs.subject && hdrs.subject[0] ? decodeSubject(hdrs.subject[0]): "No Subject";

						//console.log('Subject:', hdrs.subject && hdrs.subject[0] ? hdrs.subject[0]: "No Subject");
						//console.log('Subject:', subject);
						tweet(from[0].name, from[0].address, subject);
						count += 1;
	            });
	            msg.on('end', function() {
	              //console.log('Finished message no. ' + msg.seqno);
	            });
	          });
	        }
	      }, function(err) {
				if (err) 
					throw err;
				//console.log('Done fetching all messages!');
				addBatchLog(count);
				imap.logout();
	      }
	    );
	  });
	});	
}

function readAndTweet(req, res, template, block, next) {
/*
	var BatchLog = calipso.db.model('BatchLog');

	BatchLog.findOne({}, {}, { sort: { 'time' : -1 } }, function(err, log) {
		if (err) {
			// No log
			doReadAndTweet('June 1, 2013');
		}
		console.log(log);
		doReadAndTweet(log.time);
	});
*/
	doReadAndTweet('June 1, 2013');

	calipso.theme.renderItem(req, res, template, block, {content: { title: "Gezi Dashboard" } }, next);
//  res.send('eCrafting dashboard.');
}

function show(obj) {
  return inspect(obj, false, Infinity);
}

function die(err) {
  console.log('Uh oh: ' + err);
  process.exit(1);
}

function openInbox(cb) {
  imap.connect(function(err) {
    if (err) die(err);
    imap.openBox('INBOX', false, cb);
  });
}