import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  afterEach,
} from 'vitest'
import ApexCharts from '../../src/entries/full.js'
import CanvasRenderer from '../../src/renderers/canvas/CanvasRenderer'
import { pathBox } from '../../src/renderers/canvas/CanvasGraphics'
import RendererController from '../../src/modules/RendererController'
import Intersect from '../../src/modules/tooltip/Intersect'
import Tooltip from '../../src/modules/tooltip/Tooltip'
import TooltipUtils from '../../src/modules/tooltip/Utils'
import { createChartWithOptions } from './utils/utils.js'

/**
 * Violin tooltips outside the default shared mode, and on canvas.
 *
 * Intersect mode (`shared: false, intersect: true`) hovers each mark, and
 * violins were never given the hover listeners. On canvas the bodies are
 * painted, so there is no node to hover or measure at all: the renderer
 * resolves the violin under the pointer, and the coords cached for the marks
 * carry what the SVG path reads off the body. Placement against the painted
 * page is covered end to end in tests/interaction/specs/violin-tooltip.spec.js.
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

function violinOptions(extra = {}) {
  return {
    chart: { type: 'violin', width: 600, height: 400, ...extra.chart },
    series: [
      {
        name: 'A',
        data: [
          { x: 'G1', y: { density, points: [1, 2, 2.5, 3, 3.2, 4, 4.5] } },
          { x: 'G2', y: { density, points: [0.5, 1.5, 3, 3.5, 5] } },
        ],
      },
    ],
    plotOptions: extra.plotOptions || {},
    tooltip: extra.tooltip || {},
    dataLabels: { enabled: false },
  }
}

describe('canvas hitTest: bar-like marks', () => {
  // jsdom has no Path2D and no 2D context, so stand in for both: a path's
  // fill is the box its d-string spans, and the context tests a point
  // against that.
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

  function renderer() {
    const w = {
      config: { series: [{ data: new Array(4) }] },
      layout: { gridWidth: 100, gridHeight: 100 },
      globals: {},
    }
    const r = new CanvasRenderer(w, {})
    r.beginSeries()
    r._hitCtx = {
      isPointInPath(path, x, y) {
        const b = pathBox(path.d)
        return x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height
      },
    }
    return r
  }

  it('resolves the mark whose fill covers the point', () => {
    const r = renderer()
    r.renderPaths({ realIndex: 0, j: 0, pathTo: 'M 0 0 L 10 50', fill: '#a' })
    r.renderPaths({ realIndex: 0, j: 1, pathTo: 'M 20 0 L 30 50', fill: '#a' })
    r.renderPaths({ realIndex: 1, j: 1, pathTo: 'M 35 0 L 45 50', fill: '#b' })
    expect(r.hitTest(5, 25)).toMatchObject({
      seriesIndex: 0,
      dataPointIndex: 0,
    })
    expect(r.hitTest(25, 25)).toMatchObject({
      seriesIndex: 0,
      dataPointIndex: 1,
    })
    expect(r.hitTest(40, 25)).toMatchObject({
      seriesIndex: 1,
      dataPointIndex: 1,
    })
    expect(r.hitTest(15, 25)).toBe(null)
  })

  it('skips series-wide paths and unpainted ones', () => {
    const r = renderer()
    // a line/area path stands for the whole series: it records no `j`
    r.renderPaths({ realIndex: 0, pathTo: 'M 0 0 L 100 100', fill: '#a' })
    // neither filled nor stroked, so nothing of it is painted to hit
    r.renderPaths({
      realIndex: 0,
      j: 2,
      pathTo: 'M 0 0 L 100 100',
      fill: 'none',
    })
    expect(r.hitTest(50, 50)).toBe(null)
  })

  it('a heatmap cell still wins over a mark', () => {
    const r = renderer()
    r.renderPaths({ realIndex: 0, j: 0, pathTo: 'M 0 0 L 10 10', fill: '#a' })
    r.drawRectCell(0, 0, 10, 10, {
      fill: '#b',
      seriesIndex: 3,
      dataPointIndex: 4,
    })
    expect(r.hitTest(5, 5)).toMatchObject({
      seriesIndex: 3,
      dataPointIndex: 4,
    })
  })
})

describe('violin on canvas: the cached coords stand in for the body path', () => {
  beforeAll(() => {
    ApexCharts.registerRenderer(
      'canvas',
      (w, ctx) => new CanvasRenderer(w, ctx),
    )
  })
  afterAll(() => {
    RendererController.unregisterRenderer('canvas')
  })

  for (const horizontal of [false, true]) {
    it(`${horizontal ? 'horizontal' : 'vertical'}: re-anchored like the SVG body, with the painted extent`, () => {
      const plotOptions = { bar: { horizontal } }
      const svg = createChartWithOptions(violinOptions({ plotOptions }))
      const body = svg.w.dom.baseEl.querySelector(
        ".apexcharts-violin-area[j='1']",
      )
      const svgCx = parseFloat(body.getAttribute('cx'))
      const svgCy = parseFloat(body.getAttribute('cy'))
      svg.destroy()

      const canvas = createChartWithOptions(
        violinOptions({ plotOptions, chart: { renderer: 'canvas' } }),
      )
      expect(canvas.w.globals.activeRenderer.kind).toBe('canvas')
      const coords = canvas.w.globals.barCanvasCoords[0][1]
      const b = coords.bounds

      expect(b).toBeTruthy()
      expect(b.right).toBeGreaterThan(b.left)
      expect(b.bottom).toBeGreaterThan(b.top)
      if (horizontal) {
        // the value end is the re-anchored one; the category one is Bar's
        expect(coords.cx).toBeCloseTo(svgCx, 6)
        expect(coords.cy).toBeCloseTo(svgCy, 6)
      } else {
        expect(coords.cy).toBeCloseTo(svgCy, 6)
        // the rendered centre (which SVG takes from the axis ticks), and
        // the violin is symmetric around it
        expect(coords.cx).toBeCloseTo((b.left + b.right) / 2, 6)
        // while the intersect tooltip gets the body's own cx, as off SVG
        expect(coords.bodyCx).toBeCloseTo(svgCx, 6)
      }
      canvas.destroy()
    })
  }
})

describe('violin: intersect tooltip', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('hovering a violin body captions that violin', async () => {
    const chart = createChartWithOptions(
      violinOptions({ tooltip: { shared: false, intersect: true } }),
    )
    const w = chart.w
    const body = w.dom.baseEl.querySelector(".apexcharts-violin-area[j='1']")
    // jsdom lays nothing out: give the violin a box to be beside
    body.getBoundingClientRect = () => ({
      left: 300,
      top: 60,
      right: 340,
      bottom: 260,
      width: 40,
      height: 200,
      x: 300,
      y: 60,
    })

    // inside the plot, which jsdom puts at (translateX, translateY)
    body.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        clientX: 320,
        clientY: w.layout.translateY + 20,
      }),
    )
    // a hover this soon after the render is drawn on the next ~20ms tick
    await new Promise((resolve) => setTimeout(resolve, 40))

    expect(w.interact.capturedSeriesIndex).toBe(0)
    expect(w.interact.capturedDataPointIndex).toBe(1)
    const tooltip = w.dom.baseEl.querySelector('.apexcharts-tooltip')
    expect(tooltip.classList.contains('apexcharts-active')).toBe(true)
    chart.destroy()
  })
})

describe('violin on canvas: grouped violins read as the SVG chart reads them', () => {
  beforeAll(() => {
    ApexCharts.registerRenderer(
      'canvas',
      (w, ctx) => new CanvasRenderer(w, ctx),
    )
  })
  afterAll(() => {
    RendererController.unregisterRenderer('canvas')
  })

  /**
   * Two violin series over the same two categories, painted to canvas, or
   * drawn as SVG when `renderer` says so.
   */
  function grouped(horizontal, renderer = 'canvas') {
    const opts = violinOptions({
      chart: { renderer },
      plotOptions: { bar: { horizontal } },
    })
    opts.series.push({
      name: 'B',
      data: [
        { x: 'G1', y: { density, points: [2, 3, 3.5, 4] } },
        { x: 'G2', y: { density, points: [1, 2, 4, 5] } },
      ],
    })
    const chart = createChartWithOptions(opts)
    expect(chart.w.globals.activeRenderer.kind).toBe(renderer)
    return chart
  }

  /** Union of the cached extents of every series' violin at j. */
  function unionAt(w, j) {
    const bs = Object.values(w.globals.barCanvasCoords).map((s) => s[j].bounds)
    return {
      left: Math.min(...bs.map((b) => b.left)),
      top: Math.min(...bs.map((b) => b.top)),
      right: Math.max(...bs.map((b) => b.right)),
      bottom: Math.max(...bs.map((b) => b.bottom)),
    }
  }

  it('vertical: the band and the box where the SVG chart puts them, whichever series is hovered', () => {
    /** Where the shared box goes over violin 1 with series `s` hovered. */
    const place = (renderer, s) => {
      const chart = grouped(false, renderer)
      const w = chart.w
      const pos = w.globals.tooltip.tooltipPosition
      const band = vi.spyOn(pos, 'moveXCrosshairs')
      const move = vi.spyOn(pos, 'moveTooltip').mockImplementation(() => {})
      pos.moveStickyTooltipOverBars(1, s)
      // the two violins' centre lines at j = 1, as each renderer keeps them
      const centres =
        renderer === 'canvas'
          ? [0, 1].map((i) => w.globals.barCanvasCoords[i][1].cx)
          : [
              ...w.dom.baseEl.querySelectorAll(
                ".apexcharts-violin-area[j='1']",
              ),
            ].map((el) => parseFloat(el.getAttribute('data:center')))
      const out = {
        band: band.mock.calls[0][0],
        move: move.mock.calls[0],
        centres,
      }
      chart.destroy()
      return out
    }
    for (const s of [0, 1]) {
      const svg = place('svg', s)
      const canvas = place('canvas', s)
      // The band stands halfway between the two violins on both renderers,
      // not on either one's centre line.
      for (const r of [svg, canvas]) {
        expect(r.centres).toHaveLength(2)
        expect(Math.abs(r.centres[0] - r.centres[1])).toBeGreaterThan(10)
        expect(r.band).toBeCloseTo((r.centres[0] + r.centres[1]) / 2, 6)
      }
      expect(canvas.band).toBeCloseTo(svg.band, 6)
      expect(canvas.move[0]).toBeCloseTo(svg.move[0], 6)
      // with two series the SVG query takes rel = 1, series 0, either way
      expect(canvas.move[1]).toBeCloseTo(svg.move[1], 6)
    }
  })

  for (const hidden of ['A', 'B']) {
    it(`vertical, ${hidden} hidden: the band on the violin left, on SVG as on canvas`, () => {
      // The SVG chart read the middle of the category off the cx of the
      // series its query picked, which counts the hidden series: the band
      // stood on an edge of the violin left. It now goes where the canvas
      // chart puts it, on that violin's centre line.
      const shown = hidden === 'A' ? 1 : 0
      const bands = {}
      const centres = {}
      for (const renderer of ['svg', 'canvas']) {
        const chart = grouped(false, renderer)
        chart.hideSeries(hidden)
        const w = chart.w
        expect(w.globals.collapsedSeriesIndices).toEqual([1 - shown])
        const pos = w.globals.tooltip.tooltipPosition
        const band = vi.spyOn(pos, 'moveXCrosshairs')
        vi.spyOn(pos, 'moveTooltip').mockImplementation(() => {})

        pos.moveStickyTooltipOverBars(1, shown)

        bands[renderer] = band.mock.calls[0][0]
        // (jsdom matches no camelCase attribute selector on SVG nodes, so
        // the series group is found by reading the attribute)
        const group = [
          ...w.dom.baseEl.querySelectorAll(
            '.apexcharts-violin-series .apexcharts-series',
          ),
        ].find((g) => g.getAttribute('data:realIndex') === String(shown))
        centres[renderer] =
          renderer === 'canvas'
            ? w.globals.barCanvasCoords[shown][1].cx
            : parseFloat(
                group
                  .querySelector(".apexcharts-violin-area[j='1']")
                  .getAttribute('data:center'),
              )
        chart.destroy()
      }
      expect(bands.svg).toBeCloseTo(bands.canvas, 6)
      expect(bands.canvas).toBeCloseTo(centres.canvas, 6)
      expect(centres.svg).toBeCloseTo(centres.canvas, 6)
    })
  }

  it('horizontal: above or below the row of every violin at j, as an SVG row is', () => {
    const chart = grouped(true)
    const w = chart.w
    const pos = w.globals.tooltip.tooltipPosition
    const around = vi.spyOn(pos, 'placeAroundBar')

    expect(pos.placeHorizontalSharedTooltip(1)).toBe(true)

    const u = unionAt(w, 1)
    const origin = TooltipUtils.plotInWrap(w)
    const [row] = around.mock.calls[0]
    expect(row.left).toBeCloseTo(origin.left + u.left, 6)
    expect(row.right).toBeCloseTo(origin.left + u.right, 6)
    expect(row.top).toBeCloseTo(origin.top + u.top, 6)
    expect(row.bottom).toBeCloseTo(origin.top + u.bottom, 6)
    chart.destroy()
  })
})

