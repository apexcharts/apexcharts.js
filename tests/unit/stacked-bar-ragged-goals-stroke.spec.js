import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Stacked bar and column defects users saw:
// - on a category stack, the layers above a shorter series restarted at the
//   axis and overlapped the layers below (columns and horizontal bars);
// - stacked columns with borderRadius rounded the joins between segments at
//   points past the first series' length;
// - stacked columns with stroke.show:false still left gaps of stroke.width
//   between layers;
// - goals on a stacked column bound to a secondary y axis vanished, and bar
//   goals vanished on a logarithmic y axis.

const paths = (name) =>
  [
    ...document.querySelectorAll(
      `.apexcharts-series[seriesName="${name}"] .apexcharts-bar-area`,
    ),
  ].map((p) => p.getAttribute('d'))

const stack = (series, extra = {}) =>
  createChartWithOptions({
    chart: { type: 'bar', stacked: true, width: 600, height: 400 },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    xaxis: { categories: ['a', 'b', 'c'] },
    series,
    ...extra,
  })

describe('stacked bars', () => {
  // The padded series is the oracle: a short series must stack as if it had
  // nulls for the points it lacks.
  for (const horizontal of [false, true]) {
    it(`a short series does not break the stack (horizontal: ${horizontal})`, () => {
      const top = (bData) => {
        stack(
          [
            { name: 'A', data: [10, 10, 10] },
            { name: 'B', data: bData },
            { name: 'C', data: [5, 5, 5] },
          ],
          { plotOptions: { bar: { horizontal } } },
        )
        return paths('C')
      }
      const padded = top([3, null, null])
      expect(padded.every((d) => d.trim().length > 0)).toBe(true)
      expect(top([3])).toEqual(padded)
    })
  }

  it('a short first series does not round later joins', () => {
    const mid = (aData) => {
      stack(
        [
          { name: 'A', data: aData },
          { name: 'B', data: [10, 10, 10] },
          { name: 'C', data: [10, 10, 10] },
        ],
        {
          plotOptions: {
            bar: { borderRadius: 10, borderRadiusWhenStacked: 'last' },
          },
        },
      )
      return paths('B')
    }
    expect(mid([10])).toEqual(mid([10, null, null]))
  })

  it('stroke.show:false ignores stroke.width', () => {
    const all = (stroke) => {
      stack(
        [
          { name: 'A', data: [10, 20, 30] },
          { name: 'B', data: [5, 15, 25] },
        ],
        { stroke },
      )
      return [...paths('A'), ...paths('B')]
    }
    expect(all({ show: false, width: 6 })).toEqual(
      all({ show: false, width: 0 }),
    )
  })

  it('a goal on a secondary-axis series is drawn on that axis', () => {
    stack(
      [
        {
          name: 'B',
          data: [
            { x: 'a', y: 10 },
            { x: 'b', y: 12 },
          ],
        },
        {
          name: 'A',
          data: [
            {
              x: 'a',
              y: 1000,
              goals: [{ name: 'g', value: 1000, strokeColor: '#f00' }],
            },
            { x: 'b', y: 900 },
          ],
        },
      ],
      {
        xaxis: {},
        yaxis: [{ seriesName: 'B' }, { seriesName: 'A', opposite: true }],
      },
    )
    const ys = (name) => {
      const v = (paths(name)[0].match(/-?[\d.]+/g) || [])
        .map(Number)
        .filter((_, k) => k % 2 === 1)
      return [Math.min(...v), Math.max(...v)]
    }
    const lines = document.querySelectorAll(
      '.apexcharts-bar-goals-groups line',
    )
    expect(lines.length).toBe(1)
    // measured up from the baseline by A's own height on A's own axis
    const base = ys('B')[1]
    const [aTop, aBottom] = ys('A')
    const goalY = Number(lines[0].getAttribute('y1'))
    expect(Math.abs(goalY - (base - (aBottom - aTop)))).toBeLessThan(3)
  })
})

it('a bar goal sits at its value on a logarithmic axis', () => {
  const chart = createChartWithOptions({
    chart: { type: 'bar', width: 600, height: 400 },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    yaxis: { logarithmic: true },
    series: [
      {
        name: 'A',
        data: [
          {
            x: 'a',
            y: 100,
            goals: [{ name: 'g', value: 100, strokeColor: '#f00' }],
          },
          { x: 'b', y: 1000 },
          { x: 'c', y: 10 },
        ],
      },
    ],
  })
  const lines = document.querySelectorAll('.apexcharts-bar-goals-groups line')
  expect(lines.length).toBe(1)
  const goalY = Number(lines[0].getAttribute('y1'))
  expect(Math.abs(goalY - chart.w.globals.seriesYvalues[0][0])).toBeLessThan(3)
})
