import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import ApexCharts from '../../src/entries/full.js'
import CanvasRenderer from '../../src/renderers/canvas/CanvasRenderer'
import CanvasGraphics from '../../src/renderers/canvas/CanvasGraphics'
import CanvasCompositor from '../../src/renderers/canvas/CanvasCompositor'
import RendererController from '../../src/modules/RendererController'
import Grid from '../../src/modules/axes/Grid'
import { createChartWithOptions } from './utils/utils.js'

/**
 * The canvas renderer paints each series mark through the clip its SVG node
 * would carry (Grid.maskRects), and its canvas reaches as far past the plot
 * as those clips do. On a numeric x axis the bar clip runs a whole
 * `barPadForNumericAxis` past either side, where the outer half of an edge
 * column, candle, box or violin is drawn; the canvas used to stop a small
 * marker margin out and cut that half off. The pixels are compared against
 * the SVG chart end to end in tests/interaction/specs/canvas-plot-edges.spec.js.
 */

const density = [
  [0, 0.02],
  [1, 0.1],
  [2, 0.35],
  [3, 0.5],
  [4, 0.35],
  [5, 0.1],
  [6, 0.02],
]

/** Three violins over category x, which converts to numbers: G1 and G3 sit on the plot's edges. */
function violinOptions(renderer) {
  return {
    chart: { type: 'violin', width: 600, height: 400, renderer },
    series: [
      {
        name: 'A',
        data: ['G1', 'G2', 'G3'].map((x) => ({ x, y: { density } })),
      },
    ],
    plotOptions: { violin: { points: { show: false } } },
    dataLabels: { enabled: false },
  }
}

/** @param {any} el */
const rectOf = (el) =>
  ['x', 'y', 'width', 'height'].reduce(
    (o, k) => ({ ...o, [k]: parseFloat(el.getAttribute(k)) }),
    {},
  )

describe('plot clips: one set of rects for both renderers', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('Grid.maskRects is what the SVG clip paths are drawn with', () => {
    const chart = createChartWithOptions(violinOptions('svg'))
    const w = chart.w
    expect(w.axisFlags.isXNumeric).toBe(true)
    expect(w.globals.barPadForNumericAxis).toBeGreaterThan(20)

    const rects = Grid.maskRects(w)
    // (+ 0 folds a -0 into 0: the attribute reads back unsigned)
    const plain = (r) =>
      Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v + 0]))
    expect(rectOf(w.dom.elGridRect.node)).toEqual(plain(rects.grid))
    expect(rectOf(w.dom.elGridRectBar.node)).toEqual(plain(rects.bar))
    expect(rectOf(w.dom.elGridRectMarker.node)).toEqual(plain(rects.marker))
    // the bar clip reaches past the plot by the numeric-axis bar pad
    expect(rects.bar.x).toBeLessThanOrEqual(-w.globals.barPadForNumericAxis)
    expect(rects.bar.x + rects.bar.width).toBeGreaterThanOrEqual(
      w.layout.gridWidth + w.globals.barPadForNumericAxis,
    )
    chart.destroy()
  })
})

