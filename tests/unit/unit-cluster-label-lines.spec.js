/**
 * Cluster labels split on "\n", as the outer labels already do.
 *
 * Production report: in `layout: 'columns'`, a `clusterLabels.formatter`
 * returning "Name\n42%" drew one line (SVG collapses the newline to a space),
 * while an external label with the same text drew two.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import { createChartWithOptions } from './utils/utils'
import '../../src/entries/unit.js'
import ApexCharts from '../../src/entries/standard.js'

const mk = (clusterLabels, layout = 'columns') =>
  createChartWithOptions({
    chart: {
      type: 'unit',
      width: 600,
      height: 400,
      animations: { enabled: false },
    },
    series: [30, 20],
    labels: ['Alpha', 'Beta'],
    plotOptions: {
      unit: {
        layout,
        clusterLabels: {
          show: true,
          fontSize: '20px',
          formatter: (name, { percent }) => `${name}\n${percent.toFixed(0)}%`,
          ...clusterLabels,
        },
      },
    },
  })

const labels = (c) => [
  ...c.w.dom.baseEl.querySelectorAll('text.apexcharts-unit-label'),
]
const lines = (t) =>
  [...t.querySelectorAll('tspan')].map((ts) => ts.textContent)
// Topmost dot of the label's own bar (dots sit below a top label).
const barTop = (c, i) =>
  Math.min(
    ...[
      ...c.w.dom.baseEl.querySelectorAll(
        `.apexcharts-series[rel="${i + 1}"] .apexcharts-unit-area`,
      ),
    ].map((d) => +d.getAttribute('cy') - +d.getAttribute('r')),
  )
const barBottom = (c, i) =>
  Math.max(
    ...[
      ...c.w.dom.baseEl.querySelectorAll(
        `.apexcharts-series[rel="${i + 1}"] .apexcharts-unit-area`,
      ),
    ].map((d) => +d.getAttribute('cy') + +d.getAttribute('r')),
  )

describe('unit columns: cluster labels split on "\\n"', () => {
  it('draws one tspan per line, each starting under the label centre', () => {
    const c = mk({})
    const t = labels(c)[0]
    expect(lines(t)).toEqual(['Alpha', '60%'])
    const spans = [...t.querySelectorAll('tspan')]
    spans.forEach((ts) =>
      expect(ts.getAttribute('x')).toBe(t.getAttribute('x')),
    )
    expect(spans[0].getAttribute('dy')).toBe('0')
    expect(+spans[1].getAttribute('dy')).toBe(Math.round(20 * 1.35))
    c.destroy()
  })

  it('a one-line label is unchanged: plain text, no tspans', () => {
    const c = mk({ formatter: (name) => name })
    const t = labels(c)[0]
    expect(t.querySelectorAll('tspan')).toHaveLength(0)
    expect(t.textContent).toBe('Alpha')
    c.destroy()
  })

  // Bar 0 takes two lines and bar 1 one, in the same chart, so both share one
  // dot pitch and their gaps to their bars compare exactly.
  const mixed = (name, { seriesIndex, percent }) =>
    seriesIndex === 0 ? `${name}\n${percent.toFixed(0)}%` : name

  it('a top label grows upward: its last line sits where a one-line label does', () => {
    const c = mk({ formatter: mixed })
    const lh = Math.round(20 * 1.35)
    const [two, one] = labels(c)
    expect(lines(two)).toEqual(['Alpha', '60%'])
    const yTwo = +two.getAttribute('y')
    const yOne = +one.getAttribute('y')
    expect(barTop(c, 0) - (yTwo + lh)).toBeCloseTo(barTop(c, 1) - yOne, 6)
    // And the whole block clears the top of the plot.
    expect(yTwo - 20).toBeGreaterThanOrEqual(0)
    c.destroy()
  })

  it('a bottom label grows downward: its first line sits where a one-line label does', () => {
    const c = mk({ position: 'bottom', formatter: mixed })
    const lh = Math.round(20 * 1.35)
    const [two, one] = labels(c)
    const yTwo = +two.getAttribute('y')
    const yOne = +one.getAttribute('y')
    expect(yTwo - barBottom(c, 0)).toBeCloseTo(yOne - barBottom(c, 1), 6)
    expect(yTwo + lh).toBeLessThanOrEqual(c.w.layout.gridHeight)
    c.destroy()
  })

  it('the label band grows with the lines, so a tall bar is not crowded into its label', () => {
    const one = mk({ formatter: (name) => name })
    const two = mk({})
    // The tallest bar starts lower by the extra line, its label kept clear.
    expect(barTop(two, 0) - barTop(one, 0)).toBeGreaterThan(0)
    one.destroy()
    two.destroy()
  })
})

describe('unit small-multiple waffle: a multi-line tile label rides its tile', () => {
  const realRaf = window.requestAnimationFrame
  const realCaf = window.cancelAnimationFrame
  let chart
  afterEach(() => {
    chart?.destroy()
    chart = null
    window.requestAnimationFrame = realRaf
    window.cancelAnimationFrame = realCaf
    vi.restoreAllMocks()
  })

  it('every line moves with the label while the tiles re-flow', async () => {
    let T = 1000
    const q = new Map()
    let id = 0
    window.requestAnimationFrame = (cb) => (q.set(++id, cb), id)
    window.cancelAnimationFrame = (h) => q.delete(h)
    vi.spyOn(performance, 'now').mockImplementation(() => T)
    const frames = (n) => {
      for (let f = 0; f < n; f++) {
        T += 16
        const cbs = [...q.values()]
        q.clear()
        cbs.forEach((cb) => cb(T))
      }
    }
    document.body.innerHTML = '<div id="chart"></div>'
    chart = new ApexCharts(document.querySelector('#chart'), {
      chart: {
        type: 'unit',
        width: 600,
        height: 400,
        animations: {
          enabled: true,
          speed: 400,
          dynamicAnimation: { speed: 400 },
        },
      },
      series: [50, 30, 50, 50, 50],
      labels: ['A', 'B', 'C', 'D', 'E'],
      plotOptions: {
        unit: {
          layout: 'grid',
          grid: { split: true },
          clusterLabels: { show: true, formatter: (name) => `${name}\nline 2` },
        },
      },
    })
    await chart.render()
    frames(200)
    const tileLabels = () => [
      ...chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-label'),
    ]
    const before = new Map(
      tileLabels().map((t) => [t.firstChild.textContent, +t.getAttribute('x')]),
    )
    // 5 tiles -> 4: the tile columns change, so the labels slide sideways.
    await chart.updateSeries([50, 0, 80, 50, 50])
    let slid = false
    for (let f = 0; f < 40; f++) {
      frames(1)
      tileLabels().forEach((t) => {
        const spans = [...t.querySelectorAll('tspan')]
        expect(spans).toHaveLength(2)
        spans.forEach((ts) =>
          expect(ts.getAttribute('x')).toBe(t.getAttribute('x')),
        )
        const was = before.get(spans[0].textContent)
        if (was != null && Math.abs(+t.getAttribute('x') - was) > 1) slid = true
      })
    }
    expect(slid).toBe(true)
  })
})
