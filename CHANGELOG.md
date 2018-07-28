# Change Log

All notable changes to this project will be documented in this file.

The document follows the conventions described in [“Keep a CHANGELOG”](http://keepachangelog.com).

====


## [v1.0.2] - 2018-28-07

### Fixed
- Added polyfill for certain es6 features (promise, includes, etc) as IE11 doesn't support them and the chart was failing to render in IE11 because of this.
