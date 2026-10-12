/**
 * The chart.streaming memory bound applies to the dataReducer's raw stash as
 * well as to config.series. The stash is what every parse re-reduces from,
 * so left alone it grew by every appended point and each append ran the
 * reducer over the whole history.
 */
import { describe, it, expect } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'

const points = (n, from = 0) =>
  Array.from({ length: n }, (_, i) => [from + i, (i % 13) + 1])

describe('streaming trim with a data reducer', () => {
  it('keeps the raw stash within maxPoints', async () => {
    document.body.innerHTML = '<div id="c"></div>'
    const chart = new ApexCharts(document.querySelector('#c'), {
      chart: {
        type: 'line',
        width: 500,
        height: 300,
        animations: { enabled: false },
        streaming: { enabled: true, maxPoints: 1000 },
        dataReducer: { enabled: true, threshold: 100, targetPoints: 50 },
      },
      series: [{ name: 'S', data: points(1000) }],
      xaxis: { type: 'numeric' },
    })
    await chart.render()
    expect(chart.w.globals.dataReducerRawSeries[0].data.length).toBe(1000)

    for (let k = 0; k < 3; k++) {
      await chart.appendData([{ data: points(200, 1000 + k * 200) }])
    }
    const raw = chart.w.globals.dataReducerRawSeries[0].data
    expect(raw.length).toBe(1000)
    expect(raw[raw.length - 1][0]).toBe(1599)
    chart.destroy()
  })
})
