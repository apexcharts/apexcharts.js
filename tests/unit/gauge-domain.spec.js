// The gauge's value arc, needle, ticks and bands all read one min/max domain
// through one clockwise value-to-angle mapping, so on any domain or angle
// range every mark sits on the same dial.
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

function gauge(radialBar = {}, series = [72]) {
  return createChartWithOptions({
    chart: { type: 'gauge', height: 350 },
    series,
    plotOptions: { radialBar },
  })
}

const needleAngle = () => {
  const t = document
    .querySelector('.apexcharts-gauge-needle')
    .getAttribute('transform')
  return Number(/rotate\(([^)]+)\)/.exec(t)[1])
}
// Where ring 0's value arc ends, in degrees.
const arcEnd = (chart) =>
  chart.w.config.plotOptions.radialBar.startAngle +
  Number(
    document
      .querySelector('.apexcharts-radialbar-slice-0')
      .getAttribute('data:angle'),
  )

describe('gauge domain: one mapping for arc, needle, ticks and bands', () => {
  it('a negative reading on a domain below zero draws the arc where the needle points', () => {
    const chart = gauge(
      { min: -50, max: 50, shape: 'needle', needle: { showValueArc: true } },
      [-30],
    )
    // -30 is 20% of the -50..50 domain: 54 of the 270 degree sweep.
    expect(needleAngle()).toBeCloseTo(-81, 5)
    expect(arcEnd(chart)).toBeCloseTo(-81, 0)
  })

  it('a dial with startAngle above endAngle keeps the needle on the arc', () => {
    const chart = gauge(
      {
        startAngle: 90,
        endAngle: -90,
        shape: 'needle',
        needle: { showValueArc: true },
        ticks: { show: true, minor: { count: 0 } },
      },
      [25],
    )
    // The arc runs clockwise from startAngle: 25% of 180 degrees.
    expect(arcEnd(chart)).toBeCloseTo(135, 0)
    expect(needleAngle()).toBeCloseTo(135, 5)
  })

  it('a missing reading parks the needle and the arc at min, never at NaN', () => {
    gauge({ shape: 'needle', needle: { showValueArc: true } }, [NaN])
    expect(needleAngle()).toBe(-135)
    const d = document
      .querySelector('.apexcharts-radialbar-slice-0')
      .getAttribute('d')
    expect(d).not.toMatch(/NaN/)
  })
})
