// @ts-check
/**
 * Numbers, spelled out in their own dots.
 *
 * `glyphs('9,412')` returns a shape that packs 9,412 dots into the figure 9,412.
 * The headline and the data become the same object, which is the one thing a unit
 * chart can do that no other chart type can.
 *
 * The forms are seven-segment, and that is a decision rather than a shortcut.
 * A hand-drawn numeral set would be worse in three ways: every digit needs curves
 * tuned so it survives being rendered as dots, the shapes would drift out of
 * proportion with each other, and the obvious fix (tracing a typeface) would put a
 * font licence inside dist/. Seven segments are straight lines with exact
 * coordinates, they stay consistent by construction, and they read as a counter,
 * which suits a chart that is counting.
 *
 * Each segment is a two-point subpath, which is precisely the case a fill has to
 * discard and a stroke has to keep: see `keepLines` in `flattenPath`.
 *
 * @module unit-shapes/engine/digits
 */

import { stroke } from './stroke.js'

/** @typedef {import('./shape.js').ShapeMeta} ShapeMeta */
/** @typedef {import('./shape.js').UnitShape} UnitShape */

/** Advance per glyph, and the box each one is drawn in. */
const EM = 46
const TOP = 8
const MID = 48
const BOT = 88

/**
 * The seven segments, as [x0, y0, x1, y1] in a 46 x 96 box. Segment ends stop
 * short of the corners so two meeting segments leave a mitre rather than a blob
 * once the stroke rounds their caps.
 */
/** @type {Record<string, number[]>} */
const SEG = {
  a: [8, TOP, 38, TOP],
  b: [40, TOP + 3, 40, MID - 3],
  c: [40, MID + 3, 40, BOT - 3],
  d: [8, BOT, 38, BOT],
  e: [6, MID + 3, 6, BOT - 3],
  f: [6, TOP + 3, 6, MID - 3],
  g: [8, MID, 38, MID],
}

/**
 * Which segments each character lights.
 *
 * `1` is not here. Its segments are b and c, which sit on the RIGHT edge of the
 * box, so a `1` narrowed to its ink would either advance a full box and leave a
 * hole before it, or advance narrowly and let the next glyph run straight through
 * it. It is drawn as a mark instead, at the left of a narrow box, keeping the
 * seven-segment gap at the waist.
 */
/** @type {Record<string, string>} */
const GLYPHS = {
  0: 'abcdef',
  2: 'abdeg',
  3: 'abcdg',
  4: 'bcfg',
  5: 'acdfg',
  6: 'acdefg',
  7: 'abc',
  8: 'abcdefg',
  9: 'abcdfg',
  '-': 'g',
}

/** Glyphs drawn directly rather than from the segment map. */
/** @type {Record<string, (dx: number) => string>} */
const MARKS = {
  1: (/** @type {number} */ dx) =>
    `M ${dx + 17} ${TOP + 3} L ${dx + 17} ${MID - 3} `
    + `M ${dx + 17} ${MID + 3} L ${dx + 17} ${BOT - 3} `,
  '.': (/** @type {number} */ dx) => `M ${dx + 20} ${BOT} L ${dx + 20} ${BOT} `,
  ',': (/** @type {number} */ dx) => `M ${dx + 21} ${BOT - 2} L ${dx + 15} ${BOT + 10} `,
  ':': (/** @type {number} */ dx) => `M ${dx + 20} 34 L ${dx + 20} 34 M ${dx + 20} 62 L ${dx + 20} 62 `,
}

/** Narrower advance for the glyphs that do not fill their box. */
/** @type {Record<string, number>} */
const ADVANCE = { 1: EM * 0.5, '.': EM * 0.42, ',': EM * 0.42, ':': EM * 0.42, ' ': EM * 0.5 }

/**
 * The centreline for a string of digits, laid out left to right.
 *
 * @param {string} text
 * @param {number} [gap] space between glyphs in path units (10)
 * @returns {string} an SVG path of two-point subpaths
 */
export function digitsPath(text, gap = 10) {
  let d = ''
  let dx = 0
  for (const ch of String(text)) {
    if (ch === ' ') {
      dx += ADVANCE[' '] + gap
      continue
    }
    const mark = MARKS[ch]
    if (mark) {
      d += mark(dx)
      dx += (ADVANCE[ch] || EM) + gap
      continue
    }
    const on = GLYPHS[ch]
    if (!on) {
      // Skipping silently would quietly drop a character from a headline.
      throw new Error(
        `[ApexCharts] glyphs(): no seven-segment form for "${ch}". ` +
          `Digits, "-", ".", "," and ":" are available.`,
      )
    }
    for (const key of on) {
      const s = SEG[key]
      d += `M ${dx + s[0]} ${s[1]} L ${dx + s[2]} ${s[3]} `
    }
    dx += (ADVANCE[ch] || EM) + gap
  }
  return d.trim()
}

/**
 * A number (or short label) as a shape, so the dots spell out how many there are.
 *
 * @example
 *   plotOptions: { unit: { layout: 'custom', positions: glyphs('9,412') } }
 *
 * @param {string | number} text digits, plus "-", ".", "," and ":"
 * @param {Partial<ShapeMeta> & { gap?: number }} [opts]
 * @returns {UnitShape}
 */
export function glyphs(text, opts = {}) {
  const str = String(text)
  const { gap, ...meta } = opts
  return stroke({
    name: `glyphs-${str}`,
    category: 'symbols',
    // Each stroke is one segment wide, so a long number needs the dots to go
    // round: roughly 45 per lit segment keeps the strokes continuous.
    minUnits: Math.max(60, str.replace(/[^0-9]/g, '').length * 180),
    source: 'generated',
    width: 13,
    ...meta,
    path: digitsPath(str, gap),
  })
}
