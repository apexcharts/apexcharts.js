import { describe, it, expect, afterEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import { BrowserAPIs } from '../../src/ssr/BrowserAPIs.js'

// An animated update eases the plot rect when the axes change size
// (LayoutTransition). It walked every grid line and x-axis tick, building a
// writer for each, before learning that the plot had not moved, which is
// what most value updates are. Counts the tick walks of an update that
// leaves the plot where it was, and pins a mid-flight frame and the settled
// chrome of one that moves it, both recorded at the base commit.

const N = 30
const vals = (s, k = 1) =>
  Array.from({ length: N }, (_, i) => ((((i + s) * 7) % 23) + 1) * k)

const hash = (s) => {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++)
    h = Math.imul(h ^ s.charCodeAt(i), 0x01000193)
  return (h >>> 0).toString(16)
}

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

/** Every line, the plot origin and the y-axis offsets: what the tween moves. */
function chrome(root) {
  const out = []
  root
    .querySelectorAll('line, .apexcharts-grid rect, clipPath rect')
    .forEach((l) => {
      out.push(
        ['x1', 'y1', 'x2', 'y2', 'x', 'y', 'width', 'height']
          .map((a) => l.getAttribute(a))
          .join(','),
      )
    })
  root
    .querySelectorAll(
      '.apexcharts-graphical, .apexcharts-yaxis, .apexcharts-xaxis',
    )
    .forEach((g) => {
      out.push(g.getAttribute('transform'))
    })
  return out.join(';')
}

async function column(c) {
  document.body.innerHTML = '<div id="c"></div>'
  const chart = new ApexCharts(document.querySelector('#c'), {
    chart: {
      type: 'bar',
      width: 600,
      height: 300,
      animations: {
        enabled: true,
        speed: 300,
        dynamicAnimation: { enabled: true, speed: 300 },
      },
    },
    dataLabels: { enabled: false },
    grid: {
      row: { colors: ['#f3f3f3', 'transparent'] },
      xaxis: { lines: { show: true } },
    },
    xaxis: { categories: Array.from({ length: N }, (_, i) => `C${i}`) },
    series: [{ name: 'A', data: vals(0) }],
  })
  await chart.render()
  c.settle(1000)
  return chart
}

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('layout transition returns before its walk when the plot is still', () => {
  it('does not walk the ticks for an update that leaves the plot in place', async () => {
    const c = clock()
    const chart = await column(c)
    c.at(5000)
    chart.w.globals.pendingCapture = null
    const qsa = vi.spyOn(Element.prototype, 'querySelectorAll')
    // Same y range, so the y labels and the plot keep their size.
    await chart.updateSeries([{ data: vals(4) }])
    const walks = qsa.mock.calls.filter(
      ([s]) => s === '.apexcharts-xaxis-tick',
    ).length
    qsa.mockRestore()
    expect(chart.w.globals.layoutTween).toBe(null)
    // Before: 1.
    expect(walks).toBe(0)
    chart.destroy()
  })

  it('eases a plot that moves with the same frames', async () => {
    const c = clock()
    const chart = await column(c)
    const root = chart.w.dom.baseEl
    const rest0 = chrome(root)
    c.at(5000)
    chart.w.globals.pendingCapture = null
    // More grid padding moves and shrinks the plot. (jsdom measures every
    // label the same, so wider labels would not.)
    await chart.updateOptions({
      grid: { padding: { left: 40, bottom: 20 } },
      series: [{ data: vals(4) }],
    })
    expect(chart.w.globals.layoutTween).not.toBe(null)
    c.pump(5000)
    c.pump(5150)
    const mid = chrome(root)
    c.settle(5166)
    const rest = chrome(root)
    expect(mid).not.toBe(rest)
    expect(rest).not.toBe(rest0)
    expect(hash(mid)).toBe('b2bb571b')
    expect(hash(rest)).toBe('dc5f9225')
    chart.destroy()
  })
})
