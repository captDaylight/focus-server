import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/User';
import bCrypt from 'bcrypt-nodejs';

const isValidPassword = (user, password) => {
	return bCrypt.compareSync(password, user.password);
};

export default passport => {
	passport.use('login', new LocalStrategy({
		passReqToCallback: true
	}, (req, username, password, done) => {
		User.findOne({'username': username}, (err, user) => {
			if (err) return done(err);

			if (!user) {
				return done(null, false, req.flash('message', 'User not found.'));
			}
			
			if (!isValidPassword(user, password)) {
				return done(null, false, req.flash('message', 'Password is incorrect.'));
			}

			return done(null, user);
		})
	}));
};