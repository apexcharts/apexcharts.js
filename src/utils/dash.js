/**
 * One dash value, as the dash options accept it: a number (dash and gap of
 * that length), an SVG dash list string ('8 3 2 3' or '8,3,2,3'), or an
 * array of lengths ([8, 3, 2, 3]).
 * @typedef {number | string | number[]} DashPattern
 */

/**
 * Parse a dash value into the list of lengths `ctx.setLineDash` takes.
 *
 * SVG reads the same value straight from `stroke-dasharray`, so the SVG
 * renderers keep passing it through untouched; this is for the renderers
 * that need the numbers. It follows the SVG rules for a value it cannot
 * use: an empty, 'none', negative, non-numeric or all-zero list draws
 * solid, which here is `[]`. An odd-length list is returned as given;
 * canvas repeats it to an even length the way SVG does.
 *
 * @param {DashPattern | null | undefined} dash
 * @returns {number[]}
 */
export function parseDash(dash) {
  if (dash == null || dash === '') return []
  /** @type {Array<number | string>} */
  let parts
  if (Array.isArray(dash)) {
    parts = dash
  } else if (typeof dash === 'number') {
    parts = [dash]
  } else {
    const s = String(dash).trim()
    if (s === '' || s === 'none') return []
    parts = s.split(/[\s,]+/)
  }
  /** @type {number[]} */
  const out = []
  let any = false
  for (const p of parts) {
    const n =
      typeof p === 'number' ? p : Number(String(p).replace(/px$/i, ''))
    if (!isFinite(n) || n < 0) return []
    if (n > 0) any = true
    out.push(n)
  }
  return any ? out : []
}

/**
 * Whether a value is a dash value the dash options take: a finite number, a
 * dash list string ('8 3 2 3', '8,3', 'none') or an array of finite numbers.
 * Used to validate a value from code that is not the caller's config (a
 * plugin's claim), so a word like 'dashed' is refused rather than written.
 * @param {any} v
 * @returns {boolean}
 */
export function isDashPattern(v) {
  if (typeof v === 'number') return isFinite(v)
  if (typeof v === 'string') {
    const s = v.trim()
    return s === 'none' || /^\d*\.?\d+(px)?([\s,]+\d*\.?\d+(px)?)*$/i.test(s)
  }
  return (
    Array.isArray(v) &&
    v.every((n) => typeof n === 'number' && isFinite(n))
  )
}
