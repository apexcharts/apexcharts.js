'use strict';

var format = require('util').format;

var sparkles = require('sparkles');
var legacySparkles = require('sparkles/legacy');

var levels = ['debug', 'info', 'warn', 'error'];

function getLogger(namespace) {
  var logger = sparkles(namespace);
  var deprecatedLogger = legacySparkles(namespace);

  levels.forEach(function (level) {
    logger[level] = makeLogLevel(logger, level);

    // Wire up listeners for every level on the deprecated namespace
    // If anything gets emitted on this namespace, we'll emit the
    // `deprecated` event and re-emit the event on the new logger
    deprecatedLogger.on(level, function () {
      logger.emit('deprecated');
      var args = Array.prototype.slice.call(arguments);
      logger[level].apply(logger, args);
    });
  });

  return logger;
}

function makeLogLevel(self, level) {
  return function (msg) {
    if (typeof msg === 'string') {
      self.emit(level, format.apply(null, arguments));
    } else {
      var args = Array.prototype.slice.call(arguments);
      self.emit.apply(self, [level].concat(args));
    }
  };
}

module.exports = getLogger;
