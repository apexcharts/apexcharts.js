'use strict';
var uglify = require('uglify-js');
var compose = require('./composer');
var GulpUglifyError = require('./lib/gulp-uglify-error');
var logger = require('./lib/log');

module.exports = function(opts) {
  return compose(
    uglify,
    logger
  )(opts);
};

module.exports.GulpUglifyError = GulpUglifyError;
