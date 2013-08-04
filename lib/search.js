var request = require('request');

var endpoints = {
	search: 'http://www.kickstarter.com/projects/search.json'
};

// ## search
// **deprecated**
// 
// retrieves a single search page from the JSON API of the Kickstarter
// web site.
function search (query, cb) {
	var qs = { search: '', term: query };
	request.get({
		url: endpoints.search,
		qs: qs,
		json: true,
		encoding: 'UTF-8'
	}, cb);
};

module.exports = {
	search: search
};