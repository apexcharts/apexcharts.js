'use strict';

var units = [
  [ 'h', 3600e9 ],
  [ 'min', 60e9 ],
  [ 's', 1e9 ],
  [ 'ms', 1e6 ],
  [ 'μs', 1e3 ],
];

function formatHrTime(hrtime) {
  if (!Array.isArray(hrtime) || hrtime.length !== 2) {
    return '';
  }
  if (typeof hrtime[0] !== 'number' || typeof hrtime[1] !== 'number') {
    return '';
  }

  var nano = hrtime[0] * 1e9 + hrtime[1];

  for (var i = 0; i < units.length; i++) {
    if (nano < units[i][1]) {
      continue;
    }

    if (nano >= units[i][1] * 10) {
      return Math.round(nano / units[i][1]) + ' ' + units[i][0];
    }

    var s = String(Math.round(nano * 1e2 / units[i][1]));
    if (s.slice(-2) === '00') {
      s = s.slice(0, -2);
    } else if (s.slice(-1) === '0') {
      s = s.slice(0, -2) + '.' + s.slice(-2, -1);
    } else {
      s = s.slice(0, -2) + '.' + s.slice(-2);
    }
    return s + ' ' + units[i][0];
  }

  if (nano > 0) {
    return nano + ' ns';
  }

  return '';
}

module.exports = formatHrTime;
