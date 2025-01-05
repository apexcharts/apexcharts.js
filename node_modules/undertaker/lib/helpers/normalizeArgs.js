'use strict';

var assert = require('assert');

var levenshtein = require('fast-levenshtein');

function normalizeArgs(registry, args) {
  function getFunction(task) {
    if (typeof task === 'function') {
      return task;
    }

    var fn = registry.get(task);
    if (!fn) {
      var similar = similarTasks(registry, task);
      var err;
      if (similar.length > 0) {
        err = new Error('Task never defined: ' + task + ' - did you mean? ' + similar.join(', '));
        err.task = task;
        err.similar = similar;
      } else {
        err = new Error('Task never defined: ' + task);
        err.task = task;
      }
      throw err;
    }
    return fn;
  }

  var flattenArgs = Array.prototype.concat.apply([], args);
  assert(flattenArgs.length, 'One or more tasks should be combined using series or parallel');

  return flattenArgs.map(getFunction);
}

function similarTasks(registry, queryTask) {
  if (typeof queryTask !== 'string') {
    return [];
  }

  var tasks = registry.tasks();
  var similarTasks = [];
  for (var task in tasks) {
    if (Object.prototype.hasOwnProperty.call(tasks, task)) {
      var distance = levenshtein.get(task, queryTask);
      var allowedDistance = Math.floor(0.4 * task.length) + 1;
      if (distance < allowedDistance) {
        similarTasks.push(task);
      }
    }
  }
  return similarTasks;
}

module.exports = normalizeArgs;
