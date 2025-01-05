'use strict';

var fs = require('graceful-fs');

var getCodec = require('../../codecs');
var DEFAULT_ENCODING = require('../../constants').DEFAULT_ENCODING;

function bufferFile(file, optResolver, onRead) {
  var encoding = optResolver.resolve('encoding', file);
  var codec = getCodec(encoding);
  if (encoding && !codec) {
    return onRead(new Error('Unsupported encoding: ' + encoding));
  }

  fs.readFile(file.path, onReadFile);

  function onReadFile(readErr, contents) {
    if (readErr) {
      return onRead(readErr);
    }

    if (encoding) {
      var removeBOM = codec.bomAware && optResolver.resolve('removeBOM', file);

      if (removeBOM || codec.enc !== DEFAULT_ENCODING) {
        contents = codec.decode(contents, { removeBOM: removeBOM });
        contents = getCodec(DEFAULT_ENCODING).encode(contents);
      }
    }

    file.contents = contents;

    onRead();
  }
}

module.exports = bufferFile;
