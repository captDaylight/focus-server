var express = require('express');
var router = express.Router();
var Todo = require('../models/Todos');

module.exports = function(passport) {
	
	router.get('/', function(req, res) {
		res.json({message: 'OH THIS IS THE API'}); 
	});

	// TODOS
	router.route('/todos')
		.post(function (req, res) {
			// create a todo
			var todo = new Todo();
			var body = req.body;
			console.log(body);
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

	return router;
}