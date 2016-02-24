var express = require('express');
var router = express.Router();
var bCrypt = require('bcrypt-nodejs');
var jwt = require('jsonwebtoken');
var Todo = require('../models/Todos');
var User = require('../models/Users');
var Website = require('../models/Websites');

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
    expiresInMinutes: 1440 // expires in 24 hours
  });

  return {
	  success: true,
	  token: token,
	  user: newUser
	}
}

// Create User
router.route('/user')
	.post(function (req,res) {
		User.findOne({'email': req.body.email}, function (err, user) {
			if (err) return res.send(err);

			if (user) {
				// user already exists
				return res.json({message: 'Email already in use'});

			} else {
				// create user
				var user = new User();
				var body = req.body;
				var salt = bCrypt.genSaltSync(10);

				user.email = body.email;
				user.password = bCrypt.hashSync(body.password, salt, null);
				user.name = body.name;
				user.admin = body.admin;

				user.save(function(err) {
					if (err) return res.send(err);

	        // return the information including token as JSON
	        return res.json(getUserAndToken(user));
				});
			}
		});
	});

router.route('/authenticate')
	.post(function (req, res) {
		User.findOne({'email': req.body.email}, function (err, user) {
			if (err) return res.send(err);

			if (!user) {
				return res.json({message: 'User not found'});
			}

			if (!bCrypt.compareSync(req.body.password, user.password)) {
				return res.json({message: 'Invalid password'});
			}

			// TODO return token and abrieviated user
			return res.json(getUserAndToken(user));
		});
	});

// route middleware to verify a token
router.use(function(req, res, next) {
  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  console.log('token?', req.body, token);
  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, secret, function(err, decoded) {      
      if (err) {
        return res.json({ 
        	success: false, 
        	message: 'Failed to authenticate token.' 
        });
      } else {
        req.decoded = decoded;    
        next();
      }
    });
  } else {
    return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });
  }
});


router.route('/websites')
	.post(function (req, res) {
		var userEmail = req.decoded.email;
		Website.findOne({name: req.body.name}, function (err, website) {
			if (err) return res.send(err);
			
			var queryWebsite = website;

			return User.findOne({'email': userEmail}, function (err, user) {
				if (err) return res.send(err);

				if (!user) {
					return res.json({message: 'User not found with ' + req.body.email});
				}
				console.log('website again',queryWebsite);
				if (queryWebsite) {
					// user already exists
					console.log('already existed', user);
					res.json({success: true, website: queryWebsite});

				} else {
					console.log('new website', user);
					var website = new Website();
					var body = req.body;

					website.name = body.name;
					website.favicon = body.favicon;

					website.save(function (err) {
						if (err) return res.send(err);

						return res.json({success: true, website: website});
					});
				}

				return user
			});


		});
	})
	.get(function (req, res) {
		Website.find(function (err, websites) {
			if (err) return res.send(err);

			return res.json({success: true, websites: websites});
		})
	})

// TODOS
router.route('/todos')
	.post(function (req, res) {
		// create a todo
		var todo = new Todo();
		var body = req.body;

		todo.todo = body.todo;
		todo.created = body.created;
		todo.completed = body.completed;
		todo.workingOn = body.workingOn;
		todo.editing = body.editing;

		todo.save(function (err) {
			if (err) return res.send(err);

			return res.json({success: true, todo: todo});
		});
	})
	.get(function (req, res) {
		Todo.find(function (err, todos) {
			if (err) return res.send(err);

			return res.json(todos);
		});
	});

router.route('/todos/:todo_id')
	.get()
	.put()
	.delete();

module.exports = router;
