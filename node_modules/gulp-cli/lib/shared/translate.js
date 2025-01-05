'use strict';

var util = require('util');

var chalk = require('chalk');
var messages = require('@gulpjs/messages');

var tildify = require('./tildify');
var formatTime = require('./log/format-hrtime');

function Timestamp() {
  this.now = new Date();
}

Timestamp.prototype[util.inspect.custom] = function (depth, opts) {
  var timestamp = this.now.toLocaleTimeString('en', { hour12: false });
  return '[' + opts.stylize(timestamp, 'date') + ']';
};

function getDefaultMessage(data) {
  switch (data.tag) {
    case messages.PRELOAD_BEFORE: {
      return 'Preloading external module: ' + chalk.magenta(data.name);
    }
    case messages.PRELOAD_SUCCESS: {
      return 'Preloaded external module: ' + chalk.magenta(data.name)
    }
    case messages.PRELOAD_FAILURE: {
      return chalk.yellow('Failed to preload external module: ') + chalk.magenta(data.name);
    }
    case messages.PRELOAD_ERROR: {
      return chalk.yellow(data.error.toString());
    }
    case messages.LOADER_SUCCESS: {
      return 'Loaded external module: ' + chalk.magenta(data.name);
    }
    case messages.LOADER_FAILURE: {
      return chalk.yellow('Failed to load external module: ') + chalk.magenta(data.name);
    }
    case messages.LOADER_ERROR: {
      return chalk.yellow(data.error.toString());
    }
    case messages.NODE_FLAGS: {
      var nodeFlags = chalk.magenta(data.flags.join(', '));
      return 'Node flags detected: ' + nodeFlags;
    }
    case messages.RESPAWNED: {
      var pid = chalk.magenta(data.pid);
      return 'Respawned to PID: ' + pid;
    }
    case messages.MISSING_GULPFILE: {
      return chalk.red('No gulpfile found');
    }
    case messages.CWD_CHANGED: {
      return 'Working directory changed to ' + chalk.magenta(tildify(data.cwd));
    }
    case messages.UNSUPPORTED_GULP_VERSION: {
      return chalk.red('Unsupported gulp version', data.version)
    }
    case messages.DESCRIPTION: {
      return 'Tasks for ' + chalk.magenta(tildify(data.path));
    }
    case messages.GULPFILE: {
      return 'Using gulpfile ' + chalk.magenta(tildify(data.path));
    }
    case messages.TASK_START: {
      return "Starting '" + chalk.cyan(data.task) + "'..."
    }
    case messages.TASK_STOP: {
      return "Finished '" + chalk.cyan(data.task) + "' after " + chalk.magenta(formatTime(data.duration));
    }
    case messages.TASK_FAILURE: {
      return "'" + chalk.cyan(data.task) + "' " + chalk.red('errored after') + ' ' + chalk.magenta(formatTime(data.duration));
    }
    case messages.TASK_MISSING: {
      if (data.similar) {
        return chalk.red('Task never defined: ' + data.task + ' - did you mean? ' + data.similar.join(', '))
          + '\nTo list available tasks, try running: gulp --tasks';
      } else {
        return chalk.red('Task never defined: ' + data.task) +
          '\nTo list available tasks, try running: gulp --tasks';
      }
    }
    case messages.TASK_SYNC: {
      return chalk.red('The following tasks did not complete: ') + chalk.cyan(data.tasks) + "\n"
        + chalk.red('Did you forget to signal async completion?');
    }
    case messages.MISSING_NODE_MODULES: {
      return chalk.red('Local modules not found in') + ' ' + chalk.magenta(tildify(data.cwd));
    }
    case messages.MISSING_GULP: {
      return chalk.red('Local gulp not found in') + ' ' + chalk.magenta(tildify(data.cwd));
    }
    case messages.YARN_INSTALL: {
      return chalk.red('Try running: yarn install');
    }
    case messages.NPM_INSTALL: {
      return chalk.red('Try running: npm install');
    }
    case messages.YARN_INSTALL_GULP: {
      return chalk.red('Try running: yarn add gulp');
    }
    case messages.NPM_INSTALL_GULP: {
      return chalk.red('Try running: npm install gulp');
    }
    case messages.GULPLOG_DEPRECATED: {
      return chalk.yellow("gulplog v1 is deprecated. Please help your plugins update!");
    }
    case messages.COMPLETION_TYPE_MISSING: {
      return 'Missing completion type';
    }
    case messages.COMPLETION_TYPE_UNKNOWN: {
      return 'echo "gulp autocompletion rules for' + " '" + data.name + "' " + 'not found"'
    }
    case messages.ARGV_ERROR: {
      return data.message;
    }
    case messages.EXEC_ERROR: {
      return data.message;
    }
    case messages.TASK_ERROR: {
      return data.message;
    }
    case messages.USAGE: {
      return '\n' + chalk.bold('Usage:') + ' gulp ' + chalk.blue('[options]') + ' tasks';
    }
    case messages.FLAG_HELP: {
      return chalk.gray('Show this help.');
    }
    case messages.FLAG_VERSION: {
      return chalk.gray('Print the global and local gulp versions.');
    }
    case messages.FLAG_PRELOAD: {
      return chalk.gray(
        'Will preload a module before running the gulpfile. ' +
        'This is useful for transpilers but also has other applications.'
      );
    }
    case messages.FLAG_GULPFILE: {
      return chalk.gray(
        'Manually set path of gulpfile. Useful if you have multiple gulpfiles. ' +
        'This will set the CWD to the gulpfile directory as well.'
      )
    }
    case messages.FLAG_CWD: {
      return chalk.gray(
        'Manually set the CWD. The search for the gulpfile, ' +
        'as well as the relativity of all requires will be from here.'
      );
    }
    case messages.FLAG_TASKS: {
      return chalk.gray('Print the task dependency tree for the loaded gulpfile.');
    }
    case messages.FLAG_TASKS_SIMPLE: {
      return chalk.gray('Print a plaintext list of tasks for the loaded gulpfile.');
    }
    case messages.FLAG_TASKS_JSON: {
      return chalk.gray(
        'Print the task dependency tree, ' +
        'in JSON format, for the loaded gulpfile.'
      );
    }
    case messages.FLAG_TASKS_DEPTH: {
      return chalk.gray('Specify the depth of the task dependency tree.');
    }
    case messages.FLAG_COMPACT_TASKS: {
      return chalk.gray(
        'Reduce the output of task dependency tree by printing ' +
        'only top tasks and their child tasks.'
      );
    }
    case messages.FLAG_SORT_TASKS: {
      return chalk.gray('Will sort top tasks of task dependency tree.');
    }
    case messages.FLAG_COLOR: {
      return chalk.gray(
        'Will force gulp and gulp plugins to display colors, ' +
        'even when no color support is detected.'
      );
    }
    case messages.FLAG_NO_COLOR: {
      return chalk.gray(
        'Will force gulp and gulp plugins to not display colors, ' +
        'even when color support is detected.'
      );
    }
    case messages.FLAG_SILENT: {
      return chalk.gray('Suppress all gulp logging.');
    }
    case messages.FLAG_CONTINUE: {
      return chalk.gray('Continue execution of tasks upon failure.');
    }
    case messages.FLAG_SERIES: {
      return chalk.gray('Run tasks given on the CLI in series (the default is parallel).');
    }
    case messages.FLAG_LOG_LEVEL: {
      return chalk.gray(
        'Set the loglevel. -L for least verbose and -LLLL for most verbose. ' +
        '-LLL is default.'
      );
    }
    case messages.TASK_NAME: {
      return chalk.cyan(data.name);
    }
    case messages.TASK_DESCRIPTION: {
      return chalk.white(data.description);
    }
    case messages.TASK_FLAG: {
      return chalk.magenta(data.flag);
    }
    case messages.TASK_FLAG_DESCRIPTION: {
      return chalk.white('…' + data.description);
    }
    case messages.BOX_DRAWINGS_LIGHT_UP_AND_RIGHT: {
      return chalk.white('└');
    }
    case messages.BOX_DRAWINGS_LIGHT_VERTICAL_AND_RIGHT: {
      return chalk.white('├');
    }
    case messages.BOX_DRAWINGS_LIGHT_HORIZONTAL: {
      return chalk.white('─');
    }
    case messages.BOX_DRAWINGS_LIGHT_DOWN_AND_HORIZONTAL: {
      return chalk.white('┬');
    }
    case messages.BOX_DRAWINGS_LIGHT_VERTICAL: {
      return chalk.white('│');
    }
    default: {
      return data;
    }
  }
}

