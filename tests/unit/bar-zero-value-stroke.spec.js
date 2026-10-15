// @ts-nocheck
/**
 * Regression for #5046: with stroke.width > 0, a stacked bar whose value is 0
 * still painted a visible mark because BarStacked passed the series stroke
 * width into path geometry (stroke centering expands a zero-height bar by
 * strokeWidth) even though the rendered stroke-width attribute was 0.
 */
import { describe, it, expect } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

const render = async (opts = {}) => {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    chart: {
      type: 'bar',
      stacked: true,
      width: 400,
      height: 300,
      animations: { enabled: false },
      ...opts.chart,
    },
    stroke: { width: 5, ...(opts.stroke || {}) },
    plotOptions: { bar: { borderRadius: 0 }, ...(opts.plotOptions || {}) },
    series: opts.series || [
      { name: 'S1', data: [100, 0, 1] },
      { name: 'S2', data: [0, 1, 0] },
    ],
    ...opts,
  })
  await chart.render()
  return chart
}

function pathYSpan(d) {
  const nums = (d.match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi) || []).map(parseFloat)
  const ys = []
  for (let i = 1; i < nums.length; i += 2) ys.push(nums[i])
  if (!ys.length) return 0
  return Math.max(...ys) - Math.min(...ys)
}

describe('stacked bar zero values with stroke (#5046)', () => {
  it('does not expand zero-value column paths by the series stroke width', async () => {
    await render()
    const zeros = [...document.querySelectorAll('.apexcharts-bar-area')].filter(
      (p) => p.getAttribute('barHeight') === '0',
    )
    expect(zeros.length).toBe(3)
    for (const p of zeros) {
      expect(parseFloat(p.getAttribute('stroke-width') || '0')).toBe(0)
      // Path must not be grown by stroke centering (was exactly stroke.width).
      expect(pathYSpan(p.getAttribute('d') || '')).toBeLessThan(0.01)
    }
  })

  it('still strokes non-zero stacked columns', async () => {
    await render()
    const nonZero = [...document.querySelectorAll('.apexcharts-bar-area')].filter(
      (p) => parseFloat(p.getAttribute('barHeight') || '0') > 1,
    )
    expect(nonZero.length).toBeGreaterThan(0)
    expect(
      nonZero.some((p) => parseFloat(p.getAttribute('stroke-width') || '0') === 5),
    ).toBe(true)
  })
})
