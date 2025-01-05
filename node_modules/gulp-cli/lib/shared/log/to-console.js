'use strict';

var messages = require('@gulpjs/messages');

/* istanbul ignore next */
function noop() {}

function toConsole(log, opts, translate) {
  // Return immediately if logging is
  // not desired.
  if (opts.tasksSimple || opts.tasksJson || opts.help || opts.version || opts.silent) {
    // Keep from crashing process when silent.
    log.on('error', noop);
    return function () {
      log.removeListener('error', noop);
    };
  }

  // Default loglevel to info level (3).
  var loglevel = opts.logLevel || 3;

  var deprecatedPrinted = false;
  log.on('deprecated', onDeprecated);

  // -L: Logs error events.
  if (loglevel > 0) {
    log.on('error', onError);
  }

  // -LL: Logs warn and error events.
  if (loglevel > 1) {
    log.on('warn', onWarn);
  }

  // -LLL: Logs info, warn and error events.
  if (loglevel > 2) {
    log.on('info', onInfo);
  }

  if (loglevel > 3) {
    log.on('debug', onDebug);
  }

  return function () {
    log.removeListener('deprecated', onDeprecated);
    log.removeListener('error', onError);
    log.removeListener('warn', onWarn);
    log.removeListener('info', onInfo);
    log.removeListener('debug', onDebug);
  };

  function onDeprecated() {
    if (!deprecatedPrinted) {
      var msg = { tag: messages.GULPLOG_DEPRECATED };
      // Get message and timestamp before printing anything to avoid
      // logging a half message if there's an error in one of them
      var message = translate.message(msg);
      var timestamp = translate.timestamp(msg);

      if (message) {
        // Ensure timestamp is not written without a message
        if (timestamp) {
          process.stderr.write(timestamp + ' ');
        }
        console.error(message);
      }

      deprecatedPrinted = true;
    }
  }

  function onError(msg) {
    // Get message and timestamp before printing anything to avoid
    // logging a half message if there's an error in one of them
    var message = translate.message(msg);
    var timestamp = translate.timestamp(msg);

    if (message) {
      // Ensure timestamp is not written without a message
      if (timestamp) {
        process.stderr.write(timestamp + ' ');
      }
      console.error(message);
    }
  }

  // onWarn, onInfo, and onDebug are currently all the same
  // implementation but separated to change independently
  function onWarn(msg) {
    // Get message and timestamp before printing anything to avoid
    // logging a half message if there's an error in one of them
    var message = translate.message(msg);
    var timestamp = translate.timestamp(msg);

    if (message) {
      // Ensure timestamp is not written without a message
      if (timestamp) {
        process.stdout.write(timestamp + ' ');
      }
      console.log(message);
    }
  }

  function onInfo(msg) {
    // Get message and timestamp before printing anything to avoid
    // logging a half message if there's an error in one of them
    var message = translate.message(msg);
    var timestamp = translate.timestamp(msg);

    if (message) {
      // Ensure timestamp is not written without a message
      if (timestamp) {
        process.stdout.write(timestamp + ' ');
      }
      console.log(message);
    }
  }

  function onDebug(msg) {
    // Get message and timestamp before printing anything to avoid
    // logging a half message if there's an error in one of them
    var message = translate.message(msg);
    var timestamp = translate.timestamp(msg);

    if (message) {
      // Ensure timestamp is not written without a message
      if (timestamp) {
        process.stdout.write(timestamp + ' ');
      }
      console.log(message);
    }
  }
}

module.exports = toConsole;
