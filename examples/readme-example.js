var kicks = require('../');
var config = require('./config');

kicks.Client.fromEmail(config.email, config.password, null, function (err, client) {
	if (err) console.error(err);
	else client.search_projects('coffee', 50, function (err, projects) {
		if (err) console.error(err);
		else console.log(projects.map(function (project) {
			return {
				name: project.name,
				blurb: project.blurb,
				location: project.location.name,
				url: project.urls.web.project_short
			};
		}));
	});
});
