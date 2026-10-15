import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// A nested treemap's branch tooltip disagreed with the chart: names with a
// space or punctuation read "NorthxAmerica" and "RxD", a branch with its own
// y showed one total in its header and another in its tooltip, a zoomed
// branch reported "% of parent" equal to "% of total", and a per-series
// tooltip.y.formatter formatted every branch as series 0, point 0.

const NESTED = () => [
  {
    data: [
      {
        x: 'Tech',
        children: [
          { x: 'Software', children: [{ x: 'MSFT', y: 300 }, { x: 'ORCL', y: 120 }] },
          { x: 'Hardware', children: [{ x: 'AAPL', y: 280 }, { x: 'DELL', y: 60 }] },
        ],
      },
      { x: 'Energy', children: [{ x: 'Oil', children: [{ x: 'XOM', y: 200 }, { x: 'CVX', y: 150 }] }] },
    ],
  },
]

const treemap = (series, extra = {}, treemapOpts = {}) =>
  createChartWithOptions({
    chart: { type: 'treemap', height: 500, width: 800 },
    series,
    plotOptions: { treemap: treemapOpts },
    ...extra,
  })

const groupOf = (c, name) =>
  [...c.el.querySelectorAll('.apexcharts-treemap-parent')].find((g) =>
    (g.querySelector('.apexcharts-treemap-parent-label')?.textContent || '').trim().startsWith(name),
  )

const hover = (c, name) =>
  groupOf(c, name)
    .querySelector('.apexcharts-treemap-parent-header')
    .dispatchEvent(new window.MouseEvent('mouseenter', { clientX: 10, clientY: 10 }))

const tip = () => document.querySelector('.apexcharts-treemap-tooltip')

const findNode = (c, name) => {
  let found = null
  const walk = (n) => {
    if (n.name === name) found = n
    else (n.children || []).forEach(walk)
  }
  c.w.globals.treemapRoots.forEach(walk)
  return found
}

describe('treemap branch tooltip values', () => {
  it('shows branch names as written', () => {
    const c = treemap([
      {
        data: [
          { x: 'North America', children: [{ x: 'a', y: 10 }, { x: 'b', y: 5 }] },
          { x: 'R&D', children: [{ x: 'c', y: 8 }] },
        ],
      },
    ])
    hover(c, 'North America')
    expect(tip().textContent).toContain('North America:')
    hover(c, 'R&D')
    expect(tip().textContent).toContain('R&D:')
    expect(groupOf(c, 'R&D').getAttribute('data:name')).toBe('R&D')
  })

  it('escapes markup in a branch name instead of rendering it', () => {
    const c = treemap([
      {
        data: [
          { x: 'a<b & c', children: [{ x: 'a', y: 10 }] },
          { x: 'd', children: [{ x: 'e', y: 10 }] },
        ],
      },
    ])
    hover(c, 'a<b & c')
    expect(tip().textContent).toContain('a<b & c: ')
    expect(tip().querySelector('b')).toBeNull()
    expect(groupOf(c, 'a<b & c').getAttribute('data:name')).toBe('a<b & c')
  })

  it('prints the same branch total in the header and the tooltip', () => {
    const c = treemap(
      [
        {
          data: [
            { x: 'G1', y: 100, children: [{ x: 'a', y: 60 }, { x: 'b', y: 80 }] },
            { x: 'G2', children: [{ x: 'c', y: 50 }] },
          ],
        },
      ],
      {},
      { parents: { header: { showValue: true } } },
    )
    const header = groupOf(c, 'G1').querySelector('.apexcharts-treemap-parent-label').textContent
    expect(header).toMatch(/140$/)
    hover(c, 'G1')
    expect(tip().querySelector('.apexcharts-tooltip-text-y-value').textContent).toBe('140')
  })

  it('reports a zoomed branch as a share of its parent', async () => {
    const seen = []
    const c = treemap(NESTED(), {}, {
      zoom: { enabled: true },
      parents: { tooltip: { formatter: (o) => (seen.push(o), 'x') } },
    })
    c.w.globals.treemapFocusKey = findNode(c, 'Software')._key
    await c.update()
    hover(c, 'Software')
    const o = seen.at(-1)
    expect(o.percentOfTotal).toBeCloseTo((420 / 1110) * 100, 1)
    expect(o.percentOfParent).toBeCloseTo((420 / 760) * 100, 1)
  })

  it('formats a branch total with its own series and no data point', () => {
    const calls = []
    const c = treemap(
      [
        { name: 'S1', data: [{ x: 'A', children: [{ x: 'a1', y: 10 }, { x: 'a2', y: 4 }] }] },
        { name: 'S2', data: [{ x: 'B', children: [{ x: 'b1', y: 20 }, { x: 'b2', y: 3 }] }] },
      ],
      { tooltip: { y: { formatter: (v, o) => (calls.push([v, o]), String(v)) } } },
    )
    calls.length = 0
    hover(c, 'B')
    const [v, o] = calls.at(-1)
    expect(v).toBe(23)
    expect(o.seriesIndex).toBe(1)
    expect(o.dataPointIndex).toBe(-1)
  })
})
