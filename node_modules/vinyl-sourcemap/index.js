'use strict';

var File = require('vinyl');
var vinylContents = require('vinyl-contents');

var helpers = require('./lib/helpers');

var PLUGIN_NAME = 'vinyl-sourcemap';

function add(file, callback) {
  // Bail early an error if the file argument is not a Vinyl file
  if (!File.isVinyl(file)) {
    return callback(new Error(PLUGIN_NAME + '-add: Not a vinyl file'));
  }

  // Bail early successfully if file is null or already has a sourcemap
  if (file.isNull() || file.sourceMap) {
    return callback(null, file);
  }

  vinylContents(file, onContents);

  function onContents(err, contents) {
    if (err) {
      return callback(err);
    }

    var state = {
      path: '', // Root path for the sources in the map
      map: null,
      content: contents.toString(),
      // TODO: handle this?
      preExistingComment: null,
    };

    helpers.addSourceMaps(file, state, callback);
  }
}

function write(file, destPath, callback) {
  // Check if options or a callback are passed as second argument
  if (typeof destPath === 'function') {
    callback = destPath;
    destPath = undefined;
  }

  // Bail early with an error if the file argument is not a Vinyl file
  if (!File.isVinyl(file)) {
    return callback(new Error(PLUGIN_NAME + '-write: Not a vinyl file'));
  }

  // Bail early successfully if file is null or doesn't have sourcemap
  if (file.isNull() || !file.sourceMap) {
    return callback(null, file);
  }

  helpers.writeSourceMaps(file, destPath, callback);
}

module.exports = {
  add: add,
  write: write,
};
