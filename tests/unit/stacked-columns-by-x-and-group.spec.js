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

describe('horizontal bars on a numeric axis sit and stack in their own x row', () => {
  // Each row is the band of one x, but a bar was drawn in the row of its
  // position in its series, so a series missing a year put its values one row
  // up, on top of another year's stack. Oracle: the same series padded with
  // nulls, where the position already is the row.
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
        {
          name: 'C',
          data: [
            [2019, 4],
            [2020, 4],
            [2021, 4],
          ],
        },
      ],
      {
        chart: { type: 'bar', stacked: true, width: 600, height: 400 },
        plotOptions: { bar: { horizontal: true } },
        stroke: { width: 0 },
        ...extra,
      },
    )
  const ragged = [
    [2020, 25],
    [2021, 5],
  ]
  const padded = [
    [2019, null],
    [2020, 25],
    [2021, 5],
  ]
  // Where each of a series' bars starts and ends, by x.
  const bars = (chart, name) => {
    const w = chart.w
    const i = w.seriesData.seriesNames.indexOf(name)
    const el = chart.el.querySelector(
      `.apexcharts-series[seriesName="${name}"]`,
    )
    const out = {}
    el.querySelectorAll('.apexcharts-bar-area').forEach((p) => {
      const j = +p.getAttribute('j')
      const x = w.seriesData.seriesX[i][j]
      if (x != null && w.seriesData.series[i][j] != null) {
        // to 0.1 px: the padded series' empty segment adds a sub-pixel sliver
        out[x] = p
          .getAttribute('d')
          .replace(/-?\d+\.?\d*/g, (n) => (Math.round(n * 10) / 10).toString())
      }
    })
    return out
  }

  for (const [label, extra] of [
    ['numeric x', {}],
    ['datetime x', { xaxis: { type: 'datetime' } }],
  ]) {
    it(`${label}: stacks and draws as the padded series`, () => {
      const a = horiz(ragged, extra)
      const b = horiz(padded, extra)
      expect(a.w.globals.maxY).toBe(b.w.globals.maxY)
      for (const name of ['A', 'B', 'C']) {
        expect(bars(a, name)).toEqual(bars(b, name))
      }
    })
  }

  it('gives an x that only a shorter series has a row of its own', () => {
    const chart = horiz([[2022, 7]])
    expect(chart.w.labelData.labels).toEqual([2019, 2020, 2021, 2022])
    expect(chart.w.globals.dataPoints).toBe(4)
    // the 2022 bar starts at the axis, in the last row
    const [d] = Object.values(bars(chart, 'B'))
    const y = +d.match(/-?[\d.]+/g)[1]
    expect(y).toBeGreaterThan(chart.w.layout.gridHeight * 0.75)
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
