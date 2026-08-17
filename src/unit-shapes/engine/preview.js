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

/** @typedef {import('./shape.js').UnitShape} UnitShape */

/**
 * @param {UnitShape} shape
 * @param {object} [opts]
 * @param {number} [opts.count] dots to pack (defaults to the shape's minUnits, or 220)
 * @param {number} [opts.width] viewport width (300)
 * @param {number} [opts.height] viewport height (defaults to width)
 * @param {number} [opts.padding] rect inset in px (0)
 * @param {string | string[]} [opts.fill] one colour, or a ramp handed out in order
 * @param {number} [opts.r] override the dot radius the shape suggests
 * @param {boolean} [opts.svg] wrap in an <svg> element (true); false returns the
 *   dots only, for embedding in a viewport the caller owns
 * @returns {string}
 */
export function preview(shape, opts = {}) {
  const count = Math.max(1, Math.round(opts.count || shape.shape.minUnits || 220))
  const width = opts.width || 300
  const height = opts.height || width
  const pad = opts.padding || 0
  const fills = Array.isArray(opts.fill) ? opts.fill : [opts.fill || '#008FFB']

  /** @type {import('./shape.js').UnitObject[]} */
  const objects = []
  for (let i = 0; i < count; i++) {
    objects.push({
      id: `p:${i}`,
      index: i,
      seriesIndex: 0,
      dataPointIndex: i,
      label: 'preview',
      value: 1,
      datum: undefined,
      // The shapes refine this themselves; it only has to be in the right league.
      r: opts.r || Math.max(1.2, Math.sqrt((width * height) / count) / 2.6),
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
    const fill = fills[Math.floor((i / placed.length) * fills.length)] || fills[0]
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

/** @param {number} n */
function round(n) {
  return Math.round(n * 10) / 10
}
