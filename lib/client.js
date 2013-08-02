var url = require('url');
var path = require('path');

var fmt = require('util').format;

var _ = require('lodash');
var request = require('request');

var request_options = {
	encoding: 'UTF-8',
	json: true,
	headers: {
		'User-Agent': fmt('node-kicks/v%s; node.js/%s', '0.0.1', process.version)
	}
};

function Client (oauth_token, options) {
	this.oauth_token = oauth_token;
	this.options = _.merge({}, Client.defaults, options);
}

Client.prototype._api_call = function (api_url, qs, cb) {
	ropts = {
		url: api_url,
		qs: _.merge({ oauth_token: this.oauth_token }, qs)
	};
	
	request.get(_.merge({}, request_options, ropts), function (err, res, data) {
		if (err)
			cb(err);
		else if (_.has(data, 'error_messages'))
			cb(new Error(data.error_messages.toString()));
		else
			cb(null, data);
	});
};

Client.prototype.endpoints = function (api_url, cb) {
	if (! api_url)
		api_url = url.resolve(this.options.endpoint, 'v1/');

	this._api_call(api_url, null, cb);
};

Client.fromEmail = function (email, password, options, cb) {
	Client.authenticate(email, password, options, function (err, data) {
		try {
			if (err)
				cb(err);
			else if (_.has(data, 'error_messages'))
				cb(new Error(data.error_messages.toString()));
			else if (_.has(data, 'access_token'))
				cb(null, new Client(data.access_token, options));
			else
				cb(new Error('Unknown error'));
		} catch (e) {
			cb(e);
		}
	});
};

Client.authenticate = function (email, password, options, cb) {
	options = _.merge({}, Client.defaults, options);
	
	ropts = {
		qs: { client_id: options.client_id },
		url: url.resolve(options.endpoint, 'xauth/access_token'),
		json: { email: email, password: password }
	};
	
	request.post(_.merge({}, request_options, ropts), function (err, res, body) { cb(err, body); });
};

Client.defaults = {
	proxy: null,
	client_id: '2II5GGBZLOOZAA5XBU1U0Y44BU57Q58L8KOGM7H0E0YFHP3KTG',
	endpoint: 'https://api.kickstarter.com/'
};

module.exports = {
	client: Client
}; 
