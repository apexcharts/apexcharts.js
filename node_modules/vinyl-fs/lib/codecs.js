'use strict';

/* eslint-disable new-cap */

var iconv = require('iconv-lite');
// TODO: Reaching into iconv-lite is fragile
var StripBOM = require('iconv-lite/lib/bom-handling').StripBOM;
var Transform = require('streamx').Transform;

var DEFAULT_ENCODING = require('./constants').DEFAULT_ENCODING;

function Codec(codec, encoding) {
  this.codec = codec;
  this.enc = codec.enc || encoding;
  this.bomAware = codec.bomAware || false;
}

function getEncoder(codec) {
  return new codec.encoder(null, codec);
}

Codec.prototype.encode = function (str) {
  var encoder = getEncoder(this.codec);
  var buf = encoder.write(str);
  var end = encoder.end();
  return end && end.length > 0 ? Buffer.concat(buf, end) : buf;
};

Codec.prototype.encodeStream = function () {
  var encoder = getEncoder(this.codec);
  return new Transform({
    transform: function (str, cb) {
      var buf = encoder.write(str);
      if (buf && buf.length) {
        this.push(buf);
      }
      cb();
    },
    flush: function (cb) {
      var buf = encoder.end();
      if (buf && buf.length) {
        this.push(buf);
      }
      cb();
    },
  });
};

function getDecoder(codec) {
  return new codec.decoder(null, codec);
}

Codec.prototype.decode = function (buf, options) {
  var decoder = getDecoder(this.codec);
  if (options && options.removeBOM) {
    decoder = new StripBOM(decoder);
  }
  var str = decoder.write(buf);
  var end = decoder.end();
  return end ? str + end : str;
};

Codec.prototype.decodeStream = function (options) {
  var decoder = getDecoder(this.codec);
  if (options && options.removeBOM) {
    decoder = new StripBOM(decoder);
  }
  return new Transform({
    transform: function (buf, cb) {
      var str = decoder.write(buf);
      if (str && str.length) {
        this.push(str);
      }
      cb();
    },
    flush: function (cb) {
      var str = decoder.end();
      if (str && str.length) {
        this.push(str);
      }
      cb();
    },
  });
};

var cache = {};

function getCodec(encoding) {
  var codec = cache[encoding];
  if (!!codec || !encoding || Object.hasOwnProperty.call(cache, encoding)) {
    return codec;
  }

  try {
    codec = new Codec(iconv.getCodec(encoding), encoding);
  } catch (err) {
    // Unsupported codec
  }

  cache[encoding] = codec;
  return codec;
}

// Pre-load default encoding
getCodec(DEFAULT_ENCODING);

module.exports = getCodec;
