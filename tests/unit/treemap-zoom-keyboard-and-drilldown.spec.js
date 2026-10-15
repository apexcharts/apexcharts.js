import { describe, it, expect, vi } from 'vitest'
import '../../src/features/drilldown.js'
import { createChartWithOptions } from './utils/utils.js'

// Treemap click-to-zoom misbehaved around the keyboard and drilldown:
// - branch headers stayed tab stops with accessibility or keyboard off;
// - the focused branch was announced "Zoom in", collapsed, although Enter
//   zooms it out, and zooming out (or activating a breadcrumb) dropped focus
//   to the first group or to the page body;
// - with drilldown.onDrillDown, or drilldown merely enabled, zoom stayed live
//   but drilldown wiped its breadcrumb, leaving no way back out;
// - the zoom-vs-drilldown warning repeated on every render;
// - a focused branch whose leaves an update zeroed rendered an empty plot.

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

const treemap = (extra = {}, chart = {}) =>
  createChartWithOptions({
    chart: { type: 'treemap', height: 500, width: 800, ...chart },
    series: NESTED(),
    plotOptions: { treemap: { zoom: { enabled: true } } },
    ...extra,
  })

const leaves = (c) => c.el.querySelectorAll('.apexcharts-treemap-rect').length
const tabStops = (c) => c.el.querySelectorAll('.apexcharts-treemap-parent-header[tabindex]').length
const headerFor = (c, name) =>
  [...c.el.querySelectorAll('.apexcharts-treemap-parent-header[tabindex]')].find((h) =>
    h.getAttribute('aria-label').startsWith(name),
  )
const enter = (el) => el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
const tick = () => new Promise((r) => setTimeout(r, 60))
const keyOf = (c, name) => {
  let key = null
  const walk = (n) => {
    if (n.name === name) key = n._key
    else (n.children || []).forEach(walk)
  }
  c.w.globals.treemapRoots.forEach(walk)
  return key
}

describe('treemap zoom: keyboard', () => {
  it.each([
    ['accessibility', { accessibility: { enabled: false } }],
    ['keyboard', { accessibility: { keyboard: { enabled: false } } }],
  ])('makes no tab stops with %s off', (_n, chart) => {
    expect(tabStops(treemap())).toBeGreaterThan(0)
    expect(tabStops(treemap({}, chart))).toBe(0)
  })

  it('announces the focused branch as zoom out, expanded', async () => {
    const c = treemap()
    expect(headerFor(c, 'Energy').getAttribute('aria-expanded')).toBe('false')
    enter(headerFor(c, 'Energy'))
    await tick()
    const h = headerFor(c, 'Energy')
    expect(h.getAttribute('aria-label')).toMatch(/Zoom out$/)
    expect(h.getAttribute('aria-expanded')).toBe('true')
  })

  it('returns focus to the branch that was closed', async () => {
    const c = treemap()
    enter(headerFor(c, 'Energy'))
    await tick()
    enter(headerFor(c, 'Energy'))
    await tick()
    expect(c.w.globals.treemapFocusKey).toBeNull()
    expect(document.activeElement.getAttribute('aria-label')).toMatch(/^Energy/)
  })

  it('keeps focus in the chart when a breadcrumb is activated', async () => {
    const c = treemap()
    c.w.globals.treemapFocusKey = keyOf(c, 'Tech')
    await c.update()
    const btn = c.el.querySelector('.apexcharts-breadcrumb button.apexcharts-breadcrumb-item')
    btn.focus()
    btn.click() // Enter or Space on a button: a click with detail 0
    await tick()
    expect(c.w.globals.treemapFocusKey).toBeNull()
    expect(document.activeElement.getAttribute('aria-label')).toMatch(/^Tech/)
  })
})

describe('treemap zoom: state', () => {
  it('falls back to the whole tree when the focused branch empties', async () => {
    const c = treemap()
    c.w.globals.treemapFocusKey = keyOf(c, 'Energy')
    await c.update()
    expect(leaves(c)).toBe(2)
    const s = NESTED()
    s[0].data[1].children[0].children.forEach((l) => (l.y = 0))
    await c.updateSeries(s, false)
    expect(c.w.globals.treemapFocusKey).toBeNull()
    const sized = [...c.el.querySelectorAll('.apexcharts-treemap-rect')].filter(
      (r) => parseFloat(r.getAttribute('width')) > 0,
    )
    expect(sized.length).toBeGreaterThan(0)
  })
})

describe('treemap zoom beside drilldown', () => {
  it('stands down for an onDrillDown resolver', async () => {
    const c = treemap({ drilldown: { enabled: true, onDrillDown: () => null } })
    expect(tabStops(c)).toBe(0)
    c.w.globals.treemapFocusKey = keyOf(c, 'Tech')
    await c.update()
    expect(leaves(c)).toBe(6)
  })

  it('keeps its breadcrumb when drilldown is enabled with nothing to drill', async () => {
    const c = treemap({ drilldown: { enabled: true } })
    c.w.globals.treemapFocusKey = keyOf(c, 'Tech')
    await c.update()
    expect(leaves(c)).toBe(4)
    expect(c.el.querySelector('.apexcharts-breadcrumb').textContent).toContain('Tech')
  })

  it('warns about the conflict once, not on every render', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const c = treemap({ drilldown: { enabled: true, series: [{ id: 'x', data: [{ x: 'q', y: 1 }] }] } })
    await c.update()
    await c.update()
    const n = warn.mock.calls.filter((a) => String(a[0]).includes('zoom is ignored')).length
    warn.mockRestore()
    expect(n).toBe(1)
  })
})
