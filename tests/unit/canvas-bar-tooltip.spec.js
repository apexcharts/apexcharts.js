import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import CanvasRenderer from '../../src/renderers/canvas/CanvasRenderer'
import CanvasGraphics, {
  pathBox,
} from '../../src/renderers/canvas/CanvasGraphics'
import Intersect from '../../src/modules/tooltip/Intersect'
import TooltipUtils from '../../src/modules/tooltip/Utils'
import Series from '../../src/modules/Series'
import { createChartWithOptions } from './utils/utils.js'
// The canvas renderer is an opt-in feature, not part of `entries/standard.js`.
import '../../src/features/renderer-canvas.js'

/**
 * Bar-likes painted to canvas: bars, range bars (timelines, dumbbells,
 * waterfalls), candlesticks, OHLC bars, box plots and violins.
 *
 * With `tooltip.intersect` the SVG chart hovers the mark's own path; painted,
 * there was no path, so nothing was hovered and no tooltip ever showed. The
 * renderer now finds the painted path under the pointer, fill or stroke as
 * the browser does an SVG one, and hands back the box that path spans, and
 * the coords cached for the datum carry what the path's attributes would.
 * The shared tooltip and the keyboard read the same cache, the way they read
 * the SVG paths. Placement against the painted page is covered end to end in
 * tests/interaction/specs/canvas-bar-tooltip.spec.js.
 */

describe('pathBox: the box a recorded path spans', () => {
  it('spans the points of absolute and relative moves and lines', () => {
    expect(pathBox('M 10 20 L 30 5 L 25 40 Z')).toEqual({
      x: 10,
      y: 5,
      width: 20,
      height: 35,
    })
    expect(pathBox('m 10 10 l 5 0 l 0 5 z')).toEqual({
      x: 10,
      y: 10,
      width: 5,
      height: 5,
    })
    // pairs after a move are lines
    expect(pathBox('M 0 0 10 10')).toEqual({
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    })
  })

  it('follows the current point through H and V', () => {
    expect(pathBox('M 10 10 H 40 V 30')).toEqual({
      x: 10,
      y: 10,
      width: 30,
      height: 20,
    })
    expect(pathBox('M 10 10 h 5 v -4')).toEqual({
      x: 10,
      y: 6,
      width: 5,
      height: 4,
    })
  })

  it('counts curve handles, an arc by its ends, and reads exponents', () => {
    expect(pathBox('M 0 0 Q 10 -5 20 0')).toEqual({
      x: 0,
      y: -5,
      width: 20,
      height: 5,
    })
    expect(pathBox('M 0 0 C 0 -2 10 -2 10 0')).toEqual({
      x: 0,
      y: -2,
      width: 10,
      height: 2,
    })
    expect(pathBox('M 0 0 A 5 5 0 0 1 10 0')).toEqual({
      x: 0,
      y: 0,
      width: 10,
      height: 0,
    })
    expect(pathBox('M 1e1 2 L 3 4.5e-1')).toEqual({
      x: 3,
      y: 0.45,
      width: 7,
      height: 1.55,
    })
  })

  it('is null for a path that draws nothing', () => {
    expect(pathBox('')).toBeNull()
    expect(pathBox(undefined)).toBeNull()
    expect(pathBox('0 0 10 10')).toBeNull()
  })
})

describe('a recorded mark measures like an SVG path', () => {
  it('bbox() is the box its path spans, and follows a new path', () => {
    const g = new CanvasGraphics({ config: { series: [] }, globals: {} })
    g.reset()
    const mark = g.renderPaths({ realIndex: 0, j: 0, pathTo: 'M 5 5 L 15 25' })
    expect(mark.bbox()).toEqual({ x: 5, y: 5, width: 10, height: 20 })
    expect(mark.node.getBBox()).toEqual({ x: 5, y: 5, width: 10, height: 20 })
    mark.plot('M 0 0 L 4 4')
    expect(mark.bbox()).toEqual({ x: 0, y: 0, width: 4, height: 4 })
    // anything but a path keeps the empty box it always had
    expect(g.drawText({ text: 'a', x: 3, y: 3 }).bbox()).toEqual({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    })
  })
})

