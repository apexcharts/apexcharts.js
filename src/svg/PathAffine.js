// @ts-check
/**
 * Re-project a rendered path through an axis-aligned affine map. Not a shared
 * module (svg/math.js and PathMorphing.js are), so it carries no state: the
 * streaming scroll and the cross-type morph each bundle their own copy.
 * @module svg/PathAffine
 */

const CMD_RE = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g
const NUM_RE = /[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi

/**
 * Map every point of `d` through x -> ax*x + bx, y -> ay*y + by. Affine maps
 * are exact for every command the series builders emit (bezier curves are
 * affine-invariant): M/L/T points, C/S/Q control points, H (x only), V (y
 * only). An arc's end point maps and its radii scale by `rk`; rotation and
 * flags stay.
 *
 * Every command is read as absolute, which every path ApexCharts draws is. A
 * relative command would be mapped as if it were absolute, which is wrong
 * under a shift, so a relative path must be made absolute first.
 *
 * @param {string} d
 * @param {number} ax
 * @param {number} bx
 * @param {number} ay
 * @param {number} by
 * @param {number} [rk] arc radius scale
 * @returns {string}
 */
export function mapPathAffine(d, ax, bx, ay, by, rk = 1) {
  /** @type {string[]} */
  const out = []
  /** @param {number} v */
  const x = (v) => ax * v + bx
  /** @param {number} v */
  const y = (v) => ay * v + by
  CMD_RE.lastIndex = 0
  let match
  while ((match = CMD_RE.exec(d)) !== null) {
    const cmd = match[1].toUpperCase()
    const nums = (match[2].match(NUM_RE) || []).map(parseFloat)

    if (cmd === 'Z') out.push('Z')
    else if (cmd === 'H') for (const v of nums) out.push(`H ${x(v)}`)
    else if (cmd === 'V') for (const v of nums) out.push(`V ${y(v)}`)
    else if (cmd === 'A') {
      for (let i = 0; i + 6 < nums.length; i += 7) {
        out.push(
          `A ${nums[i] * rk} ${nums[i + 1] * rk} ${nums[i + 2]} ${nums[i + 3]} ${nums[i + 4]} ${x(nums[i + 5])} ${y(nums[i + 6])}`,
        )
      }
    } else {
      // M, L, T, C, S, Q: pure (x, y) coordinate lists.
      const coords = []
      for (let i = 0; i + 1 < nums.length; i += 2) {
        coords.push(`${x(nums[i])} ${y(nums[i + 1])}`)
      }
      if (coords.length) out.push(`${cmd} ${coords.join(' ')}`)
    }
  }
  return out.join(' ')
}
