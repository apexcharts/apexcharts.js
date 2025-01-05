/*!
 * cwd <https://github.com/jonschlinkert/cwd>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

var path = require('path');
var findPkg = require('find-pkg');
var exists = require('fs-exists-sync');

/**
 * Cache lookups to prevent hitting the file system
 * more than once for the same path.
 */

var cache = {};

/**
 * Uses [find-pkg][] to resolve the absolute path to the root/working directory of a project.
 *
 * @param {String|Array} `filepath` The starting filepath. Can be a string, or path parts as a list of arguments or array.
 * @return {String} Resolve filepath.
 * @api public
 */

module.exports = function(filename) {
  var filepath = path.resolve(filename || '');

  if (arguments.length > 1) {
    filepath = path.resolve.apply(path, arguments);
  }

  if (cache.hasOwnProperty(filepath)) {
    return cache[filepath];
  }

  if (path.basename(filepath) === 'package.json' && exists(filepath)) {
    cache[filepath] = filepath;
    return filepath;
  }

  var pkgPath = findPkg.sync(filepath);
  if (pkgPath) {
    return (cache[filepath] = path.resolve(path.dirname(pkgPath), filepath));
  }

  if (exists(filepath)) {
    return (cache[filepath] = filepath);
  }
};