describe('canvas hitTest and findMark on bar-like marks', () => {
  // jsdom has no Path2D and no 2D context, so stand in for both, for paths
  // of straight segments: the fill is the polygon they close (even-odd, so
  // a wick drawn up and back again encloses nothing), the stroke lineWidth
  // around them.
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

  const segments = (d) => {
    const n = d.match(/-?\d+(\.\d+)?/g).map(Number)
    const out = []
    for (let k = 2; k + 1 < n.length; k += 2) {
      out.push([n[k - 2], n[k - 1], n[k], n[k + 1]])
    }
    return out
  }
  const nearSegment = (x, y, [x1, y1, x2, y2], reach) => {
    const dx = x2 - x1
    const dy = y2 - y1
    const len = dx * dx + dy * dy
    const t = len
      ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / len))
      : 0
    return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy)) <= reach
  }

  function renderer() {
    const w = {
      config: { series: [{ data: new Array(4) }] },
      layout: { gridWidth: 100, gridHeight: 100 },
      globals: {},
    }
    const r = new CanvasRenderer(w, {})
    r.beginSeries()
    const ctx = {
      lineWidth: 1,
      widths: [],
      isPointInPath(path, x, y) {
        const n = path.d.match(/-?\d+(\.\d+)?/g).map(Number)
        let inside = false
        for (let k = 0, m = n.length - 2; k < n.length; m = k, k += 2) {
          const [xi, yi, xj, yj] = [n[k], n[k + 1], n[m], n[m + 1]]
          if (
            yi > y !== yj > y &&
            x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
          ) {
            inside = !inside
          }
        }
        return inside
      },
      isPointInStroke(path, x, y) {
        this.widths.push(this.lineWidth)
        return segments(path.d).some((s) =>
          nearSegment(x, y, s, this.lineWidth / 2),
        )
      },
    }
    r._hitCtx = ctx
    return { r, ctx }
  }

  // a candle: body 10..20 x 40..60, wick from 20 up to 80 at x 15
  const CANDLE =
    'M 10 40 L 15 40 L 15 20 L 15 40 L 20 40 L 20 60 L 15 60 L 15 80 L 15 60 L 10 60 L 10 40'

  it('resolves a mark by its fill and hands back the box of its path', () => {
    const { r } = renderer()
    r.renderPaths({
      realIndex: 0,
      j: 0,
      pathTo: 'M 0 0 L 10 0 L 10 50 L 0 50 Z',
      fill: '#a',
    })
    r.renderPaths({
      realIndex: 1,
      j: 3,
      pathTo: CANDLE,
      fill: '#b',
      stroke: '#333',
      strokeWidth: 1,
    })
    expect(r.hitTest(5, 25)).toEqual({
      seriesIndex: 0,
      dataPointIndex: 0,
      x: 0,
      y: 0,
      width: 10,
      height: 50,
    })
    // the candle's box takes in its wicks, as an SVG path's does
    expect(r.hitTest(12, 50)).toEqual({
      seriesIndex: 1,
      dataPointIndex: 3,
      x: 10,
      y: 20,
      width: 10,
      height: 60,
    })
  })

  it("finds a wick, which is stroke alone, at the mark's stroke width", () => {
    const { r, ctx } = renderer()
    r.renderPaths({
      realIndex: 0,
      j: 3,
      pathTo: CANDLE,
      fill: '#b',
      stroke: '#333',
      strokeWidth: 2,
    })
    // on the upper wick, well clear of the body
    expect(r.hitTest(15.8, 28)).toMatchObject({
      seriesIndex: 0,
      dataPointIndex: 3,
    })
    expect(ctx.widths.at(-1)).toBe(2)
    // beside it, past half the stroke
    expect(r.hitTest(17, 28)).toBeNull()
  })

  it('finds no stroke that is not painted', () => {
    const { r } = renderer()
    r.renderPaths({
      realIndex: 0,
      j: 3,
      pathTo: CANDLE,
      fill: '#b',
      stroke: 'none',
      strokeWidth: 2,
    })
    r.renderPaths({
      realIndex: 0,
      j: 4,
      pathTo: 'M 15 20 L 15 0',
      fill: 'none',
      stroke: '#333',
      strokeWidth: 0,
    })
    expect(r.hitTest(15, 28)).toBeNull()
    expect(r.hitTest(15, 10)).toBeNull()
  })

  it('findMark: the first path recorded for the point, with its box and path', () => {
    const { r } = renderer()
    // a series-wide path (a line) records no `j`
    r.renderPaths({ realIndex: 0, pathTo: 'M 0 0 L 100 100', fill: 'none' })
    // a box plot's two halves, lower first
    const lower = 'M 10 50 L 20 50 L 20 40 L 10 40 Z'
    r.renderPaths({ realIndex: 0, j: 1, pathTo: lower, fill: '#a' })
    r.renderPaths({
      realIndex: 0,
      j: 1,
      pathTo: 'M 10 40 L 20 40 L 20 30 L 10 30 Z',
      fill: '#b',
    })
    expect(r.findMark(0, 1)).toEqual({
      seriesIndex: 0,
      dataPointIndex: 1,
      x: 10,
      y: 40,
      width: 10,
      height: 10,
      d: lower,
    })
    expect(r.findMark(0, 2)).toBeNull()
    expect(r.findMark(1, 1)).toBeNull()
  })
})

