'use strict';

var fs = require('fs');
var path = require('path');
var EventEmitter = require('events');

var fastq = require('fastq');
var anymatch = require('anymatch');
var Readable = require('streamx').Readable;
var isGlob = require('is-glob');
var globParent = require('glob-parent');
var normalizePath = require('normalize-path');
var isNegatedGlob = require('is-negated-glob');
var toAbsoluteGlob = require('@gulpjs/to-absolute-glob');

var globErrMessage1 = 'File not found with singular glob: ';
var globErrMessage2 = ' (if this was purposeful, use `allowEmpty` option)';

function isFound(glob) {
  // All globs are "found", while singular globs are only found when matched successfully
  // This is due to the fact that a glob can match any number of files (0..Infinity) but
  // a signular glob is always expected to match
  return isGlob(glob);
}

function walkdir() {
  var readdirOpts = {
    withFileTypes: true,
  };

  var ee = new EventEmitter();

  var queue = fastq(onAction, 1);
  queue.drain = function () {
    ee.emit('end');
  };
  queue.error(onError);

  function onError(err) {
    if (err) {
      ee.emit('error', err);
    }
  }

  ee.pause = function () {
    queue.pause();
  };
  ee.resume = function () {
    queue.resume();
  };
  ee.end = function () {
    queue.kill();
  };
  ee.walk = walk;
  ee.exists = exists;
  ee.resolve = resolve;

  function walk(path) {
    queue.push({ action: 'walk', path: path });
  }

  function exists(path) {
    queue.push({ action: 'exists', path: path });
  }

  function resolve(path) {
    queue.push({ action: 'resolve', path: path });
  }

  function resolveSymlink(symlinkPath, cb) {
    fs.realpath(symlinkPath, function (err, realpath) {
      if (err) {
        return cb(err);
      }

      fs.lstat(realpath, function (err, stat) {
        if (err) {
          return cb(err);
        }

        if (stat.isDirectory() && !symlinkPath.startsWith(realpath + path.sep)) {
          walk(symlinkPath);
        }

        cb();
      })
    });
  }

  function onAction(data, cb) {
    if (data.action === 'walk') {
      return fs.readdir(data.path, readdirOpts, onReaddir);
    }

    if (data.action === 'exists') {
      return fs.stat(data.path, onStat);
    }

    if (data.action === 'resolve') {
      return resolveSymlink(data.path, cb);
    }

    function onStat(err, stat) {
      if (err) {
        // Ignore errors but also don't emit the path
        return cb();
      }

      // `stat` has `isDirectory()` which is what we use from Dirent
      ee.emit('path', data.path, stat);

      cb();
    }

    function onReaddir(err, dirents) {
      if (err) {
        return cb(err);
      }

      dirents.forEach(processDirent);

      cb();
    }

    function processDirent(dirent) {
      var nextpath = path.join(data.path, dirent.name);
      ee.emit('path', nextpath, dirent);

      if (dirent.isDirectory()) {
        return walk(nextpath);
      }

      if (dirent.isSymbolicLink()) {
        return resolve(nextpath);
      }
    }
  }

  return ee;
}

function validateGlobs(globs) {
  var hasPositiveGlob = false;

  globs.forEach(validateGlobs);

  function validateGlobs(globString, index) {
    if (typeof globString !== 'string') {
      throw new Error('Invalid glob at index ' + index);
    }

    var result = isNegatedGlob(globString);
    if (result.negated === false) {
      hasPositiveGlob = true;
    }
  }

  if (hasPositiveGlob === false) {
    throw new Error('Missing positive glob');
  }
}

function isPositiveGlob(glob) {
  return !isNegatedGlob(glob).negated;
}

function validateOptions(opts) {
  if (typeof opts.cwd !== 'string') {
    throw new Error('The `cwd` option must be a string');
  }

  if (typeof opts.dot !== 'boolean') {
    throw new Error('The `dot` option must be a boolean');
  }

  if (typeof opts.cwdbase !== 'boolean') {
    throw new Error('The `cwdbase` option must be a boolean');
  }

  if (
    typeof opts.uniqueBy !== 'string' &&
    typeof opts.uniqueBy !== 'function'
  ) {
    throw new Error('The `uniqueBy` option must be a string or function');
  }

  if (typeof opts.allowEmpty !== 'boolean') {
    throw new Error('The `allowEmpty` option must be a boolean');
  }

  if (opts.base && typeof opts.base !== 'string') {
    throw new Error('The `base` option must be a string if specified');
  }

  if (!Array.isArray(opts.ignore)) {
    throw new Error('The `ignore` option must be a string or array');
  }
}

