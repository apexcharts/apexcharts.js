import { describe, it, expect, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Utils from '../../src/utils/Utils.js'

// #5170: getTextRects runs inside render()'s promise. textRectsCache is
// created as a Map, but Utils.clone (and a JSON round-trip) turn a Map into
// a plain {}. That object is truthy, so `cache && cache.has(...)` still
// calls .has and rejects the render promise with
// `TypeError: cache.has is not a function`.

let chart = null
afterEach(() => {
  chart?.destroy()
  chart = null
})

const renderLine = () => {
  chart = createChartWithOptions({
    chart: { type: 'line', width: 400, height: 300 },
    series: [{ name: 'Sales', data: [10, 20, 15] }],
    xaxis: { categories: ['Jan', 'Feb', 'Mar'] },
  })
  return chart
}

// The value a clone/extend leaves behind where a Map used to be.
const replacedCache = () => Utils.clone(new Map([['k', { width: 1, height: 2 }]]))

describe('textRectsCache stays a Map (#5170)', () => {
  it('still initialises the cache as a Map on current main', () => {
    const chart = renderLine()
    expect(chart.w.globals.textRectsCache).toBeInstanceOf(Map)
  })

  it('a cloned Map is a plain object with no .has', () => {
    const replaced = replacedCache()
    expect(replaced).toEqual({})
    expect(typeof replaced.has).not.toBe('function')
  })

  it('measures inside a promise when the cache was replaced', async () => {
    const chart = renderLine()
    const graphics = chart.graphics
    chart.w.globals.textRectsCache = replacedCache()

    // mount() measures labels inside `new Promise(executor)`, which is the
    // path that surfaces as "Uncaught (in promise) TypeError: l.has is not a function".
    const measured = await new Promise((resolve, reject) => {
      try {
        resolve(graphics.getTextRects('Jan', '12px', 'Helvetica'))
      } catch (e) {
        reject(e)
      }
    })

    expect(measured.width).toEqual(expect.any(Number))
    expect(measured.height).toEqual(expect.any(Number))
    expect(chart.w.globals.textRectsCache).toBeInstanceOf(Map)
    expect(chart.w.globals.textRectsCache.has(
      ['Jan', '12px', 'Helvetica', undefined, true, undefined].join('\0'),
    )).toBe(true)
  })

  it('reuses the restored Map instead of measuring again', () => {
    const chart = renderLine()
    const graphics = chart.graphics
    chart.w.globals.textRectsCache = {}

    const first = graphics.getTextRects('Feb', '14px', 'Helvetica', 'rotate(0)')
    const cache = chart.w.globals.textRectsCache
    expect(cache).toBeInstanceOf(Map)

    const second = graphics.getTextRects('Feb', '14px', 'Helvetica', 'rotate(0)')
    expect(second).toBe(first)
    expect(cache.size).toBe(1)
  })

  it('re-inits when the slot is missing', () => {
    const chart = renderLine()
    chart.w.globals.textRectsCache = null
    const rect = chart.graphics.getTextRects('Mar', '12px')
    expect(rect.width).toEqual(expect.any(Number))
    expect(chart.w.globals.textRectsCache).toBeInstanceOf(Map)
  })
})