describe('the coords cached for a painted mark are what its SVG path says', () => {
  const boxData = [
    { x: 'A', y: [10, 20, 30, 40, 50] },
    { x: 'B', y: [15, 25, 35, 45, 55] },
    { x: 'C', y: [5, 22, 31, 38, 60] },
  ]
  const candleData = [
    { x: 'A', y: [30, 50, 20, 40] },
    { x: 'B', y: [40, 45, 25, 30] },
    { x: 'C', y: [30, 60, 28, 55] },
  ]
  const rangeData = [
    { x: 'A', y: [10, 30] },
    { x: 'B', y: [20, 45] },
    { x: 'C', y: [5, 25] },
  ]
  const CASES = [
    ['boxPlot', boxData, {}],
    ['boxPlot', boxData, { plotOptions: { bar: { horizontal: true } } }],
    ['candlestick', candleData, {}],
    [
      'candlestick',
      candleData,
      { plotOptions: { candlestick: { type: 'ohlc' } } },
    ],
    ['rangeBar', rangeData, {}],
    ['bar', [3, 7, 5], {}],
  ]

  function chart(type, data, extra, renderer) {
    return createChartWithOptions({
      chart: { type, width: 600, height: 400, renderer },
      series: [{ name: 'S', data }],
      dataLabels: { enabled: false },
      ...extra,
    })
  }

  for (const [type, data, extra] of CASES) {
    const label = `${type}${extra.plotOptions ? ' ' + JSON.stringify(extra.plotOptions) : ''}`
    it(`${label}: type, cx/cy, barWidth, range ends and the painted extent`, () => {
      const svg = chart(type, data, extra, 'svg')
      const group = svg.el.querySelector('.apexcharts-series')
      expect(group.getAttribute('data:realIndex')).toBe('0')
      const expected = [0, 1, 2].map((j) => {
        const paths = [...group.querySelectorAll(`path[j='${j}']`)]
        const first = paths[0]
        const boxes = paths.map((p) => pathBox(p.getAttribute('d')))
        return {
          j,
          className: first.getAttribute('class'),
          cx: Number(first.getAttribute('cx')),
          cy: Number(first.getAttribute('cy')),
          barWidth: Number(first.getAttribute('barWidth')),
          y1: first.getAttribute('data-range-y1'),
          y2: first.getAttribute('data-range-y2'),
          bounds: {
            left: Math.min(...boxes.map((b) => b.x)),
            top: Math.min(...boxes.map((b) => b.y)),
            right: Math.max(...boxes.map((b) => b.x + b.width)),
            bottom: Math.max(...boxes.map((b) => b.y + b.height)),
          },
        }
      })
      svg.destroy()

      const canvas = chart(type, data, extra, 'canvas')
      expect(canvas.w.globals.activeRenderer.kind).toBe('canvas')
      for (const e of expected) {
        const c = canvas.w.globals.barCanvasCoords[0][e.j]
        expect(e.className, `j ${e.j}`).toBeTruthy()
        expect(e.className).toContain(`apexcharts-${c.type}-area`)
        expect(c.cx).toBeCloseTo(e.cx, 6)
        expect(c.cy).toBeCloseTo(e.cy, 6)
        // a horizontal mark has no width to carry, on either renderer
        expect(c.barWidth ?? 0).toBeCloseTo(e.barWidth, 6)
        expect(c.rangeY1 == null ? null : String(c.rangeY1)).toBe(e.y1)
        expect(c.rangeY2 == null ? null : String(c.rangeY2)).toBe(e.y2)
        for (const k of ['left', 'top', 'right', 'bottom']) {
          expect(c.bounds[k]).toBeCloseTo(e.bounds[k], 6)
        }
      }
      canvas.destroy()
    })
  }
})