describe('violin on canvas: the hit test and the hover around it', () => {
  /**
   * An Intersect over a stub canvas violin chart whose svg is drawn
   * `svgWidth` wide and measured `measuredWidth` wide (a CSS zoom), its
   * corner at (100, 50) and the plot translated (40, 30) into it.
   */
  function canvasViolin({
    svgWidth = 400,
    measuredWidth = 400,
    hit = null,
  } = {}) {
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
    const baseEl = document.createElement('div')
    const hitTest = vi.fn(() => hit)
    const w = {
      config: { chart: { type: 'violin' }, series: [], tooltip: {} },
      globals: {
        activeRenderer: { kind: 'canvas', hitTest },
        svgWidth,
        barCanvasCoords: {
          0: {
            2: {
              cx: 50,
              cy: 60,
              barWidth: 20,
              type: 'violin',
              bounds: { left: 40, top: 10, right: 60, bottom: 110 },
            },
          },
        },
      },
      layout: {
        translateX: 40,
        translateY: 30,
        gridWidth: 300,
        gridHeight: 200,
      },
      dom: { elWrap, baseEl, Paper: { node: svg } },
    }
    const it = Object.create(Intersect.prototype)
    it.w = w
    it.ttCtx = { w }
    return { it, w, hitTest }
  }

  it('maps the pointer into plot px through a CSS zoom, and the extent back out', () => {
    // drawn 400 wide, measured 300 wide: zoom 0.75, the plot corner at
    // (100 + 30, 50 + 22.5)
    const { it, hitTest } = canvasViolin({
      measuredWidth: 300,
      hit: { seriesIndex: 0, dataPointIndex: 2 },
    })
    const mark = it.getViolinMark(
      {
        type: 'mousemove',
        clientX: 130 + 50 * 0.75,
        clientY: 72.5 + 60 * 0.75,
      },
      {},
    )
    expect(hitTest).toHaveBeenCalledWith(50, 60)
    expect(mark).toMatchObject({ i: 0, j: 2, byHitTest: true })
    expect(mark.rect.left).toBeCloseTo(130 + 40 * 0.75)
    expect(mark.rect.right).toBeCloseTo(130 + 60 * 0.75)
    expect(mark.rect.top).toBeCloseTo(72.5 + 10 * 0.75)
    expect(mark.rect.bottom).toBeCloseTo(72.5 + 110 * 0.75)
  })

  it('finds violins in a combo of another chart type, and only when the chart has any', () => {
    const { it, w } = canvasViolin({
      hit: { seriesIndex: 0, dataPointIndex: 2 },
    })
    w.config.chart.type = 'line'
    w.config.series = [{ type: 'violin' }, { type: 'line' }]
    expect(TooltipUtils.isCanvasViolinChart(w)).toBe(true)
    expect(
      it.getViolinMark({ type: 'mousemove', clientX: 0, clientY: 0 }, {}),
    ).toMatchObject({ i: 0, j: 2 })
    w.config.series = [{ type: 'line' }]
    expect(TooltipUtils.isCanvasViolinChart(w)).toBe(false)
  })
})

