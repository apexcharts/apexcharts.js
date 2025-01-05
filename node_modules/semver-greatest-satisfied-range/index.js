'use strict';

var SemverRange = require('sver').SemverRange;

function findRange(version, ranges) {
  ranges = ranges || [];

  function matches(range) {
    return SemverRange.match(range, version, false);
  }

  var validRanges = ranges.filter(matches);

  var sortedRanges = validRanges.sort(SemverRange.compare);

  return sortedRanges.pop() || null;
}

module.exports = findRange;
