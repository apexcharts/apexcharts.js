import { describe, it, expect, afterEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import CanvasRenderer from '../../src/renderers/canvas/CanvasRenderer'
import TooltipUtils from '../../src/modules/tooltip/Utils'
// The canvas renderer is an opt-in feature, not part of `entries/standard.js`.
import '../../src/features/renderer-canvas.js'

/**
 * Markers and SVG chrome beside the marks a canvas renderer paints.
 *
 * A box plot's outliers are commonly drawn as goal markers (round dots), and
 * a bar's data labels, goals and shadows, like the annotations, wait hidden
 * until the series have animated in. The canvas paints its final frame at
 * once and never ran the reveal, so all of them stayed hidden for good.
 *
 * With `tooltip.intersect` the SVG chart hovers a marker's own node; painted,
 * there is none, so the renderer finds the marker under the pointer instead
 * (hitTestMarker). End to end, against the same chart drawn as SVG:
 * tests/interaction/specs/canvas-combo-markers.spec.js.
 */

let chart = null

afterEach(() => {
  chart?.destroy()
  chart = null
})

async function mount(options) {
  document.body.innerHTML = '<div id="chart"></div>'
  chart = new ApexCharts(document.querySelector('#chart'), options)
  await chart.render()
  return chart
}

const hiddenGroups = () =>
  [...document.querySelectorAll('.apexcharts-element-hidden')].map(
    (n) => n.getAttribute('class').split(' ')[0],
  )

const OUTLIER = {
  strokeWidth: 0,
  strokeHeight: 13,
  strokeLineCap: 'round',
  strokeColor: '#FEB019',
}

const boxWithOutliers = (renderer, animations = false) => ({
  chart: {
    type: 'boxPlot',
    height: 300,
    renderer,
    animations: { enabled: animations },
  },
  series: [
    {
      name: 'box',
      data: [
        { x: 'a', y: [54, 66, 69, 75, 88], goals: [{ value: 32, ...OUTLIER }] },
        { x: 'b', y: [43, 65, 69, 76, 81], goals: [{ value: 95, ...OUTLIER }] },
      ],
    },
  ],
})

describe('SVG chrome held back for the series animation shows on canvas', () => {
  for (const animations of [false, true]) {
    it(`box plot outliers drawn as goals (animations ${animations ? 'on' : 'off'})`, async () => {
      await mount(boxWithOutliers('canvas', animations))
      expect(chart.w.globals.activeRenderer.kind).toBe('canvas')
      expect(
        document.querySelectorAll('.apexcharts-bar-goals-groups line').length,
      ).toBe(2)
      expect(hiddenGroups()).toEqual([])
    })
  }

  it('a column chart: data labels, goals and shadows', async () => {
    const goals = [{ name: 'target', value: 18, strokeColor: '#775DD0' }]
    await mount({
      chart: {
        type: 'bar',
        height: 300,
        renderer: 'canvas',
        animations: { enabled: false },
      },
      series: [
        {
          name: 'c',
          data: [
            { x: 'a', y: 10, goals },
            { x: 'b', y: 20, goals },
          ],
        },
      ],
      dataLabels: { enabled: true },
    })
    expect(chart.w.globals.activeRenderer.kind).toBe('canvas')
    expect(document.querySelectorAll('.apexcharts-datalabel').length).toBe(2)
    expect(hiddenGroups()).toEqual([])
  })

  it('stays shown through a data-only update that repaints in place', async () => {
    await mount(boxWithOutliers('canvas'))
    await chart.updateSeries([
      {
        name: 'box',
        data: [
          {
            x: 'a',
            y: [50, 60, 65, 70, 80],
            goals: [{ value: 30, ...OUTLIER }],
          },
          {
            x: 'b',
            y: [40, 60, 66, 72, 78],
            goals: [{ value: 90, ...OUTLIER }],
          },
        ],
      },
    ])
    expect(chart.w.globals.activeRenderer.kind).toBe('canvas')
    expect(
      document.querySelectorAll('.apexcharts-bar-goals-groups line').length,
    ).toBe(2)
    expect(hiddenGroups()).toEqual([])
  })

  it('annotations, when the chart would animate in', async () => {
    await mount({
      chart: {
        type: 'candlestick',
        height: 300,
        renderer: 'canvas',
        animations: { enabled: true },
      },
      series: [
        {
          data: [
            { x: 1, y: [10, 15, 8, 12] },
            { x: 2, y: [12, 18, 11, 16] },
          ],
        },
      ],
      annotations: { yaxis: [{ y: 14, label: { text: 'level' } }] },
    })
    expect(chart.w.globals.activeRenderer.kind).toBe('canvas')
    expect(hiddenGroups()).toEqual([])
  })

  it('the SVG chart still holds them while its series animate in', async () => {
    await mount({
      ...boxWithOutliers('svg', true),
      annotations: { yaxis: [{ y: 60, label: { text: 'level' } }] },
    })
    expect(chart.w.globals.activeRenderer.kind).toBe('svg')
    expect(hiddenGroups()).toContain('apexcharts-yaxis-annotations')
  })
})

describe('CanvasRenderer.hitTestMarker', () => {
  function renderer() {
    const w = {
      config: { series: [{ data: new Array(8) }] },
      layout: { gridWidth: 100, gridHeight: 100 },
      globals: {},
    }
    const r = new CanvasRenderer(w, {})
    r.beginSeries()
    return r
  }
  const style = {
    pointFillColor: '#f00',
    pointStrokeColor: '#fff',
    pointStrokeWidth: 2,
  }
  const marker = (r, x, y, j, opts = {}) => {
    const ref = r.drawMarker(x, y, {
      pSize: 5,
      seriesIndex: 1,
      ...style,
      ...opts,
    })
    if (j != null) ref.attr('rel', j)
    return ref
  }

  it('finds the marker under a point, its stroke included, with its data point', () => {
    const r = renderer()
    marker(r, 20, 30, 0)
    // scatter names its point through an attr object
    r.drawMarker(60, 30, { pSize: 5, seriesIndex: 2, ...style }).attr({
      rel: 4,
      j: 4,
    })
    expect(r.hitTestMarker(20, 30)).toEqual({
      seriesIndex: 1,
      dataPointIndex: 0,
      x: 20,
      y: 30,
      size: 5,
    })
    // radius 5 plus half the 2px stroke
    expect(r.hitTestMarker(26, 30)).toMatchObject({ dataPointIndex: 0 })
    expect(r.hitTestMarker(26.5, 30)).toBeNull()
    expect(r.hitTestMarker(62, 28)).toMatchObject({
      seriesIndex: 2,
      dataPointIndex: 4,
    })
    expect(r.hitTestMarker(40, 30)).toBeNull()
  })

  it('the one painted last wins where markers overlap', () => {
    const r = renderer()
    marker(r, 20, 30, 0)
    marker(r, 24, 30, 1, { seriesIndex: 3 })
    expect(r.hitTestMarker(22, 30)).toMatchObject({
      seriesIndex: 3,
      dataPointIndex: 1,
    })
  })

  it('skips what is not painted or names no point', () => {
    const r = renderer()
    marker(r, 20, 30, 0, { pSize: 0 })
    marker(r, 50, NaN, 1)
    marker(r, 80, 30, null)
    expect(r.hitTestMarker(20, 30)).toBeNull()
    expect(r.hitTestMarker(80, 30)).toBeNull()
  })

  it('takes no point outside the marker clip', () => {
    const r = renderer()
    marker(r, 2, 30, 0)
    r._compositor._clips = { marker: { x: 0, y: 0, width: 100, height: 100 } }
    expect(r.hitTestMarker(1, 30)).toMatchObject({ dataPointIndex: 0 })
    expect(r.hitTestMarker(-1, 30)).toBeNull()
  })
})

describe('which charts hover their markers through the hit test', () => {
  it('an xy chart on a renderer that paints markers', () => {
    const canvas = { kind: 'canvas', hitTestMarker: () => null }
    const w = (activeRenderer, xyCharts = true) => ({
      globals: { activeRenderer, xyCharts },
    })
    expect(TooltipUtils.isCanvasMarkerChart(w(canvas))).toBe(true)
    expect(TooltipUtils.isCanvasMarkerChart(w({ kind: 'svg' }))).toBe(false)
    expect(TooltipUtils.isCanvasMarkerChart(w(null))).toBe(false)
    // a heatmap's cells are no markers
    expect(TooltipUtils.isCanvasMarkerChart(w(canvas, false))).toBe(false)
  })

  it('a canvas scatter chart with an intersect tooltip listens on the whole plot', async () => {
    const opts = (renderer) => ({
      chart: {
        type: 'scatter',
        height: 300,
        renderer,
        animations: { enabled: false },
      },
      series: [
        {
          data: [
            [1, 2],
            [2, 5],
            [3, 3],
          ],
        },
      ],
      tooltip: { shared: false, intersect: true },
    })
    await mount(opts('canvas'))
    const tt = chart.w.globals.tooltip
    const listened = []
    const real = tt.addPathsEventListeners.bind(tt)
    tt.addPathsEventListeners = (paths, o) => {
      listened.push([...paths])
      return real(paths, o)
    }
    tt.addSVGEvents()
    expect(listened[0]).toEqual([chart.w.dom.Paper.node])
  })
})

describe("the series' hover dot over painted markers", () => {
  const lineWithOneMarker = (renderer) => ({
    chart: {
      type: 'line',
      height: 300,
      width: 500,
      renderer,
      animations: { enabled: false },
    },
    series: [{ name: 'a', data: [10, 41, 35, 51] }],
    // no markers but one, so the series gets its hover dot
    markers: {
      size: 0,
      discrete: [{ seriesIndex: 0, dataPointIndex: 1, size: 6 }],
    },
    tooltip: { shared: false, intersect: true },
  })
  const dot = () =>
    document.querySelector('.apexcharts-series-markers path.apexcharts-marker')

  it('takes no pointer on canvas, where it is drawn over the hovered marker', async () => {
    // Grown under a resting pointer it took the pointer from the canvas,
    // which ended the hover and shrank it again, so the box closed.
    await mount(lineWithOneMarker('canvas'))
    expect(dot().classList.contains('no-pointer-events')).toBe(true)
  })

  it('still takes it on SVG, as before', async () => {
    await mount(lineWithOneMarker('svg'))
    expect(dot().classList.contains('no-pointer-events')).toBe(false)
  })

  it('leaves a painted bubble as it is, as an SVG bubble is left', async () => {
    await mount({
      chart: {
        type: 'bubble',
        height: 300,
        width: 500,
        renderer: 'canvas',
        animations: { enabled: false },
      },
      series: [
        {
          name: 'b',
          data: [
            [1, 20, 30],
            [2, 6, 10],
          ],
        },
      ],
      tooltip: { shared: false, intersect: true },
    })
    const tt = chart.w.globals.tooltip
    const calls = []
    tt.tooltipPosition.moveTooltip = (...args) => calls.push(args)
    tt.marker.enlargePaintedPoint({ i: 0, cx: 50, cy: 60, size: 9 }, 50, 60)
    // no hover dot grown over it: the series' dot stays the hidden one
    const dots = [
      ...document.querySelectorAll('.apexcharts-series-markers path'),
    ]
    expect(dots.length).toBeGreaterThan(0)
    for (const d of dots) expect(d.getAttribute('d')).toBe('M0,0')
    // and no hover size to clear: its radius is its value
    // (Marker.enlargeCurrentPoint), so the box sits where it does on SVG
    expect(calls).toHaveLength(1)
    expect(calls[0].slice(0, 3)).toEqual([50, 60, undefined])
  })
})
