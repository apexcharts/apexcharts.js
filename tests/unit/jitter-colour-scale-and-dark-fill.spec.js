import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import { darkenColor, jitterExtent } from '../../src/charts/common/Jitter.js'
import '../../src/entries/violin.js'

// Jitter dot colour defects users saw:
// - with points.colorScale and no min/max, the ramp spanned the axis's nice
//   scale, so the lowest and highest observations never got the end colours;
// - the default darker dot fill only understood hex, so on rgb(), 8-digit
//   hex or named series colours the dots blended into the body.

const fills = (chart, sel) =>
  [...chart.el.querySelectorAll(sel)].map((p) => p.getAttribute('fill'))

const colorScale = { colors: ['#0000ff', '#ff0000'], steps: 5 }

describe('jitter colour scale', () => {
  it('spans the observations of a violin', () => {
    const chart = createChartWithOptions({
      chart: { type: 'violin', width: 600, height: 400 },
      dataLabels: { enabled: false },
      plotOptions: { violin: { points: { show: true, colorScale } } },
      series: [
        { data: [{ x: 'a', y: { points: [23, 30, 41, 47, 55, 62, 77] } }] },
      ],
    })
    const f = fills(chart, '.apexcharts-violin-points')
    expect(f).toContain('rgb(0,0,255)')
    expect(f).toContain('rgb(255,0,0)')
  })

  it('spans the observations of every box, not one box', () => {
    const chart = createChartWithOptions({
      chart: { type: 'boxPlot', width: 600, height: 400 },
      plotOptions: { boxPlot: { points: { show: true, colorScale } } },
      series: [
        {
          data: [
            { x: 'a', y: [20, 30, 40, 50, 60], points: [35, 40] },
            { x: 'b', y: [40, 50, 60, 70, 80], points: [55, 60] },
          ],
        },
      ],
    })
    const byBox = [
      ...chart.el.querySelectorAll('.apexcharts-boxPlot-points'),
    ].reduce((m, p) => {
      ;(m[p.getAttribute('j')] ||= []).push(p.getAttribute('fill'))
      return m
    }, {})
    expect(byBox[0]).toContain('rgb(0,0,255)')
    expect(byBox[0]).not.toContain('rgb(255,0,0)')
    expect(byBox[1]).toContain('rgb(255,0,0)')
  })

  it('forgets a series removed by an update', async () => {
    const lo = { data: [{ x: 'a', y: { points: [0, 2, 4, 6, 8, 10] } }] }
    const chart = createChartWithOptions({
      chart: {
        type: 'violin',
        width: 600,
        height: 400,
        animations: { enabled: false },
      },
      dataLabels: { enabled: false },
      plotOptions: { violin: { points: { show: true, colorScale } } },
      series: [lo, { data: [{ x: 'a', y: { points: [1000, 1001, 1002] } }] }],
    })
    await chart.updateSeries([lo])
    const f = fills(chart, '.apexcharts-violin-points')
    expect(f).toContain('rgb(0,0,255)')
    expect(f).toContain('rgb(255,0,0)')
  })

  it('skips observations that are not numbers', () => {
    const w = { seriesData: { series: [[]] } }
    expect(jitterExtent([[[null, 5, '9', 10]]], w)).toEqual([5, 10])
    expect(jitterExtent([[[5]], [[99]]], w)).toEqual([5, 5])
  })
})

describe('darkenColor', () => {
  it('darkens hex, rgb() and 8-digit hex colours', () => {
    expect(darkenColor('#c86432', 0.5)).toBe('rgb(100,50,25)')
    expect(darkenColor('rgb(200,100,50)', 0.5)).toBe('rgb(100,50,25)')
    expect(darkenColor('#c86432ff', 0.5)).toBe('rgb(100,50,25)')
  })
})
