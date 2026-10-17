import { vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// A mouse pan re-rendered the chart (and fired `scrolled`) on every mousemove,
// even when the window could not move: a mostly vertical drag, or a drag that
// would push a zoomed window past the data edge. Those moves now return early,
// so they cost no render and report no scroll. A pan that does move the window
// still renders once and fires `scrolled` once.

function pannedChart(scrolled) {
  const data = []
  for (let i = 1; i <= 20; i++) data.push([i, (i * 7) % 13])
  return createChartWithOptions({
    chart: {
      type: 'line',
      width: 600,
      height: 400,
      animations: { enabled: false },
      zoom: { enabled: true },
      toolbar: { autoSelected: 'pan' },
      events: { scrolled },
    },
    series: [{ name: 'S', data }],
    xaxis: { type: 'numeric' },
  })
}

/** One mousemove of a pan drag, from `from` to `to` (client px). */
function drag(chart, from, to) {
  const zps = chart.zoomPanSelection
  chart.w.interact.lastClientPosition = { x: from[0], y: from[1] }
  zps.clientX = to[0]
  zps.clientY = to[1]
  zps.panDragging({ context: zps })
}

function setup(min, max) {
  const scrolled = vi.fn()
  const chart = pannedChart(scrolled)
  chart.zoomX(min, max)
  const renders = vi.spyOn(chart.updateHelpers, '_updateOptions')
  return { chart, scrolled, renders }
}

describe('a mouse pan that cannot move the window', () => {
  test('a vertical drag neither re-renders nor fires scrolled', () => {
    const { chart, scrolled, renders } = setup(5, 10)
    for (let i = 0; i < 5; i++) drag(chart, [300, 260], [300, 200])
    expect(renders).toHaveBeenCalledTimes(0)
    expect(scrolled).toHaveBeenCalledTimes(0)
    expect([chart.w.globals.minX, chart.w.globals.maxX]).toEqual([5, 10])
  })

  test('a drag past the data edge neither re-renders nor fires scrolled', () => {
    const { chart, scrolled, renders } = setup(15, 20)
    // Dragging left moves the window right, past maxX = 20.
    for (let i = 0; i < 5; i++) drag(chart, [310, 200], [300, 200])
    expect(renders).toHaveBeenCalledTimes(0)
    expect(scrolled).toHaveBeenCalledTimes(0)
    expect([chart.w.globals.minX, chart.w.globals.maxX]).toEqual([15, 20])
  })

  test('a drag that moves the window renders once and fires scrolled once', () => {
    const { chart, scrolled, renders } = setup(5, 10)
    drag(chart, [310, 200], [300, 200])
    expect(renders).toHaveBeenCalledTimes(1)
    expect(scrolled).toHaveBeenCalledTimes(1)
    const { min, max } = scrolled.mock.calls[0][1].xaxis
    expect(min).toBeGreaterThan(5)
    expect(max - min).toBeCloseTo(5, 6)
  })
})
