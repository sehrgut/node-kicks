var _ = require('lodash');

var kicks = require('../');
var config = require('./config');

var tmpl_project_summary = "## <%=name%>\n[Project #<%=id%>, in <%=location.name%>](<%=urls.web.project_short%>)\n\n<%=blurb%>"

kicks.Client.fromEmail(config.email, config.password, null, function (err, client) {
	if (err) console.error(err);
	else client.search_projects('coffee', 50, function (err, projects) {
		if (err) console.error(err);
		else console.log(projects.map(function (project) {
			return _.template(tmpl_project_summary, project);
		}).join("\n\n"));
	});
});
