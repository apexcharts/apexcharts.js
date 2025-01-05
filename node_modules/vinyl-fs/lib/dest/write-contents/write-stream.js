'use strict';

var pipeline = require('streamx').pipeline;

var fo = require('../../file-operations');
var getCodec = require('../../codecs');
var DEFAULT_ENCODING = require('../../constants').DEFAULT_ENCODING;
var readStream = require('../../src/read-contents/read-stream');

function writeStream(file, optResolver, onWritten) {
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
    // TODO: need to test this
    flags: flags,
  };

  // TODO: is this the best API?
  var outStream = fo.createWriteStream(file.path, opt, onFlush);

  // TODO: should this use a clone?
  var streams = [file.contents];

  if (encoding && encoding.enc !== DEFAULT_ENCODING) {
    streams.push(getCodec(DEFAULT_ENCODING).decodeStream());
    streams.push(codec.encodeStream());
  }

  streams.push(outStream);

  pipeline(streams, onWritten);

  // Cleanup
  function onFlush(fd, callback) {
    // TODO: this is doing sync stuff & the callback seems unnecessary
    readStream(file, { resolve: resolve }, complete);

    function resolve(key) {
      if (key === 'encoding') {
        return encoding;
      }
      if (key === 'removeBOM') {
        return false;
      }
      throw new Error("Eek! stub resolver doesn't have " + key);
    }

    function complete() {
      if (typeof fd !== 'number') {
        return callback();
      }

      fo.updateMetadata(fd, file, callback);
    }
  }
}

module.exports = writeStream;
