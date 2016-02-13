var mongoose = require('mongoose');
var Schema = mongoose.Schema;

				// todo: action.todo,
				// id: shortid.generate(),
				// created: Date.now(),
				// completed: null,
				// workingOn: null, 
				// editing: false,

var TodosSchema = Schema({
	todo: String,
	id: String
	created: Date,
	completed: Number,
	workingOn: Number,
	editing: Boolean,
});

module.exports = mongoose.model('Todo', TodosSchema);
