import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Stacked columns found the layer below by data-point ordinal and accepted it
// only when its x matched. On a datetime axis a series missing a date then
// restarted at the axis inside the layer below, and a line series between two
// stacked columns broke the stack for every later column. Series groups were
// resolved by series name, so groups that reuse names (Desktop/Mobile under
// 2024 and again under 2025) collapsed into one four-segment stack, the axis
// summed both groups, and the grouped legend lost unnamed series.
//
// Oracle for the x half: the same data padded with zeros, where the ordinal
// already is the x, must draw identically.

const D = (d) => Date.UTC(2024, 0, d)

const stacked = (series, extra = {}) =>
  createChartWithOptions({
    chart: { type: 'bar', stacked: true, width: 600, height: 400 },
    dataLabels: { enabled: false },
    series,
    ...extra,
  })

const datetime = (series, type = 'bar') =>
  stacked(series, {
    chart: { type, stacked: true, width: 600, height: 400 },
    xaxis: { type: 'datetime' },
  })

// The top of each drawn segment of a series, keyed by its x.
const topsByX = (chart, name) => {
  const w = chart.w
  const i = w.seriesData.seriesNames.indexOf(name)
  const out = {}
  w.seriesData.seriesX[i].forEach((x, k) => {
    out[x] = Math.round(w.globals.seriesYvalues[i][k] * 10) / 10
  })
  return out
}

const A = {
  name: 'A',
  data: [
    [D(1), 10],
    [D(2), 20],
    [D(3), 30],
  ],
}

describe('stacked columns on a datetime axis stack by x', () => {
  it('a series missing a date sits on the layer below at the dates it has', () => {
    const padded = datetime([
      A,
      {
        name: 'B',
        data: [
          [D(1), 5],
          [D(2), 0],
          [D(3), 5],
        ],
      },
    ])
    const ragged = datetime([
      A,
      {
        name: 'B',
        data: [
          [D(1), 5],
          [D(3), 5],
        ],
      },
    ])
    const want = topsByX(padded, 'B')
    const got = topsByX(ragged, 'B')
    expect(got[D(1)]).toBe(want[D(1)])
    expect(got[D(3)]).toBe(want[D(3)])
    // the axis is sized for the stack actually drawn at Jan 3 (35, not 30)
    expect(ragged.w.globals.maxY).toBe(padded.w.globals.maxY)
  })

  it('a series that starts late stacks on the right dates', () => {
    const padded = datetime([
      A,
      {
        name: 'B',
        data: [
          [D(1), 0],
          [D(2), 4],
          [D(3), 6],
        ],
      },
    ])
    const ragged = datetime([
      A,
      {
        name: 'B',
        data: [
          [D(2), 4],
          [D(3), 6],
        ],
      },
    ])
    const want = topsByX(padded, 'B')
    const got = topsByX(ragged, 'B')
    expect(got[D(2)]).toBe(want[D(2)])
    expect(got[D(3)]).toBe(want[D(3)])
  })

  it('a line series between two stacked columns does not break the stack', () => {
    const col = (name, data) => ({ name, type: 'column', data })
    const B = col('B', [
      [D(1), 5],
      [D(2), 5],
      [D(3), 5],
    ])
    const sameX = datetime(
      [
        col('A', A.data),
        {
          name: 'L',
          type: 'line',
          data: [
            [D(1), 3],
            [D(2), 7],
            [D(3), 9],
          ],
        },
        B,
      ],
      'line',
    )
    const otherX = datetime(
      [
        col('A', A.data),
        {
          name: 'L',
          type: 'line',
          data: [
            [D(2), 7],
            [D(3), 9],
          ],
        },
        B,
      ],
      'line',
    )
    expect(topsByX(otherX, 'B')).toEqual(topsByX(sameX, 'B'))
  })

  const raggedB = [
    [D(1), 5],
    [D(3), 5],
  ]
  const paddedB = [
    [D(1), 5],
    [D(2), 0],
    [D(3), 5],
  ]

  // The drawn path of each segment of series `i`, keyed by its x.
  const pathsByX = (chart, i) => {
    const out = {}
    const ps = chart.el
      .querySelectorAll('.apexcharts-bar-series .apexcharts-series')
      [i].querySelectorAll('path.apexcharts-bar-area')
    chart.w.seriesData.seriesX[i].forEach((x, k) => {
      out[x] = ps[k].getAttribute('d')
    })
    return out
  }

  it('100% shares are taken of the stack at their own x', () => {
    const pct = (data) =>
      stacked([A, { name: 'B', data }], {
        chart: {
          type: 'bar',
          stacked: true,
          stackType: '100%',
          width: 600,
          height: 400,
        },
        xaxis: { type: 'datetime' },
      })
    const ragged = pct(raggedB)
    const want = pathsByX(pct(paddedB), 1)
    const got = pathsByX(ragged, 1)
    expect(got[D(1)]).toBe(want[D(1)])
    expect(got[D(3)]).toBe(want[D(3)])
    expect(ragged.w.globals.seriesPercent[1]).toEqual([
      (100 * 5) / 15,
      (100 * 5) / 35,
    ])
  })

  it('total labels read and sit on the stack at their own x', () => {
    // A's second point (Jan 2, 50) towers over the Jan 3 stack (20 + 5).
    const totals = (data) => {
      const chart = stacked(
        [
          {
            name: 'A',
            data: [
              [D(1), 10],
              [D(2), 50],
              [D(3), 20],
            ],
          },
          { name: 'B', data },
        ],
        {
          xaxis: { type: 'datetime' },
          plotOptions: { bar: { dataLabels: { total: { enabled: true } } } },
        },
      )
      const out = {}
      chart.el
        .querySelectorAll('text.apexcharts-datalabel-total')
        .forEach((t) => {
          out[Math.round(parseFloat(t.getAttribute('x')))] = [
            t.textContent,
            Math.round(parseFloat(t.getAttribute('y'))),
          ]
        })
      return out
    }
    const want = totals(paddedB)
    const got = totals(raggedB)
    const xs = Object.keys(want).filter((x) => want[x][0] !== '50')
    expect(xs.map((x) => want[x][0])).toEqual(['15', '25'])
    xs.forEach((x) => expect(got[x]).toEqual(want[x]))
  })
})

