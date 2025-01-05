'use strict';

var cliOptions = require('./cli-options');

var messages = require('@gulpjs/messages');

function makeHelp(parser, translate) {
  var usage = translate.message({ tag: messages.USAGE });
  if (usage) {
    parser.usage(usage);
  }

  Object.keys(cliOptions).forEach(function (flag) {
    var opt = cliOptions[flag];
    var description = translate.message({ tag: opt.tag });
    if (description) {
      parser.describe(flag, description);
    }
  });

  return parser;
}

module.exports = makeHelp;
