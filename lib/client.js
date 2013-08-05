var url = require('url');
var path = require('path');

var fmt = require('util').format;

var _ = require('lodash');
var request = require('request');

var version = require('./version').version;

var request_options = {
	encoding: 'UTF-8',
	json: true,
	headers: {
		'User-Agent': fmt('node-kicks/v%s; node.js/%s', version.version, process.version)
	}
};

// # _Client_

// handles all our stuff, but really shouldn't be directly
// instantiated unless you know what you're doing (i.e. have a cached OAUTH
// token from a previous session, and you know it's good).

function Client (
	// #### Parameters
	// `oauth_token` _string_: OAUTH token provided by `Client.authenticate`
		oauth_token,
	
	// `options` _object_: options map in the format of `Client.defaults`
	// (other options are ignored)
		options
	) {
	this.oauth_token = oauth_token;
	this.options = _.merge({}, Client.defaults, options);
	this._endpoints = null;
}

// ## Shared Properties

// ### Client.defaults
// default parameters for all clients
Client.defaults = {
	// `proxy` _string_: proxy server passed on to the `request` framework
	// (TODO: honour proxy setting)
	proxy: null,
	
	// `client_id` _string_: Kickstarter client id/API key. The only known
	// the only known valid id is this default, derived from the iOS app.
	client_id: '2II5GGBZLOOZAA5XBU1U0Y44BU57Q58L8KOGM7H0E0YFHP3KTG',
	
	// `endpoint` _string_: the URL against which to authenticate and fetch
	// endpoints. All other operations use fully-specified endpoint URLs
	// provided by the API itself.
	endpoint: 'https://api.kickstarter.com/'
};

// ## Shared Functions

// ### Client.fromEmail
// (factory function) authenticates against Kickstarter's server with the
// provided credentials and returns an initialized Client object.
// 
// TODO: Eagerly retrieve API endpoints.
Client.fromEmail = function (
	// #### Parameters
	// `email` _string_: Kickstarter account email address
		email,
	// `password` _string_: Kickstarter account password
		password,
	// `options` _object_: options map to override `Client.defaults`
		options,
	// `cb` _callback (err, object)_
		cb
	) {
	Client.authenticate(email, password, options, function (err, data) {
		try {
			if (err)
				cb(err);
			else if (_.has(data, 'access_token'))
				cb(null, new Client(data.access_token, options));
			else
				cb(new Error('Unknown error'));
		} catch (e) {
			cb(e);
		}
	});
};

// ### Client.authenticate
// authenticates against Kickstarter's server with the provided credentials
// and returns an authentication object.
Client.authenticate = function (
	// #### Parameters
	// `email` _string_: Kickstarter account email address
		email,
	// `password` _string_: Kickstarter account password
		password,
	// `options` _object_: options map to override `Client.defaults`
		options,
	// `cb` _callback (err, string)_
		cb
	) {
	options = _.merge({}, Client.defaults, options);
	
	ropts = {
		qs: { client_id: options.client_id },
		url: url.resolve(options.endpoint, 'xauth/access_token'),
		json: { email: email, password: password }
	};
	
	request.post(_.merge({}, request_options, ropts), function onPost (err, res, body) {
		if (err) cb(err);
		else if (_.has(body, 'error_messages'))
			cb(new Error(body.error_messages));
		else cb(null, body);
	});
};

// ## Instance Methods