describe('which charts hover their bar-likes through the hit test', () => {
  const w = (type, series, kind = 'canvas') => ({
    config: { chart: { type }, series },
    globals: { activeRenderer: { kind, hitTest: () => null } },
  })

  it('every bar-like chart type, and a bar-like series in a combo', () => {
    for (const type of [
      'bar',
      'rangeBar',
      'candlestick',
      'boxPlot',
      'violin',
    ]) {
      expect(TooltipUtils.isCanvasBarChart(w(type, [{}])), type).toBe(true)
    }
    expect(
      TooltipUtils.isCanvasBarChart(
        w('line', [{ type: 'line' }, { type: 'column' }]),
      ),
    ).toBe(true)
    expect(
      TooltipUtils.isCanvasBarChart(
        w('line', [{ type: 'line' }, { type: 'area' }]),
      ),
    ).toBe(false)
    expect(TooltipUtils.isCanvasBarChart(w('heatmap', [{}]))).toBe(false)
  })

  it('only when they are painted', () => {
    expect(TooltipUtils.isCanvasBarChart(w('boxPlot', [{}], 'svg'))).toBe(false)
    // a violin is one of them
    expect(TooltipUtils.isCanvasViolinChart(w('violin', [{}]))).toBe(true)
    expect(TooltipUtils.isCanvasViolinChart(w('boxPlot', [{}]))).toBe(false)
  })

  it('a canvas box plot with an intersect tooltip listens on the whole plot', () => {
    const opts = (renderer) => ({
      chart: { type: 'boxPlot', width: 600, height: 400, renderer },
      series: [{ data: [{ x: 'A', y: [10, 20, 30, 40, 50] }] }],
      tooltip: { shared: false, intersect: true },
    })
    const listened = (chart) => {
      const tt = chart.w.globals.tooltip
      const spy = vi.spyOn(tt, 'addPathsEventListeners')
      tt.addSVGEvents()
      return spy.mock.calls.map(([paths]) => [...paths])
    }
    const svg = createChartWithOptions(opts('svg'))
    // on SVG, each half of the box is hovered itself
    expect(listened(svg)[0].length).toBe(2)
    svg.destroy()
    const canvas = createChartWithOptions(opts('canvas'))
    const calls = listened(canvas)
    expect(calls[0]).toEqual([canvas.w.dom.Paper.node])
    canvas.destroy()
  })
})

describe('Intersect.getPaintedMark', () => {
  /**
   * An Intersect over a stub canvas chart whose svg is drawn `svgWidth` wide
   * and measured `measuredWidth` wide (a CSS zoom), its corner at (100, 50)
   * and the plot translated (40, 30) into it.
   */
  function stub({ hit, cached, measuredWidth = 300 }) {
    const elWrap = document.createElement('div')
    elWrap.getBoundingClientRect = () => ({
      left: 100,
      top: 50,
      width: 400,
      height: 300,
    })
    const svg = document.createElement('div')
    svg.getBoundingClientRect = () => ({
      left: 100,
      top: 50,
      width: measuredWidth,
      height: 300,
    })
    const hitTest = vi.fn(() => hit)
    const w = {
      config: { chart: { type: 'boxPlot' }, series: [], tooltip: {} },
      globals: {
        activeRenderer: { kind: 'canvas', hitTest },
        svgWidth: 400,
        barCanvasCoords: cached ? { 0: { 2: cached } } : null,
      },
      layout: {
        translateX: 40,
        translateY: 30,
        gridWidth: 300,
        gridHeight: 200,
      },
      dom: {
        elWrap,
        baseEl: document.createElement('div'),
        Paper: { node: svg },
      },
    }
    const it = Object.create(Intersect.prototype)
    it.w = w
    it.ttCtx = { w }
    return { it, hitTest }
  }
  // zoom 0.75: the plot corner on screen at (100 + 30, 50 + 22.5)
  const at = (x, y) => ({
    type: 'mousemove',
    clientX: 130 + x * 0.75,
    clientY: 72.5 + y * 0.75,
  })

  it('reads the hit path off the renderer and the datum off the cache, as the SVG path is read', () => {
    const { it: i, hitTest } = stub({
      hit: {
        seriesIndex: 0,
        dataPointIndex: 2,
        x: 40,
        y: 10,
        width: 20,
        height: 100,
      },
      cached: {
        cx: 50.7,
        cy: 60.2,
        barWidth: 20,
        type: 'rangebar',
        rangeY1: 0,
        rangeY2: 12,
        bounds: { left: 40, top: 0, right: 60, bottom: 110 },
      },
    })
    const mark = i.getPaintedMark(at(50, 60), {})
    expect(hitTest).toHaveBeenCalledWith(50, 60)
    expect(mark).toMatchObject({ i: 0, j: 2, byHitTest: true, barWidth: 20 })
    // cx/cy are read back the way an attribute is, with parseInt
    expect(mark.cx).toBe(50)
    expect(mark.cy).toBe(60)
    // a range starting at 0 is a range end, not a missing one
    expect(mark.y1).toBe(0)
    expect(mark.y2).toBe(12)
    // the box of the path hit, not the datum's whole extent
    expect(mark.rect.left).toBeCloseTo(130 + 40 * 0.75)
    expect(mark.rect.top).toBeCloseTo(72.5 + 10 * 0.75)
    expect(mark.rect.right).toBeCloseTo(130 + 60 * 0.75)
    expect(mark.rect.bottom).toBeCloseTo(72.5 + 110 * 0.75)
  })

  it('is no hit off every mark, or on one nothing was cached for', () => {
    expect(
      stub({ hit: null, cached: null }).it.getPaintedMark(at(5, 5), {}),
    ).toEqual({
      noHit: true,
    })
    expect(
      stub({
        hit: {
          seriesIndex: 0,
          dataPointIndex: 2,
          x: 0,
          y: 0,
          width: 1,
          height: 1,
        },
        cached: null,
      }).it.getPaintedMark(at(5, 5), {}),
    ).toEqual({ noHit: true })
  })

  it('reads a violin as its whole glyph', () => {
    const { it: i } = stub({
      hit: {
        seriesIndex: 0,
        dataPointIndex: 2,
        x: 45,
        y: 20,
        width: 10,
        height: 10,
      },
      cached: {
        cx: 50,
        bodyCx: 48,
        cy: 60,
        barWidth: 20,
        type: 'violin',
        bounds: { left: 40, top: 10, right: 60, bottom: 110 },
      },
    })
    const glyph = vi
      .spyOn(i, 'violinGlyphRect')
      .mockReturnValue({ left: 1, top: 2, right: 3, bottom: 4 })
    const mark = i.getPaintedMark(at(50, 25), {})
    expect(glyph).toHaveBeenCalledWith(0, 2, null)
    expect(mark).toMatchObject({ i: 0, j: 2, cx: 48, cy: 60, byHitTest: true })
    expect(mark.rect).toMatchObject({ left: 1, top: 2, right: 3, bottom: 4 })
  })
})

