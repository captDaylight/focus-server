var express = require('express');
var router = express.Router();

/* GET login page. */
router.get('/', function(req, res) {
	res.render('index');
});

module.exports = router;
