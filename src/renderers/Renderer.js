// @ts-check
/**
 * Strata (#2): the `Renderer` interface and shared selection helpers.
 *
 * The interface abstracts emit, identity, state, and export for the SERIES
 * layer. Both the SVG path (today) and the opt-in Canvas path implement it;
 * Prism (#20, WebGPU) will too. Keeping this contract right is the whole point
 * of sequencing Strata into the foundation: Marks (#11) emit through it and
 * Weave (#1) `api.layer` targets it.
 *
 * P1 ships the interface + selection + the SVG adapter (core, ~zero weight: it
 * wraps the Graphics/Fill/Filters that already ship). The Canvas renderer is a
 * separate tree-shakeable feature (`apexcharts/features/renderer-canvas`); when
 * it is not bundled, selection falls back to SVG.
 *
 * @module renderers/Renderer
 *
 * @typedef {'svg'|'canvas'|'gpu'} RendererKind
 *
 * @typedef {object} Renderer
 * @property {RendererKind} kind
 * @property {() => void} beginSeries          Start a fresh series layer for a render pass.
 * @property {() => any} present               Finalize; returns what mount()/fastUpdate() insert.
 * @property {() => void} clear                Wipe the series layer (fast path).
 * @property {(attrs: any) => any} group
 * @property {(opts: any) => any} drawPath
 * @property {(...args: any[]) => any} drawLine
 * @property {(...args: any[]) => any} drawRect
 * @property {(r: number, attrs: any) => any} drawCircle
 * @property {(x: number, y: number, opts: any) => any} drawMarker
 * @property {(opts: any) => any} renderPaths  High-level series path (animation-aware).
 * @property {(opts: any) => any} drawText     Series-attached text only (axis/label text stays SVG).
 * @property {(feature: string) => boolean} supports
 * @property {(px: number, py: number) => ({seriesIndex:number,dataPointIndex:number}|null)} hitTest
 * @property {(target: any, style: any) => void} restyle
 * @property {() => ({dataURL:string,x:number,y:number,w:number,h:number}|null)} toBitmap
 * @property {() => void} destroy
 */

/** Canvas cannot reproduce these; their presence forces SVG. */
const OK_FILTER_TYPES = ['none', 'lighten', 'darken']

/**
 * The active series emit target. In canvas (and, later, gpu) mode series marks
 * are RECORDED through `ctx.renderer`; in SVG mode we return the caller's own
 * `Graphics` instance untouched, so the SVG render path is byte-for-byte the
 * same as before Strata (the P1 promise). Only leaf mark calls (`renderPaths`,
 * `drawMarker`) are diverted: structural groups, string builders, and chrome
 * stay on `Graphics`.
 *
 * @param {any} ctx
 * @param {any} graphics The SVG-path fallback (a `new Graphics(w)` the caller already holds).
 * @returns {any}
 */
export function seriesEmitter(ctx, graphics) {
  const r = ctx && ctx.renderer
  return r && r.kind && r.kind !== 'svg' ? r : graphics
}

/**
 * Count the marks a render will emit: markers, data labels, and scatter/bubble
 * points: NOT the raw data length. The spike showed the SVG node-count killer
 * is per-point decorations, not the series line: a bare line/area path is O(1)
 * nodes. A separate large-`d` trigger still routes a giant plain line to canvas.
 *
 * @param {any} w
 * @returns {number}
 */
export function computeMarkCount(w) {
  const series = w.config.series || []
  const type = w.config.chart.type
  const scatterish = type === 'scatter' || type === 'bubble'

  const markerSize = w.config.markers && w.config.markers.size
  const markersOn = Array.isArray(markerSize)
    ? markerSize.some((s) => s > 0)
    : (markerSize || 0) > 0
  const labelsOn = !!(w.config.dataLabels && w.config.dataLabels.enabled)

  let total = 0
  let maxLen = 0
  series.forEach((/** @type {any} */ s) => {
    const n = Array.isArray(s.data) ? s.data.length : 0
    if (n > maxLen) maxLen = n
    if (scatterish || markersOn) total += n
    if (labelsOn) total += n
  })
  // Marks (#11): custom series are NOT auto-promoted. Their per-datum primitives
  // are object commands (no columnar fast path), so canvas paint is only fast at
  // low/moderate density; auto-promoting at the threshold would regress. Users
  // opt in explicitly with renderer:'canvas' when their renderItem is cheap.

  // Even a bare line/area re-rasterizes slowly with a huge `d` on zoom.
  const LARGE_D = 50000
  if (maxLen >= LARGE_D) total = Math.max(total, maxLen)
  return total
}

/**
 * Whether the config uses a feature the canvas renderer cannot reproduce
 * (pattern/image fill, or a state color-matrix filter beyond lighten/darken).
 * Their presence makes `'auto'` decline canvas and `'canvas'` warn + fall back.
 *
 * @param {any} w
 * @returns {boolean}
 */
export function hasCanvasUnsupportedFeature(w) {
  const fillType = w.config.fill && w.config.fill.type
  // 'gradient' is included as a P2 gate, not a hard limit: canvas CAN paint
  // gradients, but the P2 canvas renderer ships solid fills only (gradient
  // reconstruction via Fill.getFillDescriptor is the P2.1 fast-follow). Until
  // then a gradient chart routes to SVG. pattern/image are genuine v1 non-goals.
  const isUnsupportedFill = (/** @type {any} */ t) =>
    t === 'pattern' || t === 'image' || t === 'gradient'
  if (
    Array.isArray(fillType)
      ? fillType.some(isUnsupportedFill)
      : isUnsupportedFill(fillType)
  ) {
    return true
  }

  // Multi-color line (colorAboveThreshold/BelowThreshold) is drawn via a
  // gradient internally: same P2 gate as above.
  const lineColors = w.config.plotOptions?.line?.colors
  if (lineColors && lineColors.colorAboveThreshold && lineColors.colorBelowThreshold) {
    return true
  }

  const states = w.config.states || {}
  const hoverFilter = states.hover && states.hover.filter && states.hover.filter.type
  const activeFilter =
    states.active && states.active.filter && states.active.filter.type
  if (hoverFilter && !OK_FILTER_TYPES.includes(hoverFilter)) return true
  if (activeFilter && !OK_FILTER_TYPES.includes(activeFilter)) return true

  return false
}
