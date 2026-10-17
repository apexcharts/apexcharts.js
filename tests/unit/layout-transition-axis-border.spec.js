import { describe, it, expect, afterEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import { BrowserAPIs } from '../../src/ssr/BrowserAPIs.js'

// The axis borders are drawn into the grid borders group, next to the
// gridlines on the plot's edges, but with an extent of their own (the axis
// border's offset and width, the vertical one's 1px top inset). The layout
// tween eased every line of a group from one captured line, so a border
// snapped to that line's extent on the first frame and rode back, and a
// values-only update started a layout tween just to do that.

const N = 10
const vals = (s) => Array.from({ length: N }, (_, i) => (((i + s) * 7) % 23) + 1)

function clock() {
  const frames = []
  let now = 1000
  vi.spyOn(BrowserAPIs, 'requestAnimationFrame').mockImplementation((cb) => {
    frames.push(cb)
    return frames.length
  })
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  return {
    at: (t) => (now = t),
    pump(t) {
      now = t
      frames.splice(0).forEach((cb) => cb(t))
    },
    settle(from) {
      for (let t = from; t < from + 2000; t += 16) this.pump(t)
    },
  }
}

const CASES = {
  'a horizontal bar with x gridlines': {
    chart: { type: 'bar' },
    plotOptions: { bar: { horizontal: true } },
    grid: { xaxis: { lines: { show: true } } },
  },
  'a column with an offset axis border': {
    chart: { type: 'bar' },
    xaxis: { axisBorder: { offsetX: 10 } },
  },
  'a column with a narrower axis border': {
    chart: { type: 'bar' },
    xaxis: { axisBorder: { width: '80%' } },
  },
}

async function make(c, extra) {
  document.body.innerHTML = '<div id="c"></div>'
  const chart = new ApexCharts(document.querySelector('#c'), {
    ...extra,
    chart: {
      ...extra.chart,
      width: 600,
      height: 300,
      animations: {
        enabled: true,
        speed: 300,
        dynamicAnimation: { enabled: true, speed: 300 },
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      ...extra.xaxis,
      categories: Array.from({ length: N }, (_, i) => `C${i}`),
    },
    series: [{ name: 'A', data: vals(0) }],
  })
  await chart.render()
  c.settle(1000)
  return chart
}

/** The axis border lines among the grid borders. */
const borders = (chart) =>
  [
    ...chart.w.dom.baseEl.querySelectorAll(
      '.apexcharts-grid-borders line:not(.apexcharts-gridline)',
    ),
  ]
    .map((l) => ['x1', 'y1', 'x2', 'y2'].map((a) => l.getAttribute(a)).join())
    .join(';')

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('layout transition eases an axis border from its own extent', () => {
  Object.entries(CASES).forEach(([name, extra]) => {
    it(`${name}: a values-only update leaves it still`, async () => {
      const c = clock()
      const chart = await make(c, extra)
      const rest0 = borders(chart)
      expect(rest0).not.toBe('')
      c.at(5000)
      chart.w.globals.pendingCapture = null
      await chart.updateSeries([{ data: vals(4) }])
      // Before: a layout tween, which snapped the border and rode it back.
      expect(chart.w.globals.layoutTween).toBe(null)
      c.pump(5000)
      expect(borders(chart)).toBe(rest0)
      c.pump(5150)
      expect(borders(chart)).toBe(rest0)
      c.settle(5166)
      expect(borders(chart)).toBe(rest0)
      chart.destroy()
    })

    it(`${name}: a plot that moves starts it where it was`, async () => {
      const c = clock()
      const chart = await make(c, extra)
      const rest0 = borders(chart)
      c.at(5000)
      chart.w.globals.pendingCapture = null
      await chart.updateOptions({
        grid: { padding: { left: 40, bottom: 20 } },
        series: [{ data: vals(4) }],
      })
      expect(chart.w.globals.layoutTween).not.toBe(null)
      c.pump(5000)
      // Before: snapped to the gridline borders' extent.
      expect(borders(chart)).toBe(rest0)
      c.pump(5150)
      const mid = borders(chart)
      c.settle(5166)
      const rest = borders(chart)
      expect(rest).not.toBe(rest0)
      expect(mid).not.toBe(rest)
      chart.destroy()
    })
  })
})