// ### Client#api_call
// handles all session-based API calls (read: everything but auth). It takes
// care of things like passing API errors as exceptions through the callback
// chain and wrapping child API urls up as nice and pretty node functions.
Client.prototype.api_call = function (
	// #### Parameters
	// `api_url` _string_: fully-specified absolute URL, such as those
	// provided by the Kickstarter API in `data.urls.api` collections
	// of API responses.
		api_url,
	
	// `qs` _object_: map of query string keys and values to be passed
	// (TODO: Make this optional by checking `_.isFunction`)
		qs,
		
	// `cb` _callback (err, data)_: callback to receive API response
		cb
	) {
	var that = this;

	if (_.isFunction(qs)) {
		cb = qs;
		qs = null;
	}

	ropts = {
		url: api_url,
		qs: _.merge({ oauth_token: this.oauth_token }, qs)
	};

	function process_api_call (err, res, data) {
		if (err)
			cb(err);
		else if (_.has(data, 'error_messages'))
			// TODO: detect bad auth, and try re-auth()ing our client
			cb(new Error(data.error_messages.toString()));
		else
			cb(null, that.entify(data));
	}

	request.get(_.merge({}, request_options, ropts), process_api_call);
};

// ### Client#wrap
// takes an API URL and returns a function which calls `Client#api_call`
// for it.
Client.prototype.wrap = function (
	// #### Parameters
	// `api_url` _string_: API URL which could be passed to `Client#api_call`
		api_url
	) {
	return this.api_call.bind(this, api_url);
};

// ### Client#entify
// recursively searches the `data` object for `_object_.urls.api` collections
// and creates parallel collections of API call functions at `_object_.api`.
// 
// TODO: Currently only recurses down properties with `Array` values. Can we
// identify objects which are collections of API objects, and search them as
// well?
Client.prototype.entify = function (data) {
	var that = this;
	
	_.each(data, function (v, k) {
		if (! _.has(data, 'api') && k == 'urls' && _.has(v, 'api'))
			data.api = _.reduce(v.api, function (api, api_url, proc) {
				api[proc] = that.wrap(api_url);
				return api;
			}, {});
		else if (_.isArray(v))
			_.each(v, that.entify.bind(that));
	});
	
	return data;
};

// ### Client#unpaginate_projects
// wraps API calls which return collections of projects to retrieve multiple
// pages of results at once. It is a higher-order function which returns a
// function of the signature `function (n, cb)`, where `n` is the number of
// projects to attempt to retrieve. Retrieval is stopped when the last page of
// results is retrieved, or the number of projects retrieved equals or exceeds
// the requested number.
// 
// TODO: Return a `next()` pointer to the callback to allow resumption of
// the search.
Client.prototype.unpaginate_projects = function (
	// #### Parameters
	// `proc` _mixed_: API URL or function which returns a Kickstarter API
	// response to its callback
		proc
	) {
	if (! _.isFunction(proc))
		proc = this.wrap(proc);
	
	return function unpaginated (n, cb) {
		var out = [];
		
		function read_projects (err, data) {
			if (err) {
				cb(err)
			} else {
				Array.prototype.push.apply(out, data.projects);
				if (out.length < n && data.api && data.api.more_projects)
					data.api.more_projects(read_projects);
				else
					cb(null, out);
			}
		}
		
		proc(read_projects);
	};
};

// ### Client#endpoint
// returns an API endpoint function for the requested name, if one exists
// at the root level of the Kickstarter API
Client.prototype.endpoint = function (
	// #### Parameters
	// `proc` _string_: one of _categories_, _popular_projects_,
	// _ending_soon_projects_, _near_projects_, _search_projects_, or _self_;
	// or any other named API function which may be added, and returned by
	// `Client#endpoints`
		proc,
		
	// `cb` _callback (err, fn)_: callback to receive endpoint function
		cb
	) {
	this.endpoints(function (err, data) {
		if (err) cb(err);
		else if (_.has(data, proc)) cb(null, data[proc]);
		else cb(new Error(fmt('Unknown remote procedure "%s"', proc)));
	});
};

// ### Client#endpoints
// lazily loads and returns a map of named API endpoints from Kickstarter
Client.prototype.endpoints = function (
	// #### Parameters
	// `cb` _callback (err, object)_: callback to receive map of API endpoints
		cb
	) {
	function save_endpoint_urls (err, data) {
		if (err) {
			cb(err);
		} else {
			this.entify(data);
			this._endpoints = data.api;
			cb(null, this._endpoints);
		}
	}

	if (this._endpoints) {
		cb(null, this._endpoints);
	} else {
		this.api_call(
			url.resolve(this.options.endpoint, 'v1/'),
			null,
			save_endpoint_urls.bind(this));
	}
};

