'use strict';

var once = require('once');

var helpers = require('./helpers');

function mapSeries(values, iterator, options, done) {
  // Allow for options to not be specified
  if (typeof options === 'function') {
    done = options;
    options = {};
  }

  // Handle no callback case
  if (typeof done !== 'function') {
    done = helpers.noop;
  }

  done = once(done);

  // Will throw if non-object
  var keys = Object.keys(values);
  var length = keys.length;
  var idx = 0;
  // Return the same type as passed in
  var results = helpers.initializeResults(values);

  var extensions = helpers.defaultExtensions(options);

  if (length === 0) {
    return done(null, results);
  }

  var key = keys[idx];
  next(key);

  function next(key) {
    var value = values[key];

    var storage = extensions.create(value, key) || {};

    extensions.before(storage);
    iterator(value, key, once(handler));

    function handler(err, result) {
      if (err) {
        extensions.error(err, storage);
        return done(err, results);
      }

      extensions.after(result, storage);
      results[key] = result;

      if (++idx >= length) {
        done(err, results);
      } else {
        next(keys[idx]);
      }
    }
  }
}

module.exports = mapSeries;
