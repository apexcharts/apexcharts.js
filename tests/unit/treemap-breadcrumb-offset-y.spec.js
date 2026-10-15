// plotOptions.treemap.zoom.breadcrumb.offsetY moved an icicle's breadcrumb
// but not a treemap's: the treemap placed its strip with a private copy of the
// shared band placement that never added the offset.
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

const NESTED = () => [
  {
    data: [
      { x: 'Tech', children: [{ x: 'MSFT', y: 300 }, { x: 'AAPL', y: 280 }] },
      { x: 'Energy', children: [{ x: 'XOM', y: 200 }, { x: 'CVX', y: 150 }] },
    ],
  },
]

async function navTop(breadcrumb) {
  const c = createChartWithOptions({
    chart: { type: 'treemap', width: 600, height: 400, animations: { enabled: false } },
    series: NESTED(),
    plotOptions: { treemap: { zoom: { enabled: true, breadcrumb } } },
  })
  let key = null
  c.w.globals.treemapRoots.forEach((r) =>
    (r.children || []).forEach((n) => {
      if (n.name === 'Tech') key = n._key
    }),
  )
  c.w.globals.treemapFocusKey = key
  await c.update()
  const nav = c.el.querySelector('.apexcharts-breadcrumb')
  expect(nav).toBeTruthy()
  return parseFloat(nav.style.top)
}

describe('treemap breadcrumb offsetY', () => {
  it('moves the strip by offsetY, as on icicle', async () => {
    const base = await navTop({})
    expect(await navTop({ offsetY: 6 })).toBe(base + 6)
    expect(await navTop({ offsetY: -4 })).toBe(base - 4)
  })
})