// ### Client#exec
// **deprecated**
Client.prototype.exec = function (proc, data, cb) {
	var that = this;
	
	this.endpoint(proc, function (err, api_url) {
		if (! err) {
			that.api_call(api_url, data, cb);
		} else { cb(err); }
	});
};

// ## Convenience methods for known endpoints

// ### Client#categories
// retrieves the list of project categories from Kickstarter and returns them
// as an array of category objects.
Client.prototype.categories = function (
	// #### Parameters
	// `cb` _callback (err, array)_
		cb
	) {
	var that = this;
	this.endpoint('categories', function (err, proc) {
		if (err) cb(err);
		else proc(null, function (err, res) {
			if (err) cb(err);
			else if (_.has(res, 'categories')) cb(null, res, res.categories);
			else cb(new Error('No categories found'));
		});
	});
};

// ### Client#ending\_soon\_projects
// retrieves an unpaginated list of projects and returns them as an array of
// project objects.
// 
// TODO: See if the underlying API accepts "category_id" or similar parameter.
Client.prototype.ending_soon_projects = function (
	// #### Parameters
	// `n` _integer_: target number of entries to retrieve
		n,
	// `cb` _callback (err, array)_
		cb
	) {
	var that = this;
	this.endpoint('ending_soon_projects', function (err, proc) {
		if (err) cb(err);
		else that.unpaginate_projects(proc)(n, cb);
	});
};

// ### Client#near_projects
// retrieves an unpaginated list of projects near a location and returns them
// as an array of project objects.
// 
// TODO: this can take an "ll" parameter, which seems to be unrelated
// to either location.location_id or location.name.
Client.prototype.near_projects = function (
	// #### Parameters
	// `location_id` _integer_: a Kickstarter internal identifier, which
	// must be gleaned from examining the `location.location_id` property of
	// a project or user object.
		location_id,
	
	// `n` _integer_: target number of entries to retrieve
		n,
	
	// `cb` _callback (err, array)_
		cb
	) {
	var that = this;

	var qs = { location_id: location_id };
	this.endpoint('near_projects', function (err, proc) {
		if (err) cb(err);
		else that.unpaginate_projects(proc.bind(null, qs))(n, cb);
	});
};

// ### Client#popular_projects
// retrieves an unpaginated list of popular projects and returns them as an
// array of project objects.
// 
// TODO: Can this method accept category or location parameters?
Client.prototype.popular_projects = function (
	// #### Parameters
	// `n` _integer_: target number of entries to retrieve
		n,
	// `cb` _callback (err, array)_
		cb
	) {
	var that = this;
	this.endpoint('popular_projects', function (err, proc) {
		if (err) cb(err);
		else that.unpaginate_projects(proc)(n, cb);
	});
};

// ### Client#search_projects
// retrieves an unpaginated list of projects matching the query and returns them
// as an array of project objects.
Client.prototype.search_projects = function (
	// #### Parameters
	// `query` _string_: query against which to match projects
		query,
	// `n` _integer_: target number of entries to retrieve
		n,
	// `cb` _callback (err, array)_
		cb
	) {
	var that = this;
	var qs = { q: query };
	
	this.endpoint('search_projects', function (err, proc) {
		if (err) cb(err);
		else that.unpaginate_projects(proc.bind(null, qs))(n, cb);
	});
};

// ### Client#self
// retrieves the user object corresponding to the authenticated user.
Client.prototype.self = function (
	// #### Parameters
	// `cb` _callback (err, object)_
		cb
	) {
	this.endpoint('self', function (err, proc) {
		if (err) cb(err);
		else proc(cb);
	});
};

module.exports = {
	Client: Client
}; 
