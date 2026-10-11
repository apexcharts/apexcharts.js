import { describe, it, expect } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import './__mocks__/ResizeObserver.js'

// A null entry in {x, y} data is a gap. The shared tooltip read its x
// through a typeof check that let null through, and threw on hover.

const render = async (type) => {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    chart: { type, width: 500, height: 300, animations: { enabled: false } },
    series: [
      {
        name: 'A',
        data: [{ x: 'Mon', y: 1 }, null, { x: 'Wed', y: 3 }],
      },
    ],
    tooltip: { shared: true, intersect: false },
  })
  await chart.render()
  return chart
}

describe('tooltip over a null datum', () => {
  it.each(['line', 'bar'])('%s reads no x for the gap', async (type) => {
    const chart = await render(type)
    const labels = chart.ctx.tooltip.tooltipLabels
    expect(() => labels.getValuesToPrint({ i: 0, j: 1 })).not.toThrow()
    expect(labels.getValuesToPrint({ i: 0, j: 0 }).xVal).toBe('Mon')
    chart.destroy()
  })
})
