'use strict';

var fs = require('graceful-fs');
var date = require('value-or-function').date;
var Writable = require('streamx').Writable;

var constants = require('./constants');

var APPEND_MODE_REGEXP = /a/;

function closeFd(propagatedErr, fd, callback) {
  if (typeof fd !== 'number') {
    return callback(propagatedErr);
  }

  fs.close(fd, onClosed);

  function onClosed(closeErr) {
    if (propagatedErr || closeErr) {
      return callback(propagatedErr || closeErr);
    }

    callback();
  }
}

function isValidUnixId(id) {
  if (typeof id !== 'number') {
    return false;
  }

  if (id < 0) {
    return false;
  }

  return true;
}

function getFlags(options) {
  var flags = !options.append ? 'w' : 'a';
  if (!options.overwrite) {
    flags += 'x';
  }
  return flags;
}

function isFatalOverwriteError(err, flags) {
  if (!err) {
    return false;
  }

  if (err.code === 'EEXIST' && flags[1] === 'x') {
    // Handle scenario for file overwrite failures.
    return false;
  }

  // Otherwise, this is a fatal error
  return true;
}

function isFatalUnlinkError(err) {
  if (!err || err.code === 'ENOENT') {
    return false;
  }

  return true;
}

function getModeDiff(fsMode, vinylMode) {
  var modeDiff = 0;

  if (typeof vinylMode === 'number') {
    modeDiff = (vinylMode ^ fsMode) & constants.MASK_MODE;
  }

  return modeDiff;
}

function getTimesDiff(fsStat, vinylStat) {
  var mtime = date(vinylStat.mtime) || 0;
  if (!mtime) {
    return;
  }

  var atime = date(vinylStat.atime) || 0;
  if (+mtime === +fsStat.mtime && +atime === +fsStat.atime) {
    return;
  }

  if (!atime) {
    atime = date(fsStat.atime) || undefined;
  }

  var timesDiff = {
    mtime: vinylStat.mtime,
    atime: atime,
  };

  return timesDiff;
}

function getOwnerDiff(fsStat, vinylStat) {
  if (!isValidUnixId(vinylStat.uid) && !isValidUnixId(vinylStat.gid)) {
    return;
  }

  if (
    (!isValidUnixId(fsStat.uid) && !isValidUnixId(vinylStat.uid)) ||
    (!isValidUnixId(fsStat.gid) && !isValidUnixId(vinylStat.gid))
  ) {
    return;
  }

  var uid = fsStat.uid; // Default to current uid.
  if (isValidUnixId(vinylStat.uid)) {
    uid = vinylStat.uid;
  }

  var gid = fsStat.gid; // Default to current gid.
  if (isValidUnixId(vinylStat.gid)) {
    gid = vinylStat.gid;
  }

  if (uid === fsStat.uid && gid === fsStat.gid) {
    return;
  }

  var ownerDiff = {
    uid: uid,
    gid: gid,
  };

  return ownerDiff;
}

function isOwner(fsStat) {
  var hasGetuid = typeof process.getuid === 'function';
  var hasGeteuid = typeof process.geteuid === 'function';

  // If we don't have either, assume we don't have permissions.
  // This should only happen on Windows.
  // Windows basically noops fchmod and errors on futimes called on directories.
  if (!hasGeteuid && !hasGetuid) {
    return false;
  }

  var uid;
  if (hasGeteuid) {
    uid = process.geteuid();
  } else {
    uid = process.getuid();
  }

  if (fsStat.uid !== uid && uid !== 0) {
    return false;
  }

  return true;
}

// Node 10 on Windows fails with EPERM if you stat a symlink to a directory so we recursively readlink before we reflect stats
// TODO: Remove this indirection when we drop Node 10 support
function findSymlinkHardpath(path, callback) {
  fs.readlink(path, onReadlink);

  function onReadlink(readlinkErr, resolvedPath) {
    if (readlinkErr) {
      return callback(readlinkErr);
    }

    fs.lstat(resolvedPath, onLstat);

    function onLstat(lstatErr, stat) {
      if (lstatErr) {
        return callback(lstatErr);
      }

      if (stat.isSymbolicLink()) {
        return findSymlinkHardpath(resolvedPath, callback);
      }

      callback(null, resolvedPath);
    }
  }
}

function reflectStat(path, file, callback) {
  // Set file.stat to the reflect current state on disk
  fs.stat(path, onStat);

  function onStat(statErr, stat) {
    if (statErr) {
      return callback(statErr);
    }

    file.stat = stat;
    callback();
  }
}

function reflectLinkStat(path, file, callback) {
  // Set file.stat to the reflect current state on disk
  fs.lstat(path, onLstat);

  function onLstat(lstatErr, stat) {
    if (lstatErr) {
      return callback(lstatErr);
    }

    file.stat = stat;
    callback();
  }
}

