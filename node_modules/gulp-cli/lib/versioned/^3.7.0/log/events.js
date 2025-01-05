'use strict';

var log = require('gulplog');
var messages = require('@gulpjs/messages');

var exit = require('../../../shared/exit');
var formatError = require('../format-error');

// Wire up logging events
function logEvents(gulpInst) {

  // Exit with 0 or 1
  var failed = false;
  process.once('exit', function(code) {
    if (code === 0 && failed) {
      exit(1);
    }
  });

  // Total hack due to poor error management in orchestrator
  gulpInst.on('err', function() {
    failed = true;
  });

  gulpInst.on('task_start', function(e) {
    // TODO: batch these
    // so when 5 tasks start at once it only logs one time with all 5
    log.info({ tag: messages.TASK_START, task: e.task });
  });

  gulpInst.on('task_stop', function(e) {
    log.info({ tag: messages.TASK_STOP, task: e.task, duration: e.hrDuration });
  });

  gulpInst.on('task_err', function(e) {
    log.error({ tag: messages.TASK_FAILURE, task: e.task, duration: e.hrDuration });
    log.error({ tag: messages.TASK_ERROR, message: formatError(e) });
  });

  gulpInst.on('task_not_found', function(err) {
    log.error({ tag: messages.TASK_MISSING, task: err.task });
    exit(1);
  });
}

module.exports = logEvents;
