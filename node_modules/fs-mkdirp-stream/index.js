'use strict';

var Transform = require('streamx').Transform;

var mkdirp = require('./mkdirp');

function toFunction(dirpath) {
  function stringResolver(chunk, callback) {
    callback(null, dirpath);
  }

  return stringResolver;
}

function mkdirpStream(resolver) {
  // Handle resolver that's just a dirpath
  if (typeof resolver === 'string') {
    resolver = toFunction(resolver);
  }

  return new Transform({
    transform: function (chunk, callback) {
      resolver(chunk, onDirpath);

      function onDirpath(dirpathErr, dirpath, mode) {
        if (dirpathErr) {
          return callback(dirpathErr);
        }

        mkdirp(dirpath, mode, onMkdirp);
      }

      function onMkdirp(mkdirpErr) {
        if (mkdirpErr) {
          return callback(mkdirpErr);
        }

        callback(null, chunk);
      }
    },
  });
}

module.exports = mkdirpStream;
