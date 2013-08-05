var ks = require('../lib/search').search;
var od = require('../lib/odescribe');

ks('coffee', function (err, data) {
	console.log(od(data));
});
