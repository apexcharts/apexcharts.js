'use strict';

function arrayFind(arr, fn) {
  if (!Array.isArray(arr)) {
    return;
  }

  var idx = 0;
  while (idx < arr.length) {
    var result = fn(arr[idx]);
    if (result) {
      // TODO: This is wrong in Liftoff
      return arr[idx];
    }
    idx++;
  }
}

module.exports = arrayFind;
