'use strict';

var lead = require('lead');
var composer = require('stream-composer');
var mkdirpStream = require('fs-mkdirp-stream');
var createResolver = require('resolve-options');

var config = require('./options');
var prepare = require('./prepare');
var linkFile = require('./link-file');

var folderConfig = {
  outFolder: {
    type: 'string',
  },
};

function symlink(outFolder, opt) {
  if (!outFolder) {
    throw new Error(
      'Invalid symlink() folder argument.' +
        ' Please specify a non-empty string or a function.'
    );
  }

  var optResolver = createResolver(config, opt);
  var folderResolver = createResolver(folderConfig, { outFolder: outFolder });

  function dirpath(file, callback) {
    var dirMode = optResolver.resolve('dirMode', file);

    callback(null, file.dirname, dirMode);
  }

  var stream = composer.pipeline(
    prepare(folderResolver, optResolver),
    mkdirpStream(dirpath),
    linkFile(optResolver)
  );

  // Sink the stream to start flowing
  return lead(stream);
}

module.exports = symlink;
