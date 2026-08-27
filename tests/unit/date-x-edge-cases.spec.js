import Data from '../../src/modules/Data'
import DateTime from '../../src/utils/DateTime'
import { createChart } from './utils/utils.js'

// Two adjacent problems the review of #5277 named and deliberately left out of
// that PR, because they predate it:
//
//   1. On a non-datetime axis a Date x went through parseFloat(), which reads
//      the Date through its toString() ("Wed Jun 03 2026 ..."), so every point
//      became NaN even though the surrounding code had just declared this x
//      numeric.
//   2. isValidDate(new Date('garbage')) threw instead of answering false,
//      because parseDate()'s salvage pass calls .replace() on its argument and
//      an invalid Date has no such method. That took the whole render down.

const T0 = 1748924002000
const T1 = 1748924003000

function parsedX(series, xtype) {
  const chart = createChart('line', series, xtype)
  chart.w.globals.seriesX = []

  const data = new Data(chart.w, chart)
  const w = data.parseDataAxisCharts(series, series, chart)

  return w.globals.seriesX
}

function datesAndNumbers(xtype) {
  const [fromDates] = parsedX(
    [
      {
        name: 'Date',
        data: [
          { x: new Date(T0), y: 1 },
          { x: new Date(T1), y: 2 },
        ],
      },
    ],
    xtype,
  )
  const [fromNumbers] = parsedX(
    [
      {
        name: 'Number',
        data: [
          { x: T0, y: 1 },
          { x: T1, y: 2 },
        ],
      },
    ],
    xtype,
  )
  return { fromDates, fromNumbers }
}

describe('a Date x on a non-datetime axis', () => {
  it('reads the Date as its epoch on a numeric axis', () => {
    const { fromDates } = datesAndNumbers('numeric')

    expect(fromDates).toEqual([T0, T1])
  })

  it('lands on the same x as the equivalent number', () => {
    const { fromDates, fromNumbers } = datesAndNumbers('numeric')

    expect(fromDates).toEqual(fromNumbers)
  })
})

describe('an invalid Date as x', () => {
  function dt() {
    const chart = createChart(
      'line',
      [{ name: 'n', data: [{ x: 1, y: 1 }] }],
      'numeric',
    )
    return new DateTime(chart.w)
  }

  it('makes isValidDate answer false rather than throw', () => {
    const d = dt()

    expect(() => d.isValidDate(new Date('garbage'))).not.toThrow()
    expect(d.isValidDate(new Date('garbage'))).toBe(false)
  })

  it('still recognises the dates that are real', () => {
    const d = dt()

    expect(d.isValidDate(new Date(T0))).toBe(true)
    expect(d.isValidDate('2010-01-01T00:00:00.000Z')).toBe(true)
    expect(d.isValidDate('01/01/2017')).toBe(true)
    expect(d.isValidDate('not a date')).toBe(false)
  })

  it('does not take the render down', () => {
    expect(() =>
      parsedX(
        [{ name: 'bad', data: [{ x: new Date('garbage'), y: 1 }] }],
        'category',
      ),
    ).not.toThrow()
  })
})
