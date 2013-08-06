var ks = require('../lib/search').search;
var od = require('../lib/odescribe');
var util = require('util');

ks('coffee', function (err, data) {
	console.log(od.explain(data));
});