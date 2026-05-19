import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Covers gauge feature additions layered on top of the needle shape:
//   1. needle.showValueArc — draw the filled value-arc alongside the needle
//   2. needle.offsetY      — shift the needle base (and rotation origin)
//                            relative to the geometric center
//   3. Rounded needle base — the path uses a semi-circular arc, not sharp
//                            polygon corners
//   4. hollow.stroke* opts — dashed/dotted indicator border around the hollow
// Also locks in the partial-arc auto-balance gating (only fires for
// |endAngle − startAngle| < 360), which protects full-circle radialBars
// from the gauge-specific layout logic.

/**
 * @param {Record<string, any>} radialBar
 * @param {number[]} series
 */
function gauge(radialBar = {}, series = [72]) {
  return createChartWithOptions({
    chart: { type: 'gauge', height: 350 },
    series,
    plotOptions: { radialBar },
  })
}

describe('Gauge — needle base shape', () => {
  it('uses a half-circle arc at the base (rounded, not sharp corners)', () => {
    gauge({ shape: 'needle' })
    const d =
      document
        .querySelector('.apexcharts-gauge-needle-shape')
        ?.getAttribute('d') || ''
    // Rounded base path has an SVG arc command (`A rx ry ...`) between the
    // two base points. A purely polygonal needle would only contain M/L/Z.
    expect(d).toMatch(/\bA\s+\d/)
  })
})

describe("Gauge — needle + value arc together (needle.showValueArc)", () => {
  it("renders only the needle by default when shape: 'needle'", () => {
    gauge({ shape: 'needle' })
    const slice = document.querySelector('.apexcharts-radialbar-slice-0')
    expect(slice).not.toBeNull()
    expect(slice.getAttribute('stroke')).toBe('transparent')
  })

  it('also renders the filled value arc when needle.showValueArc: true', () => {
    gauge({
      shape: 'needle',
      needle: { showValueArc: true },
    })
    const slice = document.querySelector('.apexcharts-radialbar-slice-0')
    expect(slice).not.toBeNull()
    expect(slice.getAttribute('stroke')).not.toBe('transparent')
    expect(document.querySelector('.apexcharts-gauge-needle')).not.toBeNull()
  })
})

describe('Gauge — needle.offsetY', () => {
  it('moves the needle rotation origin (transform-origin y) by offsetY', () => {
    gauge({ shape: 'needle', needle: { offsetY: 40 } })
    const transformOriginA = document
      .querySelector('.apexcharts-gauge-needle')
      ?.getAttribute('transform-origin')

    gauge({ shape: 'needle', needle: { offsetY: 0 } })
    const transformOriginB = document
      .querySelector('.apexcharts-gauge-needle')
      ?.getAttribute('transform-origin')

    const yOf = (/** @type {string|null|undefined} */ v) =>
      Number((v || '').trim().split(/\s+/)[1])
    expect(yOf(transformOriginA) - yOf(transformOriginB)).toBe(40)
  })
})

describe('Gauge — hollow dashed stroke', () => {
  it('applies stroke-dasharray when hollow.strokeDasharray is set', () => {
    gauge({
      hollow: {
        size: '60%',
        stroke: '#94A3B8',
        strokeWidth: 2,
        strokeDasharray: '3 3',
      },
    })
    const hollow = document.querySelector('.apexcharts-radialbar-hollow')
    expect(hollow).not.toBeNull()
    expect(hollow.getAttribute('stroke')).toBe('#94A3B8')
    expect(hollow.getAttribute('stroke-width')).toBe('2')
    expect(hollow.getAttribute('stroke-dasharray')).toBe('3 3')
  })

  it('leaves the hollow stroke unset by default', () => {
    gauge({ hollow: { size: '60%' } })
    const hollow = document.querySelector('.apexcharts-radialbar-hollow')
    expect(hollow.getAttribute('stroke-dasharray')).toBeNull()
  })
})

describe('Partial-arc auto-balance gating', () => {
  it('does not pull the graphical group when arc is a full 360° span', () => {
    createChartWithOptions({
      chart: { type: 'radialBar', height: 350, width: 380 },
      series: [71, 63, 77],
      labels: ['Jun', 'May', 'Apr'],
      plotOptions: {
        radialBar: {
          startAngle: -180,
          endAngle: 180,
          hollow: { size: '48%' },
          track: { show: false },
        },
      },
    })
    const elGraphical = document.querySelector('.apexcharts-inner')
    const transform = elGraphical?.getAttribute('transform') || ''
    const match = transform.match(/translate\([^,]+,\s*(-?\d+(?:\.\d+)?)\)/)
    const ty = match ? Number(match[1]) : 0
    expect(Math.abs(ty)).toBeLessThan(5)
  })
})
