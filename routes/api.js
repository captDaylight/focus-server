var express = require('express');
var router = express.Router();
var bCrypt = require('bcrypt-nodejs');
var Todo = require('../models/Todos');
var User = require('../models/Users');
	
router.get('/', function(req, res) {
	res.json({message: 'OH THIS IS THE API'}); 
});

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

					// todo return token and abrieviated user
					return res.json({success: true, user});
				});
			}
		});
	});

router.route('/authenticate')
	.post(function (req,res) {
		User.findOne({'email': req.body.email}, function (err, user) {
			if (err) return res.send(err);

			if (!user) {
				return res.json({message: 'User not found'});
			}

			if (!bCrypt.compareSync(req.body.password, user.password)) {
				return res.json({message: 'Invalid password'});
			}

			// TODO return token and abrieviated user
			return res.json({success: true, user});
		});
	});

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

			return res.json({message: 'todo creatededede'});
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
