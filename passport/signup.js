import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/User';
import bCrypt from 'bcrypt-nodejs';

const createHash = pass => bCrypt.hashSync(pass, bCrypt.genSaltSync(10), null);

export default passport => {

};