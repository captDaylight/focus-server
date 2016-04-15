var express = require('express');
var router = express.Router();
var bCrypt = require('bcrypt-nodejs');
var jwt = require('jsonwebtoken');
var validate = require("validate.js");
var userConstraints = require('../models/userConstraints');
var shortid = require('shortid');
var favicon = require('favicon');
var _ = require('lodash');

var allApi = require('./api/all');
var websitesApi = require('./api/websites');

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

function getUserAndToken(user) {
	var newUser = {
		id: user._id,
		email: user.email					
	}
	var token = jwt.sign(newUser, secret, {
    expiresInMinutes: 900000000 // almost never expires
  });

  return {
	  token: token,
	  user: newUser
	}
}


module.exports = function(db) {
	function getUser(req, res, fn) {
		// get uncompleted todos
		var userEmail = req.decoded.email;
		var users = db.collection('users');

		users.findOne({'email': userEmail}, function(err, user) {
			if (err) return res.send(err);

			fn(user, users);
		});
	}

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
					return res.json({status: true, data: getUserAndToken(newUser)});
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

				var ids = user.websiteIDs;
				var websites = db.collection('websites');
				var userAndToken = getUserAndToken(user);

				if (!user.websiteIDs) {
					return res.json({
						status: true, 
						data: Object.assign(userAndToken, {websites: []})
					});
				}

				// get list of all blocked websites
				websites.find({'_id': {'$in': ids}}).toArray((err, websites) => {
					return res.json({
						status: true,
						data: Object.assign(getUserAndToken(user), {websites: websites})	
					});
				});
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
	// GET ALL DATA
	//////////////////////////////
	allApi(router, db);

	//////////////////////////////
	// WEBSITES
	//////////////////////////////
	websitesApi(router, db);



	//////////////////////////////
	// TODOS
	//////////////////////////////
	router.route('/todos')
		.post(function (req, res) {
			var userEmail = req.decoded.email;
			var users = db.collection('users');

			var newTodo = {
				text: req.body.text,
				created: req.body.created,
				completed: null
			}
			
			users.update({email: userEmail}, {
				$addToSet: {todos: newTodo}
			}, function(err, results) {
				if (err) return res.send(err);
				console.log('adding new todo', newTodo);
				return res.json({status: true, data: {todo: newTodo}});
			});
		})
		.get(function (req, res) {
			getUser(req, res, function(user) {
				if (!user.todos) {
					return res.json({status: true, data: { todos: []}});
				}

				return res.json({status: true, data: { todos: user.todos }});
			});
		});
	router.route('/todos/:created')
		.get(function (req, res) {

		})
		.put(function (req, res) {
			var userEmail = req.decoded.email;
			var users = db.collection('users');

			users.findOne({'email': userEmail}, function(err, user) {
				if (err) return res.send(err);
				
				var todo = _.find(user.todos, function (todo) {
					return todo.created === req.params.created;
				});

				if (!user.todos) {
					return res.json({status: false, data: { message: 'No Todos'}});
				}
				// if completed, move to completed array
				if ('completed' in req.body) {
					todo = _.merge(todo, {completed: req.body.completed});

					users.update({email: userEmail}, {
						$pull: {todos: {created: req.params.created}},
						$addToSet: {completedTodos: todo}
					}, function(err, results) {
						if (err) return res.send(err);
						return res.json({status: true, data: {todo: todo}});
					});
				}

				if ('text' in req.body) {
					users.update({email: userEmail, 'todos.created': req.params.created}, {
							$set: { 'todos.$.text': req.body.text }, 
						}, function (err, results) {
							if (err) return res.send(err);
							return res.json({status: true});
						});
				}

				// var todo = _.find(user.todos, function (todo) {
				// 	return todo.created === req.params.created;
				// });
				
				// console.log(todo);
				
				// return res.json({status: true, data: { todos: [] }});
			});
		})
		.delete(function(req, res) {
			var userEmail = req.decoded.email;
			var users = db.collection('users');

			users.findOne({'email': userEmail}, function(err, user) {
				if (err) return res.send(err);

				var i = _.findIndex(user.todos, function(t) {
					return t.created === req.params.created;
				})
				
				var query = i >= 0 
					? {todos: {created: req.params.created}}
					: {completedTodos: {created: req.params.created}};

				users.update({email: userEmail}, {
					$pull: query,
				}, function(err, results) {
					if (err) return res.send(err);
					
					return res.json({status: true});
				});
			});
		});

	router.route('/completedtodos/')
		.get(function (req, res) {
			// get uncompleted todos
			var userEmail = req.decoded.email;
			var users = db.collection('users');
			console.log('trying to get completed');
			users.findOne({'email': userEmail}, function(err, user) {
				if (err) return res.send(err);
				console.log('user', user);
				if (!user.completedTodos) {
					return res.json({status: true, data: { completedTodos: []}});
				}

				return res.json({status: true, data: { completedTodos: user.completedTodos }});
			});
		});


	function checkIfNum(val) {
		return typeof val === 'number' ? val : parseInt(val)
	}
	//////////////////////////////
	// SESSIONS
	//////////////////////////////
	router.route('/sessions')
		.post(function (req, res) {
			var userEmail = req.decoded.email;
			var users = db.collection('users');

			var newSession = {
				start: checkIfNum(req.body.start),
				end: checkIfNum(req.body.end),
				duration: checkIfNum(req.body.duration),
				_id: shortid.generate()
			}
			
			users.update({email: userEmail}, {
				$addToSet: {sessions: newSession}
			}, function(err, results) {
				if (err) return res.send(err);

				return res.json({status: true, data: {session: newSession}});
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

