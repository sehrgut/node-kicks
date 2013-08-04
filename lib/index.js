var _ = require('lodash');

var client = require('./client');
var version = require('./version');

_.merge(module.exports, client, version);

