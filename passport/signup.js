import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/User';
import bCrypt from 'bcrypt-nodejs';

const createHash = pass => bCrypt.hashSync(pass, bCrypt.genSaltSync(10), null);

export default passport => {
	passport.use('signup', new LocalStrategy({
		passReqToCallback: true
	}), (req, username, password, done) => {
		process.nextTick(() => {
			User.findOne({'username': username}, (err, user) => {
				if (err) done(err);

				if (user) {
					done(null, false, req.flash('message', 'user already exists'))
				} else {
					const newUser = new User();

					newUser.email = username;
					newUser.password = createHash(password);
					newUser.name = rew.params('name');

					newUser.save(err => {
						if (err) throw err;

						done(null, newUser);
					});
				}
			});
		});
	});
};