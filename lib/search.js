var querystring = require('querystring');
var request = require('request');

var endpoints = {
	search: 'http://www.kickstarter.com/projects/search.json'
};

function search (query, cb) {
	var qs = { search: '', term: query };
	request.get({
		url: endpoints.search,
		qs: qs,
		json: true,
		encoding: 'UTF-8'
	}, cb);
	return qs;
};

module.exports = {
	search: search
};