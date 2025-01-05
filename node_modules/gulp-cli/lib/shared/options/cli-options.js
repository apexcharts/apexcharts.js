'use strict';

var messages = require('@gulpjs/messages');

var options = {
  help: {
    alias: 'h',
    type: 'boolean',
    tag: messages.FLAG_HELP,
  },
  version: {
    alias: 'v',
    type: 'boolean',
    tag: messages.FLAG_VERSION,
  },
  preload: {
    type: 'string',
    requiresArg: true,
    tag: messages.FLAG_PRELOAD,
  },
  gulpfile: {
    alias: 'f',
    type: 'string',
    requiresArg: true,
    tag: messages.FLAG_GULPFILE,
  },
  cwd: {
    type: 'string',
    requiresArg: true,
    tag: messages.FLAG_CWD,
  },
  tasks: {
    alias: 'T',
    type: 'boolean',
    tag: messages.FLAG_TASKS,
  },
  'tasks-simple': {
    type: 'boolean',
    tag: messages.FLAG_TASKS_SIMPLE,
  },
  'tasks-json': {
    tag: messages.FLAG_TASKS_JSON,
  },
  'tasks-depth': {
    alias: 'depth',
    type: 'number',
    requiresArg: true,
    default: undefined,  // To detect if this cli option is specified.
    tag: messages.FLAG_TASKS_DEPTH,
  },
  'compact-tasks': {
    type: 'boolean',
    default: undefined,  // To detect if this cli option is specified.
    tag: messages.FLAG_COMPACT_TASKS,
  },
  'sort-tasks': {
    type: 'boolean',
    default: undefined,  // To detect if this cli option is specified.
    tag: messages.FLAG_SORT_TASKS,
  },
  color: {
    type: 'boolean',
    tag: messages.FLAG_COLOR,
  },
  'no-color': {
    type: 'boolean',
    tag: messages.FLAG_NO_COLOR,
  },
  silent: {
    alias: 'S',
    type: 'boolean',
    default: undefined,  // To detect if this cli option is specified.
    tag: messages.FLAG_SILENT,
  },
  continue: {
    type: 'boolean',
    default: undefined,  // To detect if this cli option is specified.
    tag: messages.FLAG_CONTINUE,
  },
  series: {
    type: 'boolean',
    default: undefined,  // To detect if this cli option is specified.
    tag: messages.FLAG_SERIES,
  },
  'log-level': {
    alias: 'L',
    // Type isn't needed because count acts as a boolean
    count: true,
    default: undefined,  // To detect if this cli option is specified.
    tag: messages.FLAG_LOG_LEVEL,
  }
};

module.exports = options;
