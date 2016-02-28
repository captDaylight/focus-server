var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = Schema({
	email: String,
	password: String,
	name: String,
	admin: Boolean,
	websites: [String],
});

module.exports = mongoose.model('Users', UserSchema);