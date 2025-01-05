'use strict';

var Transform = require('streamx').Transform;

function prepareRead(optResolver) {
  function normalize(file, callback) {
    var since = optResolver.resolve('since', file);

    if (file.stat) {
      // Skip this file if since option is set and current file is too old
      if (Math.max(file.stat.mtime, file.stat.ctime) <= since) {
        return callback();
      }
    }

    return callback(null, file);
  }

  return new Transform({
    transform: normalize,
  });
}

module.exports = prepareRead;
