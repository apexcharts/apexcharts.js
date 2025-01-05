'use strict';

var metadata = require('./helpers/metadata');

function tree(opts) {
  opts = Object.assign({ deep: false }, opts);

  var tasks = this._registry.tasks();
  var nodes = Object.values(tasks).map(function(task) {
    var meta = metadata.get(task);

    if (opts.deep) {
      return meta.tree;
    }

    return meta.tree.label;
  });

  return {
    label: 'Tasks',
    nodes: nodes,
  };
}

module.exports = tree;
