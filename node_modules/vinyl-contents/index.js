'use strict';

var Vinyl = require('vinyl');
var bl = require('bl');

function vinylContents(file, cb) {
  if (!Vinyl.isVinyl(file)) {
    cb(new Error('Must be a Vinyl object'));
    return;
  }

  if (file.isBuffer()) {
    cb(null, file.contents);
    return;
  }

  if (file.isStream()) {
    var bufferList = bl(function (err, data) {
      if (err) {
        cb(err);
        return;
      }

      cb(null, data);
    });
    file.contents.pipe(bufferList);
    return;
  }

  cb();
}

module.exports = vinylContents;
