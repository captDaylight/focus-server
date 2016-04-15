module.exports = function(router, db) {
	router.route('/')
		.get(function(req, res) {
			var userEmail = req.decoded.email;
			var users = db.collection('users');
			// get user
			users.findOne({'email': userEmail}, function(err, user) {
				// return res.json({status: true, data: { user: user }});
				var ids = user.websiteIDs;
				var websites = db.collection('websites');
				if (!user.websiteIDs) {
					return res.json({status: true, data: { websites: [] }});
				}

				// get list of all blocked websites
				websites.find({'_id': {'$in': ids}}).toArray(function(err, websites) {
					if (err) return res.send(err);
					
					var morning = new Date();
					morning.setHours(0, 0, 0, 0);

					var morningUTC = morning.getTime();

					var todaysSessions = user.sessions.filter(function (session) {
						return session.start > morningUTC;
					});

					return res.json({status: true, data: { 
						websites: websites, 
						todos: user.todos,
						sessions: todaysSessions
					}})
				});
			});
		});
};
