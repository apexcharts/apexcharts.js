import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// The Dimensions instance survives updateOptions(), so every field it
// derives from config or from a past layout must be re-derived per run. An
// update must lay out exactly like a fresh chart with the final config.

function layoutOf(chart) {
  const l = chart.w.layout
  return {
    gridWidth: l.gridWidth,
    gridHeight: l.gridHeight,
    translateX: l.translateX,
    translateY: l.translateY,
  }
}

function freshLayout(options) {
  return layoutOf(createChartWithOptions(options))
}

describe('Dimensions per-run state', () => {
  it('drops a right pad that an earlier render needed', async () => {
    const opts = (total) => ({
      chart: {
        type: 'bar',
        height: 300,
        width: 500,
        stacked: true,
        stackType: '100%',
      },
      plotOptions: {
        bar: { horizontal: true, dataLabels: { total: { enabled: total } } },
      },
      series: [
        { name: 'a', data: [44, 55, 41] },
        { name: 'b', data: [53, 32, 33] },
      ],
      xaxis: { categories: ['one', 'two', 'three'] },
    })
    const chart = createChartWithOptions(opts(true))
    await chart.updateOptions({
      plotOptions: { bar: { dataLabels: { total: { enabled: false } } } },
    })
    expect(layoutOf(chart)).toEqual(freshLayout(opts(false)))
  })
})
