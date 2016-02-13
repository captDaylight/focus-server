var express = require('express');
var router = express.Router();

module.exports = function(passport) {
	
	router.get('/', function(req, res) {
		res.json({message: 'OH THIS IS THE API'}); 
	});

	return router;
}