import { describe, it, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// #5345: a live update rebuilds the legend between pointerdown and pointerup.
// The pressed element has left the DOM by then, so the browser sends no click
// for the press and the series never toggles. The touch case, where the
// browser still sends a click after such a press, needs trusted events and is
// in tests/interaction/specs/legend-click-live-update.spec.js.

const legendText = (chart, rel) =>
  chart.el.querySelector(`.apexcharts-legend-text[rel="${rel}"]`)

const pointer = (el, type) =>
  el.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      button: 0,
      pointerType: 'mouse',
    }),
  )

const click = (el) =>
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

const settle = () => new Promise((r) => setTimeout(r, 0))

function liveChart(legendClick) {
  return createChartWithOptions({
    chart: { type: 'line', events: { legendClick } },
    series: [
      { name: 'A', data: [1, 2, 3] },
      { name: 'B', data: [3, 2, 1] },
    ],
    legend: { show: true },
  })
}

const nextSample = (chart) =>
  chart.updateSeries([
    { name: 'A', data: [1, 2, 3, 4] },
    { name: 'B', data: [3, 2, 1, 0] },
  ])

describe('legend click during live updates (#5345)', () => {
  it('toggles the series when the legend is rebuilt mid-press', async () => {
    const legendClick = vi.fn()
    const chart = liveChart(legendClick)

    const pressed = legendText(chart, 1)
    pointer(pressed, 'pointerdown')
    await nextSample(chart)
    const released = legendText(chart, 1)
    expect(released).not.toBe(pressed)
    expect(pressed.isConnected).toBe(false)

    pointer(released, 'pointerup')
    await settle()

    expect(legendClick).toHaveBeenCalledTimes(1)
    expect(chart.w.globals.collapsedSeriesIndices).toEqual([0])
  })

  it('runs a click from code after that press', async () => {
    const legendClick = vi.fn()
    const chart = liveChart(legendClick)

    pointer(legendText(chart, 1), 'pointerdown')
    await nextSample(chart)
    pointer(legendText(chart, 1), 'pointerup')
    await settle()
    legendText(chart, 1).click()
    await settle()

    expect(legendClick).toHaveBeenCalledTimes(2)
    expect(chart.w.globals.collapsedSeriesIndices).toEqual([])
  })

  it('toggles once for a press on a legend that was not rebuilt', async () => {
    const legendClick = vi.fn()
    const chart = liveChart(legendClick)

    const el = legendText(chart, 2)
    pointer(el, 'pointerdown')
    pointer(el, 'pointerup')
    click(el)
    await settle()

    expect(legendClick).toHaveBeenCalledTimes(1)
    expect(chart.w.globals.collapsedSeriesIndices).toEqual([1])
  })

  it('does not toggle when the release lands on another item', async () => {
    const legendClick = vi.fn()
    const chart = liveChart(legendClick)

    pointer(legendText(chart, 1), 'pointerdown')
    await nextSample(chart)
    pointer(legendText(chart, 2), 'pointerup')
    await settle()

    expect(legendClick).not.toHaveBeenCalled()
    expect(chart.w.globals.collapsedSeriesIndices).toEqual([])
  })
})
