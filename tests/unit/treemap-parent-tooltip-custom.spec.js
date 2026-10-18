import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// A nested treemap's branch (parent) tooltip ignored tooltip.custom, which the
// leaves, the sunburst and the icicle all honour. It now calls it the way the
// partition charts do: with the branch as `node`, dataPointIndex -1, and a
// null/undefined/false return keeping the built-in rows. The more specific
// plotOptions.treemap.parents.tooltip.formatter still owns branch tooltips
// when it is set.

const NESTED = () => [
  {
    data: [
      { x: 'Tech', children: [{ x: 'MSFT', y: 300 }, { x: 'ORCL', y: 100 }] },
      { x: 'Energy', children: [{ x: 'XOM', y: 400 }, { x: 'CVX', y: 200 }] },
    ],
  },
]

const treemap = (tooltip, treemapOpts = {}, series = NESTED()) =>
  createChartWithOptions({
    chart: { type: 'treemap', height: 500, width: 800 },
    series,
    tooltip,
    plotOptions: { treemap: treemapOpts },
  })

const hover = (c, name) =>
  [...c.el.querySelectorAll('.apexcharts-treemap-parent')]
    .find((g) => g.getAttribute('data:name') === name)
    .querySelector('.apexcharts-treemap-parent-header')
    .dispatchEvent(new window.MouseEvent('mouseenter', { clientX: 10, clientY: 10 }))

const tip = () => document.querySelector('.apexcharts-treemap-tooltip')

describe('treemap branch tooltip honours tooltip.custom', () => {
  it('renders the markup custom returns, handed the branch', () => {
    const seen = []
    const c = treemap({
      custom: (o) => {
        seen.push(o)
        return `<b class="mine">${o.node.name} ${o.value} ${o.percentOfParent}</b>`
      },
    })
    hover(c, 'Energy')
    expect(tip().querySelector('b.mine').textContent).toBe('Energy 600 60')
    const o = seen[seen.length - 1]
    expect(o.seriesIndex).toBe(0)
    expect(o.dataPointIndex).toBe(-1)
    expect(o.percentOfTotal).toBe(60)
    expect(o.w).toBe(c.w)
    expect(o.ctx).toBe(c)
    expect(o.series).toBe(c.w.seriesData.series)
    expect(o.node.children.length).toBe(2)
  })

  it('clones an Element custom returns', () => {
    const el = document.createElement('div')
    el.className = 'custom-el'
    el.textContent = 'branch'
    const c = treemap({ custom: () => el })
    hover(c, 'Tech')
    const shown = tip().querySelector('.custom-el')
    expect(shown.textContent).toBe('branch')
    expect(shown).not.toBe(el)
  })

  it('keeps the built-in rows on a null, undefined or false return', () => {
    for (const custom of [
      () => null,
      () => undefined,
      () => false,
      // written for leaf rows, opting out on a branch the documented way
      ({ node, seriesIndex, dataPointIndex, w }) =>
        node ? null : w.config.series[seriesIndex].data[dataPointIndex].x,
    ]) {
      const c = treemap({ custom })
      hover(c, 'Tech')
      expect(tip().textContent).toContain('Tech:')
      expect(tip().textContent).toContain('2 items')
      expect(tip().textContent).not.toContain('false')
    }
  })

  it('uses the entry for the branch series in the array form', () => {
    const c = treemap(
      { custom: [() => '<i>first</i>', () => '<i>second</i>'] },
      {},
      [
        { name: 'A', data: [{ x: 'Tech', children: [{ x: 'MSFT', y: 300 }] }] },
        { name: 'B', data: [{ x: 'Energy', children: [{ x: 'XOM', y: 400 }] }] },
      ],
    )
    hover(c, 'Energy')
    expect(tip().textContent).toBe('second')
  })

  it('leaves branch tooltips to parents.tooltip.formatter when it is set', () => {
    let customCalls = 0
    const c = treemap(
      {
        custom: () => {
          customCalls++
          return '<i>custom</i>'
        },
      },
      { parents: { tooltip: { formatter: (o) => `<i>formatter ${o.name}</i>` } } },
    )
    hover(c, 'Tech')
    expect(tip().textContent).toBe('formatter Tech')
    expect(customCalls).toBe(0)
  })

  it('keeps the built-in rows when parents.tooltip.formatter returns nothing', () => {
    for (const formatter of [() => undefined, () => false]) {
      const c = treemap({}, { parents: { tooltip: { formatter } } })
      hover(c, 'Tech')
      expect(tip().textContent).toContain('Tech:')
      expect(tip().textContent).not.toContain('undefined')
    }
  })
})
