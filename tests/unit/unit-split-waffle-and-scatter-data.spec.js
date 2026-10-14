import { afterEach, describe, expect, it, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import '../../src/entries/unit.js'
import ApexCharts from '../../src/entries/standard.js'

// What users saw on unit charts that read their data wrong:
// - a small-multiple waffle filled each tile from a maxUnits-clipped,
//   rounded count, so 6000 of 10000 drew 29% and 0.35 of 1 drew a full tile;
// - maxUnits did nothing on a scatter, while a split waffle (fixed cells per
//   tile) warned about it on every render;
// - a scatter drew a missing value as a fake point at the axis minimum and
//   put '80' there too;
// - spread:'jitter' on sorted data drew diagonal stripes.

let chart

async function mount(o) {
  document.body.innerHTML = '<div id="chart"></div>'
  o.chart = { type: 'unit', width: 600, height: 400, animations: { enabled: false } }
  chart = new ApexCharts(document.querySelector('#chart'), o)
  await chart.render()
  return chart
}

const groups = () => [
  ...chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit .apexcharts-series'),
]
const units = (g) => [...g.querySelectorAll('.apexcharts-unit-area')]

afterEach(() => {
  chart?.destroy()
  chart = null
  vi.restoreAllMocks()
})

describe('small-multiple waffle', () => {
  const split = (series, grid) =>
    mount({
      series,
      labels: series.map((_, i) => `S${i}`),
      plotOptions: { unit: { layout: 'grid', grid: { split: true, total: 100, ...grid } } },
    })

  it('fills each tile from value / grid.max, uncapped by maxUnits', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await split([6000, 3000, 1500], { max: 10000 })
    expect(groups().map((g) => units(g).length)).toEqual([60, 30, 15])
    expect(warn.mock.calls.some((a) => String(a[0]).includes('maxUnits'))).toBe(false)
  })

  it('fills fractional values instead of rounding each up to a whole unit', async () => {
    await split([0.35, 0.6], { max: 1 })
    expect(groups().map((g) => units(g).length)).toEqual([35, 60])
    const label = chart.w.dom.baseEl.querySelector('.apexcharts-unit-label')
    expect(label.textContent).toContain('35.0%')
  })

  it('lets the largest value fill its tile when grid.max is not set', async () => {
    await split([0.5, 0.25], {})
    expect(groups().map((g) => units(g).length)).toEqual([100, 50])
  })
})

describe('maxUnits', () => {
  it('caps a scatter to an even sample of each category, keeping datum indices', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const data = Array.from({ length: 40 }, (_, k) => k)
    await mount({
      series: [{ name: 'A', data }],
      plotOptions: { unit: { layout: 'scatter', maxUnits: 10 } },
    })
    const js = units(groups()[0]).map((d) => +d.getAttribute('j'))
    expect(js.length).toBe(10)
    // Spread across the data, not the first ten datums.
    expect(Math.max(...js)).toBeGreaterThan(30)
    expect(warn.mock.calls.filter((a) => String(a[0]).includes('maxUnits')).length).toBe(1)
  })

  it('warns once per chart, not on every update', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await mount({ series: [30, 30], labels: ['A', 'B'], plotOptions: { unit: { maxUnits: 10 } } })
    await chart.updateSeries([40, 40])
    expect(warn.mock.calls.filter((a) => String(a[0]).includes('maxUnits')).length).toBe(1)
  })
})

describe('scatter values', () => {
  it('drops a datum with no numeric value and reads numeric strings', async () => {
    await mount({
      series: [
        {
          name: 'A',
          data: [
            { name: 'a', value: 0 },
            { name: 'b', value: null },
            { name: 'c', value: '80' },
            { name: 'd', value: 100 },
          ],
        },
      ],
      plotOptions: { unit: { layout: 'scatter' } },
    })
    const ds = units(groups()[0])
    expect(ds.map((d) => d.getAttribute('j'))).toEqual(['0', '2', '3'])
    const xs = ds.map((d) => +d.getAttribute('cx'))
    // '80' sits most of the way from 0 to 100, not on the axis minimum.
    expect((xs[1] - xs[0]) / (xs[2] - xs[0])).toBeCloseTo(0.8, 2)
  })

  it('drops a 2D point without a numeric x or y', async () => {
    await mount({
      series: [{ name: 'A', data: [{ x: 1, y: 1 }, { x: null, y: 2 }, { x: '3', y: 3 }] }],
      plotOptions: { unit: { layout: 'scatter', scatter: { y: 'value' } } },
    })
    expect(units(groups()[0]).map((d) => d.getAttribute('j'))).toEqual(['0', '2'])
  })

  it.each(['horizontal', 'vertical'])(
    "spread:'jitter' on sorted data is not a sawtooth (%s)",
    async (orientation) => {
      const data = Array.from({ length: 20 }, (_, k) => 10 + k * 4)
      await mount({
        series: [{ name: 'A', data }, { name: 'B', data: [50] }],
        plotOptions: { unit: { layout: 'scatter', scatter: { spread: 'jitter', orientation } } },
      })
      const axis = orientation === 'vertical' ? 'cx' : 'cy'
      const off = units(groups()[0]).map((d) => +d.getAttribute(axis))
      const steps = off.slice(1).map((v, k) => Math.sign(v - off[k]))
      // A linear index hash rises on almost every step; a real hash does not.
      expect(steps.filter((s) => s > 0).length).toBeLessThan(15)
      expect(steps.filter((s) => s < 0).length).toBeGreaterThan(4)
    },
  )
})
