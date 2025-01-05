'use strict';

var retrieveLastRun = require('last-run');

var metadata = require('./helpers/metadata');

function lastRun(task, timeResolution) {
  var fn = task;
  if (typeof task === 'string') {
    fn = this._getTask(task);
  }

  var meta = metadata.get(fn);

  if (meta) {
    fn = meta.orig || fn;
  }

  return retrieveLastRun(fn, timeResolution);
}

module.exports = lastRun;
