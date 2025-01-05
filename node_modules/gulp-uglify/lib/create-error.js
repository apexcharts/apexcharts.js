'use strict';
var GulpUglifyError = require('./gulp-uglify-error');

function createError(file, msg, cause) {
  var perr = new GulpUglifyError(msg, cause);
  perr.plugin = 'gulp-uglify';
  perr.fileName = file.path;
  perr.showStack = false;
  return perr;
}

module.exports = createError;
