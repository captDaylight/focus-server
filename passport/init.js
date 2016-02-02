import login from './login';
import signup from './signup';
import User from '../models/User'

export default passport => {
	passport.serializeUser((user, done) => done(null, user._id));
	passport.deserializeUser((id, done) => {
		User.findById(id, (err, user) => done(err, user));
	});

	login(passport);
	signup(passport);
};