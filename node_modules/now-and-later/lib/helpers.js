'use strict';

function noop() {}

var defaultExts = {
  create: noop,
  before: noop,
  after: noop,
  error: noop,
};

function defaultExtensions(options) {
  options = options || {};
  return {
    create: options.create || defaultExts.create,
    before: options.before || defaultExts.before,
    after: options.after || defaultExts.after,
    error: options.error || defaultExts.error,
  };
}

function initializeResults(values) {
  var keys = Object.keys(values);
  var results = Array.isArray(values) ? [] : {};

  var idx = 0;
  var length = keys.length;

  for (idx = 0; idx < length; idx++) {
    var key = keys[idx];
    results[key] = undefined;
  }

  return results;
}

module.exports = {
  defaultExtensions: defaultExtensions,
  noop: noop,
  initializeResults: initializeResults,
};
