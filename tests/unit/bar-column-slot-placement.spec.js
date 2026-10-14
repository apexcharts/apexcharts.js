import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Three column placement defects users saw:
// - overlaid multi-series histograms were drawn (n-1)/2 bins left of their
//   bin edges;
// - with hideZeroBarsWhenGrouped, two non-zero bars whose values cancel out
//   were treated as zero and drawn on top of each other;
// - dataLabels.offsetX deleted the last (or first) columns of a dense column
//   chart, even with labels off.

const xs = (p) =>
  (p.getAttribute('d').match(/[ML]\s*(-?[\d.]+)/g) || []).map((s) =>
    Number(s.replace(/[ML]\s*/, '')),
  )
const centre = (p) => {
  const v = xs(p)
  return (Math.min(...v) + Math.max(...v)) / 2
}

function sample() {
  const out = []
  let seed = 7
  for (let i = 0; i < 200; i++) {
    seed = (seed * 16807) % 2147483647
    out.push((seed % 1000) / 10)
  }
  return out
}

describe('column slot placement', () => {
  it('an overlaid histogram series sits on its bins', () => {
    const centres = (n) => {
      createChartWithOptions({
        chart: { type: 'histogram', width: 600, height: 400 },
        dataLabels: { enabled: false },
        plotOptions: { histogram: { bins: 10 } },
        series: Array.from({ length: n }, (_, k) => ({
          name: 'S' + k,
          data: sample(),
        })),
      })
      const g = document.querySelector('.apexcharts-series')
      return [...g.querySelectorAll('.apexcharts-bar-area')].map(centre)
    }
    const one = centres(1)
    const three = centres(3)
    expect(three.length).toBe(one.length)
    three.forEach((x, k) => expect(x).toBeCloseTo(one[k], 3))
  })

  it('hideZeroBarsWhenGrouped keeps two slots for values that cancel', () => {
    createChartWithOptions({
      chart: { type: 'bar', width: 600, height: 400 },
      plotOptions: { bar: { hideZeroBarsWhenGrouped: true } },
      dataLabels: { enabled: false },
      stroke: { width: 0 },
      xaxis: { categories: ['c0', 'c1'] },
      series: [
        { name: 'A', data: [5, 3] },
        { name: 'B', data: [-5, 2] },
      ],
    })
    const span = (name, j) => {
      const v = xs(
        document.querySelectorAll(
          `.apexcharts-series[seriesName="${name}"] .apexcharts-bar-area`,
        )[j],
      )
      return [Math.min(...v), Math.max(...v)]
    }
    const [a0, b0, a1] = [span('A', 0), span('B', 0), span('A', 1)]
    expect(a0[1] - a0[0]).toBeCloseTo(a1[1] - a1[0], 3)
    expect(b0[0]).toBeGreaterThanOrEqual(a0[1] - 0.01)
  })

  it('hideZeroBarsWhenGrouped keeps a bar after a null in its category', () => {
    for (const horizontal of [false, true]) {
      createChartWithOptions({
        chart: { type: 'bar', width: 600, height: 400 },
        plotOptions: {
          bar: { horizontal, borderRadius: 0, hideZeroBarsWhenGrouped: true },
        },
        dataLabels: { enabled: false },
        stroke: { width: 0 },
        xaxis: { categories: ['a', 'b'] },
        series: [
          { name: 'A', data: [null, 3] },
          { name: 'B', data: [4, 5] },
        ],
      })
      const ext = (name, j) => {
        const d = document
          .querySelectorAll(
            `.apexcharts-series[seriesName="${name}"] .apexcharts-bar-area`,
          )
          [j].getAttribute('d')
        const n = (d.match(/-?[\d.]+/g) || []).map(Number)
        const v = n.filter((_, k) => k % 2 === (horizontal ? 1 : 0))
        return [Math.min(...v), Math.max(...v)]
      }
      // B's first bar stays in category a, short of the second category
      const b0 = ext('B', 0)
      const a1 = ext('A', 1)
      expect(b0[1]).toBeLessThanOrEqual(a1[0] + 0.01)
    }
  })

  it('dataLabels.offsetX does not cull the end columns', () => {
    const count = (offsetX) => {
      createChartWithOptions({
        chart: { type: 'bar', width: 600, height: 400 },
        dataLabels: { enabled: false, offsetX },
        series: [
          { name: 'A', data: Array.from({ length: 50 }, (_, k) => 10 + k) },
        ],
      })
      return document.querySelectorAll('.apexcharts-bar-area').length
    }
    expect(count(20)).toBe(50)
    expect(count(-20)).toBe(50)
  })
})
