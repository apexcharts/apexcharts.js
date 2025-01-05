'use strict';
var makeErrorCause = require('make-error-cause');

var gulpUglifyError = makeErrorCause('GulpUglifyError');
gulpUglifyError.prototype.toString = function() {
  var cause = this.cause || {};

  return (
    makeErrorCause.BaseError.prototype.toString.call(this) +
    (this.fileName ? '\nFile: ' + this.fileName : '') +
    (cause.line ? '\nLine: ' + cause.line : '') +
    (cause.col ? '\nCol: ' + cause.col : '')
  );
};

module.exports = gulpUglifyError;
