'use strict';

var asyncSettle = require('async-settle');
var nowAndLater = require('now-and-later');

var helpers = require('./helpers');

function iterator(fn, key, cb) {
  return asyncSettle(fn, cb);
}

function buildSettleSeries() {
  var args = helpers.verifyArguments(arguments);

  var options = helpers.getOptions(args);

  if (options) {
    args = args.slice(0, -1);
  }

  function settleSeries(done) {
    var onSettled = helpers.onSettled(done);
    nowAndLater.mapSeries(args, iterator, options, onSettled);
  }

  return settleSeries;
}

module.exports = buildSettleSeries;