describe('the shared tooltip over painted marks sits where the SVG chart puts it', () => {
  /** Where the shared box goes over mark `j` with series `s` hovered. */
  function place(options, renderer, j, s) {
    const chart = createChartWithOptions({
      ...options,
      chart: { ...options.chart, width: 600, height: 400, renderer },
    })
    expect(chart.w.globals.activeRenderer.kind).toBe(renderer)
    const pos = chart.w.globals.tooltip.tooltipPosition
    const band = vi.spyOn(pos, 'moveXCrosshairs')
    const move = vi.spyOn(pos, 'moveTooltip').mockImplementation(() => {})
    pos.moveStickyTooltipOverBars(j, s)
    const out = { band: band.mock.calls[0]?.[0], move: move.mock.calls[0] }
    chart.destroy()
    return out
  }

  const boxes = (shift) => [
    { x: 'A', y: [10 + shift, 20, 30, 40, 50] },
    { x: 'B', y: [15, 25 + shift, 35, 45, 55] },
    { x: 'C', y: [5, 22, 31 + shift, 38, 60] },
  ]

  it('box plots with jitter: across from the category, down from the series the SVG query picks', () => {
    // A box plot's jitter stays SVG and carries the box's `j`: it is no box.
    const options = {
      chart: { type: 'boxPlot' },
      series: [
        {
          name: 'S1',
          data: boxes(0).map((d) => ({ ...d, points: [20, 30, 40] })),
        },
        {
          name: 'S2',
          data: boxes(2).map((d) => ({ ...d, points: [21, 31, 41] })),
        },
      ],
      plotOptions: { boxPlot: { points: { show: true } } },
    }
    for (const s of [0, 1]) {
      const svg = place(options, 'svg', 1, s)
      const canvas = place(options, 'canvas', 1, s)
      expect(canvas.band).toBeCloseTo(svg.band, 6)
      expect(canvas.move[0]).toBeCloseTo(svg.move[0], 6)
      expect(canvas.move[1]).toBeCloseTo(svg.move[1], 6)
    }
  })

  it('candlesticks on a datetime axis: half a candle back from the cached cx, as from the attribute', () => {
    const t0 = Date.UTC(2024, 0, 1)
    const day = 86400000
    const options = {
      chart: { type: 'candlestick' },
      xaxis: { type: 'datetime' },
      series: [
        {
          data: [
            [30, 50, 20, 40],
            [40, 45, 25, 30],
            [30, 60, 28, 55],
            [55, 70, 50, 52],
          ].map((y, k) => ({ x: t0 + k * day, y })),
        },
      ],
    }
    const svg = place(options, 'svg', 2, 0)
    const canvas = place(options, 'canvas', 2, 0)
    expect(svg.band).toBeTypeOf('number')
    expect(canvas.band).toBeCloseTo(svg.band, 6)
    expect(canvas.move[0]).toBeCloseTo(svg.move[0], 6)
    expect(canvas.move[1]).toBeCloseTo(svg.move[1], 6)
  })
})

