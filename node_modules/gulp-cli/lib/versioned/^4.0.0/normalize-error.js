'use strict';

// Normalize an undertaker v1 error like an undertaker v2 error
function normalizeError(err) {
  /* istanbul ignore if */
  if (!err || !err.message) {
    return;
  }

  var fixed0 = 'Task never defined: ';
  var fixed1 = ' - did you mean? ';

  if (err.message.startsWith(fixed0)) {
    var task = err.message.slice(fixed0.length);
    var index = task.indexOf(fixed1);

    if (index >= 0) {
      err.similar = task.slice(index + fixed1.length).split(', ');
      err.task = task.slice(0, index);
    } else {
      err.task = task
    }
  }
}

module.exports = normalizeError;
