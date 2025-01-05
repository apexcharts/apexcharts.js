'use strict';

var Transform = require('streamx').Transform;
var sourcemap = require('vinyl-sourcemap');

function sourcemapStream(optResolver) {
  function addSourcemap(file, callback) {
    var srcMap = optResolver.resolve('sourcemaps', file);

    if (!srcMap) {
      return callback(null, file);
    }

    sourcemap.add(file, onAdd);

    function onAdd(sourcemapErr, updatedFile) {
      if (sourcemapErr) {
        return callback(sourcemapErr);
      }

      callback(null, updatedFile);
    }
  }

  return new Transform({
    transform: addSourcemap,
  });
}

module.exports = sourcemapStream;