function uniqueBy(comparator) {
  var seen = new Set();

  if (typeof comparator === 'string') {
    return isUniqueByKey;
  } else {
    return isUniqueByFunc;
  }

  function isUnique(value) {
    if (seen.has(value)) {
      return false;
    } else {
      seen.add(value);
      return true;
    }
  }

  function isUniqueByKey(obj) {
    return isUnique(obj[comparator]);
  }

  function isUniqueByFunc(obj) {
    return isUnique(comparator(obj));
  }
}

function globStream(globs, opt) {
  if (!Array.isArray(globs)) {
    globs = [globs];
  }

  validateGlobs(globs);

  var ourOpt = Object.assign(
    {},
    {
      cwd: process.cwd(),
      dot: false,
      cwdbase: false,
      uniqueBy: 'path',
      allowEmpty: false,
      ignore: [],
    },
    opt
  );
  // Normalize `ignore` to array
  ourOpt.ignore =
    typeof ourOpt.ignore === 'string' ? [ourOpt.ignore] : ourOpt.ignore;

  validateOptions(ourOpt);

  ourOpt.cwd = normalizePath(path.resolve(ourOpt.cwd), true);

  var base = ourOpt.base;
  if (ourOpt.cwdbase) {
    base = ourOpt.cwd;
  }

  var walker = walkdir();

  var stream = new Readable({
    highWaterMark: ourOpt.highWaterMark,
    read: read,
    predestroy: predestroy,
  });

  // Remove path relativity to make globs make sense
  var ourGlobs = globs.map(resolveGlob);
  ourOpt.ignore = ourOpt.ignore.map(resolveGlob);

  var found = ourGlobs.map(isFound);

  var matcher = anymatch(ourGlobs, null, ourOpt);

  var isUnique = uniqueBy(ourOpt.uniqueBy);

  walker.on('path', onPath);
  walker.once('end', onEnd);
  walker.once('error', onError);
  ourGlobs.forEach(function (glob) {
    if (isGlob(glob)) {
      // We only want to walk the glob-parent directories of any positive glob
      // to reduce the amount of files have to check.
      if (isPositiveGlob(glob)) {
        var base = globParent(glob);
        walker.walk(base);
      }
    } else {
      // If the strig is not a glob, we just check for the existence of it.
      walker.exists(glob);
    }
  });

  function read(cb) {
    walker.resume();
    cb();
  }

  function predestroy() {
    walker.end();
  }

  function resolveGlob(glob) {
    return toAbsoluteGlob(glob, ourOpt);
  }

  function onPath(filepath, dirent) {
    var matchIdx = matcher(filepath, true);
    // If the matcher doesn't match (but it is a directory),
    // we want to add a trailing separator to check the match again
    if (matchIdx === -1 && dirent.isDirectory()) {
      matchIdx = matcher(filepath + path.sep, true);
    }
    if (matchIdx !== -1) {
      found[matchIdx] = true;

      // Extract base path from glob
      var basePath = base || globParent(ourGlobs[matchIdx]);

      var obj = {
        cwd: ourOpt.cwd,
        base: basePath,
        // We always want to normalize the path to posix-style slashes
        path: normalizePath(filepath, true),
      };

      var unique = isUnique(obj);
      if (unique) {
        var drained = stream.push(obj);
        if (!drained) {
          walker.pause();
        }
      }
    }
  }

  function onEnd() {
    var destroyed = false;

    found.forEach(function (matchFound, idx) {
      if (ourOpt.allowEmpty !== true && !matchFound) {
        destroyed = true;
        var err = new Error(globErrMessage1 + ourGlobs[idx] + globErrMessage2);

        return stream.destroy(err);
      }
    });

    if (destroyed === false) {
      stream.push(null);
    }
  }

  function onError(err) {
    stream.destroy(err);
  }

  return stream;
}

module.exports = globStream;