describe('keyboard focus on a painted bar-like', () => {
  function chart(type, data, renderer = 'canvas', extra = {}) {
    return createChartWithOptions({
      chart: {
        type,
        width: 600,
        height: 400,
        renderer,
        accessibility: {
          enabled: true,
          keyboard: { enabled: true, navigation: { enabled: true } },
        },
      },
      series: [{ name: 'S', data }],
      ...extra,
    })
  }
  const focusSvg = (c) =>
    c.el
      .querySelector('.apexcharts-svg')
      .dispatchEvent(new FocusEvent('focus', { bubbles: true }))
  const blurSvg = (c) =>
    c.el
      .querySelector('.apexcharts-svg')
      .dispatchEvent(new FocusEvent('blur', { bubbles: true }))
  const key = (c, k) =>
    c.el.querySelector('.apexcharts-svg').dispatchEvent(
      new KeyboardEvent('keydown', {
        key: k,
        bubbles: true,
        cancelable: true,
      }),
    )

  const boxData = [
    { x: 'A', y: [10, 20, 30, 40, 50], points: [22, 33] },
    { x: 'B', y: [15, 25, 35, 45, 55], points: [27, 41] },
  ]

  it('outlines the painted path itself, under the bars clip, and names it', () => {
    const c = chart('boxPlot', boxData, 'canvas', {
      plotOptions: { boxPlot: { points: { show: true } } },
    })
    focusSvg(c)
    key(c, 'ArrowRight')
    const kn = c.ctx.keyboardNavigation
    expect(kn.dataPointIndex).toBe(1)

    const rings = c.el.querySelectorAll('.apexcharts-keyboard-focus-ring')
    expect(rings.length).toBe(1)
    const ring = rings[0]
    // the first path painted for the box, as the first `path[j]` on SVG
    const painted = c.ctx.renderer.findMark(0, 1)
    expect(ring.getAttribute('d')).toBe(painted.d)
    expect(ring.getAttribute('fill')).toBe('none')
    expect(ring.getAttribute('clip-path')).toBe(
      `url(#gridRectBarMask${c.w.globals.cuid})`,
    )
    expect(ring.classList.contains('apexcharts-keyboard-focused')).toBe(true)
    expect(ring.getAttribute('aria-label')).toContain('S:')
    expect(
      ring.closest('.apexcharts-series')?.getAttribute('data:realIndex'),
    ).toBe('0')
    // nothing that looks for the series' marks by index takes it for one
    expect(ring.hasAttribute('j')).toBe(false)
    // and the box's jitter, which does carry the index, is not focused
    expect(
      c.el.querySelector(
        '.apexcharts-boxPlot-points.apexcharts-keyboard-focused',
      ),
    ).toBeNull()

    blurSvg(c)
    expect(
      c.el.querySelectorAll('.apexcharts-keyboard-focus-ring').length,
    ).toBe(0)
    c.destroy()
  })

  it('points the synthetic pointer at the painted mark', () => {
    const c = chart('candlestick', [
      { x: 'A', y: [30, 50, 20, 40] },
      { x: 'B', y: [40, 45, 25, 30] },
    ])
    focusSvg(c)
    key(c, 'ArrowRight')
    const m = c.ctx.renderer.findMark(0, 1)
    const e = c.w.globals.tooltip.e
    // jsdom lays nothing out: the plot corner is (translateX, translateY)
    expect(e.clientX).toBeCloseTo(c.w.layout.translateX + m.x + m.width / 2)
    expect(e.clientY).toBeCloseTo(c.w.layout.translateY + m.y + m.height / 2)
    c.destroy()
  })

  it('a horizontal box plot places the box around the focused painted half, as the pointer does', () => {
    const c = chart('boxPlot', boxData, 'canvas', {
      plotOptions: { bar: { horizontal: true } },
      tooltip: { shared: false, intersect: true },
    })
    const around = vi.spyOn(
      c.w.globals.tooltip.tooltipPosition,
      'placeAroundBar',
    )
    focusSvg(c)
    key(c, 'ArrowRight')
    const m = c.ctx.renderer.findMark(0, 1)
    const [bar] = around.mock.calls.at(-1)
    const { left, top } = TooltipUtils.plotInWrap(c.w)
    expect(bar.left).toBeCloseTo(left + m.x)
    expect(bar.right).toBeCloseTo(left + m.x + m.width)
    expect(bar.top).toBeCloseTo(top + m.y)
    expect(bar.bottom).toBeCloseTo(top + m.y + m.height)
    c.destroy()
  })

  it('an SVG box plot draws no outline, its paths take the focus', () => {
    const c = chart('boxPlot', boxData, 'svg')
    focusSvg(c)
    key(c, 'ArrowRight')
    expect(c.ctx.keyboardNavigation.dataPointIndex).toBe(1)
    expect(
      c.el.querySelectorAll('.apexcharts-keyboard-focus-ring').length,
    ).toBe(0)
    c.destroy()
  })
})

