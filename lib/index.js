var _ = require('lodash');

var search = require('./search');
var client = require('./client');

_.merge(module.exports, search, client);

