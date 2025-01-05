// Copyright IBM Corp. 2014,2018. All Rights Reserved.
// Node module: strong-log-transformer
// This file is licensed under the Apache License 2.0.
// License text available at https://opensource.org/licenses/Apache-2.0

'use strict';

var minimist = require('minimist');
var path = require('path');

var Logger = require('./logger');
var pkg = require('../package.json');

module.exports = cli;

function cli(args) {
  var opts = minimist(args.slice(2));
  var $0 = path.basename(args[1]);
  var p = console.log.bind(console);
  if (opts.v || opts.version) {
    version($0, p);
  } else if (opts.h || opts.help) {
    usage($0, p);
  } else if (args.length < 3) {
    process.stdin.pipe(Logger()).pipe(process.stdout);
  } else {
    process.stdin.pipe(Logger(opts)).pipe(process.stdout);
  }
}

function version($0, p) {
  p('%s v%s', pkg.name, pkg.version);
}

function usage($0, p) {
  var PADDING = '               ';
  var opt, def;
  p('Usage: %s [options]', $0);
  p('');
  p('%s', pkg.description);
  p('');
  p('OPTIONS:');
  for (opt in Logger.DEFAULTS) {
    def = Logger.DEFAULTS[opt];
    if (typeof def === 'boolean')
      boolOpt(opt, Logger.DEFAULTS[opt]);
    else
      stdOpt(opt, Logger.DEFAULTS[opt]);
  }
  p('');

  function boolOpt(name, def) {
    name = name + PADDING.slice(0, 20-name.length);
    p('   --%s default: %s', name, def);
  }

  function stdOpt(name, def) {
    var value = name.toUpperCase() +
                PADDING.slice(0, 19 - name.length*2);
    p('   --%s %s default: %j', name, value, def);
  }
}
