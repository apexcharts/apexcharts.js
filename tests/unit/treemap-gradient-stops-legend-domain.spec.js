// With explicit gradient stops (-10, 0, 10) the legend domain came from the
// data (-3..3), so the stop percents fell outside 0..1: the strip ends were
// pure red and green while the tiles at the data ends were muted. Explicit
// stops now widen the domain the strip shows to cover them, never narrow it
// below the data (a pinned min/max still wins), and
// every strip stop is clamped into the domain at the colour a tile there gets.
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import { buildContinuousScale } from '../../src/charts/common/treemap/ColorScale.js'

const STOPS = [
  { value: -10, color: '#ff0000' },
  { value: 0, color: '#808080' },
  { value: 10, color: '#00ff00' },
]
const series = [
  {
    data: [
      { x: 'a', y: 30, colorValue: -3 },
      { x: 'b', y: 20, colorValue: 1 },
      { x: 'c', y: 10, colorValue: 3 },
    ],
  },
]

const create = (gradient) =>
  createChartWithOptions({
    chart: { type: 'treemap', width: 600, height: 400 },
    series,
    legend: { show: true, position: 'bottom' },
    plotOptions: {
      treemap: {
        colorScale: { gradient, gradientLegend: { enabled: true } },
      },
    },
  })

const stripStops = (c) =>
  [...c.el.querySelectorAll('.apexcharts-gradient-legend stop')].map((s) => ({
    offset: parseFloat(s.getAttribute('offset')),
    color: s.getAttribute('stop-color').toLowerCase(),
  }))

describe('treemap gradient legend with explicit stops', () => {
  it('spans the stops, so the strip ends match the tiles there', () => {
    const c = create({ stops: STOPS })
    const scale = buildContinuousScale(c.w)
    expect([scale.min, scale.max]).toEqual([-10, 10])
    const s = stripStops(c)
    expect(s.map((x) => x.offset)).toEqual([0, 50, 100])
    expect(s[0].color).toBe(scale.at(scale.min))
    expect(s[s.length - 1].color).toBe(scale.at(scale.max))
    c.destroy()
  })

  it('keeps the data range when the data is wider than the stops', () => {
    const c = create({
      stops: [
        { value: -1, color: '#ff0000' },
        { value: 1, color: '#00ff00' },
      ],
    })
    const scale = buildContinuousScale(c.w)
    expect([scale.min, scale.max]).toEqual([-3, 3])
    const s = stripStops(c)
    expect(s[0].offset).toBeCloseTo(100 / 3, 1)
    expect(s[1].offset).toBeCloseTo(200 / 3, 1)
    c.destroy()
  })

  it('a pinned min/max wins, and the strip is clamped into it', () => {
    const c = create({ stops: STOPS, min: -5, max: 5 })
    const scale = buildContinuousScale(c.w)
    expect([scale.min, scale.max]).toEqual([-5, 5])
    const s = stripStops(c)
    for (const x of s) {
      expect(x.offset).toBeGreaterThanOrEqual(0)
      expect(x.offset).toBeLessThanOrEqual(100)
    }
    expect(s[0].color).toBe(scale.at(-5))
    expect(s[s.length - 1].color).toBe(scale.at(5))
    c.destroy()
  })

  it('keeps the data-derived domain when no stops are given', () => {
    const c = create({ colors: ['#ff0000', '#808080', '#00ff00'] })
    const scale = buildContinuousScale(c.w)
    // Symmetric about the zero midpoint, from the data's -3..3.
    expect([scale.min, scale.max]).toEqual([-3, 3])
    expect(stripStops(c).map((x) => x.color)).toEqual([
      '#ff0000',
      '#808080',
      '#00ff00',
    ])
    c.destroy()
  })
})
