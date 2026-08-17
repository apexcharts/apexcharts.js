// @ts-check
/**
 * Render a shape to an SVG string, with no chart and no DOM.
 *
 * A shape is a pure function of marks and a rectangle, so a picture of one needs
 * neither a chart instance nor a browser. That is what makes this useful: docs
 * galleries, a shape picker, README images and launch graphics can all be built at
 * build time, or on a server, from the catalog alone.
 *
 * @module unit-shapes/engine/preview
 */

import { allocate } from './pack.js'

/** @typedef {import('./shape.js').UnitShape} UnitShape */

/**
 * The library's default series colours (`palette1`).
 *
 * Duplicated from `src/utils/ThemePalettes.js` rather than imported: this bundle
 * is meant to stay standalone, and that module hands back every palette at once.
 * A test asserts the two never drift apart.
 * @type {string[]}
 */
const PALETTE = ['#008FFB', '#00A86F', '#CA8501', '#FF4560', '#846DD5']

/**
 * @param {UnitShape} shape
 * @param {object} [opts]
 * @param {number} [opts.count] dots to pack (defaults to the total of `series`,
 *   else the shape's minUnits, else 220)
 * @param {number[]} [opts.series] series values, coloured band by band the way the
 *   chart colours them. Pass this whenever the preview stands in for a real chart:
 *   a shape drawn in one flat colour says the data cannot be told apart, which is
 *   the opposite of what a unit chart does.
 * @param {number} [opts.width] viewport width (300)
 * @param {number} [opts.height] viewport height (defaults to width)
 * @param {number} [opts.padding] rect inset in px (0)
 * @param {string | string[]} [opts.fill] one colour, or a ramp. With `series` a
 *   ramp is one colour per series (defaulting to the library's own palette);
 *   without it, a ramp is handed out in equal parts along the fill order.
 * @param {number} [opts.r] override the dot radius the shape suggests
 * @param {boolean} [opts.svg] wrap in an <svg> element (true); false returns the
 *   dots only, for embedding in a viewport the caller owns
 * @returns {string}
 */
export function preview(shape, opts = {}) {
  const series = opts.series && opts.series.length ? opts.series : null
  const total = series ? series.reduce((a, b) => a + Math.max(0, b), 0) : 0
  const count = Math.max(
    1,
    Math.round(opts.count || total || shape.shape.minUnits || 220),
  )
  const width = opts.width || 300
  const height = opts.height || width
  const pad = opts.padding || 0
  const given = Array.isArray(opts.fill)
    ? opts.fill
    : opts.fill
      ? [opts.fill]
      : null
  const fills = given || (series ? PALETTE : ['#008FFB'])
  // Dots per series at THIS dot count: the same proportional split the chart
  // makes when it scales a dataset down to maxUnits, so the bands a preview
  // shows are the bands the chart would draw.
  const shares = series ? share(series, count) : null

  /** @type {import('./shape.js').UnitObject[]} */
  const objects = []
  /** @type {number[]} the series each dot belongs to, in fill order */
  const owner = []
  const r = opts.r || Math.max(1.2, Math.sqrt((width * height) / count) / 2.6)
  for (let i = 0; i < count; i++) {
    const s = shares ? seriesAt(shares, i) : 0
    owner.push(s)
    objects.push({
      id: `p:${i}`,
      index: i,
      seriesIndex: s,
      dataPointIndex: i,
      label: shares ? `series-${s + 1}` : 'preview',
      value: 1,
      datum: undefined,
      // The shapes refine this themselves; it only has to be in the right league.
      r,
    })
  }

  const placed = shape(objects, {
    x: pad,
    y: pad,
    width: Math.max(1, width - pad * 2),
    height: Math.max(1, height - pad * 2),
  })

  // Group by fill so a ramp emits one <g> per colour instead of a fill attribute
  // per circle, which roughly halves the markup for a multi-colour preview.
  /** @type {Map<string, string[]>} */
  const groups = new Map()
  placed.forEach((p, i) => {
    // With series, a dot's colour is its series, exactly as in the chart. Without
    // one, a ramp is spread evenly along the shape's own fill order.
    const slot = shares
      ? owner[i] % fills.length
      : Math.floor((i / placed.length) * fills.length)
    const fill = fills[slot] || fills[0]
    const circle = `<circle cx="${round(p.x)}" cy="${round(p.y)}" r="${round(p.r || 3)}"/>`
    const list = groups.get(fill)
    if (list) list.push(circle)
    else groups.set(fill, [circle])
  })

  let body = ''
  groups.forEach((circles, fill) => {
    body += `<g fill="${fill}">${circles.join('')}</g>`
  })

  if (opts.svg === false) return body
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" ` +
    `width="${width}" height="${height}" role="img" ` +
    `aria-label="${shape.shape.name} drawn with ${placed.length} dots">` +
    `${body}</svg>`
  )
}

/**
 * Series values -> dots per series, summing to exactly `count`.
 *
 * Largest remainder, then the same promise the chart makes when it clips a
 * dataset to `maxUnits`: a series with a value keeps at least one dot. A band
 * that rounded away would read as a category that is not in the data at all.
 *
 * @param {number[]} series
 * @param {number} count
 * @returns {number[]}
 */
function share(series, count) {
  const weights = series.map((v) => Math.max(0, v))
  const out = allocate(weights, count)
  for (let i = 0; i < out.length; i++) {
    if (out[i] || !weights[i]) continue
    // Borrow from whoever has most, so the total stays exact.
    let big = 0
    for (let j = 1; j < out.length; j++) if (out[j] > out[big]) big = j
    if (out[big] > 1) {
      out[big]--
      out[i] = 1
    }
  }
  return out
}

/**
 * Which series owns dot `i`, given the per-series dot counts.
 * @param {number[]} shares
 * @param {number} i
 * @returns {number}
 */
function seriesAt(shares, i) {
  let acc = 0
  for (let s = 0; s < shares.length; s++) {
    acc += shares[s]
    if (i < acc) return s
  }
  return shares.length - 1
}

/** @param {number} n */
function round(n) {
  return Math.round(n * 10) / 10
}
