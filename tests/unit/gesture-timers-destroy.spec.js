import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ZoomPanSelection from '../../src/modules/ZoomPanSelection'
import Series from '../../src/modules/Series'

// The wheel, inertia and wheel-hint frames and timers live on w.interact, so
// a gesture survives the re-render each of its frames triggers (the
// per-update ZoomPanSelection.destroy leaves them alone on purpose). A real
// destroy used to leave them pending too, each one firing into a dead chart.
// ZoomPanSelection.destroy now cancels them on a real destroy and drops the
// gesture state, so a render() of the same chart afterwards starts clean.

const FAKE = {
  toFake: [
    'setTimeout',
    'clearTimeout',
    'requestAnimationFrame',
    'cancelAnimationFrame',
  ],
}

function lineChart() {
  return createChartWithOptions({
    chart: {
      type: 'line',
      width: 600,
      height: 400,
      zoom: { enabled: true, type: 'x' },
      toolbar: { autoSelected: 'zoom' },
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
          [6, 40],
        ],
      },
    ],
    xaxis: { type: 'numeric' },
  })
}

/** A Ctrl + wheel notch over the plot: a zoom, not a page scroll. */
const zoomWheel = (/** @type {any} */ extra = {}) => ({
  ctrlKey: true,
  deltaY: -120,
  deltaX: 0,
  deltaMode: 0,
  clientX: 300,
  preventDefault() {},
  ...extra,
})

/** A left-button mouse event the zoom handlers accept. */
function pointer(/** @type {string} */ type, /** @type {number} */ x) {
  const e = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX: x,
    clientY: 150,
  })
  if (e.which !== 1) Object.defineProperty(e, 'which', { value: 1 })
  return e
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('a real destroy cancels the gesture frames and timers', () => {
  it('mid wheel zoom: neither the zoom frame nor the settle timer runs', () => {
    vi.useFakeTimers(FAKE)
    const chart = lineChart()
    const apply = vi.spyOn(ZoomPanSelection.prototype, '_applyWheelZoom')
    const end = vi.spyOn(ZoomPanSelection.prototype, '_endWheelZoom')

    chart.zoomPanSelection.mouseWheelEvent(zoomWheel())
    const st = chart.w.interact.wheel
    expect(st.rafId).not.toBeNull()
    expect(st.endTimer).not.toBeNull()

    chart.destroy()
    expect(vi.getTimerCount()).toBe(0)
    expect(() => vi.runAllTimers()).not.toThrow()
    expect(apply).not.toHaveBeenCalled()
    expect(end).not.toHaveBeenCalled()
  })

  it('an update mid wheel zoom keeps the gesture going', () => {
    vi.useFakeTimers(FAKE)
    const chart = lineChart()
    const apply = vi.spyOn(ZoomPanSelection.prototype, '_applyWheelZoom')
    const end = vi.spyOn(ZoomPanSelection.prototype, '_endWheelZoom')

    chart.zoomPanSelection.mouseWheelEvent(zoomWheel())
    chart.updateOptions({ title: { text: 'zooming' } })
    vi.runAllTimers()
    expect(apply).toHaveBeenCalledTimes(1)
    expect(end).toHaveBeenCalledTimes(1)
    chart.destroy()
  })

  it('mid inertia glide: no further frame runs', () => {
    vi.useFakeTimers(FAKE)
    const chart = lineChart()
    const step = vi.spyOn(ZoomPanSelection.prototype, '_applyXRange')

    chart.zoomPanSelection._startInertia(1)
    expect(chart.w.interact.momentum.inertiaRAF).not.toBeNull()

    chart.destroy()
    expect(vi.getTimerCount()).toBe(0)
    expect(() => vi.runAllTimers()).not.toThrow()
    expect(step).not.toHaveBeenCalled()
  })

  it('with the wheel hint up: its fade-out timer does not run', () => {
    vi.useFakeTimers(FAKE)
    const chart = lineChart()
    const hide = vi.spyOn(ZoomPanSelection.prototype, '_hideWheelHint')

    // A bare wheel on the cooperative ('auto') wheel shows the hint.
    chart.zoomPanSelection.mouseWheelEvent(zoomWheel({ ctrlKey: false }))
    expect(chart.w.interact.wheelHintTimer).toBeTruthy()

    // The destroy takes the hint down itself, once; the timer never fires.
    chart.destroy()
    expect(hide).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
    expect(() => vi.runAllTimers()).not.toThrow()
    expect(hide).toHaveBeenCalledTimes(1)
  })

  it('mid announcement: the live region is not written', () => {
    vi.useFakeTimers(FAKE)
    const chart = lineChart()
    const region = chart.w.dom.baseEl.querySelector('.apexcharts-sr-status')
    chart.ctx.keyboardNavigation._announce('Zoomed in')

    chart.destroy()
    expect(() => vi.runAllTimers()).not.toThrow()
    expect(region.textContent).toBe('')
  })

  it('a render() after a destroy mid gesture gets working wheel and drag zoom', async () => {
    vi.useFakeTimers(FAKE)
    const chart = lineChart()
    chart.zoomPanSelection.mouseWheelEvent(zoomWheel())
    chart.zoomPanSelection._startInertia(1)
    chart.destroy()

    const rendered = chart.render()
    await vi.runAllTimersAsync()
    await rendered
    expect(chart.w.interact.momentum?.busy).toBeFalsy()

    const apply = vi.spyOn(ZoomPanSelection.prototype, '_applyWheelZoom')
    chart.zoomPanSelection.mouseWheelEvent(zoomWheel())
    vi.runAllTimers()
    expect(apply).toHaveBeenCalledTimes(1)

    const drawn = vi.spyOn(ZoomPanSelection.prototype, 'selectionDrawn')
    const svg = chart.w.dom.baseEl.querySelector('.apexcharts-svg')
    svg.dispatchEvent(pointer('mousedown', 150))
    svg.dispatchEvent(pointer('mousemove', 350))
    svg.dispatchEvent(pointer('mouseup', 350))
    expect(drawn).toHaveBeenCalledTimes(1)
    chart.destroy()
  })
})

describe('the collapsing series paint hold', () => {
  it('runs once the hold is over', () => {
    vi.useFakeTimers(FAKE)
    const chart = lineChart()
    const fn = vi.fn()
    Series.afterCollapseHold(chart.w, fn)
    vi.runAllTimers()
    expect(fn).toHaveBeenCalledTimes(1)
    chart.destroy()
  })

  it('does nothing on a chart destroyed mid hold', () => {
    vi.useFakeTimers(FAKE)
    const chart = lineChart()
    const w = chart.w
    const fn = vi.fn()
    Series.afterCollapseHold(w, fn)

    // The -collapsing class of a series hidden by this render.
    w.globals.collapsedSeries = [{ index: 0 }]
    w.globals.collapsingSeriesIndices = [0]
    const remove = vi.fn()
    const elSeries = { node: { classList: { add() {}, remove } } }
    Series.addCollapsedClassToSeries(w, elSeries, 0)

    chart.destroy()
    expect(() => vi.runAllTimers()).not.toThrow()
    expect(fn).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
  })
})
