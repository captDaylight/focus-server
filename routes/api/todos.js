var _ = require('lodash');
module.exports = function(router, db) {
	function getUser(req, res, fn) {
		// get uncompleted todos
		var userEmail = req.decoded.email;
		var users = db.collection('users');

		users.findOne({'email': userEmail}, function(err, user) {
			if (err) return res.send(err);

			fn(user, users);
		});
	}
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
}