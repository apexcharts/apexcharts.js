import { describe, it, expect } from 'vitest'
import './__mocks__/ResizeObserver.js'
// Sunburst, icicle and unit are opt-in: their entries register the types.
import ApexCharts from '../../src/entries/sunburst.js'
import '../../src/entries/icicle.js'
import '../../src/entries/unit.js'
import '../../src/entries/pie.js'

// Only pie and radial publish w.globals.radialSize. With the default
// chart.height, Core.resizeNonAxisCharts used to fit every other non-axis
// type to a radius of 0, collapsing a sunburst to a 15px strip.
const TREE = () => [
  {
    data: [
      {
        x: 'A',
        children: [
          { x: 'a1', y: 12.3 },
          { x: 'a2', y: 45.6 },
        ],
      },
      { x: 'B', y: 30 },
    ],
  },
]

const svgHeight = async (options) => {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    ...options,
    chart: { width: 500, animations: { enabled: false }, ...options.chart },
  })
  await chart.render()
  return Number(chart.el.querySelector('svg').getAttribute('height'))
}

describe('non-axis charts at the default height', () => {
  it('keep a sunburst at its laid-out height', async () => {
    expect(
      await svgHeight({ chart: { type: 'sunburst' }, series: TREE() }),
    ).toBeGreaterThan(200)
  })

  it('keep an icicle at its laid-out height', async () => {
    expect(
      await svgHeight({ chart: { type: 'icicle' }, series: TREE() }),
    ).toBeGreaterThan(200)
  })

  it('keep a unit chart at its laid-out height', async () => {
    expect(
      await svgHeight({
        chart: { type: 'unit' },
        series: [62, 24, 20],
        labels: ['x', 'y', 'z'],
      }),
    ).toBeGreaterThan(200)
  })

  it('still fit a pie to its radius', async () => {
    expect(
      await svgHeight({ chart: { type: 'pie' }, series: [44, 55, 13] }),
    ).toBeGreaterThan(200)
  })
})
