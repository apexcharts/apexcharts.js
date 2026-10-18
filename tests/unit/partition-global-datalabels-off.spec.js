// `dataLabels: { enabled: false }` turns labels off on every other type, but
// the sunburst and the icicle read only their plotOptions dataLabels.show and
// kept drawing their labels.
import { describe, it, expect, afterEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/full.js'
import '../../src/entries/icicle.js'

const TREE = [
  {
    data: [
      { x: 'Europe', children: [{ x: 'France', y: 30 }, { x: 'Spain', y: 20 }] },
      { x: 'Asia', y: 25 },
    ],
  },
]
const labels = () =>
  document.querySelectorAll('.apexcharts-sunburst-labels textPath').length

async function mount(o = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  const c = new ApexCharts(document.querySelector('#chart'), {
    series: TREE,
    ...o,
    chart: {
      type: 'sunburst',
      width: 500,
      height: 400,
      animations: { enabled: false },
      ...o.chart,
    },
  })
  await c.render()
  return c
}

describe('sunburst and the global dataLabels.enabled', () => {
  let chart
  afterEach(() => chart?.destroy())

  it('draws labels by default', async () => {
    chart = await mount()
    expect(labels()).toBeGreaterThan(0)
  })

  it('draws none with dataLabels.enabled false, and again once re-enabled', async () => {
    chart = await mount({ dataLabels: { enabled: false } })
    expect(labels()).toBe(0)
    await chart.updateOptions({ dataLabels: { enabled: true } })
    expect(labels()).toBeGreaterThan(0)
  })

  it('a type whose default turns labels off hands the sunburst its own', async () => {
    chart = await mount({
      chart: { type: 'polarArea' },
      series: [30, 20, 25],
      labels: ['France', 'Spain', 'Asia'],
    })
    await chart.updateOptions({ chart: { type: 'sunburst' }, series: TREE })
    expect(labels()).toBeGreaterThan(0)
  })
})

describe('icicle and the global dataLabels.enabled', () => {
  let chart
  afterEach(() => chart?.destroy())
  const icicleLabels = () =>
    document.querySelectorAll('.apexcharts-icicle-labels text').length

  it('draws labels by default, none with enabled false, and again once re-enabled', async () => {
    chart = await mount({ chart: { type: 'icicle' } })
    expect(icicleLabels()).toBeGreaterThan(0)
    await chart.updateOptions({ dataLabels: { enabled: false } })
    expect(icicleLabels()).toBe(0)
    await chart.updateOptions({ dataLabels: { enabled: true } })
    expect(icicleLabels()).toBeGreaterThan(0)
  })
})
