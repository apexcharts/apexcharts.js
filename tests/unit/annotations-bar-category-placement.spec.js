import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

const q = (chart, sel) => chart.w.dom.baseEl.querySelector(sel)

describe('category x annotation placement', () => {
  const cats = Array.from({ length: 12 }, (_, i) => `c${i}`)
  const build = (type, show) =>
    createChartWithOptions({
      chart: { type, width: 600, height: 350 },
      series: [{ data: cats.map((_, i) => i + 1) }],
      xaxis: { categories: cats, labels: { show } },
      annotations: { xaxis: [{ x: 'c5', label: { text: 'five' } }] },
    })

  for (const type of ['bar', 'line']) {
    it(`places a ${type} category annotation with x labels hidden`, () => {
      const shown = q(build(type, true), '.apexcharts-xaxis-annotations line')
      const x1 = parseFloat(shown.getAttribute('x1'))
      const hidden = q(build(type, false), '.apexcharts-xaxis-annotations line')
      expect(hidden).not.toBeNull()
      expect(parseFloat(hidden.getAttribute('x1'))).toBeCloseTo(x1, 1)
    })
  }
})

describe('point annotation seriesIndex on bars', () => {
  const options = (extra = {}) => ({
    chart: { type: 'bar', width: 600, height: 350, ...extra },
    series: [
      { name: 'A', data: [10, 20, 30, 40] },
      { name: 'B', data: [15, 25, 35, 45] },
      { name: 'C', data: [12, 22, 32, 42] },
    ],
    xaxis: { categories: ['a', 'b', 'c', 'd'] },
    annotations: {
      points: [{ x: 'b', y: 20, seriesIndex: 0, label: { text: 'A-b' } }],
    },
  })

  const markerX = (chart) => {
    const m = q(chart, '.apexcharts-point-annotation-marker')
    const cx = m.getAttribute('cx')
    if (cx !== null) return parseFloat(cx)
    // A path marker: centre of the numbers in its path.
    const nums = (m.getAttribute('d').match(/-?[\d.]+/g) || []).map(Number)
    const xs = nums.filter((_, i) => i % 2 === 0)
    return (Math.min(...xs) + Math.max(...xs)) / 2
  }

  const barCentre = (chart, seriesName, j) => {
    const g = q(chart, `.apexcharts-series[seriesName='${seriesName}']`)
    const bar = g.querySelectorAll('.apexcharts-bar-area')[j]
    const d = bar.getAttribute('d')
    const xs = []
    const re = /[ML]\s*(-?[\d.]+)\s+(-?[\d.]+)/g
    let m
    while ((m = re.exec(d))) xs.push(parseFloat(m[1]))
    return (Math.min(...xs) + Math.max(...xs)) / 2
  }

  it('sits on its bar side by side', () => {
    const chart = createChartWithOptions(options())
    expect(markerX(chart)).toBeCloseTo(barCentre(chart, 'A', 1), 0)
  })

  it('sits on its bar after another series is hidden', async () => {
    const chart = createChartWithOptions(options())
    chart.toggleSeries('B')
    await new Promise((r) => setTimeout(r, 0))
    expect(markerX(chart)).toBeCloseTo(barCentre(chart, 'A', 1), 0)
  })

  it('sits on its column when stacked', () => {
    const chart = createChartWithOptions(options({ stacked: true }))
    expect(markerX(chart)).toBeCloseTo(barCentre(chart, 'A', 1), 0)
  })
})
