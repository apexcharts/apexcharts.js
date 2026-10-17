/**
 * The trellis colour map hard-coded palette1: `theme.palette` and the dark
 * mode palette were ignored, monochrome panels disagreed with the shared
 * legend, and function entries in `colors` were filtered out, shifting
 * every later colour onto the wrong series.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/trellis.js'
import { getThemePalettes } from '../../src/utils/ThemePalettes.js'

beforeAll(() => {
  Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
    writable: true,
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  })
})
beforeEach(() => {
  document.body.innerHTML = ''
  if (typeof Apex !== 'undefined') Apex._chartInstances = []
})

const series = () =>
  ['p', 'q'].flatMap((k) =>
    ['A', 'B', 'C'].map((name, i) => ({ name, k, data: [i + 1, i + 2] })),
  )

/** @param {Record<string, any>} extra */
const mount = async (extra) => {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const chart = new ApexCharts(el, {
    chart: { type: 'line', height: 300, animations: { enabled: false } },
    trellis: { by: 'k', virtualize: false },
    xaxis: { categories: ['a', 'b'] },
    series: series(),
    ...extra,
  })
  await chart.render()
  return chart
}

/** CSS-normalised colour, as jsdom stores it in style.background. */
const css = (c) => {
  const d = document.createElement('div')
  d.style.background = c
  return d.style.background
}
/** @param {any} chart */
const legend = (chart) =>
  Array.from(
    chart.el.querySelectorAll('.apexcharts-trellis-legend-item'),
  ).map((i) => i.firstChild.style.background)

describe('trellis: the colour map follows the theme', () => {
  it('theme.palette colours the panels and the legend', async () => {
    const p3 = getThemePalettes().palette3
    const chart = await mount({ theme: { palette: 'palette3' } })
    expect(chart.trellis.panels[0].chart.w.globals.colors.slice(0, 3)).toEqual(p3.slice(0, 3))
    expect(legend(chart)).toEqual(p3.slice(0, 3).map(css))
    chart.destroy()
  })

  it('dark mode uses its own default palette', async () => {
    const p4 = getThemePalettes().palette4
    const chart = await mount({ theme: { mode: 'dark' } })
    expect(chart.trellis.panels[1].chart.w.globals.colors.slice(0, 3)).toEqual(p4.slice(0, 3))
    chart.destroy()
  })

  it('a function entry in colors keeps its place', async () => {
    const fn = () => '#00ff00'
    const chart = await mount({ colors: ['#111111', fn, '#333333'] })
    const cols = chart.trellis.panels[0].chart.w.config.colors
    expect(cols[0]).toBe('#111111')
    expect(typeof cols[1]).toBe('function')
    expect(cols[2]).toBe('#333333')
    expect(legend(chart)[2]).toBe(css('#333333'))
    // the legend shows the colour the panel's function paints, not a
    // palette colour no panel shows
    expect(legend(chart)[1]).toBe(css('#00ff00'))
    const fill = chart.trellis.panels[0].chart.el
      .querySelectorAll('.apexcharts-series')[1]
      .querySelector('path')
      .getAttribute('stroke')
    expect(fill).toMatch(/^rgba\(0,255,0/)
    // and an update still hands the panel the function, not a resolved colour
    await chart.updateSeries(series())
    expect(typeof chart.trellis.panels[0].chart.w.config.colors[1]).toBe('function')
    chart.destroy()
  })

  it('monochrome: the legend shows the shades the panels paint', async () => {
    const chart = await mount({ theme: { monochrome: { enabled: true, color: '#255aee' } } })
    const painted = chart.trellis.panels[0].chart.w.globals.colors.slice(0, 3)
    expect(legend(chart)).toEqual(painted.map(css))
    chart.destroy()
  })
})