describe('the dataset highlight over painted bars', () => {
  it('highlights the series the hit test finds, and clears it off the bars', async () => {
    const c = createChartWithOptions({
      chart: { type: 'bar', width: 600, height: 400, renderer: 'canvas' },
      series: [
        { name: 'A', data: [3, 5] },
        { name: 'B', data: [4, 6] },
      ],
      tooltip: {
        shared: false,
        intersect: true,
        onDatasetHover: { highlightDataSeries: true },
      },
    })
    const w = c.w
    expect(w.globals.activeRenderer.kind).toBe('canvas')
    // jsdom paints nothing, so the renderer is told what is under the pointer
    let hit = {
      seriesIndex: 1,
      dataPointIndex: 0,
      x: 10,
      y: 10,
      width: 5,
      height: 5,
    }
    vi.spyOn(w.globals.activeRenderer, 'hitTest').mockImplementation(() => hit)
    const errors = []
    const onError = (e) => errors.push(e.error || e.message)
    window.addEventListener('error', onError)
    const move = async () => {
      w.dom.Paper.node.dispatchEvent(
        new MouseEvent('mousemove', {
          bubbles: true,
          clientX: w.layout.translateX + 12,
          clientY: w.layout.translateY + 12,
        }),
      )
      // a hover this soon after another is drawn on the next ~20ms tick
      await new Promise((resolve) => setTimeout(resolve, 40))
    }
    // jsdom matches no `[data\\:realIndex]` selector, so the classes the
    // highlight sets cannot be read back here; what it was asked is.
    const highlight = vi.spyOn(Series.prototype, 'highlightSeries')
    const toggle = vi.spyOn(Series.prototype, 'toggleSeriesOnHover')

    await move()
    expect(errors).toEqual([])
    expect(w.interact.capturedSeriesIndex).toBe(1)
    expect(highlight).toHaveBeenLastCalledWith('B')

    hit = null
    await move()
    expect(errors).toEqual([])
    expect(toggle.mock.calls.at(-1)[0].type).toBe('mouseout')
    window.removeEventListener('error', onError)
    c.destroy()
  })
})

describe('keyboard focus on a vertical bar-like goes where the pointer puts the box', () => {
  // An intersect tooltip places a vertical mark's box beside the mark
  // (Intersect.handleBarTooltip). Focus used the sticky box over the
  // category, on both renderers; it now hands the pointer's placement the
  // focused mark, as the node (SVG) or the painted mark (canvas) under the
  // pointer.
  function columns(renderer, tooltip, chart = {}) {
    return createChartWithOptions({
      chart: {
        type: 'bar',
        width: 600,
        height: 400,
        renderer,
        accessibility: {
          enabled: true,
          keyboard: { enabled: true, navigation: { enabled: true } },
        },
        ...chart,
      },
      series: [
        { name: 'A', data: [10, 20, 30, 40] },
        { name: 'B', data: [15, 25, 35, 45] },
      ],
      tooltip,
    })
  }
  const INTERSECT = { shared: false, intersect: true }

  /** Focus point 2 of series 1, and what placed its box. */
  function focus(c) {
    const ttCtx = c.w.globals.tooltip
    const kn = c.ctx.keyboardNavigation
    // jsdom matches no escaped `data\:realIndex` selector: hand the bar over
    const bar = c.w.dom.Paper.find('.apexcharts-bar-area').find(
      (b) =>
        b.node.getAttribute('j') === '2' &&
        b.node.parentNode.getAttribute('data:realIndex') === '1',
    )
    if (bar) vi.spyOn(c.w.dom.Paper, 'findOne').mockReturnValue(bar)
    const hover = vi
      .spyOn(ttCtx.intersect, 'handleBarTooltip')
      .mockImplementation(() => {})
    const sticky = vi
      .spyOn(ttCtx.tooltipPosition, 'moveStickyTooltipOverBars')
      .mockImplementation(() => {})
    kn._setSyntheticEvent(1, 2, ttCtx)
    kn._showTooltipBar(1, 2, ttCtx)
    return { hover, sticky, bar }
  }

  it('an intersect SVG column hands the pointer placement its node', () => {
    const c = columns('svg', INTERSECT)
    const { hover, sticky, bar } = focus(c)
    expect(bar).toBeTruthy()
    expect(sticky).not.toHaveBeenCalled()
    expect(hover).toHaveBeenCalledTimes(1)
    const { e, opt } = hover.mock.calls[0][0]
    expect(TooltipUtils.hoverTarget(e)).toBe(bar.node)
    expect(e.apexPaintedHit).toBeFalsy()
    expect(opt.tooltipEl).toBe(c.w.globals.tooltip.getElTooltip())
    c.destroy()
  })

  it('an intersect canvas column hands it the painted mark', () => {
    const c = columns('canvas', INTERSECT)
    const { hover, sticky } = focus(c)
    expect(sticky).not.toHaveBeenCalled()
    expect(hover).toHaveBeenCalledTimes(1)
    const { e } = hover.mock.calls[0][0]
    expect(e.apexPaintedHit).toEqual(c.ctx.renderer.findMark(1, 2))
    c.destroy()
  })

  it('getPaintedMark takes a named mark at its word, without a hit test', () => {
    const c = columns('canvas', INTERSECT)
    const hitTest = vi.spyOn(c.w.globals.activeRenderer, 'hitTest')
    const mark = c.ctx.renderer.findMark(1, 2)
    const read = c.w.globals.tooltip.intersect.getPaintedMark(
      { type: 'mousemove', clientX: 0, clientY: 0, apexPaintedHit: mark },
      {},
    )
    expect(hitTest).not.toHaveBeenCalled()
    expect([read.i, read.j]).toEqual([1, 2])
    c.destroy()
  })

  it('a shared tooltip keeps the sticky box, on either renderer', () => {
    for (const renderer of ['svg', 'canvas']) {
      const c = columns(renderer, { shared: true, intersect: false })
      const { hover, sticky } = focus(c)
      expect(hover).not.toHaveBeenCalled()
      expect(sticky).toHaveBeenCalledWith(2, 1)
      c.destroy()
    }
  })

  it('so does a chart synced to a group, whose pointer takes the sticky path', () => {
    const a = columns('svg', INTERSECT, { id: 'ka', group: 'kg' })
    const b = columns('svg', INTERSECT, { id: 'kb', group: 'kg' })
    expect(a.ctx.getSyncedCharts().length).toBe(2)
    const { hover, sticky } = focus(a)
    expect(hover).not.toHaveBeenCalled()
    expect(sticky).toHaveBeenCalledWith(2, 1)
    a.destroy()
    b.destroy()
  })
})

