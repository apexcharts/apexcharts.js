const nodeSemver = require('semver');
const { Semver, SemverRange } = require('./sver');

module.exports = function nodeRangeToSemverRange (range) {
  let parsed = nodeSemver.validRange(range);

  // tag version
  if (!parsed)
    return new SemverRange(range);

  if (parsed === '*')
    return new SemverRange(parsed);

  try {
    let semverRange = new SemverRange(range);
    if (!semverRange.version.tag)
      return semverRange;
  }
  catch (e) {
    if (e.code !== 'ENOTSEMVER')
      throw e;
  }

  let outRange;
  for (let union of parsed.split('||')) {
    // compute the intersection into a lowest upper bound and a highest lower bound
    let upperBound, lowerBound, upperEq, lowerEq;
    for (let intersection of union.split(' ')) {
      let lt = intersection[0] === '<';
      let gt = intersection[0] === '>';
      if (!lt && !gt) {
        upperBound = intersection;
        upperEq = true;
        break;
      }
      let eq = intersection[1] === '=';
      if (!gt) {
        let version = new Semver(intersection.substr(1 + eq));
        if (!upperBound || upperBound.gt(version)) {
          upperBound = version;
          upperEq = eq;
        }
      }
      else if (!lt) {
        let eq = intersection[1] === '=';
        let version = new Semver(intersection.substr(1 + eq));
        if (!lowerBound || lowerBound.lt(version)) {
          lowerBound = version;
          lowerEq = eq;
        }
      }
    }

    // no upper bound -> wildcard
    if (!upperBound) {
      outRange = new SemverRange('*');
      continue;
    }

    // if the lower bound is greater than the upper bound then just return the lower bound exactly
    if (lowerBound && upperBound && lowerBound.gt(upperBound)) {
      let curRange = new SemverRange(lowerBound.toString());
      // the largest or highest union range wins
      if (!outRange || !outRange.contains(curRange) && (curRange.gt(outRange) || curRange.contains(outRange)))
        outRange = curRange;
      continue;
    }

    // determine the largest semver range satisfying the upper bound
    let upperRange;
    if (upperBound) {
      // if the upper bound has an equality then we return it directly
      if (upperEq) {
        let curRange = new SemverRange(upperBound.toString());
        // the largest or highest union range wins
        if (!outRange || !outRange.contains(curRange) && (curRange.gt(outRange) || curRange.contains(outRange)))
          outRange = curRange;
        continue;
      }

      let major = 0, minor = 0, patch = 0, rangeType = '';

      // if an exact prerelease range, match the lower bound as a range
      if (upperBound.pre && lowerBound.major === upperBound.major && lowerBound.minor === upperBound.minor && lowerBound.patch === upperBound.patch) {
        outRange = new SemverRange('~' + lowerBound.toString());
        continue;
      }

      // <2.0.0 -> ^1.0.0
      else if (upperBound.patch === 0) {
        if (upperBound.minor === 0) {
          if (upperBound.major > 0) {
            major = upperBound.major - 1;
            rangeType = '^';
          }
        }
        // <1.2.0 -> ~1.1.0
        else {
          major = upperBound.major;
          minor = upperBound.minor - 1;
          rangeType = '~';
        }
      }
      // <1.2.3 -> ~1.2.0
      else {
        major = upperBound.major;
        minor = upperBound.minor;
        patch = 0;
        rangeType = '~';
      }

      if (major === 0 && rangeType === '^')
        upperRange = new SemverRange('0');
      else
        upperRange = new SemverRange(rangeType + major + '.' + minor + '.' + patch);
    }

    if (!lowerBound) {
      outRange = upperRange;
      continue;
    }

    // determine the lower range semver range
    let lowerRange;
    if (!lowerEq) {
      if (lowerBound.pre)
        lowerRange = new SemverRange('^^' + lowerBound.major + '.' + lowerBound.minor + '.' + lowerBound.patch + '-' + [...lowerBound.pre, 1].join('.'));
      else
        lowerRange = new SemverRange('^^' + lowerBound.major + '.' + lowerBound.minor + '.' + (lowerBound.patch + 1));
    }
    else {
      lowerRange = new SemverRange('^^' + lowerBound.toString());
    }

    // we then intersect the upper semver range with the lower semver range
    // if the intersection is empty, we return the upper range only
    let curRange = upperRange ? lowerRange.intersect(upperRange) || upperRange : lowerRange;

    // the largest or highest union range wins
    if (!outRange || !outRange.contains(curRange) && (curRange.gt(outRange) || curRange.contains(outRange)))
      outRange = curRange;
  }
  return outRange;
}
