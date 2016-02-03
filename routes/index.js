var express = require('express');
var router = express.Router();

const isAuthenticated = (req, res, next) => {
	if (req.isAuthenticated()) return next();
	
	res.redirect('/');
};

export default passport => {
	
	/* GET home page. */
	router.get('/', function(req, res, next) {
	  res.render('index');
	});

	/* GET home page. */
	router.get('/login', function(req, res, next) {
	  res.render('login', { message: req.flash('message') });
	});

	router.post('/login', passport.authenticate('login', {
		successRedirect: '/home',
		failureRedirect: '/login',
		failureFlash: true,
	}));

	/* GET home page. */
	router.get('/signup', function(req, res, next) {
	  res.render('signup', { message: req.flash('message') });
	});

	router.post('/signup', passport.authenticate('signup', {
		successRedirect: '/home',
		failureRedirect: '/signup',
		failureFlash: true,
	}))

	/* GET Home Page */
	router.get('/home', isAuthenticated, function(req, res){
		res.render('home', { user: req.user });
	});

	return router;
};
