'use strict';

function debounce(fn, delay) {
  var timeout;
  var args;
  var self;

  return function () {
    self = this;
    args = arguments;
    clear();
    timeout = setTimeout(run, delay);
  };

  function run() {
    clear();
    fn.apply(self, args);
  }

  function clear() {
    clearTimeout(timeout);
    timeout = null;
  }
}

module.exports = debounce;
