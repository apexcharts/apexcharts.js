// @ts-check
import Utils from '../../utils/Utils'

/**
 * Shared jitter ("individual observations") overlay used by violin and boxPlot.
 *
 * The whole point is performance: every observation is one sub-path appended to
 * a single <path> per category — never one DOM node per point. Offsets are a
 * deterministic index hash (SSR-safe, no Math.random); points beyond
 * `maxPoints` are stride-thinned. An optional value `colorScale` buckets dots
 * into shades of a ramp (one extra path per shade). The wrap is registered as a
 * delayed element so it reveals gradually after the chart's paths animate.
 *
 * @module common/Jitter
 **/

/**
 * Build the jitter sub-path groups for ONE category. Returns `[]` when points
 * are hidden/absent. Normally one group (single dot colour); with
 * `options.colorScale` the dots are bucketed by value into shade groups, each
 * carrying its ramp colour (fill set). Groups with `fill: null` inherit the
 * caller's resolved default colour.
 *
 * @param {{
 *   w: any,
 *   points: number[] | undefined,
 *   seedA: number,
 *   seedB: number,
 *   center: number,
 *   halfExtent: number,
 *   alongFn: (v:number)=>number,
 *   isHorizontal: boolean,
 *   options: any,
 *   clampAt?: ((v:number)=>number) | null,
 * }} o
 * @returns {{fill:string|null, d:string}[]}
 */
export function buildJitterGroups({
  w,
  points,
  seedA,
  seedB,
  center,
  halfExtent,
  alongFn,
  isHorizontal,
  options,
  clampAt,
}) {
  const opts = options
  if (!opts || opts.show === false) return []
  if (!points || !points.length) return []

  const maxPoints = opts.maxPoints || 3000
  const stride =
    points.length > maxPoints ? Math.ceil(points.length / maxPoints) : 1
  const r = opts.size != null ? opts.size : 2.5
  const jitterFrac = opts.jitter != null ? opts.jitter : 0.5
  const jitterPx = halfExtent * jitterFrac
  const constrain = opts.constrainToViolin !== false && typeof clampAt === 'function'
  const isSquare = opts.shape === 'square'

  // Optional value colour-scale → bucket dots into shades of a colour ramp.
  const scale = opts.colorScale
  const useScale =
    scale && Array.isArray(scale.colors) && scale.colors.length > 0
  const steps = useScale ? Math.max(2, scale.steps || 24) : 1
  const sMin = useScale && scale.min != null ? scale.min : w.globals.minY
  const sMax = useScale && scale.max != null ? scale.max : w.globals.maxY
  const span = sMax - sMin || 1
  /** @type {string[]} */
  const buckets = useScale ? new Array(steps).fill('') : ['']

  for (let k = 0; k < points.length; k += stride) {
    const v = points[k]
    const a = alongFn(v)
    let off = (hash01(seedA * 7919 + seedB * 100003 + k) - 0.5) * 2 * jitterPx
    if (constrain) {
      const cap = /** @type {(v:number)=>number} */ (clampAt)(v)
      if (off > cap) off = cap
      if (off < -cap) off = -cap
    }
    const px = isHorizontal ? a : center + off
    const py = isHorizontal ? center + off : a
    const sub = isSquare ? squareSubPath(px, py, r) : circleSubPath(px, py, r)

    if (useScale) {
      let t = (v - sMin) / span
      if (t < 0) t = 0
      if (t > 1) t = 1
      buckets[Math.round(t * (steps - 1))] += sub
    } else {
      buckets[0] += sub
    }
  }

  if (!useScale) {
    return buckets[0] ? [{ fill: null, d: buckets[0] }] : []
  }
  /** @type {{fill:string|null, d:string}[]} */
  const groups = []
  for (let b = 0; b < steps; b++) {
    if (!buckets[b]) continue
    groups.push({
      fill: rampColorAt(scale.colors, b / (steps - 1)),
      d: buckets[b],
    })
  }
  return groups
}

/**
 * Render the per-category jitter paths inside a single delayed-reveal wrap.
 * Resolves each path's fill: a value colour-scale group wins; otherwise the
 * `fillColor` option — 'series' (category colour), 'series-dark' (a darker
 * shade of it), or any literal colour string.
 *
 * @param {{
 *   graphics: any,
 *   w: any,
 *   elSeries: any,
 *   pointsByCat: {groups:{fill:string|null,d:string}[], j:number}[],
 *   options: any,
 *   distributed: boolean,
 *   realIndex: number,
 *   wrapClass: string,
 *   pointClass: string,
 * }} o
 */
