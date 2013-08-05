var kicks = require('../');
var _ = require('lodash');
var config = require('./config');
var od = require('../lib/odescribe');
var url = require('url');

function display_projects(err, projects) {
	if (!err) {
		console.log(od(projects));

		console.log(projects.map(function (p) {
			return _.pick(p, ['name', 'blurb', 'goal', 'pledged', 'state', 'slug', 'deadline']);
		}));
	} else { console.error(err); }
}

var rlvl = 0;

function examine_search_response(err, res) {
	if (!err) {

		if (rlvl < 1) {
			rlvl++;
			C.api_call(res.urls.api.more_projects, null, examine_search_response);
		}
	
		console.log(res.urls.api);
		console.log(res.api);
		console.log(res.projects.map(function (p) { return _.pick(p, ['name']); }));
	} else { console.error(err); }
}

var C = null;

kicks.Client.fromEmail(config.email, config.password, null, function (err, client) {
	C = client;
	
	client.endpoint('search_projects', function (err, proc) {
		var qs = { q: 'game' };
		proc(qs, examine_search_response);
//		proc = client.unpaginate_projects(proc.bind(null, qs));
//		proc(10, display_projects);
	});
});