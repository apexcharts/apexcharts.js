import Data from '../../src/modules/Data'
import { createChart } from './utils/utils.js'

// A datetime axis kept millisecond resolution for a numeric x but not for a
// Date, because the Date branch went through x.toString() first and
// Date.prototype.toString() has second resolution. Two points 500ms apart
// landed on the same x, which draws as a vertical line. (#5054)

const T0 = 1748924002000
const T_HALF = 1748924002500
const T1 = 1748924003000

function parsedX(series) {
  const chart = createChart('line', series, 'datetime')
  chart.w.globals.seriesX = []

  const data = new Data(chart.w, chart)
  const w = data.parseDataAxisCharts(series, series, chart)

  return w.globals.seriesX
}

describe('datetime axis with Date objects as x', () => {
  it('keeps milliseconds for Date x values', () => {
    const [xs] = parsedX([
      {
        name: 'Date',
        data: [
          { x: new Date(T0), y: 1 },
          { x: new Date(T_HALF), y: 2 },
          { x: new Date(T1), y: 1 },
        ],
      },
    ])

    expect(xs).toEqual([T0, T_HALF, T1])
  })

  it('parses Date x the same way as the equivalent number', () => {
    const [fromNumbers] = parsedX([
      {
        name: 'Number',
        data: [
          { x: T0, y: 1 },
          { x: T_HALF, y: 2 },
          { x: T1, y: 1 },
        ],
      },
    ])
    const [fromDates] = parsedX([
      {
        name: 'Date',
        data: [
          { x: new Date(T0), y: 1 },
          { x: new Date(T_HALF), y: 2 },
          { x: new Date(T1), y: 1 },
        ],
      },
    ])

    expect(fromDates).toEqual(fromNumbers)
  })

  it('still parses date strings', () => {
    const [xs] = parsedX([
      {
        name: 'String',
        data: [
          { x: '2010-01-01T00:00:00.000Z', y: 1 },
          { x: '2010-01-02T00:00:00.000Z', y: 2 },
        ],
      },
    ])

    expect(xs).toEqual([1262304000000, 1262390400000])
  })
})
