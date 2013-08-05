## Known Issues

* Kickstarter "more_projects" API URLs (notably used by
  `Client#unpaginate_projects`) don't return next-page results from the cursor
  parameter. This may have something to do with the signature in the url?