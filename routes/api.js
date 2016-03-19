var express = require('express');
var router = express.Router();
var bCrypt = require('bcrypt-nodejs');
var jwt = require('jsonwebtoken');
var validate = require("validate.js");
var userConstraints = require('../models/userConstraints');
var ObjectId = require('mongodb').ObjectID;
var shortid = require('shortid');
// RESULTS FORMAT
// results { result: { ok: 1, n: 1 },
//   ops: 
//    [ { email: 'paul@paaoeuul.paul',
//        password: '$2a$10$RkLHR9q4tw2349NHigcH.e8LjuRvgEye9A5x/x6Wk5cBdJPneQnBO',
//        name: undefined,
//        admin: undefined,
//        _id: 56db01b1652acfc20d8ed08a } ],
//   insertedCount: 1,
//   insertedIds: [ 56db01b1652acfc20d8ed08a ] }

var secret = process.env.SUPER_SECRET;

router.get('/', function(req, res) {
	res.json({message: 'OH THIS IS THE API'}); 
});

function getUserAndToken(user) {
	var newUser = {
		id: user._id,
		email: user.email					
	}
	var token = jwt.sign(newUser, secret, {
    expiresInMinutes: 900000000 // almost never expires
  });

  return {
	  status: true,
	  token: token,
	  user: newUser
	}
}

module.exports = function(db) {
	// console.log(db.collection('users').drop());
	// Create User
	router.route('/user')
		.post(function (req,res) {
			var users = db.collection('users');
			var body = req.body;
			users.findOne({'email': body.email}, function(err, user) {
				var newUser;
				if (err) return res.send(err);
				
				if (user) {
					return res.json({status: false, reason: {email: 'Email already in use'}});
				}

				var errors = validate({
					email: body.email, 
					password: body.password
				}, userConstraints)
				
				if (!!errors) {
					return res.json({status: false, reason: errors});
				}

				var salt = bCrypt.genSaltSync(10);
				var newUser = {
					email: body.email,
					password: bCrypt.hashSync(body.password, salt, null),
					name: body.name,
					admin: body.admin
				};

				users.insert(newUser, function(err, results) {
					if (err) return res.send(err);
					console.log('results', results);
					return res.json(getUserAndToken(newUser));
				});

			});
		});

	router.route('/authenticate')
		.post(function (req, res) {
			var users = db.collection('users');
			var body = req.body;
			users.findOne({'email': body.email}, function(err, user) {
				if (err) return res.send(err);

				if (!user) {
					return res.json({status: false, reason: 'User not found'});
				}

				if (!bCrypt.compareSync(body.password, user.password)) {
					return res.json({status:false, reason: 'Invalid password'});
				}

				// TODO return token and abrieviated user
				return res.json(getUserAndToken(user));
			});
		});
	
	//////////////////////////////
	//////////////////////////////
	// AUTHENTICATED
	//////////////////////////////
	//////////////////////////////

	// route middleware to verify a token
	router.use(function(req, res, next) {
	  // check header or url parameters or post parameters for token
	  var token = req.body.token || req.query.token || req.headers['x-access-token'];

	  // decode token
	  if (token) {
	    // verifies secret and checks exp
	    jwt.verify(token, secret, function(err, decoded) {      
	      if (err) {
	        return res.json({ 
	        	status: false, 
	        	reason: 'Failed to authenticate token.' 
	        });
	      } else {
	        req.decoded = decoded;    
	        next();
	      }
	    });
	  } else {
	    return res.status(403).send({ 
	        status: false, 
	        reason: 'No token provided.' 
	    });
	  }
	});

	//////////////////////////////
	// WEBSITES
	//////////////////////////////

	router.route('/websites/common')
		.get(function (req, res) {
			var websites = db.collection('websites');
			var body = req.body;

			websites.find({'common': true}).toArray(function(err, websites) {
				if (err) return res.send(err);
				
				return res.json({status: true, data: { websites: websites }});
			});
		});

	function addWebsiteToUser(res, user, id) {
		user.websites = user.websites.concat(id);
		user.save(function(err, user) {
			if (err) res.send(err);
		});
	}
	router.route('/websites')
		.post(function (req, res) {
			var websites = db.collection('websites');
			var body = req.body;

			websites.findOne({url: body.url}, function(err, website) {
				if (err) return res.send(err);

				var userEmail = req.decoded.email;
				var users = db.collection('users');

				if (website) {
					// if the website already exists
					users.update({email: userEmail}, {$addToSet: {websiteIDs: website._id}});
					return res.json({status: true, data: {website: website}});
				} else {
					// create a new website
					var newWebsite = {
						url: body.url,
						favicon: body.favicon,
						common: body.common === 'true' ? true : false, // sites for initial load
					};

					websites.insert(newWebsite, function(err, results) {
						if (err) return res.send(err);
						users.update({email: userEmail}, {
							$addToSet: {websiteIDs: results.insertedIds[0]}
						});
						return res.json({status: true, data: {
							website: results.ops[0]
						}})
					});
				}
			});
		})
		.get(function (req, res) {
			var userEmail = req.decoded.email;
			var users = db.collection('users');

			// get user
			users.findOne({'email': userEmail}, function(err, user) {
				if (err) return res.send(err);
				// get all website ids
				var ids = user.websiteIDs;
				var websites = db.collection('websites');
				
				if (!user.websiteIDs) {
					return res.json({status: true, data: { websites: [] }});
				}

				// get list of all blocked websites
				websites.find({'_id': {'$in': ids}}).toArray(function(err, websites) {
					if (err) return res.send(err);
					
					return res.json({status: true, data: { websites: websites }})
				});
			});
		})
	// delete a website
	router.route('/websites/:website_id')
		.delete(function (req, res) {
			var userEmail = req.decoded.email;
			var users = db.collection('users');

			users.updateOne({'email': userEmail}, {
				'$pull': {
					'websiteIDs': {
						'$in': [ObjectId(req.params.website_id)]
					}
				}
			}, function(err, results) {
				if (err) return res.send(err);
				return res.json({status: true, data: {id: req.params.website_id}})
			});
		});


	//////////////////////////////
	// TODOS
	//////////////////////////////
	router.route('/todos')
		.post(function (req, res) {
			
		})
		.get(function (req, res) {
			// get uncompleted todos
			var userEmail = req.decoded.email;
			var users = db.collection('users');

			users.findOne({'email': userEmail}, function(err, user) {
				if (err) return res.send(err);

				if (!user.todos) {
					return res.json({status: true, data: { todos: []}});
				}

				return res.json({status: true, data: { todos: user.todos }});
			});
		});
	router.route('/todos/:todo_id')
		.get()
		.put()
		.delete();


	//////////////////////////////
	// SESSIONS
	//////////////////////////////
	router.route('/sessions')
		.post(function (req, res) {
			var userEmail = req.decoded.email;
			var users = db.collection('users');

			var newSession = {
				start: req.body.start,
				end: req.body.end,
				_id: shortid.generate()
			}
			console.log('typeof ', req.body.start, typeof req.body.start);
			users.update({email: userEmail}, {
				$addToSet: {sessions: newSession}
			}, function(err, results) {
				if (err) return res.send(err);

				return res.json({status: true, data: newSession});
			});
		})
		.get(function (req, res) {
			// get list of sessions
			var userEmail = req.decoded.email;
			var users = db.collection('users');

			users.findOne({'email': userEmail}, function(err, user) {
				if (err) return res.send(err);

				return res.json({status: true, data: {sessions: user.sessions}});
			});
		})

	return router;
}
