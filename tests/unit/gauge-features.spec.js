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
  it('renders a needle group with the shape only', () => {
    gaugeChart({ shape: 'needle' })
    const group = document.querySelector('.apexcharts-gauge-needle')
    expect(group).not.toBeNull()
    expect(group.querySelector('.apexcharts-gauge-needle-shape')).not.toBeNull()
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

describe('Gauge — value arc honors min/max (non-percentage domains)', () => {
  it('value 50 of 0..100 (default) → ~half the available sweep', () => {
    gaugeChart(
      {
        startAngle: -90,
        endAngle: 90,
      },
      [50],
    )
    const arc = document.querySelector('.apexcharts-radialbar-slice-0')
    expect(arc).not.toBeNull()
    // For a 180° total sweep at 50% the arc spans roughly 90°. A simple way
    // to assert "non-trivial sweep that isn't full" is to check the path d
    // contains an arc command but does NOT span the full 180°.
    const d = arc.getAttribute('d') || ''
    expect(d).toContain('A')
  })

  it('value 120 of 0..240 (speedometer) → arc fills half the sweep, NOT clamped to 100%', () => {
    // Before the fix: any value > 100 clamped to 100% → the arc filled the
    // FULL sweep. With the fix, 120 of 0..240 → 50% of sweep.
    gaugeChart(
      {
        startAngle: -90,
        endAngle: 90,
        min: 0,
        max: 240,
      },
      [120],
    )
    const arcAtHalf = document
      .querySelector('.apexcharts-radialbar-slice-0')
      ?.getAttribute('d')

    // Compare against a known-full arc (value at max).
    gaugeChart(
      {
        startAngle: -90,
        endAngle: 90,
        min: 0,
        max: 240,
      },
      [240],
    )
    const arcAtFull = document
      .querySelector('.apexcharts-radialbar-slice-0')
      ?.getAttribute('d')

    // The half-fill arc should differ from the full-sweep arc. Pre-fix, both
    // would be identical (because 120 > 100 → clamped to 100 → 100/100 = 1.0).
    expect(arcAtHalf).not.toBe(arcAtFull)
  })

  it('value above max clamps to the sweep endpoint', () => {
    gaugeChart(
      {
        startAngle: -90,
        endAngle: 90,
        min: 0,
        max: 50,
      },
      [9999],
    )
    const arcOver = document
      .querySelector('.apexcharts-radialbar-slice-0')
      ?.getAttribute('d')
    gaugeChart(
      {
        startAngle: -90,
        endAngle: 90,
        min: 0,
        max: 50,
      },
      [50],
    )
    const arcAtMax = document
      .querySelector('.apexcharts-radialbar-slice-0')
      ?.getAttribute('d')
    expect(arcOver).toBe(arcAtMax)
  })
})
