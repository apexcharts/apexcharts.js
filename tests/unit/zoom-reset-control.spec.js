import { createChartWithOptions } from './utils/utils.js'

// Drag-to-zoom is a deliberate gesture, so unlike the wheel and the pinch it is
// not withheld when the toolbar is hidden. The button that undoes it IS in that
// toolbar, though, so a page that hid the toolbar left the viewer zoomed into a
// window with nothing on screen to get back out of. `chart.zoom.resetControl`
// closes that: while the chart is zoomed and nothing else can reset it, one
// reset control is drawn where the toolbar would have been, and Escape does the
// same thing for anyone who never goes looking for a button.

function lineChart(chartOpts = {}) {
  return createChartWithOptions({
    chart: { type: 'line', width: 600, height: 400, ...chartOpts },
    series: [
      {
        name: 'S',
        data: [
          [1, 10],
          [2, 20],
          [3, 15],
          [4, 30],
        ],
      },
    ],
    xaxis: { type: 'numeric' },
  })
}

/** The render a zoom causes is queued, so the DOM lands a tick later. */
async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

async function zoomIn(chart) {
  chart.zoomX(2, 3)
  await settle()
}

const resets = () => document.querySelectorAll('.apexcharts-reset-icon')
const toolbars = () => document.querySelectorAll('.apexcharts-toolbar')

/** Every control a full toolbar carries that is not the reset. */
const otherTools = () =>
  document.querySelectorAll(
    '.apexcharts-zoom-icon, .apexcharts-zoomin-icon, .apexcharts-zoomout-icon, .apexcharts-pan-icon, .apexcharts-menu-icon, .apexcharts-menu',
  )

function pressEscape(chart) {
  const svg = chart.w.dom.baseEl.querySelector('.apexcharts-svg')
  svg.dispatchEvent(
    new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  )
}

describe('the way back out of a zoom', () => {
  test('the option defaults to auto, like the gestures it answers for', () => {
    const chart = lineChart()
    expect(chart.w.config.chart.zoom.resetControl).toBe('auto')
  })

  // The promise `toolbar: { show: false }` makes, and the reason the control is
  // drawn on the zoom rather than on the render: a page that never zooms is
  // exactly as bare as it asked to be.
  test('a chart nobody zoomed keeps the bare canvas the page asked for', () => {
    lineChart({ toolbar: { show: false } })
    expect(toolbars()).toHaveLength(0)
  })

  test('a zoom with the toolbar hidden draws one reset control and nothing else', async () => {
    const chart = lineChart({ toolbar: { show: false } })

    await zoomIn(chart)

    expect(resets()).toHaveLength(1)
    expect(otherTools()).toHaveLength(0)
  })

  test('pressing it puts the range back and takes the control away', async () => {
    const chart = lineChart({ toolbar: { show: false } })
    await zoomIn(chart)
    expect(chart.w.globals.minX).toBe(2)

    resets()[0].dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    await settle()

    expect(chart.w.interact.zoomed).toBe(false)
    expect(chart.w.globals.minX).toBe(1)
    expect(chart.w.globals.maxX).toBe(4)
    expect(resets()).toHaveLength(0)
  })

  test('Escape puts the range back too, for the viewer who never looks for a button', async () => {
    const chart = lineChart({ toolbar: { show: false } })
    await zoomIn(chart)

    pressEscape(chart)
    await settle()

    expect(chart.w.interact.zoomed).toBe(false)
    expect(chart.w.globals.minX).toBe(1)
  })

  test('Escape does nothing to a chart that is not zoomed', async () => {
    const chart = lineChart({ toolbar: { show: false } })

    pressEscape(chart)
    await settle()

    expect(chart.w.globals.minX).toBe(1)
    expect(chart.w.globals.maxX).toBe(4)
  })

  // A page saying it has its own reset is taken at its word, on both halves:
  // the control it would duplicate, and the key it may want for itself.
  test('false leaves the page to its own reset, and turns the key off with it', async () => {
    const chart = lineChart({
      toolbar: { show: false },
      zoom: { resetControl: false },
    })

    await zoomIn(chart)
    expect(resets()).toHaveLength(0)

    pressEscape(chart)
    await settle()
    expect(chart.w.interact.zoomed).toBe(true)
    expect(chart.w.globals.minX).toBe(2)
  })

  test('a toolbar already showing its reset gets no second one', async () => {
    const chart = lineChart()

    await zoomIn(chart)

    expect(toolbars()).toHaveLength(1)
    expect(resets()).toHaveLength(1)
  })

  // The other dead end, and the same answer: the toolbar is there, but the one
  // control that undoes a zoom was switched off.
  test('a toolbar with its reset tool switched off gains one while zoomed', async () => {
    const chart = lineChart({
      toolbar: { show: true, tools: { reset: false } },
    })
    expect(resets()).toHaveLength(0)

    await zoomIn(chart)
    expect(resets()).toHaveLength(1)

    resets()[0].dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    await settle()

    // Back to the page's own configuration once there is nothing to undo.
    expect(resets()).toHaveLength(0)
  })

  test('zoom.enabled: false never draws one, because nothing can zoom', async () => {
    const chart = lineChart({
      toolbar: { show: false },
      zoom: { enabled: false },
    })

    chart.w.interact.zoomed = true
    await chart.updateOptions({})

    expect(resets()).toHaveLength(0)
  })
})
