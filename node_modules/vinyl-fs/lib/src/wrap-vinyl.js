'use strict';

var File = require('vinyl');
var Transform = require('streamx').Transform;

function wrapVinyl() {
  function wrapFile(globFile, callback) {
    var file = new File(globFile);

    callback(null, file);
  }

  return new Transform({
    transform: wrapFile,
  });
}

module.exports = wrapVinyl;
