import { afterEach, describe, expect, it, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// annotationsBackground measured the grid and one label, drew that label's
// background rect, then measured the next: every rect it drew forced a fresh
// layout for the next read, about one per labelled annotation on each full
// render. It now measures every label first, then draws all the rects, so the
// reads share one layout. The rects it draws, and where they land, are
// unchanged.

function annotatedChart() {
  const label = (text, extra = {}) => ({ text, ...extra })
  return createChartWithOptions({
    chart: { type: 'line', width: 600, height: 400 },
    series: [{ name: 'S', data: [10, 40, 25, 50, 30, 60] }],
    xaxis: { categories: ['A', 'B', 'C', 'D', 'E', 'F'] },
    annotations: {
      xaxis: [
        { x: 'B', label: label('x one', { orientation: 'horizontal' }) },
        { x: 'C', label: label('x two', { orientation: 'horizontal' }) },
        { x: 'D', label: label('') },
        { x: 'E', label: label('x four', { orientation: 'horizontal' }) },
      ],
      yaxis: [
        { y: 20, label: label('y one') },
        { y: 45, label: label('y two') },
      ],
      points: [{ x: 'D', y: 50, label: label('point') }],
    },
  })
}

afterEach(() => vi.restoreAllMocks())

/** Run annotationsBackground and log each layout read (R) and DOM write (W). */
function trace(chart) {
  const log = []
  let gridReads = 0
  const realRect = Element.prototype.getBoundingClientRect
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    function () {
      log.push('R')
      if (this.classList.contains('apexcharts-grid')) gridReads++
      return realRect.call(this)
    },
  )
  const writes = [
    [Node.prototype, 'insertBefore'],
    [Node.prototype, 'appendChild'],
  ]
  for (const [proto, m] of writes) {
    const real = proto[m]
    vi.spyOn(proto, m).mockImplementation(function (...args) {
      log.push('W')
      return real.apply(this, args)
    })
  }
  chart.annotations.helpers.annotationsBackground()
  vi.restoreAllMocks()
  return { log: log.join(''), gridReads }
}

describe('annotation label backgrounds', () => {
  it('measure everything before drawing anything', () => {
    const chart = annotatedChart()
    const { log, gridReads } = trace(chart)
    // Six labelled annotations (the empty one draws nothing): the grid and
    // the label read for each, then two writes each (draw, then move into
    // place before the label).
    expect(log).toMatch(/^R+W+$/)
    expect(log).toBe('R'.repeat(12) + 'W'.repeat(12))
    expect(gridReads).toBe(6)
  })

  it('draw one rect right before each labelled annotation', () => {
    const chart = annotatedChart()
    const el = chart.w.dom.baseEl
    const labels = el.querySelectorAll(
      '.apexcharts-xaxis-annotation-label, .apexcharts-yaxis-annotation-label, .apexcharts-point-annotation-label',
    )
    const withBg = Array.from(labels).filter(
      (l) =>
        l.previousElementSibling && l.previousElementSibling.tagName === 'rect',
    )
    expect(withBg.map((l) => l.textContent).sort()).toEqual([
      'point',
      'x four',
      'x one',
      'x two',
      'y one',
      'y two',
    ])
  })
})
