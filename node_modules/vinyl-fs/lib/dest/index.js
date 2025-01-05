'use strict';

var lead = require('lead');
var composer = require('stream-composer');
var mkdirpStream = require('fs-mkdirp-stream');
var createResolver = require('resolve-options');

var config = require('./options');
var prepare = require('./prepare');
var sourcemap = require('./sourcemap');
var writeContents = require('./write-contents');

var folderConfig = {
  outFolder: {
    type: 'string',
  },
};

function dest(outFolder, opt) {
  if (!outFolder) {
    throw new Error(
      'Invalid dest() folder argument.' +
        ' Please specify a non-empty string or a function.'
    );
  }

  var optResolver = createResolver(config, opt);
  var folderResolver = createResolver(folderConfig, { outFolder: outFolder });

  function dirpath(file, callback) {
    var dirMode = optResolver.resolve('dirMode', file);

    callback(null, file.dirname, dirMode);
  }

  var saveStream = composer.pipeline(
    prepare(folderResolver, optResolver),
    sourcemap(optResolver),
    mkdirpStream(dirpath),
    writeContents(optResolver)
  );

  // Sink the output stream to start flowing
  return lead(saveStream);
}

module.exports = dest;
