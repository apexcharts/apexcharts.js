import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Covers the gauge feature additions layered on top of the needle shape:
//   1. needle.showValueArc — draw the filled value-arc alongside the needle
//   2. pivot.offsetY      — shift the needle pivot (and rotation origin)
//                            relative to the geometric center
//   3. hollow.stroke* opts — dashed/dotted indicator border around the hollow
// Also locks in the partial-arc auto-balance gating (only fires for
// |endAngle − startAngle| < 360), which protects full-circle radialBars from
// the gauge-specific layout logic.

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

describe("Gauge — needle + value arc together (needle.showValueArc)", () => {
  it("renders only the needle by default when shape: 'needle'", () => {
    gauge({ shape: 'needle' })
    const slice = document.querySelector('.apexcharts-radialbar-slice-0')
    expect(slice).not.toBeNull()
    // Default: value-arc is rendered transparent so only the needle is visible.
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

describe('Gauge — pivot.offsetY', () => {
  it('shifts the pivot circle cy by offsetY pixels', () => {
    gauge({
      shape: 'needle',
      pivot: { offsetY: 0 },
    })
    const pivotBase = document
      .querySelector('.apexcharts-gauge-needle-pivot')
      ?.getAttribute('cy')
    expect(pivotBase).not.toBeNull()
    const baselineCy = Number(pivotBase)

    // Re-render with a positive offsetY and verify cy moved by exactly that
    // amount, in either direction.
    gauge({
      shape: 'needle',
      pivot: { offsetY: 25 },
    })
    const shiftedCy = Number(
      document
        .querySelector('.apexcharts-gauge-needle-pivot')
        ?.getAttribute('cy'),
    )
    expect(shiftedCy - baselineCy).toBe(25)
  })

  it('moves the needle rotation origin with the pivot', () => {
    gauge({
      shape: 'needle',
      pivot: { offsetY: 40 },
    })
    const transformOrigin = document
      .querySelector('.apexcharts-gauge-needle')
      ?.getAttribute('transform-origin')
    // Rotation origin must match the shifted pivot — otherwise the needle
    // sweeps around the wrong point.
    const pivotCy = Number(
      document
        .querySelector('.apexcharts-gauge-needle-pivot')
        ?.getAttribute('cy'),
    )
    expect(transformOrigin).toMatch(new RegExp(`\\b${pivotCy}\\b`))
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
    // No stroke attrs added unless explicitly configured — preserves the
    // existing visual (transparent stroke).
    expect(hollow.getAttribute('stroke-dasharray')).toBeNull()
  })
})

describe('Partial-arc auto-balance gating', () => {
  it('does not pull the graphical group when arc is a full 360° span', () => {
    // -180/+180 is a full circle (360° span). The dashboards/dark sample uses
    // this — the partial-arc branch must NOT alter the natural layout here.
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
    // For a full circle, translateY must NOT have been shifted by the
    // partial-arc auto-balance branch. Allow tiny non-zero from base layout
    // (legend/padding) but not the proportional padding shift this fix
    // would otherwise apply.
    const match = transform.match(/translate\([^,]+,\s*(-?\d+(?:\.\d+)?)\)/)
    const ty = match ? Number(match[1]) : 0
    expect(Math.abs(ty)).toBeLessThan(5)
  })
})
