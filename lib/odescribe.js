var url = require('url');
var util = require('util'),
	fmt = util.format;

var _ = require('lodash');

function isFullUrl(str) {
	if (! _.isString(str)) return false;
	
	var u = url.parse(str);
	return u && u.protocol;
}

function isInteger(n) {
	return _.isNumber(n) && (n % 1 == 0)
}
	
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
	
	if (isFullUrl(v)) return 'url';
	if (isInteger(v)) return 'integer';
	
	return typeof(v);
}

function describeObject(o, level) {
	var pairs = _.map(o, function (v, k) {
		return fmt('%s%s: %s', entab('  ', level + 1), k, describeValue(v, level+1));
	});
	
	return fmt('object of { \n%s\n%s}', pairs.join("\n"), entab('  ', level));
}

module.exports = describeValue;