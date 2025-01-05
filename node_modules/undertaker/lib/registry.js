'use strict';

var validateRegistry = require('./helpers/validateRegistry');

function setTasks(registry, nameAndTask) {
  var name = nameAndTask[0];
  var task = nameAndTask[1];
  registry.set(name, task);
  return registry;
}

function registry(newRegistry) {
  if (!newRegistry) {
    return this._registry;
  }

  validateRegistry(newRegistry);

  var tasks = this._registry.tasks();

  this._registry = Object.entries(tasks).reduce(setTasks, newRegistry);
  this._registry.init(this);
}

module.exports = registry;
