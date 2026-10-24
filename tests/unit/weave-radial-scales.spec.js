/**
 * #5380: the dial a radialBar or gauge drew, published once and read by
 * everything that draws on it: `chart.getRadialScales()`, Weave's
 * `api.radialScales` / `payload.radialScales`, and the chart's own bands,
 * ticks and needle. Checked against the drawn SVG, so the published numbers
 * and the picture cannot drift apart.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/standard.js'

const nums = (el, attr = 'd') =>
  el
    .getAttribute(attr)
    .match(/-?[\d.]+(e-?\d+)?/g)
    .map(Number)

/** The radius of an `M x y A r r ...` arc path. */
const arcRadius = (el) => nums(el)[2]

const bands = [
  { from: 0, to: 30, color: '#d33' },
  { from: 30, to: 70, color: '#fb0' },
  { from: 70, to: 100, color: '#2a6' },
]

function gauge(radialBar = {}, series = [62], chart = {}) {
  return createChartWithOptions({
    chart: { type: 'gauge', width: 400, height: 400, ...chart },
    series,
    plotOptions: { radialBar: { bands, ...radialBar } },
  })
}

describe('chart.getRadialScales()', () => {
  it('matches the drawn hollow, bands and ticks', () => {
    const chart = gauge({
      ticks: { show: true, major: { count: 5, length: 10 }, minor: { count: 0 } },
    })
    const rs = chart.getRadialScales()
    const hollow = chart.el.querySelector('.apexcharts-radialbar-hollow')
    expect(rs.cx).toBeCloseTo(Number(hollow.getAttribute('cx')), 9)
    expect(rs.cy).toBeCloseTo(Number(hollow.getAttribute('cy')), 9)
    expect(rs.hollow.radius).toBeCloseTo(Number(hollow.getAttribute('r')), 9)

    const band = chart.el.querySelector('.apexcharts-gauge-band')
    expect(rs.bands.radius).toBeCloseTo(arcRadius(band), 9)
    expect(rs.bands.thickness).toBeCloseTo(
      Number(band.getAttribute('stroke-width')),
      9,
    )
    // The bands, the ticks and the first ring share one centre line.
    expect(rs.radius).toBe(rs.bands.radius)
    expect(rs.rings[0].radius).toBe(rs.radius)

    // Ticks run min..max in 5 steps; each starts on the dial radius.
    const ticks = [...chart.el.querySelectorAll('.apexcharts-gauge-ticks line')]
    expect(ticks).toHaveLength(5)
    ticks.forEach((line, i) => {
      const p = rs.point(rs.min + (i * (rs.max - rs.min)) / 4)
      expect(Number(line.getAttribute('x1'))).toBeCloseTo(p.x, 9)
      expect(Number(line.getAttribute('y1'))).toBeCloseTo(p.y, 9)
      const q = rs.point(rs.min + (i * (rs.max - rs.min)) / 4, rs.radius + 10)
      expect(Number(line.getAttribute('x2'))).toBeCloseTo(q.x, 9)
      expect(Number(line.getAttribute('y2'))).toBeCloseTo(q.y, 9)
    })
    chart.destroy()
  })

  it('maps values to angles the way the dial runs', () => {
    const chart = gauge({ min: 0, max: 240 })
    const rs = chart.getRadialScales()
    expect(rs.min).toBe(0)
    expect(rs.max).toBe(240)
    // The gauge's default dial: -135 to 135.
    expect(rs.startAngle).toBe(-135)
    expect(rs.endAngle).toBe(135)
    expect(rs.angle(0)).toBe(rs.startAngle)
    expect(rs.angle(240)).toBe(rs.endAngle)
    expect(rs.angle(120)).toBe(0)
    // Clamped, as drawn; a non-number reads as min.
    expect(rs.angle(999)).toBe(rs.endAngle)
    expect(rs.angle(-5)).toBe(rs.startAngle)
    expect(rs.angle(NaN)).toBe(rs.startAngle)
    // 0 degrees is 12 o'clock.
    const top = rs.point(120, 50)
    expect(top.x).toBeCloseTo(rs.cx, 9)
    expect(top.y).toBeCloseTo(rs.cy - 50, 9)
    chart.destroy()
  })

  it('gives each ring its own radius, in series order, inverseOrder included', () => {
    for (const inverseOrder of [false, true]) {
      const chart = createChartWithOptions({
        chart: { type: 'radialBar', width: 400, height: 400 },
        series: [44, 55, 67],
        plotOptions: { radialBar: { inverseOrder, track: { margin: 6 } } },
      })
      const rs = chart.getRadialScales()
      expect(rs.rings.map((r) => r.seriesIndex)).toEqual([0, 1, 2])
      rs.rings.forEach((ring, i) => {
        const arc = chart.el.querySelector(`.apexcharts-radialbar-slice-${i}`)
        expect(ring.radius).toBeCloseTo(arcRadius(arc), 9)
        expect(ring.thickness).toBeCloseTo(
          Number(arc.getAttribute('stroke-width')),
          9,
        )
      })
      const outer = inverseOrder ? 2 : 0
      const radii = rs.rings.map((r) => r.radius)
      expect(Math.max(...radii)).toBe(rs.rings[outer].radius)
      expect(rs.bands).toBeNull()
      expect(rs.needle).toBeNull()
      chart.destroy()
    }
  })

  it("reports the needle's pivot and length on the needle shape", () => {
    const chart = gauge({
      shape: 'needle',
      needle: { length: '80%', offsetY: 12 },
    })
    const rs = chart.getRadialScales()
    expect(rs.needle.cx).toBe(rs.cx)
    expect(rs.needle.cy).toBe(rs.cy + 12)
    expect(rs.needle.length).toBeCloseTo(rs.radius * 0.8, 9)
    const g = chart.el.querySelector('.apexcharts-gauge-needle')
    expect(g.getAttribute('transform')).toBe(`rotate(${rs.angle(62)})`)
    chart.destroy()
  })

  it('is frozen, and a new render publishes a new object', async () => {
    const chart = gauge()
    const a = chart.getRadialScales()
    expect(Object.isFrozen(a)).toBe(true)
    expect(Object.isFrozen(a.rings)).toBe(true)
    expect(Object.isFrozen(a.rings[0])).toBe(true)
    expect(() => {
      'use strict'
      a.cx = 0
    }).toThrow()
    await chart.updateSeries([20])
    const b = chart.getRadialScales()
    expect(b).not.toBe(a)
    expect(b.cx).toBe(a.cx)
    chart.destroy()
  })

  it('follows a resize', async () => {
    const chart = gauge()
    const r1 = chart.getRadialScales().radius
    await chart.updateOptions({ chart: { width: 250, height: 250 } })
    const r2 = chart.getRadialScales().radius
    expect(r2).toBeLessThan(r1)
    const band = chart.el.querySelector('.apexcharts-gauge-band')
    expect(arcRadius(band)).toBeCloseTo(r2, 9)
    chart.destroy()
  })

  it('is null on other chart types, and after a type change', async () => {
    const line = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [1, 2, 3] }],
    })
    expect(line.getRadialScales()).toBeNull()
    line.destroy()
    const pie = createChartWithOptions({
      chart: { type: 'donut' },
      series: [1, 2, 3],
    })
    expect(pie.getRadialScales()).toBeNull()
    pie.destroy()
    const chart = gauge()
    expect(chart.getRadialScales()).not.toBeNull()
    await chart.updateOptions({ chart: { type: 'donut' } })
    expect(chart.getRadialScales()).toBeNull()
    chart.destroy()
  })
})

