'use strict';

var Transform = require('streamx').Transform;
var sourcemap = require('vinyl-sourcemap');

function sourcemapStream(optResolver) {
  function saveSourcemap(file, callback) {
    var self = this;

    var srcMap = optResolver.resolve('sourcemaps', file);

    if (!srcMap) {
      return callback(null, file);
    }

    var srcMapLocation = typeof srcMap === 'string' ? srcMap : undefined;

    sourcemap.write(file, srcMapLocation, onWrite);

    function onWrite(sourcemapErr, updatedFile, sourcemapFile) {
      if (sourcemapErr) {
        return callback(sourcemapErr);
      }

      self.push(updatedFile);
      if (sourcemapFile) {
        self.push(sourcemapFile);
      }

      callback();
    }
  }

  return new Transform({
    transform: saveSourcemap,
  });
}

module.exports = sourcemapStream;
