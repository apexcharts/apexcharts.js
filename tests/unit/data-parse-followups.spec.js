import { describe, it, expect, afterEach } from 'vitest'
// Sunburst is opt-in; importing its entry registers the type globally for the
// shared helper below.
import '../../src/entries/sunburst.js'
import { createChartWithOptions } from './utils/utils.js'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('sunburst root colour reaches the legend', () => {
  it('a root with its own colour paints its legend marker that colour', () => {
    const chart = createChartWithOptions({
      chart: { type: 'sunburst', width: 400, height: 400 },
      legend: { show: true },
      series: [
        {
          data: [
            { x: 'Tech', color: '#123456', children: [{ x: 'Software', y: 3 }] },
            { x: 'Energy', children: [{ x: 'Oil', y: 2 }] },
          ],
        },
      ],
    })
    const w = chart.w
    expect(w.globals.colors[0]).toBe('#123456')
    // The uncoloured root keeps its palette colour.
    expect(w.globals.colors[1]).not.toBe('#123456')
    const markers = chart.el.querySelectorAll(
      '.apexcharts-legend-marker.apexcharts-marker',
    )
    expect(markers.length).toBe(2)
    expect(markers[0].getAttribute('fill').toLowerCase()).toBe('#123456')
  })
})
