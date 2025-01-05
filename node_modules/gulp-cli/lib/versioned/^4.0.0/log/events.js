'use strict';

var log = require('gulplog');
var messages = require('@gulpjs/messages');

var formatError = require('../format-error');

// Wire up logging events
function logEvents(gulpInst) {

  var loggedErrors = [];

  gulpInst.on('start', function(evt) {
    /* istanbul ignore next */
    // TODO: batch these
    // so when 5 tasks start at once it only logs one time with all 5
    var level = evt.branch ? 'debug' : 'info';
    log[level]({ tag: messages.TASK_START, task: evt.name });
  });

  gulpInst.on('stop', function(evt) {
    /* istanbul ignore next */
    var level = evt.branch ? 'debug' : 'info';
    log[level]({ tag: messages.TASK_STOP, task: evt.name, duration: evt.duration });
  });

  gulpInst.on('error', function(evt) {
    var level = evt.branch ? 'debug' : 'error';
    log[level]({ tag: messages.TASK_FAILURE, task: evt.name, duration: evt.duration });

    // If we haven't logged this before, log it and add to list
    if (loggedErrors.indexOf(evt.error) === -1) {
      log.error({ tag: messages.TASK_ERROR, message: formatError(evt) });
      loggedErrors.push(evt.error);
    }
  });
}

module.exports = logEvents;
