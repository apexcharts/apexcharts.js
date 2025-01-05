'use strict';

var fo = require('../../file-operations');
var getCodec = require('../../codecs');
var DEFAULT_ENCODING = require('../../constants').DEFAULT_ENCODING;

function writeBuffer(file, optResolver, onWritten) {
  var flags = fo.getFlags({
    overwrite: optResolver.resolve('overwrite', file),
    append: optResolver.resolve('append', file),
  });

  var encoding = optResolver.resolve('encoding', file);
  var codec = getCodec(encoding);
  if (encoding && !codec) {
    return onWritten(new Error('Unsupported encoding: ' + encoding));
  }

  var opt = {
    mode: file.stat.mode,
    flags: flags,
  };

  var contents = file.contents;

  if (encoding && codec.enc !== DEFAULT_ENCODING) {
    contents = getCodec(DEFAULT_ENCODING).decode(contents);
    contents = codec.encode(contents);
  }

  fo.writeFile(file.path, contents, opt, onWriteFile);

  function onWriteFile(writeErr, fd) {
    if (writeErr) {
      return fo.closeFd(writeErr, fd, onWritten);
    }

    fo.updateMetadata(fd, file, onUpdate);

    function onUpdate(updateErr) {
      fo.closeFd(updateErr, fd, onWritten);
    }
  }
}

module.exports = writeBuffer;
