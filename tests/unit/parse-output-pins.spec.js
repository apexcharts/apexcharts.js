import { describe, it, expect, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import DateTime from '../../src/utils/DateTime.js'

// Value pins for the parse pipeline, written so they hold before and after
// the parse-work cuts in Data, Range and DateTime: the parsed x and y, the x
// and y extents, the rendered x-axis labels and the goals, for every x shape
// a series can carry. Each case runs in UTC and in a zone with an offset, as
// process.env.TZ is read per call in Node.

const prevTZ = process.env.TZ
afterEach(() => {
  if (prevTZ === undefined) delete process.env.TZ
  else process.env.TZ = prevTZ
})

const T0 = Date.UTC(2017, 0, 1)
const DAY = 86400000
const iso = (k) => new Date(T0 + k * DAY).toISOString()

const xAxisLabels = (chart) =>
  Array.from(chart.el.querySelectorAll('.apexcharts-xaxis-label')).map(
    (l) => l.textContent,
  )

const pin = (chart) => {
  const w = chart.w
  const gl = w.globals
  const sg = w.seriesData.seriesGoals
  return {
    seriesX: w.seriesData.seriesX,
    labels: w.labelData.labels,
    series: w.seriesData.series,
    // a series without goals may hold all-null slots or nothing at all
    goals: w.seriesData.series.map((_, i) =>
      sg[i] && sg[i].some(Boolean) ? sg[i] : null,
    ),
    minX: gl.minX,
    maxX: gl.maxX,
    minY: gl.minY,
    maxY: gl.maxY,
    minXDiff: gl.minXDiff,
    dataPoints: gl.dataPoints,
    yValueDecimal: gl.yValueDecimal,
    hasNullValues: gl.hasNullValues,
    xLabels: xAxisLabels(chart),
  }
}

const xy = (xs, ys = [3, 5.5, 2, 8]) => xs.map((x, k) => ({ x, y: ys[k] }))

const cases = {
  'datetime, [[timestamp, y]]': {
    xaxis: { type: 'datetime' },
    series: [{ data: [0, 1, 2, 3].map((k) => [T0 + k * DAY, k * 1.5]) }],
  },
  'datetime, [[timestamp, y]] with a null row and a null y': {
    xaxis: { type: 'datetime' },
    series: [
      { data: [[T0, 1], null, [T0 + 2 * DAY, null], [T0 + 3 * DAY, 4]] },
    ],
  },
  'datetime, [[timestamp, y]] with fractional timestamps': {
    xaxis: { type: 'datetime' },
    series: [{ data: [[T0 + 0.5, 1], [T0 + DAY + 0.7, 2], [T0 + 2 * DAY, 3]] }],
  },
  'datetime, [[ISO string, y]]': {
    xaxis: { type: 'datetime' },
    series: [{ data: [0, 1, 2].map((k) => [iso(k), k + 1]) }],
  },
  'datetime, {x: timestamp}': {
    xaxis: { type: 'datetime' },
    series: [{ data: xy([0, 1, 2, 3].map((k) => T0 + k * DAY)) }],
  },
  'datetime, {x: ISO string}': {
    xaxis: { type: 'datetime' },
    series: [{ data: xy([0, 1, 2, 3].map(iso)) }],
  },
  'datetime, {x: date without a time}': {
    xaxis: { type: 'datetime' },
    series: [
      { data: xy(['2017-01-01', '2017-01-02', '2017-01-03', '2017-01-04']) },
    ],
  },
  'datetime, {x: local date strings}': {
    xaxis: { type: 'datetime' },
    series: [
      {
        data: xy(['01/01/2017', '01/02/2017', '2017-01-03 06:00', 'Jan 4 2017']),
      },
    ],
  },
  'datetime, {x: Date}': {
    xaxis: { type: 'datetime' },
    series: [
      { data: xy([0, 1, 2, 3].map((k) => new Date(T0 + k * DAY + 250))) },
    ],
  },
  'datetime, {x: ISO string}, datetimeUTC false': {
    xaxis: { type: 'datetime', labels: { datetimeUTC: false } },
    series: [{ data: xy(['2017-01-01', '01/02/2017', iso(2), iso(3)]) }],
  },
  'datetime, plain values with ISO categories, two series': {
    xaxis: { type: 'datetime', categories: [0, 1, 2, 3].map(iso) },
    series: [{ data: [1, 2, 3, 4] }, { data: [4, 3, 2.25, 1] }],
  },
  'datetime, plain values with local date labels': {
    xaxis: { type: 'datetime' },
    labels: ['01/01/2017', '01/02/2017', '01/03/2017', T0 + 3 * DAY],
    series: [{ data: [1, 2, 3, 4] }],
  },
  'category, {x: name}': {
    series: [{ data: xy(['Apples', 'Pears', 'Plums', 'Figs']) }],
  },
  'category, {x: strings that look like dates}': {
    xaxis: { type: 'category' },
    series: [
      { data: xy(['2017-01-01', '01/02/2017', 'Jan 3 2017', '2017']) },
      { data: xy(['2017-01-01', '01/02/2017', 'Jan 3 2017', '2017'], [1, 2, 3, 4]) },
    ],
  },
  'category bar, {x, y} with goals on one series and nulls': {
    chart: { type: 'bar' },
    series: [
      {
        data: [
          { x: 'A', y: 4, goals: [{ name: 'g', value: 9 }] },
          { x: 'B', y: null },
          { x: 'C', y: 6 },
          { x: 'D', y: 2, goals: [{ name: 'g', value: -3 }] },
        ],
      },
      { data: xy(['A', 'B', 'C', 'D'], [1, 2, null, 7]) },
    ],
  },
  'category bar, {x, y} without goals, negative values': {
    chart: { type: 'bar' },
    series: [{ data: xy(['A', 'B', 'C'], [-4, -2.5, -1]) }],
  },
  'numeric, {x: number} with a null y': {
    xaxis: { type: 'numeric' },
    series: [{ data: xy([1, 2.5, 4, 8], [10, null, 0.125, 3]) }],
  },
  'numeric line, two {x, y} series, the second all null': {
    xaxis: { type: 'numeric' },
    series: [
      { data: xy([1, 2, 3], [2, 4, 6]) },
      { data: xy([1, 2, 3], [null, null, null]) },
    ],
  },
  'stacked bar, {x, y} with goals absent': {
    chart: { type: 'bar', stacked: true },
    series: [
      { data: xy(['A', 'B', 'C'], [1, -2, 3.5]) },
      { data: xy(['A', 'B', 'C'], [4, -1, 0.25]) },
    ],
  },
}

describe('a datetime outside years 0..9999', () => {
  it('stays the UTC instant it names under datetimeUTC', () => {
    // a 25-char ISO cut dropped the Z, so it was read again as local time
    process.env.TZ = 'America/New_York'
    const dt = new DateTime({
      config: { xaxis: { labels: { datetimeUTC: true } } },
    })
    expect(dt.parseDate('+010000-01-01T00:00:00.000Z')).toBe(
      Date.UTC(10000, 0, 1),
    )
    expect(dt.parseDate('-000001-01-01T00:00:00.000Z')).toBe(
      Date.UTC(-1, 0, 1),
    )
  })
})

for (const tz of ['UTC', 'America/New_York']) {
  describe(`parsed output pins, TZ=${tz}`, () => {
    for (const [name, opts] of Object.entries(cases)) {
      it(name, () => {
        process.env.TZ = tz
        const chart = createChartWithOptions({
          chart: { type: 'line', width: 480, height: 300, ...opts.chart },
          xaxis: opts.xaxis,
          labels: opts.labels,
          series: opts.series,
        })
        expect(pin(chart)).toMatchSnapshot()
        chart.destroy()
      })
    }

    it('DateTime.parseDate and isValidDate', () => {
      process.env.TZ = tz
      const inputs = [
        '2017-01-01',
        '2017-01-01T10:00:00Z',
        '2017-01-01T10:00:00.123Z',
        '2017-01-01T10:00:00',
        '2017-01-01 10:00',
        '2017-1-5',
        '01/02/2017',
        'Jan 5 2017',
        '5th Jan 2017',
        '2017',
        '+010000-01-01T00:00:00.000Z',
        '-000001-01-01T00:00:00.000Z',
        'garbage',
        '',
        new Date(T0 + 123),
        new Date('garbage'),
        null,
        undefined,
        1483228800000,
      ]
      const out = {}
      for (const utc of [true, false]) {
        const dt = new DateTime({
          config: { xaxis: { labels: { datetimeUTC: utc } } },
        })
        out['utc ' + utc] = inputs.map((v) => [
          String(v),
          dt.parseDate(v),
          dt.isValidDate(v),
        ])
      }
      // spot checks that do not depend on the snapshot
      const dt = new DateTime({
        config: { xaxis: { labels: { datetimeUTC: true } } },
      })
      expect(dt.parseDate('2017-01-01T10:00:00.123Z')).toBe(T0 + 36000123)
      expect(dt.parseDate('01/02/2017')).toBe(new Date(2017, 0, 2).getTime())
      expect(dt.parseDate(new Date(T0 + 123))).toBe(T0 + 123)
      expect(out).toMatchSnapshot()
    })
  })
}
