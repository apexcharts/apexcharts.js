import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Exports from '../../src/modules/Exports'

const lineChart = () =>
  createChartWithOptions({
    chart: { type: 'line', width: 400, height: 300 },
    series: [{ name: 'A', data: [1, 2, 3] }],
  })

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getSvgString lands every running tween first', () => {
  it('lands the axis chrome tweens before cloning the chart', () => {
    const chart = lineChart()
    const w = chart.w
    const landed = []
    const finish = () => {
      w.globals.chromeTweens.delete(finish)
      landed.push('chrome')
    }
    w.globals.chromeTweens = new Set([finish])
    const exports = new Exports(w, chart.ctx)
    const clone = vi.spyOn(w.dom.elWrap, 'cloneNode')
    clone.mockImplementation(function (deep) {
      landed.push('clone')
      return Node.prototype.cloneNode.call(this, deep)
    })
    exports.getSvgString()
    expect(landed).toEqual(['chrome', 'clone'])
    expect(w.globals.chromeTweens.size).toBe(0)
  })
})
