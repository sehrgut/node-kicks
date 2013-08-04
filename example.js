var kicks = require('./');
var Q = require('q');
var _ = require('lodash');

var config = require('./config.json');
var results = [];

var client = null;

function summarize_project(p) {
	return _.pick(p, 'name', 'blurb', 'location', 'id', 'api');
}

function printEndpoints () {
	return Q.nfcall(client.endpoints.bind(client))
	.then(function (ep) { console.log(ep); });
}

function printPopular () {
	return Q.nfcall(client.popular_projects.bind(client, 20))
	.then(function (projects) {
		console.log(projects.map(summarize_project));
		console.log(projects.length);
	});
}

function findCoffee () {
	return Q.nfcall(client.search_projects.bind(client, 'coffee', 100))
	.then(function (projects) {
		console.log(projects.map(summarize_project));
		console.log(projects.length);
	});
}

function printNear () {
	return Q.nfcall(client.near_projects.bind(client, 2487956, 20))
	.then(function (projects) {
		console.log(projects.map(summarize_project));
		console.log(projects.length);
	});
}

function printSelf () {
	return Q.nfcall(client.self.bind(client))
	.then(function (self) {
		return Q.nfcall(self.api.self);
	})
	.then(function (user) {
		console.log(user);
	});
}

Q.nfcall(kicks.Client.fromEmail, config.email, config.password, null)
.then(function (c) {
	client = c;
	return Q.all([printEndpoints(), printSelf()]);
})
.catch(console.error);