// ---------------------------------------------------------------------------
// Weave
// ---------------------------------------------------------------------------

/** What the probe saw on the last draw. */
let seen = null

/**
 * An example plugin written against nothing but the published geometry: a
 * dot on the rim at `options.value`, and a thin arc over the first ring from
 * min to that value. It never reads the chart's SVG, which is the point.
 */
const rimDot = {
  name: 'rim-dot',
  apiVersion: 7,
  setup(api) {
    seen = { can: api.can('radial-scales') }
    api.on('draw', (payload) => {
      const rs = api.radialScales
      seen.api = rs
      seen.payload = payload.radialScales
      seen.scales = payload.scales
      if (!rs) return
      const value = api.options.value ?? rs.max
      const ring = rs.rings[0]
      const layer = api.layer({ className: 'rim-dot' })
      const p = rs.point(value, ring.radius + ring.thickness / 2)
      layer.circle({ cx: p.x, cy: p.y, r: 4, fill: '#111' })
      const a = rs.point(rs.min, ring.radius)
      const b = rs.point(value, ring.radius)
      const large = rs.angle(value) - rs.startAngle > 180 ? 1 : 0
      layer.path({
        d: `M ${a.x} ${a.y} A ${ring.radius} ${ring.radius} 0 ${large} 1 ${b.x} ${b.y}`,
        stroke: '#111',
        width: 1,
        className: 'rim-dot-arc',
      })
    })
  },
}

