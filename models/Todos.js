var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TodosSchema = Schema({
	todo: String,
	id: String,
	created: Date,
	completed: Number,
	workingOn: Number,
	editing: Boolean,
});

module.exports = mongoose.model('Todo', TodosSchema);
