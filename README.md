node-kicks
==========

kickstarter API for node

## Introduction
Since the public introduction of the Kickstarter mobile
app<sup>[1][iosapp]</sup>, a semi-public web service API has been
available.<sup>[2][explore-api], [3][gem-ks]</sup> This API is internal, and is
subject to change, but still provides a more reliable method than
scraping.<sup>[4][npm-ks]</sup>

`kicks` provides a fluent wrapper around this API. Since the API is still in
flux, methods are provided to introspect the API and call remote procedures
which may be added. Convenience methods are provided explicitly wrapping
known remote procedure signatures.

## Quick Start

	var kicks = require('kicks');
	var config = require('./config');

	kicks.Client.fromEmail(config.email, config.password, null, function (err, client) {
		if (err) console.error(err);
		else client.search_projects('coffee', 50, function (err, projects) {
			if (err) console.error(err);
			else console.log(projects.map(function (project) {
				return {
					name: project.name,
					blurb: project.blurb,
					location: project.location.name,
					url: project.urls.web.project_short
				};
			}));
		});
	});

(This code is available in examples/readme-example.js.)
	
## API Reference
Currently, the only API reference is the groc docs, so you'll have to open
the ./doc/index.html in your browser to get at them.

## References
1. [Kickstarter iOS App][iosapp]
2. [Let's explore Kickstarter's API][explore-api], Mark Olson.
3. [kickscraper][gem-ks] ruby gem
4. [kickstarter scraper][npm-ks] on NPM


[iosapp]: http://www.kickstarter.com/mobile
[npm-ks]: https://npmjs.org/kickstarter
[gem-ks]: https://github.com/markolson/kickscraper
[explore-api]: http://syntaxi.net/2013/03/24/let-s-explore-kickstarter-s-api/