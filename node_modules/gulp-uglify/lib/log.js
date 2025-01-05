'use strict';
var hasLog = require('has-gulplog');
var each = require('array-each');

var levels = ['debug', 'info', 'warn', 'error'];

each(levels, function(level) {
  module.exports[level] = function() {
    if (hasLog()) {
      var log = require('gulplog');

      log[level].apply(log, arguments);
    }
  };
});
