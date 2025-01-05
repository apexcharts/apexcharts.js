'use strict';

var path = require('path');

var fs = require('graceful-fs');

var MASK_MODE = parseInt('7777', 8);

// Utility for passing dirpath that was used with `fs.stat`
function stat(dirpath, cb) {
  fs.stat(dirpath, onStat);

  function onStat(err, stats) {
    cb(err, dirpath, stats);
  }
}

// Utility for passing dirpath that was used with `fs.lstat`
function lstat(dirpath, cb) {
  fs.lstat(dirpath, onStat);

  function onStat(err, stats) {
    cb(err, dirpath, stats);
  }
}

function mkdirp(dirpath, mode, callback) {
  if (typeof mode === 'function') {
    callback = mode;
    mode = undefined;
  }

  if (typeof mode === 'string') {
    mode = parseInt(mode, 8);
  }

  dirpath = path.resolve(dirpath);

  fs.mkdir(dirpath, mode, onMkdir);

  function onMkdir(mkdirErr) {
    if (!mkdirErr) {
      return stat(dirpath, onStat);
    }

    switch (mkdirErr.code) {
      case 'ENOENT': {
        return mkdirp(path.dirname(dirpath), onRecurse);
      }

      case 'EEXIST': {
        return stat(dirpath, onStat);
      }

      case 'ENOTDIR': {
        // On ENOTDIR, this will traverse up the tree until it finds something it can stat
        return stat(dirpath, onErrorRecurse);
      }

      default: {
        return callback(mkdirErr);
      }
    }

    function onErrorRecurse(err, dirpath, stats) {
      if (err) {
        return stat(path.dirname(dirpath), onErrorRecurse);
      }

      onStat(err, dirpath, stats);
    }

    function onStat(statErr, dirpath, stats) {
      if (statErr) {
        // If we have ENOENT here it might be a symlink,
        // so we need to recurse to error with the target file name
        if (statErr.code === 'ENOENT') {
          return lstat(dirpath, onStat);
        }

        return callback(statErr);
      }

      if (!stats.isDirectory()) {
        return lstat(dirpath, onNonDirectory);
      }

      if (!mode) {
        return callback();
      }

      if ((stats.mode & MASK_MODE) === mode) {
        return callback();
      }

      fs.chmod(dirpath, mode, onChmod);
    }

    function onChmod(chmodErr) {
      if (chmodErr && chmodErr.code !== 'ENOSUP') {
        return callback(chmodErr);
      }

      callback();
    }

    function onNonDirectory(err, dirpath, stats) {
      if (err) {
        // Just being cautious by bubbling the mkdir error
        return callback(mkdirErr);
      }

      if (stats.isSymbolicLink()) {
        return fs.readlink(dirpath, onReadlink);
      }

      // Trying to readdir will surface the ENOTDIR we want
      // TODO: Use `opendir` when we support node >12
      fs.readdir(dirpath, callback);
    }

    function onReadlink(err, link) {
      if (err) {
        // Just being cautious by bubbling the mkdir error
        return callback(mkdirErr);
      }

      // Trying to readdir will surface the ENOTDIR we want
      // TODO: Use `opendir` when we support node >12
      fs.readdir(link, callback);
    }
  }

  function onRecurse(recurseErr) {
    if (recurseErr) {
      return callback(recurseErr);
    }

    mkdirp(dirpath, mode, callback);
  }
}

module.exports = mkdirp;
