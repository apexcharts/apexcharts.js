/**
 * #5381 (and #1280): plotOptions.radialBar.targets, marks at a value on a
 * ring, drawn on the published dial geometry (#5380).
 */
import { describe, it, expect } from 'vitest'
import './__mocks__/ResizeObserver.js'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/standard.js'
// An opt-in add-on (free): not in the default bundle.
import '../../src/features/radial-targets.js'

const targetsOf = (chart) => [
  ...chart.el.querySelectorAll('.apexcharts-radial-target'),
]

/** The angle a target is turned to. */
const angleOf = (el) =>
  Number(
    /rotate\(([-\d.e]+)/.exec(
      el.querySelector('.apexcharts-radial-target-mark').getAttribute('transform'),
    )[1],
  )

const num = (el, a) => Number(el.getAttribute(a))

function gauge(radialBar = {}, series = [62], extra = {}) {
  return createChartWithOptions({
    chart: { type: 'gauge', width: 400, height: 400 },
    series,
    ...extra,
    plotOptions: { radialBar },
  })
}

describe('radialBar targets', () => {
  it('draws nothing by default', () => {
    const chart = gauge()
    expect(chart.w.config.plotOptions.radialBar.targets).toEqual([])
    expect(chart.el.querySelector('.apexcharts-radial-targets')).toBeNull()
    chart.destroy()
  })

  it('draws a line across the ring at the value, turned round the centre', () => {
    const chart = gauge({ targets: [{ value: 80 }] })
    const rs = chart.getRadialScales()
    const [t] = targetsOf(chart)
    expect(angleOf(t)).toBe(rs.angle(80))
    const mark = t.querySelector('.apexcharts-radial-target-mark')
    expect(mark.getAttribute('transform')).toBe(
      `rotate(${rs.angle(80)} ${rs.cx} ${rs.cy})`,
    )
    // Drawn at 12 o'clock: 130% of the ring's thickness, centred on it.
    const line = t.querySelector('line')
    const ring = rs.rings[0]
    expect(num(line, 'x1')).toBeCloseTo(rs.cx, 9)
    expect(rs.cy - num(line, 'y1')).toBeCloseTo(ring.radius - (ring.thickness * 1.3) / 2, 9)
    expect(rs.cy - num(line, 'y2')).toBeCloseTo(ring.radius + (ring.thickness * 1.3) / 2, 9)
    expect(num(line, 'stroke-width')).toBe(3)
    // Chrome: it does not take the ring's pointer events.
    expect(
      chart.el
        .querySelector('.apexcharts-radial-targets')
        .getAttribute('pointer-events'),
    ).toBe('none')
    chart.destroy()
  })

  it('marks each ring of a radialBar by seriesIndex, inverseOrder included', () => {
    for (const inverseOrder of [false, true]) {
      const chart = createChartWithOptions({
        chart: { type: 'radialBar', width: 400, height: 400 },
        series: [44, 55, 67],
        plotOptions: {
          radialBar: {
            inverseOrder,
            targets: [
              { value: 50, seriesIndex: 0, shape: 'circle', length: 8 },
              { value: 90, seriesIndex: 2, shape: 'circle', length: 8 },
            ],
          },
        },
      })
      const rs = chart.getRadialScales()
      const circles = [...chart.el.querySelectorAll('.apexcharts-radial-target circle')]
      expect(circles).toHaveLength(2)
      expect(rs.cy - num(circles[0], 'cy')).toBeCloseTo(rs.rings[0].radius, 9)
      expect(rs.cy - num(circles[1], 'cy')).toBeCloseTo(rs.rings[2].radius, 9)
      expect(num(circles[0], 'r')).toBe(4)
      expect(targetsOf(chart).map((t) => t.getAttribute('rel'))).toEqual(['1', '3'])
      chart.destroy()
    }
  })

  it("'series' follows the ring's own value, through updateSeries", async () => {
    const chart = gauge({ targets: [{ value: 'series', shape: 'triangle' }] })
    const rs = chart.getRadialScales()
    expect(angleOf(targetsOf(chart)[0])).toBe(rs.angle(62))
    await chart.updateSeries([25])
    expect(angleOf(targetsOf(chart)[0])).toBe(chart.getRadialScales().angle(25))
    chart.destroy()
  })

  it('places a triangle outside the ring, pointing at it', () => {
    const chart = gauge({
      targets: [{ value: 30, shape: 'triangle', length: 10, width: 12 }],
    })
    const rs = chart.getRadialScales()
    const ring = rs.rings[0]
    const d = targetsOf(chart)[0]
      .querySelector('path')
      .getAttribute('d')
      .match(/-?[\d.]+(e-?\d+)?/g)
      .map(Number)
    // Tip on the outer edge, base 10px further out and 12px wide.
    expect(rs.cy - d[1]).toBeCloseTo(ring.radius + ring.thickness / 2, 9)
    expect(rs.cy - d[3]).toBeCloseTo(ring.radius + ring.thickness / 2 + 10, 9)
    expect(d[4] - d[2]).toBeCloseTo(12, 9)
    chart.destroy()
  })

  it('sits on the bands on a needle gauge with no value arc', () => {
    const chart = gauge({
      shape: 'needle',
      bands: [
        { from: 0, to: 50, color: '#d33' },
        { from: 50, to: 100, color: '#2a6' },
      ],
      targets: [{ value: 75, position: 'inside', shape: 'triangle' }],
    })
    const rs = chart.getRadialScales()
    const d = targetsOf(chart)[0]
      .querySelector('path')
      .getAttribute('d')
      .match(/-?[\d.]+(e-?\d+)?/g)
      .map(Number)
    expect(rs.cy - d[1]).toBeCloseTo(rs.bands.radius - rs.bands.thickness / 2, 9)
    expect(angleOf(targetsOf(chart)[0])).toBe(rs.angle(75))
    // The needle still renders.
    expect(chart.el.querySelector('.apexcharts-gauge-needle-shape')).not.toBeNull()
    chart.destroy()
  })

  it("takes the theme's text colour by default and the caller's when given", () => {
    const light = gauge({ targets: [{ value: 10 }] })
    const fore = light.w.config.chart.foreColor
    expect(targetsOf(light)[0].querySelector('line').getAttribute('stroke')).toBe(fore)
    light.destroy()

    const dark = gauge({ targets: [{ value: 10 }] }, [62], {
      theme: { mode: 'dark' },
    })
    const darkFore = dark.w.config.chart.foreColor
    expect(darkFore).not.toBe(fore)
    expect(targetsOf(dark)[0].querySelector('line').getAttribute('stroke')).toBe(
      darkFore,
    )
    dark.destroy()

    const own = gauge({
      targets: [{ value: 10, shape: 'circle', color: '#c00', strokeColor: '#fff', strokeWidth: 2 }],
    })
    const c = targetsOf(own)[0].querySelector('circle')
    expect(c.getAttribute('fill')).toBe('#c00')
    expect(c.getAttribute('stroke')).toBe('#fff')
    expect(c.getAttribute('stroke-width')).toBe('2')
    own.destroy()
  })

  it('draws an upright label off the outer end of the mark', () => {
    const chart = gauge({
      startAngle: -90,
      endAngle: 90,
      targets: [
        { value: 100, label: { text: 'Max', offset: 6 } },
        { value: 50, label: { text: 'Mid', style: { color: '#123456' } } },
      ],
    })
    const rs = chart.getRadialScales()
    const [right, top] = targetsOf(chart).map((t) =>
      t.querySelector('.apexcharts-radial-target-label'),
    )
    expect(right.textContent).toBe('Max')
    // Not inside the turned group, so the text is never rotated.
    expect(right.closest('.apexcharts-radial-target-mark')).toBeNull()
    expect(right.getAttribute('transform')).toBeNull()
    // At 90 degrees the label grows rightwards from the mark's end.
    expect(right.getAttribute('text-anchor')).toBe('start')
    const outer = rs.rings[0].radius + (rs.rings[0].thickness * 1.3) / 2
    expect(num(right, 'x') - rs.cx).toBeCloseTo(outer + 6, 6)
    expect(num(right, 'y')).toBeCloseTo(rs.cy, 6)
    // At 12 o'clock it is centred, and clears the mark by half its height.
    expect(top.getAttribute('text-anchor')).toBe('middle')
    expect(num(top, 'x')).toBeCloseTo(rs.cx, 6)
    expect(rs.cy - num(top, 'y')).toBeCloseTo(outer + 4 + 11 / 2, 6)
    expect(top.getAttribute('fill')).toBe('#123456')
    chart.destroy()
  })

  it('survives updateOptions, and goes when the list empties', async () => {
    const chart = gauge({ targets: [{ value: 20, cssClass: 'goal', id: 'g' }] })
    expect(chart.el.querySelector('.apexcharts-radial-target.goal')).not.toBeNull()
    expect(targetsOf(chart)[0].getAttribute('data-target-id')).toBe('g')
    await chart.updateOptions({ title: { text: 'Score' } })
    expect(targetsOf(chart)).toHaveLength(1)
    await chart.updateOptions({
      plotOptions: { radialBar: { targets: [{ value: 90 }, { value: 40 }] } },
    })
    const rs = chart.getRadialScales()
    expect(targetsOf(chart).map(angleOf)).toEqual([rs.angle(90), rs.angle(40)])
    await chart.updateOptions({ plotOptions: { radialBar: { targets: [] } } })
    expect(targetsOf(chart)).toHaveLength(0)
    chart.destroy()
  })

  it('skips a target with no value, or on a ring that does not exist', () => {
    const chart = gauge({
      targets: [{ value: null }, { value: 'abc' }, { value: 50, seriesIndex: 3 }, { value: 50 }],
    })
    expect(targetsOf(chart)).toHaveLength(1)
    expect(targetsOf(chart)[0].getAttribute('data-target-index')).toBe('3')
    chart.destroy()
  })

  it("hides with its ring when the legend hides the ring's series", async () => {
    const chart = createChartWithOptions({
      chart: { type: 'radialBar', width: 400, height: 400 },
      series: [44, 55],
      labels: ['A', 'B'],
      legend: { show: true },
      plotOptions: {
        radialBar: {
          targets: [
            { value: 60, seriesIndex: 0 },
            { value: 60, seriesIndex: 1 },
          ],
        },
      },
    })
    expect(targetsOf(chart)).toHaveLength(2)
    chart.toggleSeries('A')
    await new Promise((r) => setTimeout(r, 0))
    expect(targetsOf(chart).map((t) => t.getAttribute('rel'))).toEqual(['2'])
    chart.toggleSeries('A')
    await new Promise((r) => setTimeout(r, 0))
    expect(targetsOf(chart)).toHaveLength(2)
    chart.destroy()
  })
})

// jsdom's rAF timestamps run on another clock than performance.now(), so a
// tween never advances here (see gauge-needle-lifecycle). These read where
// each tween starts, written before its first frame.
describe('radialBar targets move with the chart', () => {
  function animated(radialBar, series = [70]) {
    document.body.innerHTML = '<div id="chart"></div>'
    return new ApexCharts(document.querySelector('#chart'), {
      chart: {
        type: 'gauge',
        width: 400,
        height: 400,
        animations: {
          enabled: true,
          speed: 60,
          dynamicAnimation: { enabled: true, speed: 60 },
        },
      },
      series,
      plotOptions: { radialBar },
    })
  }

  it('sweeps in from the start of the dial on mount, with its ring', async () => {
    const chart = animated({ targets: [{ value: 80 }, { value: 'series' }] })
    await chart.render()
    const rs = chart.getRadialScales()
    expect(targetsOf(chart).map(angleOf)).toEqual([rs.startAngle, rs.startAngle])
    expect(chart.w.globals.radialTargetRAF).not.toBeNull()
    chart.destroy()
  })

  it('moves from where it was on a data update', async () => {
    const chart = animated({ targets: [{ value: 'series' }, { value: 80 }] })
    await chart.render()
    const rs = chart.getRadialScales()
    await chart.updateSeries([30])
    const [follow, fixed] = targetsOf(chart).map(angleOf)
    // The pointer starts from 70, the fixed target is already in place.
    expect(follow).toBe(rs.angle(70))
    expect(fixed).toBe(rs.angle(80))
    chart.destroy()
  })

  it('lands at once with animations off', () => {
    const chart = gauge({ targets: [{ value: 80 }] })
    expect(angleOf(targetsOf(chart)[0])).toBe(chart.getRadialScales().angle(80))
    expect(chart.w.globals.radialTargetRAF).toBeNull()
    chart.destroy()
  })
})
