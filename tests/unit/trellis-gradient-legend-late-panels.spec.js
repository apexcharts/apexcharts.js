import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import IntersectionObserver from './__mocks__/IntersectionObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/trellis.js'
import Graphics from '../../src/modules/Graphics.js'

// On a virtualized heatmap trellis, hovering cells in a panel that scrolled
// into view after the shared gradient strip was built left the strip's value
// arrow hidden: only panels mounted at build time were wired.

beforeAll(() => {
  Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
    writable: true,
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  })
})
beforeEach(() => {
  document.body.innerHTML = ''
  IntersectionObserver.instances.length = 0
  if (typeof Apex !== 'undefined') Apex._chartInstances = []
})

async function until(fn, what, timeout = 5000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (fn()) return
    await new Promise((r) => setTimeout(r, 20))
  }
  throw new Error(`timed out waiting for ${what}`)
}
const row = (name, k, vals) => ({
  name,
  k,
  data: vals.map((y, i) => ({ x: `c${i}`, y })),
})
const hoverCell = (panel) =>
  Graphics._fireEvent(panel.w, 'dataPointMouseEnter', [
    new MouseEvent('mouseenter'),
    panel,
    { seriesIndex: 0, dataPointIndex: 2, w: panel.w },
  ])

async function mountFirstThenRest() {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const keys = ['a', 'b', 'c', 'd']
  const chart = new ApexCharts(el, {
    chart: { type: 'heatmap', height: 400, animations: { enabled: false } },
    trellis: { by: 'k', virtualize: true },
    series: keys.flatMap((k, i) => [
      row('r1', k, [1 + i * 20, 2 + i * 20, 3 + i * 20]),
      row('r2', k, [4 + i * 20, 5 + i * 20, 6 + i * 20]),
    ]),
    plotOptions: {
      heatmap: { colorScale: { gradientLegend: { enabled: true } } },
    },
    dataLabels: { enabled: false },
  })
  await chart.render()
  const io = IntersectionObserver.instances.at(-1)
  const cells = () =>
    Array.from(el.querySelectorAll('.apexcharts-trellis-cell'))
  io.trigger([cells()[0]])
  await until(() => chart.trellis.chrome.gradientLegend, 'strip built')
  io.trigger(cells())
  await until(() => chart.getPanels().every((p) => p.chart), 'all mounted')
  return chart
}

describe('trellis: the shared gradient strip hears late-mounted panels', () => {
  it('hovering a panel mounted after the strip moves the arrow', async () => {
    const chart = await mountFirstThenRest()
    const arrow = chart.trellis.chrome.gradientLegend.arrowEl
    arrow.setAttribute('opacity', '0')
    hoverCell(chart.getPanel('d'))
    expect(arrow.getAttribute('opacity')).not.toBe('0')
    chart.destroy()
  })

  it('tearing the strip down drops its panelMounted hook from the host', async () => {
    const chart = await mountFirstThenRest()
    const hostMounted = () => chart.w.globals.events.panelMounted || []
    expect(hostMounted().length).toBe(1)
    chart.trellis.chrome.destroyGradientLegend()
    expect(hostMounted().length).toBe(0)
    chart.destroy()
  })
})