describe('violin on canvas: handleBarTooltip off and on the violins', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  /** handleBarTooltip on a stub whose hit test answers `barXY`. */
  function stub({ interactive = false, active = true, enabledOnSeries } = {}) {
    const tooltipEl = document.createElement('div')
    if (active) tooltipEl.classList.add('apexcharts-active')
    const ttCtx = {
      tConfig: { interactive, enabledOnSeries },
      getElTooltip: () => tooltipEl,
      handleMouseOut: vi.fn(),
      interactiveHideDelay: () => 100,
      offMarkHideTimeout: undefined,
      cancelOffMarkHide: Tooltip.prototype.cancelOffMarkHide,
    }
    const w = {
      globals: { isDestroyed: false },
      config: { tooltip: { shared: false } },
      interact: {},
    }
    const it = Object.create(Intersect.prototype)
    it.w = w
    it.ttCtx = ttCtx
    const move = (barXY) => {
      it.getBarTooltipXY = () => barXY
      it.handleBarTooltip({
        e: { type: 'mousemove', clientX: 5, clientY: 5 },
        opt: {},
      })
    }
    return { ttCtx, move }
  }

  it('hides at once off every violin', () => {
    const { ttCtx, move } = stub()
    move({ noHit: true })
    expect(ttCtx.handleMouseOut).toHaveBeenCalledTimes(1)
  })

  it('gives an interactive box the grace a mouseout gives it, and lets later moves leave it running', () => {
    vi.useFakeTimers()
    const { ttCtx, move } = stub({ interactive: true })
    move({ noHit: true })
    expect(ttCtx.handleMouseOut).not.toHaveBeenCalled()
    vi.advanceTimersByTime(60)
    // still roaming off the violins: the close is not pushed back
    move({ noHit: true })
    vi.advanceTimersByTime(40)
    expect(ttCtx.handleMouseOut).toHaveBeenCalledTimes(1)
    expect(ttCtx.offMarkHideTimeout).toBeUndefined()
  })

  it('calls the close off when the pointer reaches a violin again', () => {
    vi.useFakeTimers()
    const { ttCtx, move } = stub({ interactive: true })
    move({ noHit: true })
    // a hit with no coords returns right after the cancel
    move({ j: null, barHeight: 0, barWidth: 0 })
    vi.advanceTimersByTime(200)
    expect(ttCtx.handleMouseOut).not.toHaveBeenCalled()
  })

  it('checks enabledOnSeries against the series the hit test found', () => {
    const { ttCtx, move } = stub({ enabledOnSeries: [0] })
    move({ i: 1, j: 2, byHitTest: true, barHeight: 10, barWidth: 10 })
    expect(ttCtx.handleMouseOut).toHaveBeenCalledTimes(1)
  })
})
