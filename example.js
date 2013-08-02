var kicks = require('./');
var Q = require('q');

var config = require('./config.json');

Q.nfcall(kicks.client.fromEmail, config.email, config.password, null)
.then(function (client) {
	return Q.nfcall(client.endpoints.bind(client, null));
})
.then(console.log)
.catch(console.error);
