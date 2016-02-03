var login = require('./login');
var signup = require('./signup');
var User = require('../models/user');

export default passport => {
	passport.serializeUser((user, done) => done(null, user._id));
	passport.deserializeUser((id, done) => {
		User.findById(id, (err, user) => done(err, user));
	});

	login(passport);
	signup(passport);
};