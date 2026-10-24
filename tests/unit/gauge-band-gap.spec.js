// bandsStyle.gap is a pixel width along the band's radius, so it reads the
// same on any domain and a small domain keeps its bands.
import { describe, it, expect, vi } from 'vitest'
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

// #5374: a gap that is a share of the scale, or an angle, reads the same at
// every size; a number keeps meaning px.
describe('gauge bandsStyle.gap units', () => {
  const bands = [
    { from: 0, to: 50, color: '#f00' },
    { from: 50, to: 100, color: '#0c6' },
  ]

  // The angle between band 0's end and band 1's start, round the dial centre.
  function gapAngle(size, gap) {
    const chart = createChartWithOptions({
      chart: { type: 'gauge', width: size, height: size },
      series: [40],
      plotOptions: { radialBar: { bands, bandsStyle: { gap } } },
    })
    const { cx, cy } = chart.getRadialScales()
    const ang = (x, y) => (Math.atan2(x - cx, cy - y) * 180) / Math.PI
    const nums = [...document.querySelectorAll('.apexcharts-gauge-band')].map(
      (p) =>
        p
          .getAttribute('d')
          .match(/-?[\d.]+(e-?\d+)?/g)
          .map(Number),
    )
    // Each arc runs from its end point (first) back to its start (last).
    const end0 = ang(nums[0][0], nums[0][1])
    const start1 = ang(nums[1][nums[1].length - 2], nums[1][nums[1].length - 1])
    return start1 - end0
  }

  it("'%' is a share of the scale, the same at two sizes", () => {
    // The default gauge sweeps 270 degrees, so 2% is 5.4 degrees.
    expect(gapAngle(300, '2%')).toBeCloseTo(5.4, 4)
    expect(gapAngle(600, '2%')).toBeCloseTo(5.4, 4)
  })

  it("'deg' is an angle, the same at two sizes", () => {
    expect(gapAngle(300, '3deg')).toBeCloseTo(3, 4)
    expect(gapAngle(600, '3deg')).toBeCloseTo(3, 4)
  })

  it("a number and '4px' are px, so the angle shrinks as the gauge grows", () => {
    const small = gapAngle(300, 4)
    const large = gapAngle(600, 4)
    expect(large).toBeLessThan(small * 0.6)
    expect(gapAngle(300, '4px')).toBeCloseTo(small, 6)
    // The px are along the band's own radius.
    const r = createChartWithOptions({
      chart: { type: 'gauge', width: 300, height: 300 },
      series: [40],
      plotOptions: { radialBar: { bands, bandsStyle: { gap: 4 } } },
    }).getRadialScales().bands.radius
    expect(small).toBeCloseTo(((4 / r) * 180) / Math.PI, 4)
  })

  it('an unparseable string draws no gap', () => {
    expect(gapAngle(300, 'wide')).toBeCloseTo(0, 6)
  })
})

describe('gauge band dropped for its gap', () => {
  const warns = () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    return spy
  }

  it('warns once, naming the band, and keeps the others', () => {
    const spy = warns()
    const opts = () => ({
      chart: { type: 'gauge', width: 400, height: 400 },
      series: [50],
      plotOptions: {
        radialBar: {
          min: 0,
          max: 4800000,
          bands: [
            { from: 0, to: 2000000, color: '#f00' },
            { from: 2000000, to: 2010000, color: '#fb0' },
            { from: 2010000, to: 4800000, color: '#0c6' },
          ],
          bandsStyle: { gap: '1.5deg' },
        },
      },
    })
    const chart = createChartWithOptions(opts())
    expect(document.querySelectorAll('.apexcharts-gauge-band').length).toBe(2)
    const msgs = spy.mock.calls.map((c) => String(c[0]))
    const hits = msgs.filter((m) => m.includes('bandsStyle.gap'))
    expect(hits).toHaveLength(1)
    expect(hits[0]).toContain('band 1 is narrower')
    // A redraw of the same config says nothing more.
    chart.updateOptions({ title: { text: 'again' } }, true, false)
    createChartWithOptions(opts())
    expect(
      spy.mock.calls.filter((c) => String(c[0]).includes('bandsStyle.gap')),
    ).toHaveLength(1)
    spy.mockRestore()
  })

  it('says nothing for a band that is empty or off the scale', () => {
    const spy = warns()
    createChartWithOptions({
      chart: { type: 'gauge', width: 400, height: 400 },
      series: [50],
      plotOptions: {
        radialBar: {
          bands: [
            { from: 20, to: 20, color: '#f00' },
            { from: 120, to: 140, color: '#fb0' },
            { from: 0, to: 100, color: '#0c6' },
          ],
          bandsStyle: { gap: 7 },
        },
      },
    })
    expect(
      spy.mock.calls.filter((c) => String(c[0]).includes('bandsStyle.gap')),
    ).toHaveLength(0)
    spy.mockRestore()
  })
})
