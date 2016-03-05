var express = require('express');
var router = express.Router();
var bCrypt = require('bcrypt-nodejs');
var jwt = require('jsonwebtoken');
var validate = require("validate.js");
var userConstraints = require('../models/userConstraints');

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


	function addWebsiteToUser(res, user, id) {
		console.log(user.websites, typeof id);
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
					console.log('website already exists', website._id);
					users.update({email: userEmail}, {$addToSet: {websitesIDs: website._id}});
					users.findOne({email: userEmail}, function(err, user){
						console.log(user);
					});
					return res.json({status: true, data: {website: website}})
				} else {
					var newWebsite = {
						url: body.url,
						favicon: body.favicon
					};

					websites.insert(newWebsite, function(err, results) {
						if (err) return res.send(err);
						users.update({email: userEmail}, {
							$addToSet: {websitesIDs: results.insertedIds[0]}
						});
						users.findOne({email: userEmail}, function(err, user){
							console.log(user);
						});
						return res.json({status: true, data: {
							website: results.ops[0]
						}})
					});
				}

				// return users.findOne({email: userEmail}, function (err, user) {
				// 	if (err) return res.send(err);

				// 	if (!user) {
				// 		return res.json({
				// 			status: false, 
				// 			reason: 'User not found with ' + req.body.email
				// 		});
				// 	} 

				// })
			});

			// Website.findOne({name: req.body.name}, function (err, website) {
			// 	if (err) return res.send(err);
				
			// 	var queryWebsite = website;

			// 	return User.findOne({'email': userEmail}, function (err, user) {
			// 		if (err) return res.send(err);

			// 		if (!user) {
			// 			return res.json({message: 'User not found with ' + req.body.email});
			// 		}
			// 		if (queryWebsite) {
			// 			// website already exists
			// 			addWebsiteToUser(res, user, queryWebsite._id);
			// 			res.json({success: true, website: queryWebsite});
						
			// 		} else {
			// 			var website = new Website();
			// 			var body = req.body;

			// 			website.name = body.name;
			// 			website.favicon = body.favicon;

			// 			website.save(function (err) {
			// 				if (err) return res.send(err);
			// 				addWebsiteToUser(res, user, website._id);
			// 				return res.json({success: true, website: website});
			// 			});
			// 		}

			// 		return user
			// 	});
			// });
		})
		// .get(function (req, res) {
		// 	User.findOne({'email': req.decoded.email}, function (err, user) {
		// 		if (err) return res.send(err);

		// 		if (!user) {
		// 			return res.json({message: 'User not found with ' + req.body.email});
		// 		}

		// 		Website.find({'_id': {
		// 			$in: user.websites
		// 		}}, function(err, websites) {
		// 			if (err) return res.send(err);
		// 			return res.json({success: true, websites: websites});
		// 		});
		// 	});
		// })

	// // TODOS
	// router.route('/todos')
	// 	.post(function (req, res) {
	// 		// create a todo
	// 		var todo = new Todo();
	// 		var body = req.body;

	// 		todo.todo = body.todo;
	// 		todo.created = body.created;
	// 		todo.completed = body.completed;
	// 		todo.workingOn = body.workingOn;
	// 		todo.editing = body.editing;

	// 		todo.save(function (err) {
	// 			if (err) return res.send(err);

	// 			return res.json({success: true, todo: todo});
	// 		});
	// 	})
	// 	.get(function (req, res) {
	// 		Todo.find(function (err, todos) {
	// 			if (err) return res.send(err);

	// 			return res.json(todos);
	// 		});
	// 	});

	// router.route('/todos/:todo_id')
	// 	.get()
	// 	.put()
	// 	.delete();
	console.log('returning router');
	return router;
}
