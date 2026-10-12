/**
 * A trellis host draws no chart of its own. appendData and refreshTokens
 * used to call the single-chart pipeline directly and drew a stray chart
 * beside the grid, while the panels never received the new points.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/trellis.js'

beforeAll(() => {
  Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
    writable: true,
    value: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  })
})

beforeEach(() => {
  document.body.innerHTML = ''
  if (typeof Apex !== 'undefined') Apex._chartInstances = []
})

const day = (i) => Date.UTC(2025, 0, 1) + i * 86400000
const rows = (base) => Array.from({ length: 4 }, (_, i) => [day(i), base + i])

function mount() {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const chart = new ApexCharts(el, {
    chart: { type: 'line', height: 400, animations: { enabled: false } },
    trellis: { by: 'region', virtualize: false },
    series: [
      { name: 'Revenue', region: 'North', data: rows(10) },
      { name: 'Revenue', region: 'South', data: rows(20) },
    ],
    xaxis: { type: 'datetime' },
  })
  return { chart, el }
}

/** Charts drawn directly in the host, outside the trellis grid. */
const strayCharts = (el) =>
  [...el.querySelectorAll('.apexcharts-canvas')].filter(
    (c) => !c.closest('.apexcharts-trellis'),
  ).length

describe('trellis host entry points', () => {
  it('appendData reaches the panels and draws nothing beside the grid', async () => {
    const { chart, el } = mount()
    await chart.render()
    await chart.appendData([{ data: [[day(4), 99]] }, { data: [[day(4), 77]] }])
    expect(strayCharts(el)).toBe(0)
    const [north, south] = chart.getPanels()
    expect(north.chart.w.config.series[0].data.length).toBe(5)
    expect(south.chart.w.config.series[0].data.at(-1)).toEqual([day(4), 77])
    chart.destroy()
  })

  it('refreshTokens rebuilds the grid instead of drawing a single chart', async () => {
    const { chart, el } = mount()
    await chart.render()
    await chart.refreshTokens()
    expect(strayCharts(el)).toBe(0)
    expect(el.querySelectorAll('.apexcharts-trellis').length).toBe(1)
    expect(chart.getPanels().length).toBe(2)
    chart.destroy()
  })
})
