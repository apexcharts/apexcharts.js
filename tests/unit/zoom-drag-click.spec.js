import { createChartWithOptions } from './utils/utils.js'

// Issue #5060: a drag-to-zoom ends on mouseup, and that mouseup bubbles from
// `.apexcharts-svg` (ZoomPanSelection) to the chart element, where Events
// treats every left-button mouseup as chart.events.click. A plain click, and
// a click that only jitters inside the selection threshold, must still fire.

function lineChart(events, chartExtra = {}) {
  return createChartWithOptions({
    chart: {
      type: 'line',
      width: 600,
      height: 400,
      zoom: { enabled: true, type: 'xy' },
      toolbar: { autoSelected: 'zoom', tools: { zoom: true, pan: true } },
      events,
      ...chartExtra,
    },
    series: [
      {
        name: 'S',
        data: [
          [1, 10],
          [2, 20],
          [3, 15],
          [4, 30],
          [5, 25],
        ],
      },
    ],
    xaxis: { type: 'numeric' },
    markers: { size: 6 },
  })
}

/**
 * @param {string} type
 * @param {number} x
 * @param {number} y
 */
function pointer(type, x, y) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX: x,
    clientY: y,
  })
  // Handlers still read the legacy `which`. jsdom leaves it at 0 for a
  // constructed MouseEvent, which would skip both the drag and the click.
  if (event.which !== 1) {
    Object.defineProperty(event, 'which', { value: 1 })
  }
  return event
}

/**
 * @param {any} chart
 * @param {{ x: number, y: number }} from
 * @param {{ x: number, y: number }} to
 * @param {{ move?: boolean }} [opts]
 */
function gesture(chart, from, to, { move = true } = {}) {
  const svg = chart.w.dom.baseEl.querySelector('.apexcharts-svg')
  svg.dispatchEvent(pointer('mousedown', from.x, from.y))
  if (move) svg.dispatchEvent(pointer('mousemove', to.x, to.y))
  svg.dispatchEvent(pointer('mouseup', to.x, to.y))
}

describe('zoom selection drag does not fire chart click (#5060)', () => {
  it('does not fire click after a drag past the selection threshold', () => {
    const click = vi.fn()
    const zoomed = vi.fn()
    const chart = lineChart({ click, zoomed })
    expect(chart.w.interact.zoomEnabled).toBe(true)

    // jsdom reports an empty box for the selection rect, so give it the span
    // the drag drew. selectionDrawn converts that box into the zoomed range.
    const zoomRect = chart.w.dom.baseEl.querySelector('.apexcharts-zoom-rect')
    zoomRect.getBoundingClientRect = () => ({
      left: 120,
      right: 360,
      top: 80,
      bottom: 260,
      width: 240,
      height: 180,
      x: 120,
      y: 80,
    })

    const minBefore = chart.w.globals.minX
    const maxBefore = chart.w.globals.maxX
    gesture(chart, { x: 80, y: 120 }, { x: 280, y: 220 })

    expect(click).not.toHaveBeenCalled()
    expect(zoomed).toHaveBeenCalledTimes(1)
    expect(chart.w.interact.zoomed).toBe(true)
    expect(chart.w.globals.maxX - chart.w.globals.minX).toBeLessThan(
      maxBefore - minBefore,
    )

    // The drag's mouseup consumed the flag, so the next click still reports.
    gesture(chart, { x: 100, y: 140 }, { x: 100, y: 140 }, { move: false })
    expect(click).toHaveBeenCalledTimes(1)
    chart.destroy()
  })

  it('still fires click for a plain click with no movement', () => {
    const click = vi.fn()
    const chart = lineChart({ click })

    gesture(chart, { x: 80, y: 120 }, { x: 80, y: 120 }, { move: false })

    expect(click).toHaveBeenCalledTimes(1)
    chart.destroy()
  })

  it('still fires click when the pointer only jitters inside the drag threshold', () => {
    const click = vi.fn()
    const chart = lineChart({ click })

    // 5px across and 3px down: dragged, but under the 10px selection gate.
    gesture(chart, { x: 80, y: 120 }, { x: 85, y: 123 })

    expect(click).toHaveBeenCalledTimes(1)
    chart.destroy()
  })

  it('still fires dataPointSelection when a point is clicked', () => {
    const click = vi.fn()
    const dataPointSelection = vi.fn()
    const chart = lineChart({ click, dataPointSelection })
    const marker = chart.w.dom.baseEl.querySelector(
      '.apexcharts-series-markers .apexcharts-marker',
    )
    expect(marker).toBeTruthy()

    marker.dispatchEvent(pointer('mousedown', 100, 150))
    marker.dispatchEvent(pointer('mouseup', 100, 150))

    expect(dataPointSelection).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    const payload = dataPointSelection.mock.calls[0][2]
    expect(payload.seriesIndex).toBe(0)
    expect(payload.dataPointIndex).toBeTypeOf('number')
    chart.destroy()
  })

  it('fires click again on the next plain click after a zoom drag', () => {
    const click = vi.fn()
    const chart = lineChart({ click })

    gesture(chart, { x: 80, y: 120 }, { x: 280, y: 220 })
    expect(click).not.toHaveBeenCalled()

    gesture(chart, { x: 90, y: 130 }, { x: 90, y: 130 }, { move: false })

    expect(click).toHaveBeenCalledTimes(1)
    chart.destroy()
  })

  it('does not fire click after a selection-tool drag past the threshold', () => {
    const click = vi.fn()
    const chart = lineChart(
      { click },
      {
        toolbar: {
          autoSelected: 'selection',
          tools: { selection: true, zoom: true },
        },
      },
    )
    expect(chart.w.interact.selectionEnabled).toBe(true)
    expect(chart.w.interact.zoomEnabled).toBe(false)

    gesture(chart, { x: 80, y: 120 }, { x: 280, y: 160 })

    expect(click).not.toHaveBeenCalled()
    chart.destroy()
  })

  it('still fires click after a pan drag', () => {
    const click = vi.fn()
    const chart = lineChart(
      { click },
      { toolbar: { autoSelected: 'pan', tools: { zoom: true, pan: true } } },
    )
    expect(chart.w.interact.panEnabled).toBe(true)
    expect(chart.w.interact.zoomEnabled).toBe(false)

    gesture(chart, { x: 80, y: 120 }, { x: 280, y: 120 })

    expect(click).toHaveBeenCalledTimes(1)
    chart.destroy()
  })
})
