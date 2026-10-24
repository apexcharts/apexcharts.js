import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

function marker(i, j) {
  return [...document.querySelectorAll('.apexcharts-marker')].find(
    (m) =>
      m.getAttribute('index') === String(i) &&
      m.getAttribute('j') === String(j),
  )
}

function radar(events, markers = { size: 6 }) {
  return createChartWithOptions({
    chart: {
      type: 'radar',
      events: {
        dataPointMouseEnter: (e, ctx, { seriesIndex, dataPointIndex }) =>
          events.push(['enter', seriesIndex, dataPointIndex]),
        dataPointSelection: (e, ctx, { seriesIndex, dataPointIndex }) =>
          events.push(['select', seriesIndex, dataPointIndex]),
      },
    },
    series: [{ name: 'a', data: [40, 15, 14, 20, 11] }],
    labels: ['a', 'b', 'c', 'd', 'e'],
    markers,
  })
}

describe('radar marker events', () => {
  it('fires dataPointMouseEnter and dataPointSelection from a marker', () => {
    const events = []
    const chart = radar(events)

    const target = marker(0, 2)
    expect(target).toBeTruthy()
    target.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))

    expect(events).toContainEqual(['enter', 0, 2])
    expect(events).toContainEqual(['select', 0, 2])

    chart.destroy()
  })

  it('delegates once per series, not once per point', () => {
    const chart = radar([])
    const groups = document.querySelectorAll(
      '.apexcharts-radar-series .apexcharts-series .apexcharts-series-markers',
    )
    expect(groups.length).toBe(1)
    expect(groups[0].querySelectorAll('.apexcharts-marker').length).toBe(5)
    chart.destroy()
  })

  it('fires no marker events for the invisible markers.size: 0 hit area', () => {
    const events = []
    const chart = radar(events, { size: 0 })

    // the hit area is still drawn, so the tooltip keeps resolving hover
    const target = marker(0, 2)
    expect(target).toBeTruthy()
    expect(() => {
      target.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
      target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      target.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      target.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }))
    }).not.toThrow()

    expect(events).toEqual([])
    expect(target.getAttribute('selected')).toBeNull()

    chart.destroy()
  })

  it('keeps a selected point highlighted across a redraw', async () => {
    const chart = radar([])

    marker(0, 2).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(chart.w.interact.selectedDataPoints[0]).toEqual([2])

    await chart.updateSeries([{ name: 'a', data: [30, 25, 24, 10, 21] }])

    const selected = marker(0, 2)
    expect(selected.getAttribute('selected')).toBe('true')
    expect(selected.getAttribute('filter')).toBeTruthy()
    expect(marker(0, 1).getAttribute('selected')).toBeNull()
    expect(marker(0, 1).getAttribute('filter')).toBeNull()

    chart.destroy()
  })
})
