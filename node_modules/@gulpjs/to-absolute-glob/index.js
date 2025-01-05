'use strict';

var path = require('path');
var isNegated = require('is-negated-glob');

module.exports = function (glob, options) {
  // default options
  var opts = options || {};

  // ensure cwd is absolute
  var cwd = unescape(opts.cwd ? opts.cwd : process.cwd());
  cwd = path.resolve(cwd);
  cwd = unixify(cwd);
  cwd = escape(cwd);

  var rootDir = opts.root;
  // if `options.root` is defined, ensure it's absolute
  if (rootDir) {
    rootDir = unescape(rootDir);
    rootDir = unixify(rootDir);
    if (process.platform === 'win32' || !path.isAbsolute(rootDir)) {
      rootDir = unixify(path.resolve(rootDir));
    }
    rootDir = escape(rootDir);
  }

  // store last character before glob is modified
  var suffix = glob.slice(-1);

  // check to see if glob is negated (and not a leading negated-extglob)
  var ing = isNegated(glob);
  glob = ing.pattern;

  // trim starting ./ from glob patterns
  if (glob.slice(0, 2) === './') {
    glob = glob.slice(2);
  }

  // when the glob pattern is only a . use an empty string
  if (glob.length === 1 && glob === '.') {
    glob = '';
  }

  // make glob absolute
  if (rootDir && glob.charAt(0) === '/') {
    glob = join(rootDir, glob);
  } else if (!path.isAbsolute(glob) || glob.slice(0, 1) === '\\') {
    glob = join(cwd, glob);
  }

  // if glob had a trailing `/`, re-add it now in case it was removed
  if (suffix === '/' && glob.slice(-1) !== '/') {
    glob += '/';
  }

  // re-add leading `!` if it was removed
  return ing.negated ? '!' + glob : glob;
};

function escape(path) {
  return path.replace(/([({[\]})*?!])/g, '\\$1');
}

function unescape(path) {
  return path.replace(/\\([({[\]})*?!])/g, '$1');
}

// Before calling unixify, we remove the escapes and then
// we add them back afterwards to avoid double-escaping
function unixify(filepath) {
  return filepath.replace(/\\/g, '/');
}

function join(dir, glob) {
  if (dir.charAt(dir.length - 1) === '/') {
    dir = dir.slice(0, -1);
  }
  if (glob.charAt(0) === '/') {
    glob = glob.slice(1);
  }
  if (!glob) return dir;

  // Resolve `../` segements in the  glob
  while (glob.slice(0, 3) === '../') {
    dir = dir.slice(0, dir.lastIndexOf('/'));
    glob = glob.slice(3);
  }

  return dir + '/' + glob;
}
