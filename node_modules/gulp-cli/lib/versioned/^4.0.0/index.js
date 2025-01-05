'use strict';

var fs = require('fs');

var log = require('gulplog');
var stdout = require('mute-stdout');
var messages = require('@gulpjs/messages');

var exit = require('../../shared/exit');

var logTasks = require('../../shared/log/tasks');
var logEvents = require('./log/events');
var logSyncTask = require('./log/sync-task');
var normalizeError = require('./normalize-error');
var logTasksSimple = require('./log/tasks-simple');
var registerExports = require('../../shared/register-exports');

var copyTree = require('../../shared/log/copy-tree');
var getTask = require('./log/get-task');
var requireOrImport = require('../../shared/require-or-import');

function execute(env, opts, translate) {
  var tasks = opts._;
  var toRun = tasks.length ? tasks : ['default'];

  if (opts.tasksSimple || opts.tasks || opts.tasksJson) {
    // Mute stdout if we are listing tasks
    stdout.mute();
  }

  var gulpInst = require(env.modulePath);
  logEvents(gulpInst);
  logSyncTask(gulpInst, opts);

  // This is what actually loads up the gulpfile
  requireOrImport(env.configPath, function(err, exported) {
    // Before import(), if require() failed we got an unhandled exception on the module level.
    // So console.error() & exit() were added here to mimic the old behavior as close as possible.
    if (err) {
      console.error(err);
      exit(1);
    }

    registerExports(gulpInst, exported);

    // Always unmute stdout after gulpfile is required
    stdout.unmute();

    var tree;
    if (opts.tasksSimple) {
      tree = gulpInst.tree();
      return logTasksSimple(tree.nodes);
    }
    if (opts.tasks) {
      tree = gulpInst.tree({ deep: true });
      tree.label = translate.message({ tag: messages.DESCRIPTION, path: env.configPath });

      return logTasks(tree, opts, getTask(gulpInst), translate);
    }
    if (opts.tasksJson) {
      tree = gulpInst.tree({ deep: true });
      tree.label = translate.message({ tag: messages.DESCRIPTION, path: env.configPath });

      var output = JSON.stringify(copyTree(tree, opts));

      if (typeof opts.tasksJson === 'boolean' && opts.tasksJson) {
        return console.log(output);
      }
      return fs.writeFileSync(opts.tasksJson, output, 'utf-8');
    }
    try {
      log.info({ tag: messages.GULPFILE, path: env.configPath });
      var runMethod = opts.series ? 'series' : 'parallel';
      gulpInst[runMethod](toRun)(function(err) {
        if (err) {
          exit(1);
        }
      });
    } catch (err) {
      normalizeError(err);
      if (err.task) {
        log.error({ tag: messages.TASK_MISSING, task: err.task, similar: err.similar });
      } else {
        log.error({ tag: messages.EXEC_ERROR, message: err.message, error: err });
      }
      exit(1);
    }
  });
}

module.exports = execute;