function getDefaultTimestamp() {
  return util.inspect(new Timestamp(), { colors: !!chalk.supportsColor });
}

function buildTranslations(cfg) {
  cfg = cfg || {};

  return {
    message: function (data) {
      // Don't allow an `undefined` message through
      if (typeof data === 'undefined') {
        data = Object.create(null);
      }

      var message;
      if (typeof cfg.message === 'function') {
        try {
          message = cfg.message(data);
        } catch (err) {
          console.error('A problem occurred with the user-defined `message()` function.');
          console.error('Please correct your `.gulp.*` config file.');
        }
      }

      // If the user has provided a message, return it
      if (message) {
        return message;
      }

      // Users can filter messages by explicitly returning `false`
      if (message === false) {
        return '';
      }

      // If the user hasn't returned a message or silenced it with `false`
      // get the default message. Will return the first argument if the message
      // is not defined in the `@gulpjs/messages` package
      return getDefaultMessage(data);
    },
    timestamp: function (data) {
      // Don't allow an `undefined` message through
      if (typeof data === 'undefined') {
        data = Object.create(null);
      }

      var time;
      if (typeof cfg.timestamp === 'function') {
        try {
          time = cfg.timestamp(data);
        } catch (err) {
          console.error('A problem occurred with the user-defined `timestamp()` function.');
          console.error('Please correct your `.gulp.*` config file.');
        }
      }

      // If the user has provided a timestamp, return it
      if (time) {
        return time;
      }

      // Users can filter timestamps by explicitly returning `false`
      if (time === false) {
        return '';
      }

      return getDefaultTimestamp();
    }
  }
}

module.exports = buildTranslations;
