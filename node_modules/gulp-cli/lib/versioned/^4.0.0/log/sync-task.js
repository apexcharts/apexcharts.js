'use strict';

var log = require('gulplog');
var messages = require('@gulpjs/messages');

var tasks = {};

function warn() {
  var taskKeys = Object.keys(tasks);

  if (!taskKeys.length) {
    return;
  }

  var taskNames = taskKeys.map(function(key) {
    return tasks[key];
  }).join(', ');

  process.exitCode = 1;

  log.warn({ tag: messages.TASK_SYNC, tasks: taskNames });
}

function start(e) {
  tasks[e.uid] = e.name;
}

function clear(e) {
  delete tasks[e.uid];
}

function clearAll() {
  tasks = {};
}

function logSyncTask(gulpInst, opts) {

  process.once('exit', warn);
  gulpInst.on('start', start);
  gulpInst.on('stop', clear);
  // When not running in --continue mode, we need to clear everything on error to avoid
  // false positives.
  gulpInst.on('error', opts.continue ? clear : clearAll);
}

module.exports = logSyncTask;
