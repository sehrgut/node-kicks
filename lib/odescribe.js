var url = require('url');
var util = require('util'),
	fmt = util.format;

var _ = require('lodash');

// TODO: options for detect_url, detect_integer
// TODO: detect cycles: https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
// TODO: detect when an object is a keyed collection of identical-schema objects

function isUrl(str) {
	if (! _.isString(str)) return false;
	
	return Boolean(url.parse(str).protocol);
}

function isInteger(n) {
	return _.isNumber(n) && (n % 1 == 0)
}
	

/*
function entab(str, n) {
	return _.times(n, function () { return str; }).join('');
}

function describeValue(v, level) {
	level = level ? level : 0;
	if (_.isArray(v)) return describeArray(v, level);
	if (_.isObject(v)) return describeObject(v, level);
	else return describeScalar(v, level);
}

function describeArray(a, level) {
	if (a.length)
		return fmt('array [ %s\n%s]', describeValue(a[0], level + 1), entab('  ', level));
	return 'array of nothing';
}

function describeScalar(v, level) {
	// TODO: detect ints and floats, maybe signedness
	
	if (isUrl(v)) return 'url';
	if (isInteger(v)) return 'integer';
	
	return typeof(v);
}

function describeObject(o, level) {
	var pairs = _.map(o, function (v, k) {
		return fmt('%s%s: %s', entab('  ', level + 1), k, describeValue(v, level+1));
	});
	
	return fmt('object of { \n%s\n%s}', pairs.join("\n"), entab('  ', level));
}
*/

function omap(o, cb) {
	var out = {};
	_.each(o, function (v, k) {
		out[k] = cb(v, k, o);
	});
	return out;
}

function describe (v) {
	if (_.isArray(v)) return [ describe(v[0]) ];
	if (_.isObject(v)) return omap(v, function (x) { return describe(x); });
	if (isUrl(v)) return 'url';
	if (isInteger(v)) return 'integer';
	return typeof(v);
}

function explain (v) {
	return util.inspect(describe(v), { depth: null });
}

module.exports = {
	describe: describe,
	explain: explain
};