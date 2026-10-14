import { describe, it, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Series from '../../src/modules/Series.js'

// Three legend defects users saw:
// - with clusterGroupedSeries and interleaved groups (2024, 2025, 2024) the
//   legend listed the groups as 2025, 2024;
// - hovering the label of a hidden series faded out every visible series;
// - a legendClick handler that destroyed the chart threw, synchronously on
//   click or in the next frame after a keyboard toggle.

const twoLines = (events) =>
  createChartWithOptions({
    chart: { type: 'line', events },
    series: [
      { name: 'A', data: [1, 2, 3] },
      { name: 'B', data: [3, 2, 1] },
    ],
    legend: { show: true },
  })

describe('legend group order, hidden item hover, destroy in legendClick', () => {
  it('lists interleaved series groups in series order', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', stacked: true },
      series: [
        { name: 'Desktop', group: '2024', data: [1, 2] },
        { name: 'Desktop', group: '2025', data: [2, 3] },
        { name: 'Mobile', group: '2024', data: [3, 4] },
      ],
      xaxis: { categories: ['a', 'b'] },
      legend: { show: true, clusterGroupedSeries: true },
    })
    const groups = [...chart.el.querySelectorAll('.apexcharts-legend-group')]
    expect(groups.map((g) => g.classList[1])).toEqual([
      'apexcharts-legend-group-0',
      'apexcharts-legend-group-1',
    ])
    expect(groups[0].querySelectorAll('.apexcharts-legend-series').length).toBe(2)
  })

  it('does not highlight a hidden series when its label is hovered', async () => {
    const chart = twoLines()
    await chart.hideSeries('B')
    const spy = vi.spyOn(Series.prototype, 'toggleSeriesOnHover')
    for (const sel of ['marker', 'text']) {
      chart.el
        .querySelector(`.apexcharts-legend-${sel}[rel="2"]`)
        .dispatchEvent(new MouseEvent('mousemove', { bubbles: true }))
    }
    expect(spy).not.toHaveBeenCalled()
    chart.el
      .querySelector('.apexcharts-legend-text[rel="1"]')
      .dispatchEvent(new MouseEvent('mousemove', { bubbles: true }))
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('survives a legendClick handler that destroys the chart', () => {
    let chart
    chart = twoLines({ legendClick: () => chart.destroy() })
    const item = chart.el.querySelector('.apexcharts-legend-series[rel="1"]')
    expect(() => chart.legend.onLegendClick({ target: item })).not.toThrow()
  })

  it('skips the keyboard focus restore once the chart is destroyed', async () => {
    let chart
    chart = twoLines({
      legendClick: () => Promise.resolve().then(() => chart.destroy()),
    })
    const frames = []
    const raf = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb) => frames.push(cb))
    chart.el
      .querySelector('.apexcharts-legend-series[rel="1"]')
      .dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      )
    await Promise.resolve()
    await Promise.resolve()
    raf.mockRestore()
    expect(frames.length).toBeGreaterThan(0)
    expect(() => frames.forEach((f) => f(0))).not.toThrow()
  })
})
