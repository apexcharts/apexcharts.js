import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Plan 04 — gauge features: threshold bands, tick marks, needle/dial shape.
// All three are additive to the existing radialBar renderer; they're driven
// by plotOptions.radialBar config and active for both 'arc' and 'needle'
// gauges unless noted.

function gaugeChart(plotOptions = {}, series = [72]) {
  return createChartWithOptions({
    chart: { type: 'gauge', height: 350 },
    series,
    plotOptions: { radialBar: plotOptions },
  })
}

describe('Gauge — threshold bands', () => {
  it('renders one band path per entry', () => {
    gaugeChart({
      bands: [
        { from: 0, to: 30, color: '#FF4560' },
        { from: 30, to: 70, color: '#FEB019' },
        { from: 70, to: 100, color: '#00E396' },
      ],
    })
    const bands = document.querySelectorAll('.apexcharts-gauge-band')
    expect(bands.length).toBe(3)
  })

  it('skips zero-width bands and bands missing from/to', () => {
    gaugeChart({
      bands: [
        { from: 0, to: 30, color: '#FF4560' },
        { from: 50, to: 50, color: '#000' }, // zero-width — skipped
        /** @ts-expect-error - intentional missing fields */
        { color: '#fff' }, // missing — skipped
      ],
    })
    expect(document.querySelectorAll('.apexcharts-gauge-band').length).toBe(1)
  })

  it('hides the track by default when bands are present', () => {
    gaugeChart({
      bands: [{ from: 0, to: 100, color: '#888' }],
    })
    expect(document.querySelector('.apexcharts-radialbar-track')).toBeNull()
  })

  it('keeps the track when bandsStyle.hideTrackWhenPresent: false', () => {
    gaugeChart({
      bands: [{ from: 0, to: 50, color: '#888' }],
      bandsStyle: { hideTrackWhenPresent: false },
    })
    expect(document.querySelector('.apexcharts-radialbar-track')).not.toBeNull()
  })
})

describe('Gauge — tick marks', () => {
  it('renders major ticks when ticks.show: true', () => {
    gaugeChart({
      ticks: { show: true, major: { count: 6 }, minor: { count: 0 } },
    })
    const group = document.querySelector('.apexcharts-gauge-ticks')
    expect(group).not.toBeNull()
    // 6 major lines.
    expect(group.querySelectorAll('line').length).toBe(6)
  })

  it('renders minor ticks between majors', () => {
    gaugeChart({
      ticks: { show: true, major: { count: 5 }, minor: { count: 3 } },
    })
    const group = document.querySelector('.apexcharts-gauge-ticks')
    // 5 majors + 4 gaps × 3 minors = 5 + 12 = 17
    expect(group.querySelectorAll('line').length).toBe(17)
  })

  it('renders tick labels when labels.show: true', () => {
    gaugeChart({
      ticks: {
        show: true,
        major: { count: 3 },
        minor: { count: 0 },
        labels: { show: true, formatter: (v) => `${v}` },
      },
    })
    const labels = document.querySelectorAll('.apexcharts-gauge-tick-label')
    expect(labels.length).toBe(3)
  })

  it('omits ticks entirely when ticks.show: false (default)', () => {
    gaugeChart({})
    expect(document.querySelector('.apexcharts-gauge-ticks')).toBeNull()
  })
})

describe("Gauge — shape: 'needle'", () => {
  it('renders a needle group with shape + pivot', () => {
    gaugeChart({ shape: 'needle' })
    const group = document.querySelector('.apexcharts-gauge-needle')
    expect(group).not.toBeNull()
    expect(group.querySelector('.apexcharts-gauge-needle-shape')).not.toBeNull()
    expect(group.querySelector('.apexcharts-gauge-needle-pivot')).not.toBeNull()
  })

  it('rotates the needle group to the value angle', () => {
    gaugeChart(
      {
        shape: 'needle',
        startAngle: -90,
        endAngle: 90,
        min: 0,
        max: 100,
      },
      [50], // halfway → angle 0 (straight up)
    )
    const group = document.querySelector('.apexcharts-gauge-needle')
    const transform = group.getAttribute('transform') || ''
    // value 50 of 0..100 between -90..90 → midpoint = 0°
    expect(transform).toMatch(/rotate\(\s*0\b/)
  })

  it('clamps values outside [min, max] to the bounds', () => {
    gaugeChart(
      {
        shape: 'needle',
        startAngle: -90,
        endAngle: 90,
        min: 0,
        max: 100,
      },
      [9999],
    )
    const group = document.querySelector('.apexcharts-gauge-needle')
    const transform = group.getAttribute('transform') || ''
    // max → endAngle = 90
    expect(transform).toMatch(/rotate\(\s*90\b/)
  })

  it('skips the value arc (renders transparent) when needle shape is active', () => {
    gaugeChart({ shape: 'needle' })
    const arcs = document.querySelectorAll('.apexcharts-radialbar-area')
    // Tracks share this class. Filter to slice elements only.
    const slices = Array.from(arcs).filter((a) =>
      a.classList.contains('apexcharts-radialbar-slice-0'),
    )
    expect(slices.length).toBeGreaterThan(0)
    expect(slices[0].getAttribute('stroke')).toBe('transparent')
  })

  it("default shape: 'arc' renders a filled value arc as before", () => {
    gaugeChart({})
    const arcs = document.querySelectorAll('.apexcharts-radialbar-slice-0')
    expect(arcs.length).toBeGreaterThan(0)
    expect(arcs[0].getAttribute('stroke')).not.toBe('transparent')
    expect(document.querySelector('.apexcharts-gauge-needle')).toBeNull()
  })
})