describe('a line beside painted bars, and a line with gaps, on canvas', () => {
  it('a captured line in a shared combo takes the pointsArray positioner', () => {
    // On SVG the line's marker is enlarged and the box goes to its point
    // (hasMarkers); painted, the line has no marker node either.
    const opts = (renderer) => ({
      chart: { type: 'line', width: 600, height: 400, renderer },
      tooltip: { shared: true },
      series: [
        { name: 'L', type: 'line', data: [12, 15, 11, 18] },
        { name: 'C', type: 'column', data: [10, 20, 30, 25] },
      ],
      xaxis: { categories: ['a', 'b', 'c', 'd'] },
    })
    const c = createChartWithOptions(opts('canvas'))
    const ttCtx = c.w.globals.tooltip
    const points = vi
      .spyOn(ttCtx.tooltipPosition, 'moveDynamicPointsOnHover')
      .mockImplementation(() => {})
    const bars = vi
      .spyOn(ttCtx.tooltipPosition, 'moveStickyTooltipOverBars')
      .mockImplementation(() => {})
    ttCtx.tooltipRect = { x: 0, y: 0, ttWidth: 80, ttHeight: 40 }
    const e = { type: 'mousemove', clientX: 0, clientY: 0 }
    ttCtx.e = e
    ttCtx.create(e, ttCtx, 0, 2, ttCtx.ttItems)
    expect(points).toHaveBeenCalledWith(2)
    expect(bars).not.toHaveBeenCalled()

    // the column captured stays with the bars
    points.mockClear()
    ttCtx.create(e, ttCtx, 1, 2, ttCtx.ttItems)
    expect(bars).toHaveBeenCalledWith(2, 1)
    expect(points).not.toHaveBeenCalled()
    c.destroy()
  })

  it('the tooltip cache of a line with nulls has one entry per point, as on SVG', () => {
    const opts = (renderer) => ({
      chart: { type: 'line', width: 600, height: 400, renderer },
      series: [{ name: 'L', data: [12, null, 11, 18, null, 14, 16] }],
    })
    const svg = createChartWithOptions(opts('svg'))
    const canvas = createChartWithOptions(opts('canvas'))
    expect(canvas.w.globals.activeRenderer.kind).toBe('canvas')
    const svgPoints = svg.w.globals.pointsArray[0]
    const canvasPoints = canvas.w.globals.pointsArray[0]
    expect(svgPoints.length).toBe(7)
    expect(canvasPoints).toEqual(svgPoints)
    svg.destroy()
    canvas.destroy()
  })
})
