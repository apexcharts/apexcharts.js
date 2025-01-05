'use strict';

var asyncDone = require('async-done');
var nowAndLater = require('now-and-later');

var helpers = require('./helpers');

function iterator(fn, key, cb) {
  return asyncDone(fn, cb);
}

function buildSeries() {
  var args = helpers.verifyArguments(arguments);

  var options = helpers.getOptions(args);

  if (options) {
    args = args.slice(0, -1);
  }

  function series(done) {
    nowAndLater.mapSeries(args, iterator, options, done);
  }

  return series;
}

module.exports = buildSeries;
