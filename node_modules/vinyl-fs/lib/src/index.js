'use strict';

var gs = require('glob-stream');
var pipeline = require('streamx').pipeline;
var toThrough = require('to-through');
var isValidGlob = require('is-valid-glob');
var normalizePath = require('normalize-path');
var createResolver = require('resolve-options');

var config = require('./options');
var prepare = require('./prepare');
var wrapVinyl = require('./wrap-vinyl');
var sourcemap = require('./sourcemap');
var readContents = require('./read-contents');
var resolveSymlinks = require('./resolve-symlinks');

function normalize(glob) {
  return normalizePath(glob, false);
}

function src(glob, opt) {
  var optResolver = createResolver(config, opt);

  if (!isValidGlob(glob)) {
    throw new Error('Invalid glob argument: ' + glob);
  }

  if (!Array.isArray(glob)) {
    glob = [glob];
  }

  glob = glob.map(normalize);

  var outputStream = pipeline(
    gs(glob, opt),
    wrapVinyl(optResolver),
    resolveSymlinks(optResolver),
    prepare(optResolver),
    readContents(optResolver),
    sourcemap(optResolver)
  );

  return toThrough(outputStream);
}

module.exports = src;
