import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Animations from '../../src/modules/Animations.js'

// A render that does not animate reveals the delayed overlays (bar data
// labels, markers, shadows) from Graphics.renderPaths. It did so once per
// PATH, walking the whole delayedElements list each time, so a 20x200
// column chart with animations off ran 4,000 reveals over the same few
// dozen nodes. A reveal is only needed when something new was registered
// since the last one; the overlays still all end up shown.

const series = (n, m) =>
  Array.from({ length: n }, (_, s) => ({
    name: 'S' + s,
    data: Array.from({ length: m }, (_, i) => ((i * 7 + s * 3) % 17) + 1),
  }))

function countReveals() {
  const counts = { calls: 0, visits: 0 }
  const orig = Animations.prototype.showDelayedElements
  vi.spyOn(Animations.prototype, 'showDelayedElements').mockImplementation(
    function () {
      counts.calls++
      counts.visits += this.w.globals.delayedElements.length
      return orig.call(this)
    },
  )
  return counts
}

const revealState = (chart) => {
  const svg = chart.w.dom.Paper.node
  return {
    hidden: svg.querySelectorAll('.apexcharts-element-hidden').length,
    shown: svg.querySelectorAll('.apexcharts-hidden-element-shown').length,
  }
}

describe('delayed elements reveal on a render that does not animate', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reveals once per new registration, not once per bar', () => {
    const counts = countReveals()
    const chart = createChartWithOptions({
      chart: { type: 'bar' },
      series: series(10, 40),
    })
    // 400 bars: the base did one reveal per bar, 400 of them. Kept small so
    // the spec stays well inside the CI timeout.
    expect(counts.calls).toBeLessThanOrEqual(10)
    expect(counts.visits).toBeLessThan(400)
    expect(revealState(chart)).toEqual({ hidden: 0, shown: 20 })
    chart.destroy()
  })

  it('still reveals what a later series registers, after an update', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar' },
      series: series(6, 30),
      dataLabels: { enabled: true },
    })
    expect(revealState(chart)).toEqual({ hidden: 0, shown: 12 })
    const counts = countReveals()
    await chart.updateSeries(series(6, 30).reverse())
    // the fast update redraws the series groups (labels and their wraps)
    // but keeps the chrome, so 6 overlays, as on the base
    expect(revealState(chart)).toEqual({ hidden: 0, shown: 6 })
    expect(counts.calls).toBeLessThanOrEqual(6)
    chart.destroy()
  })

  it('reveals line markers and area overlays as before', () => {
    const line = createChartWithOptions({
      chart: { type: 'line' },
      markers: { size: 3 },
      series: series(6, 30),
    })
    expect(revealState(line)).toEqual({ hidden: 0, shown: 6 })
    line.destroy()
  })
})
