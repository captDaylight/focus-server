var express = require('express');
var router = express.Router();

/* GET login page. */
router.get('/', function(req, res) {
  const data = req.isAuthenticated() ? { user: req.user } : {};
	res.render('index', data);
});

module.exports = router;
