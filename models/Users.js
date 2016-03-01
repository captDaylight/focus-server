var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = Schema({
	email: String,
	password: String,
	name: String,
	admin: Boolean,
	websites: [String],
	todos: [],
});

module.exports = mongoose.model('Users', UserSchema);