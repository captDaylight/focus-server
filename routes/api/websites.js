var ObjectId = require('mongodb').ObjectID;

module.exports = function(router, db) {
	router.route('/websites/common')
		.get(function (req, res) {
			var websites = db.collection('websites');
			var body = req.body;

			websites.find({'common': true}).toArray(function(err, websites) {
				if (err) return res.send(err);
				
				return res.json({status: true, data: { websites: websites }});
			});
		});

	function addWebsiteToUser(res, user, id) {
		user.websites = user.websites.concat(id);
		user.save(function(err, user) {
			if (err) res.send(err);
		});
	}
	router.route('/websites')
		.post(function (req, res) {
			var websites = db.collection('websites');
			var body = req.body;

			websites.findOne({url: body.parsedURL}, function(err, website) {
				if (err) return res.send(err);

				var userEmail = req.decoded.email;
				var users = db.collection('users');

				if (website) {
					// if the website already exists
					users.update({email: userEmail}, {$addToSet: {websiteIDs: website._id}});
					return res.json({status: true, data: {website: website}});
				} else {
					// create a new website
					var newWebsite = {
						url: body.parsedURL,
						common: body.common === 'true' ? true : false, // sites for initial load
					};
					favicon(body.rawURL, function(err, favicon_url) {
						if (err) return res.send(err);
						console.log(err, favicon_url);
						newWebsite.favicon = favicon_url;

						websites.insert(newWebsite, function(err, results) {
							if (err) return res.send(err);
							users.update({email: userEmail}, {
								$addToSet: {websiteIDs: results.insertedIds[0]}
							});
							return res.json({status: true, data: {
								website: results.ops[0]
							}})
						});
					});
				}
			});
		})
		.get(function (req, res) {
			var userEmail = req.decoded.email;
			var users = db.collection('users');

			// get user
			users.findOne({'email': userEmail}, function(err, user) {
				if (err) return res.send(err);
				// get all website ids
				var ids = user.websiteIDs;
				var websites = db.collection('websites');
				
				if (!user.websiteIDs) {
					return res.json({status: true, data: { websites: [] }});
				}

				// get list of all blocked websites
				websites.find({'_id': {'$in': ids}}).toArray(function(err, websites) {
					if (err) return res.send(err);
					
					return res.json({status: true, data: { websites: websites }})
				});
			});
		})
	// delete a website
	router.route('/websites/:website_id')
		.delete(function (req, res) {
			var userEmail = req.decoded.email;
			var users = db.collection('users');

			users.updateOne({'email': userEmail}, {
				'$pull': {
					'websiteIDs': {
						'$in': [ObjectId(req.params.website_id)]
					}
				}
			}, function(err, results) {
				if (err) return res.send(err);
				return res.json({status: true, data: {id: req.params.website_id}})
			});
		});
};