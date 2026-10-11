import { describe, it, expect } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'

// The zoom-aware downsampler records the raw data's x bounds next to its raw
// stash, and pan/zoom clamp against them. They describe that stash, so they
// have to go with it: with the reducer turned off, new data never re-records
// them, and the old dataset's range kept clamping the new one.

const points = (n, from = 0) =>
  Array.from({ length: n }, (_, i) => [from + i, (i % 13) + 1])

describe('dataReducer raw x bounds', () => {
  it('are dropped with the raw stash when the series is redefined', async () => {
    document.body.innerHTML = '<div id="c"></div>'
    const chart = new ApexCharts(document.querySelector('#c'), {
      chart: {
        type: 'line',
        width: 500,
        height: 300,
        animations: { enabled: false },
        dataReducer: { enabled: true, threshold: 100, targetPoints: 50 },
      },
      series: [{ name: 'S', data: points(1000) }],
      xaxis: { type: 'numeric' },
    })
    await chart.render()
    expect(chart.w.globals.dataReducerRawMaxX).toBe(999)

    await chart.updateOptions({ chart: { dataReducer: { enabled: false } } })
    await chart.updateSeries([{ name: 'S', data: points(50, 2000) }])

    expect(chart.w.globals.dataReducerRawMinX ?? null).toBe(null)
    expect(chart.w.globals.dataReducerRawMaxX ?? null).toBe(null)
    chart.destroy()
  })
})
