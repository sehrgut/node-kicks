## Known Issues

* Kickstarter "more_projects" API URLs (notably used by
  `Client#unpaginate_projects`) don't return next-page results from the cursor
  parameter. This is confirmed as an upstream bug affecting the iOS app as
  well.