'use strict';

// Built-in types
var types = [
  'object',
  'number',
  'string',
  'symbol',
  'boolean',
  'date',
  'function', // Weird to expose this
];

function normalize(coercer, value) {
  var coercers = coercer;
  if (!Array.isArray(coercers)) {
    coercers = [coercer];
  }

  var ctx = this;
  var args = slice(arguments, 2);

  // Try in order until one returns a non-undefined value
  var result;
  coercers.some(function (coercer) {
    var val = value;
    if (typeof value === 'function' && coercer !== 'function') {
      val = value.apply(ctx, args);
    }

    result = coerce(ctx, coercer, val);
    return result !== undefined;
  });

  return result;
}

function coerce(ctx, coercer, value) {
  // Handle built-in types
  if (typeof coercer === 'string') {
    if (coerce[coercer]) {
      return coerce[coercer].call(ctx, value);
    }
    return typeOf(coercer, value);
  }

  // Handle custom coercer
  if (typeof coercer === 'function') {
    return coercer.call(ctx, value);
  }

  throw new Error('Invalid coercer. Can only be a string or function.');
}

coerce.string = function (value) {
  if (
    value != null &&
    typeof value === 'object' &&
    typeof value.toString === 'function'
  ) {
    value = value.toString();
  }
  return typeOf('string', primitive(value));
};

coerce.number = function (value) {
  return typeOf('number', primitive(value));
};

coerce.boolean = function (value) {
  return typeOf('boolean', primitive(value));
};

coerce.date = function (value) {
  value = primitive(value);
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return new Date(value);
  }
};

function typeOf(type, value) {
  if (typeof value === type) {
    return value;
  }
}

function primitive(value) {
  if (
    value != null &&
    typeof value === 'object' &&
    typeof value.valueOf === 'function'
  ) {
    value = value.valueOf();
  }
  return value;
}

function slice(value, from) {
  return Array.prototype.slice.call(value, from);
}

// Add methods for each type
types.forEach(function (type) {
  // Make it an array for easier concat
  var typeArg = [type];

  normalize[type] = function () {
    var args = slice(arguments);
    return normalize.apply(this, typeArg.concat(args));
  };
});

module.exports = normalize;
