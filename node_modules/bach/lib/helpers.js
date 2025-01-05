'use strict';

function noop() {}

function getOptions(args) {
  // TODO: use `.at(-1)` when the API is available
  var lastArg = args.slice(-1)[0];

  if (typeof lastArg !== 'function') {
    return lastArg;
  }
}

function filterSuccess(elem) {
  return elem.state === 'success';
}

function filterError(elem) {
  return elem.state === 'error';
}

function pluckValue(elem) {
  return elem.value;
}

function buildOnSettled(done) {
  if (typeof done !== 'function') {
    done = noop;
  }

  function onSettled(error, result) {
    if (error) {
      return done(error, null);
    }

    if (!Array.isArray(result)) {
      result = [];
    }

    var settledErrors = result.filter(filterError);
    var settledResults = result.filter(filterSuccess);

    var errors = null;
    if (settledErrors.length) {
      errors = settledErrors.map(pluckValue);
    }

    var results = null;
    if (settledResults.length) {
      results = settledResults.map(pluckValue);
    }

    done(errors, results);
  }

  return onSettled;
}

function verifyArguments(args) {
  args = Array.prototype.concat.apply([], args);

  if (!args.length) {
    throw new Error('A set of functions to combine is required');
  }

  args.forEach(verifyEachArg);

  return args;
}

function verifyEachArg(arg, argIdx, args) {
  var isFunction = typeof arg === 'function';
  if (isFunction) {
    return;
  }

  if (argIdx === args.length - 1) {
    // Last arg can be an object of extension points
    return;
  }

  var msg =
    'Only functions can be combined, got ' +
    typeof arg +
    ' for argument ' +
    argIdx;
  throw new Error(msg);
}

module.exports = {
  getOptions: getOptions,
  onSettled: buildOnSettled,
  verifyArguments: verifyArguments,
};
