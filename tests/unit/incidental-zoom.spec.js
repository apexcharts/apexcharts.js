import { createChartWithOptions } from './utils/utils.js'

// Wheel and pinch zoom are "incidental" gestures: a page scroll or a two-finger
// swipe over the chart can zoom it without the viewer ever asking to. Both
// default to 'auto', which resolves against a reset button already being on
// screen. A chart with the toolbar hidden used to swallow the page's wheel and
// leave the viewer stuck in a window they could not undo.
//
// `chart.zoom.resetControl` (zoom-reset-control.spec.js) now draws a reset of
// its own once a chart is zoomed, and these gates are deliberately left as they
// are: that control arrives after the fact, while what an incidental wheel zoom
// takes first is the page scroll it swallowed, which no button hands back.

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

/** The resolver both gestures share (ZoomPanSelection._incidentalZoomEnabled). */
function gestures(chart) {
  const zps = chart.zoomPanSelection
  return { wheel: zps._wheelZoomEnabled(), pinch: zps._pinchEnabled() }
}

describe("incidental zoom gestures — 'auto' follows the reset affordance", () => {
  test('the default toolbar gives both gestures', () => {
    const chart = lineChart()
    expect(chart.w.config.chart.zoom.allowMouseWheelZoom).toBe('auto')
    expect(chart.w.config.chart.zoom.pinch).toBe('auto')
    expect(gestures(chart)).toEqual({ wheel: true, pinch: true })
  })

  test('a hidden toolbar withholds both: no reset button, no incidental zoom', () => {
    const chart = lineChart({ toolbar: { show: false } })
    expect(gestures(chart)).toEqual({ wheel: false, pinch: false })
  })

  test('a toolbar without its reset tool counts as no way back', () => {
    const chart = lineChart({
      toolbar: { show: true, tools: { reset: false } },
    })
    expect(gestures(chart)).toEqual({ wheel: false, pinch: false })
  })

  test('explicit true forces the gesture on for a page that resets it itself', () => {
    const chart = lineChart({
      toolbar: { show: false },
      zoom: { allowMouseWheelZoom: true, pinch: true },
    })
    expect(gestures(chart)).toEqual({ wheel: true, pinch: true })
  })

  test('explicit false still wins over a visible toolbar', () => {
    const chart = lineChart({
      zoom: { allowMouseWheelZoom: false, pinch: false },
    })
    expect(gestures(chart)).toEqual({ wheel: false, pinch: false })
  })

  test("'auto' is the cooperative wheel; only an explicit true is greedy", () => {
    expect(lineChart().zoomPanSelection._wheelZoomGreedy()).toBe(false)
    expect(lineChart().w.config.chart.zoom.wheelHint).toBe(true)
    expect(
      lineChart({ zoom: { allowMouseWheelZoom: true } }).zoomPanSelection
        ._wheelZoomGreedy(),
    ).toBe(true)
  })

  test('the hint text comes from the locale, with a fallback for old locales', () => {
    expect(lineChart().w.globals.locale.toolbar.wheelZoomHint).toBe(
      'Use {key} + scroll to zoom',
    )
    // a locale written before the key existed falls back to English
    const chart = lineChart({
      locales: [{ name: 'xx', options: { toolbar: { reset: 'R' } } }],
      defaultLocale: 'xx',
    })
    expect(chart.w.globals.locale.toolbar.reset).toBe('R')
    expect(chart.w.globals.locale.toolbar.wheelZoomHint).toBe(
      'Use {key} + scroll to zoom',
    )
  })

  test('zoom.enabled: false withholds both however they are set', () => {
    const chart = lineChart({
      zoom: { enabled: false, allowMouseWheelZoom: true, pinch: true },
    })
    expect(gestures(chart)).toEqual({ wheel: false, pinch: false })
  })
})
