'use strict';

var copyProps = require('copy-props');

var fromConfigToCliOpts = {
  'flags.silent': 'silent',
  'flags.continue': 'continue',
  'flags.series': 'series',
  'flags.logLevel': 'logLevel',
  'flags.compactTasks': 'compactTasks',
  'flags.tasksDepth': 'tasksDepth',
  'flags.sortTasks': 'sortTasks',
};

function mergeCliOpts(opts, config) {
  opts = copyProps(opts, {});
  return copyProps(config, opts, fromConfigToCliOpts, defaults);
}

function defaults(cfgInfo, optInfo) {
  if (optInfo.value === undefined) {
    return cfgInfo.value;
  }
}

module.exports = mergeCliOpts;
