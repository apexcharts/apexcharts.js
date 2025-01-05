'use strict';

var chokidar = require('chokidar');
var asyncDone = require('async-done');
var normalizeArgs = require('./lib/normalize-args');
var debounce = require('./lib/debounce');

function watch(glob, options, cb) {
  return normalizeArgs(glob, options, cb, watchProc);
}

function watchProc(globs, options, cb) {
  var watcher = chokidar.watch(globs, options);
  registerWatchEvent(watcher, options, cb);
  return watcher;
}

function registerWatchEvent(watcher, opts, cb) {
  if (typeof cb !== 'function') {
    return;
  }

  var queued = false;
  var running = false;

  function runComplete(err) {
    running = false;

    if (err && watcher.listenerCount('error') > 0) {
      watcher.emit('error', err);
    }

    // If we have a run queued, start onChange again
    if (queued) {
      queued = false;
      onChange();
    }
  }

  function onChange() {
    if (running) {
      if (opts.queue) {
        queued = true;
      }
      return;
    }

    running = true;
    asyncDone(cb, runComplete);
  }

  var debounced = debounce(onChange, opts.delay);
  opts.events.forEach(watchEvent);

  function watchEvent(eventName) {
    watcher.on(eventName, debounced);
  }
}

module.exports = watch;
