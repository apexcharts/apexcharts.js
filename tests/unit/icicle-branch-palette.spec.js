// Users saw a flame-graph-shaped icicle (all -> main -> frames) painted in a
// single hue, because the palette only moved below a root that branched
// directly, and with `sort: 'value'` or `'name'` the cells took their sorted
// position's colour while the legend kept the authored one.
import { describe, it, expect } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/icicle.js'

async function mount(o) {
  document.body.innerHTML = '<div id="chart"></div>'
  const c = new ApexCharts(document.querySelector('#chart'), {
    chart: { type: 'icicle', width: 600, height: 400, animations: { enabled: false } },
    ...o,
  })
  await c.render()
  return c
}
const fill = (name) =>
  [...document.querySelectorAll('.apexcharts-icicle-cell')]
    .find((el) => el.getAttribute('data:name') === name)
    .getAttribute('fill')
    .toLowerCase()

describe('icicle branch palette', () => {
  it('a single-child trunk hands the palette to the first level that branches', async () => {
    const c = await mount({
      series: [
        {
          data: [
            {
              x: 'all',
              children: [
                { x: 'main', children: [{ x: 'f1', y: 10 }, { x: 'f2', y: 20 }, { x: 'f3', y: 5 }] },
              ],
            },
          ],
        },
      ],
    })
    const colors = c.w.globals.colors.map((s) => String(s).toLowerCase())
    expect(['f1', 'f2', 'f3'].map(fill)).toEqual(colors.slice(0, 3))
    // The trunk is the pale container tone, not a palette slot.
    expect(colors).not.toContain(fill('all'))
    expect(fill('main')).toBe(fill('all'))
    c.destroy()
  })

  for (const sort of ['value', 'name']) {
    it(`sort:'${sort}' keeps each branch on its authored colour`, async () => {
      const c = await mount({
        legend: { show: true },
        series: [{ data: [{ x: 'B', y: 10 }, { x: 'A', y: 50 }] }],
        plotOptions: { icicle: { sort } },
      })
      const colors = c.w.globals.colors.map((s) => String(s).toLowerCase())
      expect(fill('B')).toBe(colors[0])
      expect(fill('A')).toBe(colors[1])
      c.destroy()
    })
  }
})