beforeAll(() => {
  ApexCharts.registerPlugin(rimDot)
})

describe('Weave api.radialScales', () => {
  it('advertises the capability and hands the same object to api and payload', () => {
    seen = null
    const chart = createChartWithOptions({
      chart: { type: 'gauge', width: 400, height: 400 },
      series: [62],
      plugins: [{ name: 'rim-dot', options: { value: 80 } }],
    })
    expect(seen.can).toBe(true)
    expect(seen.api).toBe(chart.getRadialScales())
    expect(seen.payload).toBe(chart.getRadialScales())
    // The axis projection stays null on a dial.
    expect(seen.scales).toBeNull()
    chart.destroy()
  })

  it('is enough to draw on the dial: the example plugin lands on the rim', () => {
    seen = null
    const chart = createChartWithOptions({
      chart: { type: 'gauge', width: 400, height: 400 },
      series: [62],
      plotOptions: { radialBar: { bands } },
      plugins: [{ name: 'rim-dot', options: { value: 70 } }],
    })
    const dot = chart.el.querySelector('.rim-dot circle')
    expect(dot).not.toBeNull()
    // Checked against the drawn chart, not the geometry: the band boundary at
    // 70 sits on the same radial line as the dot.
    const hollow = chart.el.querySelector('.apexcharts-radialbar-hollow')
    const cx = Number(hollow.getAttribute('cx'))
    const cy = Number(hollow.getAttribute('cy'))
    const lastBand = chart.el.querySelector('[data-band-index="2"]')
    const d = nums(lastBand)
    // Band 2 runs from its end (first point) back to its start (last point).
    const sx = d[d.length - 2]
    const sy = d[d.length - 1]
    const angle = (x, y) => Math.atan2(x - cx, cy - y)
    expect(
      angle(Number(dot.getAttribute('cx')), Number(dot.getAttribute('cy'))),
    ).toBeCloseTo(angle(sx, sy), 9)
    // ...at the ring's outer edge.
    const rs = chart.getRadialScales()
    expect(
      Math.hypot(
        Number(dot.getAttribute('cx')) - cx,
        Number(dot.getAttribute('cy')) - cy,
      ),
    ).toBeCloseTo(rs.rings[0].radius + rs.rings[0].thickness / 2, 9)
    expect(chart.el.querySelector('.rim-dot-arc')).not.toBeNull()
    chart.destroy()
  })

  it('redraws from the new geometry after updateSeries', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'radialBar', width: 400, height: 400 },
      series: [40],
      plugins: [{ name: 'rim-dot' }],
    })
    await chart.updateSeries([40, 70])
    expect(seen.api.rings).toHaveLength(2)
    expect(seen.api).toBe(chart.getRadialScales())
    expect(chart.el.querySelectorAll('.rim-dot circle')).toHaveLength(1)
    chart.destroy()
  })

  it('is null on an axis chart, where scales applies', () => {
    seen = null
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      series: [{ data: [1, 2, 3] }],
      plugins: [{ name: 'rim-dot' }],
    })
    expect(seen.can).toBe(true)
    expect(seen.api).toBeNull()
    expect(seen.payload).toBeNull()
    expect(seen.scales).not.toBeNull()
    expect(chart.el.querySelector('.rim-dot circle')).toBeNull()
    chart.destroy()
  })
})
