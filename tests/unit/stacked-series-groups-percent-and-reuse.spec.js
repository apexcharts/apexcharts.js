import { describe, it, expect } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

// Two series group defects users saw:
// - 100% stacked bars with series groups divided every group by the grand
//   total, so groups topped out at their share of it (80% and 20%) instead
//   of 100% each;
// - the default per-axis group was written onto the caller's series
//   objects, so reusing them (a new chart, or a second y axis) kept the
//   stale group and two axes stacked as one group at the wrong width.

const render = async (opts) => {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    ...opts,
    chart: {
      width: 600,
      height: 400,
      ...opts.chart,
      animations: { enabled: false },
    },
  })
  await chart.render()
  return chart
}

describe('stacked series groups', () => {
  it('normalises each group of a 100% stack against its own total', async () => {
    const chart = await render({
      chart: { type: 'bar', stacked: true, stackType: '100%' },
      series: [
        { name: 'a1', group: 'A', data: [40, 30] },
        { name: 'a2', group: 'A', data: [40, 10] },
        { name: 'b1', group: 'B', data: [10, 5] },
        { name: 'b2', group: 'B', data: [10, 15] },
      ],
    })
    expect(chart.w.globals.seriesPercent).toEqual([
      [50, 75],
      [50, 25],
      [50, 25],
      [50, 75],
    ])
  })

  it('normalises each group per x on a numeric axis', async () => {
    const chart = await render({
      chart: { type: 'bar', stacked: true, stackType: '100%' },
      xaxis: { type: 'numeric' },
      series: [
        { name: 'a1', group: 'A', data: [{ x: 1, y: 30 }, { x: 2, y: 20 }] },
        { name: 'a2', group: 'A', data: [{ x: 2, y: 60 }] },
        { name: 'b1', group: 'B', data: [{ x: 1, y: 5 }, { x: 2, y: 5 }] },
      ],
    })
    expect(chart.w.globals.seriesPercent).toEqual([[100, 25], [75], [100, 100]])
  })

  it('keeps a single stack normalised to the grand total', async () => {
    const chart = await render({
      chart: { type: 'bar', stacked: true, stackType: '100%' },
      series: [
        { name: 'a', data: [30] },
        { name: 'b', data: [10] },
      ],
    })
    expect(chart.w.globals.seriesPercent).toEqual([[75], [25]])
  })

  it('does not write the default group onto the caller series', async () => {
    const series = [
      { name: 'A', type: 'column', data: [1, 2] },
      { name: 'B', type: 'column', data: [3, 4] },
    ]
    const chart = await render({ chart: { type: 'bar', stacked: true }, series })
    expect(series.map((s) => s.group)).toEqual([undefined, undefined])
    expect(chart.w.labelData.seriesGroupIndex).toEqual([0, 0])
  })

  it('groups by axis when the same series objects are reused with two y axes', async () => {
    const series = [
      { name: 'A', type: 'column', data: [1, 2] },
      { name: 'B', type: 'column', data: [3, 4] },
    ]
    await render({ chart: { type: 'bar', stacked: true }, series })
    const chart = await render({
      chart: { type: 'bar', stacked: true },
      series,
      yaxis: [{ seriesName: 'A' }, { seriesName: 'B', opposite: true }],
    })
    expect(chart.w.labelData.seriesGroupIndex).toEqual([0, 1])
    expect(chart.w.globals.barGroups).toEqual([0, 1])
    const fresh = await render({
      chart: { type: 'bar', stacked: true },
      series: series.map((s) => ({ ...s })),
      yaxis: [{ seriesName: 'A' }, { seriesName: 'B', opposite: true }],
    })
    expect(chart.w.globals.barWidth).toBe(fresh.w.globals.barWidth)
  })

  it('still honours an explicit group shared across axes', async () => {
    const chart = await render({
      chart: { type: 'bar', stacked: true },
      series: [
        { name: 'A', group: 'g', data: [1, 2] },
        { name: 'B', group: 'g', data: [3, 4] },
      ],
      yaxis: [{ seriesName: 'A' }, { seriesName: 'B', opposite: true }],
    })
    expect(chart.w.labelData.seriesGroups).toEqual([['A', 'B']])
  })
})
