'use strict';

var Transform = require('streamx').Transform;

var readDir = require('./read-dir');
var readStream = require('./read-stream');
var readBuffer = require('./read-buffer');
var readSymbolicLink = require('./read-symbolic-link');

function readContents(optResolver) {
  function readFile(file, callback) {
    // Skip reading contents if read option says so
    var read = optResolver.resolve('read', file);
    if (!read) {
      return callback(null, file);
    }

    // Don't fail to read a directory
    if (file.isDirectory()) {
      return readDir(file, optResolver, onRead);
    }

    // Process symbolic links included with `resolveSymlinks` option
    if (file.stat && file.stat.isSymbolicLink()) {
      return readSymbolicLink(file, optResolver, onRead);
    }

    // Read and pass full contents
    var buffer = optResolver.resolve('buffer', file);
    if (buffer) {
      return readBuffer(file, optResolver, onRead);
    }

    // Don't buffer anything - just pass streams
    return readStream(file, optResolver, onRead);

    // This is invoked by the various readXxx modules when they've finished
    // reading the contents.
    function onRead(readErr) {
      if (readErr) {
        return callback(readErr);
      }
      callback(null, file);
    }
  }

  return new Transform({
    transform: readFile,
  });
}

module.exports = readContents;
