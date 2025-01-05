'use strict';

var stringWidth = require('string-width');
var messages = require('@gulpjs/messages');

var isObject = require('../is-object');

function logTasks(tree, opts, getTask, translate) {
  if (opts.sortTasks) {
    tree.nodes = tree.nodes.sort(compareByLabel);
  }

  var maxDepth = opts.tasksDepth;
  if (typeof maxDepth !== 'number') {
    maxDepth = 50;
  } else if (maxDepth < 1) {
    maxDepth = 1;
  }

  var compactedTasks = opts.compactTasks ? tree.nodes : [];

  var treeOpts = {
    maxDepth: maxDepth,
    compactedTasks: compactedTasks,
    getTask: getTask,
  };

  printTaskTree(tree, treeOpts);

  function printTaskTree(tree, opts) {
    var lines = [];
    lines.push({ label: tree.label });
    var maxLabelWidth = 0;

    tree.nodes.forEach(function(node, idx, arr) {
      var isLast = idx === arr.length - 1;
      var w = createTreeLines(node, lines, opts, 1, '', isLast);
      maxLabelWidth = Math.max(maxLabelWidth, w);
    });

    lines.forEach(function(line) {
      var s = line.label;
      if (line.desc) {
        var spaces = ' '.repeat(maxLabelWidth - line.width) + '  ';
        s += spaces + line.desc;
      }
      if (s) {
        // We don't need timestamps here
        console.log(s);
      }
    });
  }

  function createTreeLines(node, lines, opts, depth, bars, isLast) {
    var task = { label: node.label, bars: bars, depth: depth };
    if (depth === 1) {
      var t = opts.getTask(node.label);
      task.desc = t.description;
      task.flags = t.flags;
    }

    var isLeaf = isLeafNode(node, depth, opts);

    var maxLabelWidth = addTaskToLines(task, lines, isLast, isLeaf);

    if (!isLeaf) {
      bars += (isLast ? ' ' : translate.message({ tag: messages.BOX_DRAWINGS_LIGHT_VERTICAL }));
      bars += ' '
      node.nodes.forEach(function(node, idx, arr) {
        var isLast = idx === arr.length - 1;
        createTreeLines(node, lines, opts, depth + 1, bars, isLast);
      });
    }

    return maxLabelWidth;
  }

  function addTaskToLines(task, lines, isLast, isLeaf) {
    var taskBars = task.bars + (isLast
        ? translate.message({ tag: messages.BOX_DRAWINGS_LIGHT_UP_AND_RIGHT })
        : translate.message({ tag: messages.BOX_DRAWINGS_LIGHT_VERTICAL_AND_RIGHT })) +
          translate.message({ tag: messages.BOX_DRAWINGS_LIGHT_HORIZONTAL });
    if (isLeaf) {
      taskBars += translate.message({ tag: messages.BOX_DRAWINGS_LIGHT_HORIZONTAL });
    } else {
      taskBars += translate.message({ tag: messages.BOX_DRAWINGS_LIGHT_DOWN_AND_HORIZONTAL });
    }
    taskBars += ' ';

    var line = {};
    if (task.depth === 1) {
      line.label = taskBars + translate.message({ tag: messages.TASK_NAME, name: task.label });
    } else {
      line.label = taskBars + translate.message({ tag: messages.TASK_NAME, name: task.label });
    }
    line.width = stringWidth(line.label);

    if (typeof task.desc === 'string' && task.desc) {
      line.desc = translate.message({ tag: messages.TASK_DESCRIPTION, description: task.desc });
    }
    lines.push(line);

    var maxLabelWidth = line.width;

    if (!isObject(task.flags)) {
      return maxLabelWidth;
    }

    var flagBars = task.bars;
    if (isLast) {
      flagBars += ' ';
    } else {
      flagBars += translate.message({ tag: messages.BOX_DRAWINGS_LIGHT_VERTICAL });
    }
    flagBars += ' ';

    if (isLeaf) {
      flagBars += ' ';
    } else {
      flagBars += translate.message({ tag: messages.BOX_DRAWINGS_LIGHT_VERTICAL });
    }
    flagBars += ' ';

    Object.entries(task.flags).sort(flagSorter).forEach(addFlagsToLines);

    function addFlagsToLines(ent) {
      if (typeof ent[0] !== 'string' || !ent[0]) return;
      var line = {};
      line.label = flagBars + translate.message({ tag: messages.TASK_FLAG, flag: ent[0] });
      line.width = stringWidth(line.label);

      maxLabelWidth = Math.max(maxLabelWidth, line.width);

      if (typeof ent[1] === 'string' && ent[1] !== '') {
        line.desc = translate.message({ tag: messages.TASK_FLAG_DESCRIPTION, description: ent[1] });
      }
      lines.push(line);
    }

    return maxLabelWidth;
  }
}

function isLeafNode(node, depth, opts) {
  if (depth >= opts.maxDepth) {
    return true;
  } else if (depth > 1 && opts.compactedTasks.includes(node)) {
    return true;
  } else if (!Array.isArray(node.nodes) || node.nodes.length === 0) {
    return true;
  }
  return false;
}

function compareByLabel(a, b) {
  /* istanbul ignore if */
  if (!b.label) {
    return -1;
  } else /* istanbul ignore if */ if (!a.label) {
    return 1;
  } else {
    return (a.label <= b.label) ? -1 : 1;
  }
}

function flagSorter(a, b) {
  return (a[0] <= b[0]) ? -1 : 1;
}

module.exports = logTasks;

