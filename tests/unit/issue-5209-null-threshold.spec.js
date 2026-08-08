import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

describe('Issue 5209 — null value + line threshold colors on area chart', () => {
  const thresholdOptions = {
    chart: { type: 'area', width: '800px', height: 350 },
    plotOptions: {
      line: {
        isSlopeChart: false,
        colors: {
          threshold: 0,
          colorAboveThreshold: 'rgba(0,136,238,0.30)',
          colorBelowThreshold: 'rgba(255,0,0,0.30)',
        },
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ['A','B','C','D','E','F','G','H','I','J'],
    },
    stroke: { curve: 'straight' },
  }

  it('uses userSpaceOnUse gradient so split segments share a consistent color mapping', () => {
    const chart = createChartWithOptions({
      ...thresholdOptions,
      series: [{ data: [60, 63, 60, 87, -50, -50, null, 100, 120, 138] }],
    })

    // null splits the area into multiple paths
    const areaPaths = document.querySelectorAll('.apexcharts-area[fill^="url("]')
    expect(areaPaths.length).toBeGreaterThan(1)

    // gradient must use userSpaceOnUse so the threshold offset is identical
    // across every segment (not relative to each path's bounding box)
    const grad = document.querySelector('linearGradient')
    expect(grad).toBeTruthy()
    expect(grad.getAttribute('gradientUnits')).toBe('userSpaceOnUse')
    expect(grad.getAttribute('y2')).toBe(String(chart.w.layout.gridHeight))
  })

  it('keeps default objectBoundingBox gradient when there are no null values', () => {
    const chart = createChartWithOptions({
      ...thresholdOptions,
      series: [{ data: [60, 63, 60, 87, -50, -50, 0, 100, 120, 138] }],
    })

    // no null -> single area path
    const areaPaths = document.querySelectorAll('.apexcharts-area[fill^="url("]')
    expect(areaPaths.length).toBe(1)

    // default gradientUnits (objectBoundingBox) is preserved
    const grad = document.querySelector('linearGradient')
    expect(grad.getAttribute('gradientUnits')).toBeNull()
  })

  it('computes threshold gradient stops ignoring null values', () => {
    const chart = createChartWithOptions({
      ...thresholdOptions,
      series: [{ data: [60, 63, 60, 87, -50, -50, null, 100, 120, 138] }],
    })

    // non-null data: [60,63,60,87,-50,-50,100,120,138]
    // maxPositive=138, minNegative=-50, threshold=0
    // totalRange=188, negative%=50/188*100=26.6, offset=100-26.6=73.4 -> 0.734
    const grad = document.querySelector('linearGradient')
    const stops = grad.querySelectorAll('stop')
    expect(parseFloat(stops[0].getAttribute('offset'))).toBeCloseTo(0.734, 2)
  })
})