describe('horizontal stacked bars on a numeric axis stack by index', () => {
  // drawStackedBarPaths stacks by position, so the extent must too.
  const horiz = (bData, extra = {}) =>
    stacked(
      [
        {
          name: 'A',
          data: [
            [2019, 10],
            [2020, 20],
            [2021, 30],
          ],
        },
        { name: 'B', data: bData },
      ],
      {
        chart: { type: 'bar', stacked: true, width: 600, height: 400 },
        plotOptions: { bar: { horizontal: true } },
        ...extra,
      },
    )
  const ragged = [
    [2020, 25],
    [2021, 5],
  ]
  const byIndex = [
    [2019, 25],
    [2020, 5],
  ]

  it('numeric x', () => {
    expect(horiz(ragged).w.globals.maxY).toBe(horiz(byIndex).w.globals.maxY)
  })

  it('datetime x', () => {
    const dt = { xaxis: { type: 'datetime' } }
    expect(horiz(ragged, dt).w.globals.maxY).toBe(
      horiz(byIndex, dt).w.globals.maxY,
    )
  })
})

describe('series groups resolve by index, not by name', () => {
  const grouped = (names, extra) =>
    stacked(
      [
        { name: names[0], group: '2024', data: [10, 20] },
        { name: names[1], group: '2024', data: [5, 5] },
        { name: names[2], group: '2025', data: [12, 18] },
        { name: names[3], group: '2025', data: [6, 4] },
      ],
      { xaxis: { categories: ['Q1', 'Q2'] }, ...extra },
    )
  const barLeft = (chart, i) => {
    const s = chart.el.querySelectorAll(
      '.apexcharts-bar-series .apexcharts-series',
    )[i]
    return parseFloat(
      s.querySelector('path').getAttribute('d').replace(/^M\s*/, ''),
    )
  }

  it('groups that reuse names keep their own stacks, extent and totals', () => {
    const unique = grouped([
      'Desktop 24',
      'Mobile 24',
      'Desktop 25',
      'Mobile 25',
    ])
    const dup = grouped(['Desktop', 'Mobile', 'Desktop', 'Mobile'])

    expect(dup.w.labelData.seriesGroupIndex).toEqual([0, 0, 1, 1])
    expect(barLeft(dup, 2)).not.toBeCloseTo(barLeft(dup, 0), 1)
    for (let i = 0; i < 4; i++) {
      expect(barLeft(dup, i)).toBeCloseTo(barLeft(unique, i), 5)
    }
    expect(dup.w.globals.maxY).toBe(unique.w.globals.maxY)
    expect(dup.w.seriesData.stackedSeriesTotalsByGroups).toEqual([
      [15, 25],
      [18, 22],
    ])
  })

  it('a legend toggle on a reused name hides only that series', () => {
    const chart = grouped(['Desktop', 'Mobile', 'Desktop', 'Mobile'], {
      chart: {
        type: 'bar',
        stacked: true,
        width: 600,
        height: 400,
        animations: { enabled: false },
      },
    })
    const click = () =>
      chart.el
        .querySelector(
          '.apexcharts-legend-series[rel="3"] .apexcharts-legend-text',
        )
        .click()
    const w = chart.w
    click()
    expect(w.globals.collapsedSeriesIndices).toEqual([2])
    expect(w.seriesData.series[0]).toEqual([10, 20])
    expect(w.seriesData.series[2]).toEqual([0, 0])
    click()
    expect(w.globals.collapsedSeriesIndices).toEqual([])
    expect(w.seriesData.series[2]).toEqual([12, 18])
  })

  it('the grouped legend files every item, unnamed or reused, under its group', () => {
    const chart = stacked(
      [
        { group: 'a', data: [1, 2] },
        { group: 'a', data: [3, 4] },
        { name: 'X', group: 'b', data: [2, 2] },
        { name: 'X', group: 'c', data: [1, 1] },
      ],
      {
        xaxis: { categories: ['Q1', 'Q2'] },
        legend: { clusterGroupedSeries: true },
      },
    )
    const counts = [0, 1, 2].map(
      (gi) =>
        chart.el.querySelectorAll(
          `.apexcharts-legend-group-${gi} .apexcharts-legend-series`,
        ).length,
    )
    expect(counts).toEqual([2, 1, 1])
  })
})
