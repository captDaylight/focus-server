var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var WebsitesSchema = Schema({
	name: String,
	favicon: String,
});

module.exports = mongoose.model('Website', WebsitesSchema);