'use strict';

var asyncSettle = require('async-settle');
var nowAndLater = require('now-and-later');

var helpers = require('./helpers');

function iterator(fn, key, cb) {
  return asyncSettle(fn, cb);
}

function buildSettleParallel() {
  var args = helpers.verifyArguments(arguments);

  var options = helpers.getOptions(args);

  if (options) {
    args = args.slice(0, -1);
  }

  function settleParallel(done) {
    var onSettled = helpers.onSettled(done);
    nowAndLater.map(args, iterator, options, onSettled);
  }

  return settleParallel;
}

module.exports = buildSettleParallel;
