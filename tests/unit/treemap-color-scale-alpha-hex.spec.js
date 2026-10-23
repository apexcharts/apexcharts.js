// A gradient stop written as #RGBA or #RRGGBBAA was not read as a colour:
// #RGBA came out black, and #RRGGBBAA never blended, so every tile between
// two stops took the lower stop's colour and the gradient fell into steps.
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import {
  buildContinuousScale,
  mixColors,
  readableOn,
} from '../../src/charts/common/treemap/ColorScale.js'

const create = (gradient) =>
  createChartWithOptions({
    chart: { type: 'treemap', width: 600, height: 400 },
    series: [
      {
        data: [
          { x: 'a', y: 30, colorValue: 0 },
          { x: 'b', y: 20, colorValue: 5 },
          { x: 'c', y: 10, colorValue: 10 },
        ],
      },
    ],
    plotOptions: { treemap: { colorScale: { gradient } } },
  })

describe('treemap colour scale with hex alpha', () => {
  it('blends #RRGGBBAA stops, alpha included', () => {
    expect(mixColors('#ff000080', '#0000ff80', 0.5)).toBe('#80008080')
    expect(mixColors('#ff0000ff', '#0000ff00', 0.5)).toBe('#80008080')
  })

  it('reads #RGBA as its colour, not as black', () => {
    expect(mixColors('#f008', '#00f8', 0)).toBe('#ff000088')
    expect(mixColors('#f00f', '#00ff', 1)).toBe('#0000ff')
  })

  it('keeps opaque colours as six-digit hex', () => {
    expect(mixColors('#f00', '#0000FF', 0.5)).toBe('#800080')
  })

  it('colours the tiles between alpha stops on the gradient', () => {
    const c = create({
      stops: [
        { value: 0, color: '#ff000080' },
        { value: 10, color: '#0000ff80' },
      ],
    })
    const scale = buildContinuousScale(c.w)
    expect(scale.at(0)).toBe('#ff000080')
    expect(scale.at(5)).toBe('#80008080')
    expect(scale.at(10)).toBe('#0000ff80')
    c.destroy()
  })

  it('picks the label colour from the hue under the alpha', () => {
    expect(readableOn('#ffff00cc')).toBe('#000000')
    expect(readableOn('#ff0c')).toBe('#000000')
    expect(readableOn('#000080cc')).toBe('#ffffff')
  })
})