export function renderJitter({
  graphics,
  w,
  elSeries,
  pointsByCat,
  options,
  distributed,
  realIndex,
  wrapClass,
  pointClass,
}) {
  if (!options || options.show === false || !pointsByCat.length) return

  const pOpacity = options.opacity != null ? options.opacity : 0.9
  const strokeColor = options.strokeColor != null ? options.strokeColor : '#fff'
  const strokeW = options.strokeWidth != null ? options.strokeWidth : 1

  // Jitter is an overlay over the chart paths. On the INITIAL animated mount it
  // should reveal gradually (like markers / data labels), so hide it and
  // register it as a delayed element — Animations.showDelayedElements() reveals
  // it once the path-grow animation completes. On any re-render (zoom/update,
  // where dataChanged is set) or when animations are off, there is no animation
  // to reveal it, so draw it visible immediately — otherwise it would stay
  // stuck at opacity:0 (jitter disappearing on zoom).
  const willAnimateIn =
    w.config.chart.animations.enabled &&
    !w.globals.resized &&
    !w.globals.dataChanged
  const elPointsWrap = graphics.group({
    class: willAnimateIn ? `${wrapClass} apexcharts-element-hidden` : wrapClass,
  })
  if (willAnimateIn) {
    w.globals.delayedElements.push({ el: elPointsWrap.node })
  }

  pointsByCat.forEach(({ groups, j }) => {
    const catColor = distributed
      ? w.globals.colors[j]
      : w.globals.colors[realIndex]
    const fc = options.fillColor
    const defaultFill =
      fc === 'series'
        ? catColor
        : fc === 'series-dark'
          ? darkenColor(catColor, 0.45)
          : fc || darkenColor(catColor, 0.45)

    groups.forEach((g) => {
      const elPoints = graphics.drawPath({
        d: g.d,
        fill: g.fill != null ? g.fill : defaultFill,
        stroke: strokeW > 0 ? strokeColor : 'none',
        strokeWidth: strokeW,
        fillOpacity: pOpacity,
        classes: pointClass,
      })
      elPoints.attr('data:realIndex', realIndex)
      elPoints.attr('j', j)
      // Widened bar mask (same as the body) so dots on the outer half of edge
      // categories aren't clipped at the grid boundary.
      elPoints.attr('clip-path', `url(#gridRectBarMask${w.globals.cuid})`)
      // Decorative overlay — must not capture pointer events, otherwise hovering
      // the dots disrupts the body's hover state and the shared tooltip.
      elPoints.node.style.pointerEvents = 'none'
      elPointsWrap.add(elPoints)
    })
  })

  elSeries.add(elPointsWrap)
}

/**
 * Darken a colour toward black by `amount` (0 = unchanged, 1 = black),
 * returning an `rgb(...)` string. Falls back to the input when it can't be
 * parsed as hex.
 * @param {string} color hex colour
 * @param {number} amount 0..1
 * @returns {string}
 */
export function darkenColor(color, amount) {
  const rgb = Utils.parseHex(color)
  if (!rgb) return color
  const f = Math.max(0, 1 - amount)
  return `rgb(${Math.round(rgb[0] * f)},${Math.round(rgb[1] * f)},${Math.round(rgb[2] * f)})`
}

/**
 * Linearly interpolate a multi-stop colour ramp (hex stops) at t ∈ [0,1],
 * returning an `rgb(...)` string.
 * @param {string[]} colors hex stops, low → high
 * @param {number} t
 * @returns {string}
 */
export function rampColorAt(colors, t) {
  if (!colors.length) return '#000'
  if (colors.length === 1) return colors[0]
  const x = Math.max(0, Math.min(1, t)) * (colors.length - 1)
  const i = Math.floor(x)
  const frac = x - i
  const c0 = Utils.parseHex(colors[i]) || [0, 0, 0]
  const c1 = Utils.parseHex(colors[Math.min(i + 1, colors.length - 1)]) || c0
  /** @param {number} a @param {number} b */
  const mix = (a, b) => Math.round(a + (b - a) * frac)
  return `rgb(${mix(c0[0], c1[0])},${mix(c0[1], c1[1])},${mix(c0[2], c1[2])})`
}

/**
 * Stable hash of an integer → float in [0, 1). Deterministic jitter offsets so
 * output is identical across renders and SSR (no Math.random).
 * @param {number} n
 * @returns {number}
 */
export function hash01(n) {
  let h = (n ^ 0x9e3779b9) >>> 0
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/**
 * A full circle of radius r at (px, py) as two arc sub-commands.
 * @param {number} px @param {number} py @param {number} r
 */
export function circleSubPath(px, py, r) {
  return `M ${px - r} ${py} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 `
}

/**
 * A square of half-size r centered at (px, py).
 * @param {number} px @param {number} py @param {number} r
 */
export function squareSubPath(px, py, r) {
  return `M ${px - r} ${py - r} h ${2 * r} v ${2 * r} h ${-2 * r} z `
}
