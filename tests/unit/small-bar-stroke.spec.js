import { afterEach, describe, expect, it, vi } from 'vitest'
import Helpers from '../../src/charts/common/bar/Helpers.js'
import { createChartWithOptions } from './utils/utils.js'

let chart

afterEach(() => {
  chart?.destroy()
  vi.restoreAllMocks()
})

const render = ({
  horizontal = false,
  reversed = false,
  sign = 1,
  stroke = 1,
  radius = 4,
  data,
} = {}) => {
  const rects = vi.spyOn(Helpers.prototype, 'barRect')
  chart = createChartWithOptions({
    chart: { type: 'bar', width: 500, height: 325 },
    series: [
      { name: 'A', data: data || [sign * 80, sign * 0.01] },
      { name: 'B', data: data || [sign * 85, sign * 1] },
    ],
    stroke: { width: stroke, colors: ['transparent'] },
    plotOptions: {
      bar: { horizontal, borderRadius: radius, borderRadiusApplication: 'end' },
    },
    yaxis: { min: -100, max: 100, reversed },
    dataLabels: { enabled: false },
  })
  return rects.mock.results.map(({ value }, i) => ({
    input: rects.mock.calls[i][0],
    rect: value,
  }))
}

describe('small stroked bars (#4882)', () => {
  for (const horizontal of [false, true]) {
    for (const reversed of [false, true]) {
      for (const sign of [1, -1]) {
        it(`keeps the value edge on the correct side (horizontal=${horizontal}, reversed=${reversed}, sign=${sign})`, () => {
          const results = render({ horizontal, reversed, sign })
          expect(results).toHaveLength(4)
          let small = 0
          for (const { input, rect } of results) {
            const length = Math.abs(input.v2 - input.v1)
            const directedLength = horizontal
              ? (rect.x2 - rect.x1) * rect.direction
              : (rect.y1 - rect.y2) * rect.direction
            expect(directedLength).toBeGreaterThanOrEqual(0)
            if (length < rect.strokeWidth) {
              small++
              expect(directedLength).toBeCloseTo(0, 8)
            } else {
              expect(directedLength).toBeCloseTo(length - rect.strokeWidth, 8)
            }
            expect(rect.pathTo).not.toMatch(/NaN|Infinity/)
          }
          expect(small).toBeGreaterThan(0)
          expect(
            document.querySelectorAll('.apexcharts-bar-area'),
          ).toHaveLength(4)
        })
      }
    }
  }

  it('preserves the height when there is no stroke', () => {
    for (const { input, rect } of render({ stroke: 0 })) {
      expect(Math.abs(rect.y1 - rect.y2)).toBeCloseTo(
        Math.abs(input.v1 - input.v2),
        8,
      )
    }
  })

  it('also keeps square columns above their stroke-inset baseline', () => {
    for (const { rect } of render({ radius: 0 })) {
      expect(rect.y2).toBeLessThanOrEqual(rect.y1)
    }
  })

  it('keeps zero and null values collapsed without a stroke', () => {
    for (const { rect } of render({ data: [0, null] })) {
      expect(rect.strokeWidth).toBe(0)
      expect(rect.y2).toBe(rect.y1)
      expect(rect.pathTo).not.toMatch(/NaN|Infinity/)
    }
  })

  it('does not draw bars for empty data', () => {
    expect(render({ data: [] })).toEqual([])
    expect(document.querySelectorAll('.apexcharts-bar-area')).toHaveLength(0)
  })
})