function updateMetadata(fd, file, callback) {
  fs.fstat(fd, onStat);

  function onStat(statErr, stat) {
    if (statErr) {
      return callback(statErr);
    }

    // Check if mode needs to be updated
    var modeDiff = getModeDiff(stat.mode, file.stat.mode);

    // Check if atime/mtime need to be updated
    var timesDiff = getTimesDiff(stat, file.stat);

    // Check if uid/gid need to be updated
    var ownerDiff = getOwnerDiff(stat, file.stat);

    // Set file.stat to the reflect current state on disk
    Object.assign(file.stat, stat);

    // Nothing to do
    if (!modeDiff && !timesDiff && !ownerDiff) {
      return callback();
    }

    // Check access, `futimes`, `fchmod` & `fchown` only work if we own
    // the file, or if we are effectively root (`fchown` only when root).
    if (!isOwner(stat)) {
      return callback();
    }

    if (modeDiff) {
      return mode();
    }
    if (timesDiff) {
      return times();
    }
    owner();

    function mode() {
      var mode = stat.mode ^ modeDiff;

      fs.fchmod(fd, mode, onFchmod);

      function onFchmod(fchmodErr) {
        if (!fchmodErr) {
          file.stat.mode = mode;
        }
        if (timesDiff) {
          return times(fchmodErr);
        }
        if (ownerDiff) {
          return owner(fchmodErr);
        }
        callback(fchmodErr);
      }
    }

    function times(propagatedErr) {
      fs.futimes(fd, timesDiff.atime, timesDiff.mtime, onFutimes);

      function onFutimes(futimesErr) {
        if (!futimesErr) {
          file.stat.atime = timesDiff.atime;
          file.stat.mtime = timesDiff.mtime;
        }
        // If a filesystem doesn't implement futimes, we don't callback with the error.
        // Instead we update the stats to match filesystem and clear the error.
        if (futimesErr && futimesErr.code === 'ENOSYS') {
          file.stat.atime = stat.atime;
          file.stat.mtime = stat.mtime;
          futimesErr = null;
        }
        if (ownerDiff) {
          return owner(propagatedErr || futimesErr);
        }
        callback(propagatedErr || futimesErr);
      }
    }

    function owner(propagatedErr) {
      fs.fchown(fd, ownerDiff.uid, ownerDiff.gid, onFchown);

      function onFchown(fchownErr) {
        if (!fchownErr) {
          file.stat.uid = ownerDiff.uid;
          file.stat.gid = ownerDiff.gid;
        }
        callback(propagatedErr || fchownErr);
      }
    }
  }
}

function symlink(srcPath, destPath, opts, callback) {
  // Because fs.symlink does not allow atomic overwrite option with flags, we
  // delete and recreate if the link already exists and overwrite is true.
  if (opts.flags === 'w') {
    // TODO What happens when we call unlink with windows junctions?
    fs.unlink(destPath, onUnlink);
  } else {
    fs.symlink(srcPath, destPath, opts.type, onSymlink);
  }

  function onUnlink(unlinkErr) {
    if (isFatalUnlinkError(unlinkErr)) {
      return callback(unlinkErr);
    }
    fs.symlink(srcPath, destPath, opts.type, onSymlink);
  }

  function onSymlink(symlinkErr) {
    if (isFatalOverwriteError(symlinkErr, opts.flags)) {
      return callback(symlinkErr);
    }
    callback();
  }
}

/*
  Custom writeFile implementation because we need access to the
  file descriptor after the write is complete.
  Most of the implementation taken from node core.
 */
function writeFile(filepath, data, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  if (!Buffer.isBuffer(data)) {
    return callback(new TypeError('Data must be a Buffer'));
  }

  if (!options) {
    options = {};
  }

  // Default the same as node
  var mode = options.mode || constants.DEFAULT_FILE_MODE;
  var flags = options.flags || 'w';
  var position = APPEND_MODE_REGEXP.test(flags) ? null : 0;

  fs.open(filepath, flags, mode, onOpen);

  function onOpen(openErr, fd) {
    if (openErr) {
      return onComplete(openErr);
    }

    fs.write(fd, data, 0, data.length, position, onComplete);

    function onComplete(writeErr) {
      callback(writeErr, fd);
    }
  }
}

function noopFlush(fd, cb) {
  cb();
}

function createWriteStream(path, options, flush) {
  if (typeof options === 'function') {
    flush = options;
    options = null;
  }

  options = options || {};
  flush = flush || noopFlush;

  var mode = options.mode || constants.DEFAULT_FILE_MODE;
  var flags = options.flags || 'w';

  var fd = null;

  return new Writable({
    mapWritable: function (data) {
      if (typeof data === 'string') {
        return Buffer.from(data);
      } else {
        return data;
      }
    },
    open: function (cb) {
      fs.open(path, flags, mode, onOpen);

      function onOpen(openErr, openedFd) {
        if (openErr) {
          cb(openErr);
          return;
        }

        fd = openedFd;
        cb();
      }
    },
    destroy: function (cb) {
      if (fd) {
        fs.close(fd, onClose);
      } else {
        onClose();
      }

      function onClose(closeErr) {
        fd = null;
        cb(closeErr);
      }
    },
    write: function (data, cb) {
      fs.write(fd, data, 0, data.length, null, onWrite);

      function onWrite(writeErr) {
        if (writeErr) {
          cb(writeErr);
          return;
        }

        cb();
      }
    },
    final: function (cb) {
      flush(fd, cb);
    },
  });
}

module.exports = {
  closeFd: closeFd,
  isValidUnixId: isValidUnixId,
  getFlags: getFlags,
  isFatalOverwriteError: isFatalOverwriteError,
  isFatalUnlinkError: isFatalUnlinkError,
  getModeDiff: getModeDiff,
  getTimesDiff: getTimesDiff,
  getOwnerDiff: getOwnerDiff,
  isOwner: isOwner,
  findSymlinkHardpath: findSymlinkHardpath,
  reflectStat: reflectStat,
  reflectLinkStat: reflectLinkStat,
  updateMetadata: updateMetadata,
  symlink: symlink,
  writeFile: writeFile,
  createWriteStream: createWriteStream,
};
