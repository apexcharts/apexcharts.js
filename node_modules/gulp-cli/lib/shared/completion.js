'use strict';

var fs = require('fs');
var path = require('path');

var messages = require('@gulpjs/messages');

module.exports = function(name, translate) {
  if (typeof name !== 'string') {
    throw new Error(translate.message({ tag: messages.COMPLETION_TYPE_MISSING }));
  }
  var file = path.join(__dirname, '../../completion', name);
  try {
    console.log(fs.readFileSync(file, 'utf8'));
    process.exit(0);
  } catch (err) {
    console.log(translate.message({ tag: messages.COMPLETION_TYPE_UNKNOWN, name: name }));
    process.exit(5);
  }
};