describe('canvas host: reaches as far as the SVG clips', () => {
  beforeAll(() => {
    ApexCharts.registerRenderer(
      'canvas',
      (w, ctx) => new CanvasRenderer(w, ctx),
    )
  })
  afterAll(() => {
    RendererController.unregisterRenderer('canvas')
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('a numeric-x violin chart: the edge violins fit on the canvas whole', () => {
    const chart = createChartWithOptions(violinOptions('canvas'))
    const w = chart.w
    expect(w.globals.activeRenderer.kind).toBe('canvas')
    const fo = rectOf(w.dom.baseEl.querySelector('.apexcharts-canvas-series'))
    const bar = Grid.maskRects(w).bar

    // the old reach, the edge-marker margin, still holds
    const margin = Math.ceil((w.globals.markers.largestSize || 0) + 8)
    expect(fo.x).toBeLessThanOrEqual(-margin)
    expect(fo.y).toBeLessThanOrEqual(-margin)
    // and the canvas spans the bar clip, so the half of G1 and G3 outside
    // the plot is on it
    expect(fo.x).toBeLessThanOrEqual(bar.x)
    expect(fo.x + fo.width).toBeGreaterThanOrEqual(bar.x + bar.width)
    // every violin drawn lies within it
    for (const j of [0, 2]) {
      const b = w.globals.barCanvasCoords[0][j].bounds
      expect(b.left).toBeGreaterThanOrEqual(fo.x)
      expect(b.right).toBeLessThanOrEqual(fo.x + fo.width)
    }
    expect(w.globals.barCanvasCoords[0][0].bounds.left).toBeLessThan(-margin)
    chart.destroy()
  })
})

describe('canvas marks record the clip their SVG node would carry', () => {
  /** @param {Record<string, any>} [globals] */
  function graphics(globals = {}) {
    return new CanvasGraphics({
      config: { series: [] },
      globals,
      layout: { gridWidth: 100, gridHeight: 100 },
    })
  }
  const clipOf = (g) => g.displayList().at(-1).clip

  it('renderPaths: the clip Graphics.renderPaths gives the SVG path', () => {
    const g = graphics()
    g.reset()
    // a line or area: the grid clip
    g.renderPaths({ realIndex: 0, pathTo: 'M 0 0' })
    expect(clipOf(g)).toBe('grid')
    // a column: the bar clip
    g.renderPaths({ realIndex: 0, j: 0, pathTo: 'M 0 0', chartType: 'bar' })
    expect(clipOf(g)).toBe('bar')
    // no clip asked for: none
    g.renderPaths({ realIndex: 0, pathTo: 'M 0 0', shouldClipToGrid: false })
    expect(clipOf(g)).toBe(null)

    const horizontal = graphics({ isBarHorizontal: true })
    horizontal.renderPaths({ realIndex: 0, pathTo: 'M 0', chartType: 'bar' })
    expect(clipOf(horizontal)).toBe('grid')

    const combo = graphics({ comboCharts: true })
    combo.renderPaths({ realIndex: 0, pathTo: 'M 0 0' })
    expect(clipOf(combo)).toBe('bar')
  })

  it('a clip-path set on the mark afterwards, as Bar.renderSeries sets one', () => {
    const g = graphics()
    const mark = g.renderPaths({ realIndex: 0, j: 0, pathTo: 'M 0 0' })
    expect(clipOf(g)).toBe('grid')
    mark.attr('clip-path', 'url(#gridRectBarMask7)')
    expect(clipOf(g)).toBe('bar')
    mark.node.setAttribute('clip-path', 'url(#gridRectMarkerMask7)')
    expect(clipOf(g)).toBe('marker')
    mark.attr({ 'clip-path': 'url(#gridRectMask7)' })
    expect(clipOf(g)).toBe('grid')
    // a clip the canvas does not paint through leaves the mark's as it was
    mark.attr('clip-path', 'url(#forecastMask7)')
    expect(clipOf(g)).toBe('grid')
  })
})

/** A recording stand-in for a CanvasRenderingContext2D. */
function recordingCtx() {
  const log = []
  let depth = 0
  const ctx = {
    log,
    get depth() {
      return depth
    },
    globalAlpha: 1,
    save() {
      depth++
      log.push(['save'])
    },
    restore() {
      depth--
      log.push(['restore'])
    },
    rect(...a) {
      log.push(['rect', ...a])
    },
    clip() {
      log.push(['clip'])
    },
    fill() {
      log.push(['fill', depth])
    },
    stroke() {},
    arc() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    setTransform() {},
    setLineDash() {},
    clearRect() {},
  }
  return ctx
}

describe('canvas paint: each mark through its clip', () => {
  const RealPath2D = globalThis.Path2D
  beforeAll(() => {
    globalThis.Path2D = class {
      /** @param {string} d */
      constructor(d) {
        this.d = d
      }
    }
  })
  afterAll(() => {
    globalThis.Path2D = RealPath2D
  })

  /** A compositor painting into `ctx`, its clips and reach set as createHost sets them. */
  function compositor(ctx) {
    const c = new CanvasCompositor({
      layout: { gridWidth: 100, gridHeight: 80 },
    })
    c._c2d = ctx
    c._canvas = {
      width: 400,
      height: 300,
      style: { width: '400px', height: '300px' },
    }
    c._dpr = 1
    c._pad = { left: 40.5, top: 10, right: 40, bottom: 10 }
    c._clips = {
      grid: { x: -3, y: -3, width: 106, height: 86 },
      bar: { x: -33.25, y: -3, width: 166.5, height: 86 },
      marker: { x: -6, y: -6, width: 112, height: 92 },
    }
    return c
  }

  const markerShim = (n) => ({
    _mx: new Float64Array(n),
    _my: new Float64Array(n),
    _msize: new Float64Array(n).fill(3),
    _mshape: new Int16Array(n),
    _mstyle: new Int32Array(n),
    markerCount: () => n,
    markerStyle: () => ({ fill: '#000' }),
    markerSeries: () => 0,
    rectCount: () => 0,
  })

  it('a run of bars shares one clip, on whole device pixels around the bar rect', () => {
    const ctx = recordingCtx()
    const c = compositor(ctx)
    const bar = (j) => ({
      tag: 'path',
      z: 0,
      d: `M ${j}`,
      fill: '#a',
      clip: 'bar',
    })
    c.paint(
      [
        bar(0),
        bar(1),
        { tag: 'path', z: 1, d: 'M 0', fill: '#b', clip: 'grid' },
      ],
      markerShim(2),
    )

    const clips = ctx.log.filter((e) => e[0] === 'rect')
    // the bar run, the line, then the markers
    expect(clips).toHaveLength(3)
    // (40.5 - 33.25) = 7.25 -> 7, (40.5 - 33.25 + 166.5) = 173.75 -> 174
    expect(clips[0]).toEqual(['rect', 7, 7, 167, 86])
    expect(clips[1]).toEqual(['rect', 37, 7, 107, 86])
    expect(clips[2]).toEqual(['rect', 34, 4, 113, 92])
    // every mark painted inside a clip, and every save restored
    const fills = ctx.log.filter((e) => e[0] === 'fill')
    expect(fills.length).toBe(5)
    expect(fills.every((e) => e[1] === 1)).toBe(true)
    expect(ctx.depth).toBe(0)
  })

  it('an unclipped mark paints unclipped', () => {
    const ctx = recordingCtx()
    const c = compositor(ctx)
    c.paint(
      [{ tag: 'path', z: 0, d: 'M 0', fill: '#a', clip: null }],
      markerShim(0),
    )
    expect(ctx.log.filter((e) => e[0] === 'fill')).toEqual([['fill', 0]])
  })
})

describe('canvas hitTest: a mark is hit only where its clip lets it show', () => {
  const RealPath2D = globalThis.Path2D
  beforeAll(() => {
    globalThis.Path2D = class {
      /** @param {string} d */
      constructor(d) {
        this.d = d
      }
    }
  })
  afterAll(() => {
    globalThis.Path2D = RealPath2D
  })

  it('the part a clip cuts off takes no hover, as off a clipped SVG path', () => {
    const w = {
      config: { series: [{ data: new Array(2) }] },
      layout: { gridWidth: 100, gridHeight: 100 },
      globals: {},
    }
    const r = new CanvasRenderer(w, {})
    r.beginSeries()
    // the paths here are rects, so a point is in one inside the box of its
    // corners
    r._hitCtx = {
      isPointInPath(path, x, y) {
        const n = path.d.match(/-?\d+(\.\d+)?/g).map(Number)
        const xs = n.filter((_, k) => k % 2 === 0)
        const ys = n.filter((_, k) => k % 2 === 1)
        return (
          x >= Math.min(...xs) &&
          x <= Math.max(...xs) &&
          y >= Math.min(...ys) &&
          y <= Math.max(...ys)
        )
      },
    }
    r._compositor._clips = {
      bar: { x: -12, y: -3, width: 124, height: 106 },
    }
    // a column straddling the plot's left edge, wider than the clip reaches
    const mark = r.renderPaths({
      realIndex: 0,
      j: 0,
      pathTo: 'M -40 0 L 10 0 L 10 50 L -40 50 Z',
      fill: '#a',
    })
    mark.attr('clip-path', 'url(#gridRectBarMask1)')

    const hit = { seriesIndex: 0, dataPointIndex: 0 }
    expect(r.hitTest(5, 25)).toMatchObject(hit)
    // past the plot, inside the clip: painted, so hovered
    expect(r.hitTest(-10, 25)).toMatchObject(hit)
    // past the clip: not painted, so not hovered
    expect(r.hitTest(-20, 25)).toBe(null)
  })
})
