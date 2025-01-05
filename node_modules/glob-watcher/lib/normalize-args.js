'use strict';

var defaultOpts = {
  delay: 200,
  events: ['add', 'change', 'unlink'],
  ignored: [],
  ignoreInitial: true,
  queue: true,
};

function normalizeArgs(glob, options, cb, next) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  var opts = Object.assign({}, defaultOpts, options);

  if (!Array.isArray(opts.events)) {
    opts.events = [opts.events];
  }

  if (Array.isArray(glob)) {
    // We slice so we don't mutate the passed globs array
    glob = glob.slice();
  } else {
    glob = [glob];
  }

  return next(glob, opts, cb);
}

module.exports = normalizeArgs;
