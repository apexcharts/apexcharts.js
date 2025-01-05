'use strict';

var fs = require('graceful-fs');
var Composer = require('stream-composer');

var getCodec = require('../../codecs');
var DEFAULT_ENCODING = require('../../constants').DEFAULT_ENCODING;

function streamFile(file, optResolver, onRead) {
  var encoding = optResolver.resolve('encoding', file);
  var codec = getCodec(encoding);
  if (encoding && !codec) {
    return onRead(new Error('Unsupported encoding: ' + encoding));
  }

  var filePath = file.path;

  file.contents = new Composer({
    open: function (cb) {
      var contents = fs.createReadStream(filePath);
      var streams = [contents];

      if (encoding) {
        var removeBOM =
          codec.bomAware && optResolver.resolve('removeBOM', file);

        if (removeBOM || codec.enc !== DEFAULT_ENCODING) {
          streams.push(codec.decodeStream({ removeBOM: removeBOM }));
          streams.push(getCodec(DEFAULT_ENCODING).encodeStream());
        }
      }

      if (streams.length > 1) {
        this.setPipeline(streams);
      } else {
        this.setReadable(contents);
      }

      cb();
    },
  });

  onRead();
}

module.exports = streamFile;
