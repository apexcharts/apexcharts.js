'use strict';

function isObject(v) {
  return (v != null && typeof v === 'object' && !Array.isArray(v));
}

module.exports = isObject;
