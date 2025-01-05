'use strict';

var Transform = require('streamx').Transform;
var fo = require('../file-operations');

function resolveSymlinks(optResolver) {
  // A stat property is exposed on file objects as a (wanted) side effect
  function resolveFile(file, callback) {
    fo.reflectLinkStat(file.path, file, onReflect);

    function onReflect(statErr) {
      if (statErr) {
        return callback(statErr);
      }

      if (!file.stat.isSymbolicLink()) {
        return callback(null, file);
      }

      var resolveSymlinks = optResolver.resolve('resolveSymlinks', file);

      if (!resolveSymlinks) {
        return callback(null, file);
      }

      fo.findSymlinkHardpath(file.path, onSymlinkHardpath);
    }

    function onSymlinkHardpath(readlinkErr, path) {
      if (readlinkErr) {
        return callback(readlinkErr);
      }

      // Get target's stats
      fo.reflectStat(path, file, onReflect);
    }
  }

  return new Transform({
    transform: resolveFile,
  });
}

module.exports = resolveSymlinks;
