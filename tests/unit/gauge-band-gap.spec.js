// bandsStyle.gap is a pixel width along the band's radius, so it reads the
// same on any domain and a small domain keeps its bands.
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

function gauge(radialBar = {}, series = [72]) {
  return createChartWithOptions({
    chart: { type: 'gauge', height: 350 },
    series,
    plotOptions: { radialBar },
  })
}

describe('gauge bandsStyle.gap is in pixels', () => {
  const bands = [
    { from: 0, to: 3, color: '#f00' },
    { from: 3, to: 7, color: '#fb0' },
    { from: 7, to: 10, color: '#0c6' },
  ]

  it('keeps every band on a small domain', () => {
    gauge({ min: 0, max: 10, bands, bandsStyle: { gap: 4 } }, [5])
    expect(document.querySelectorAll('.apexcharts-gauge-band').length).toBe(3)
  })

  it('opens a gap of about that many pixels between neighbours', () => {
    // A sized chart: jsdom lays an unsized one out with no radius at all.
    createChartWithOptions({
      chart: { type: 'gauge', width: 400, height: 400 },
      series: [5],
      plotOptions: {
        radialBar: { min: 0, max: 10, bands, bandsStyle: { gap: 4 } },
      },
    })
    const ends = [...document.querySelectorAll('.apexcharts-gauge-band')].map(
      (p) =>
        p
          .getAttribute('d')
          .match(/-?[\d.]+/g)
          .map(Number),
    )
    // Each band is drawn from its end point back to its start point, so the
    // gap runs from band 0's first point to band 1's last.
    const a0 = ends[0].slice(0, 2)
    const b1 = ends[1].slice(-2)
    const gap = Math.hypot(a0[0] - b1[0], a0[1] - b1[1])
    expect(gap).toBeGreaterThan(3)
    expect(gap).toBeLessThan(5)
  })
})
