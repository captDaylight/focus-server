var shortid = require('shortid');

function checkIfNum(val) {
	return typeof val === 'number' ? val : parseInt(val)
}

module.exports = function(router, db) {
	router.route('/sessions')
		.post(function (req, res) {
			var userEmail = req.decoded.email;
			var users = db.collection('users');

			var newSession = {
				start: checkIfNum(req.body.start),
				end: checkIfNum(req.body.end),
				duration: checkIfNum(req.body.duration),
				_id: shortid.generate()
			}
			
			users.update({email: userEmail}, {
				$addToSet: {sessions: newSession}
			}, function(err, results) {
				if (err) return res.send(err);

				return res.json({status: true, data: {session: newSession}});
			});
		})
		.get(function (req, res) {
			// get list of sessions
			var userEmail = req.decoded.email;
			var users = db.collection('users');

			users.findOne({'email': userEmail}, function(err, user) {
				if (err) return res.send(err);

				return res.json({status: true, data: {sessions: user.sessions}});
			});
		});
};