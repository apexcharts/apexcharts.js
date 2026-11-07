import fs from 'fs'
import path from 'path'
import { describe, it, expect, afterEach, vi } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/measure.js'
import Theme from '../../src/modules/Theme.js'
import { placeInReservedBand } from '../../src/charts/common/Breadcrumb.js'
import { igniteSheet } from './utils/ignite-ui-sheet.js'

// Plan 36, phase 1E (D3): `--apx-radius-factor` scales every fixed radius,
// the stylesheet's and the ones drawn in JS. It defaults to 1, where the
// output is what it was; 0 squares the corners.

const CSS = fs.readFileSync(
  path.resolve(__dirname, '../../src/assets/apexcharts.css'),
  'utf8',
)

/** @type {ReturnType<typeof igniteSheet> | null} */
let page = null

afterEach(() => {
  page?.restore()
  page = null
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

/**
 * @param {string | null} factor `--apx-radius-factor`, or null for unset
 * @param {Record<string, any>} [options]
 */
async function chartAt(factor, options = {}) {
  page = igniteSheet({
    apx: factor == null ? {} : { '--apx-radius-factor': factor },
  })
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    series: [{ name: 'A', data: [1, 2, 3, 4] }],
    xaxis: { type: 'numeric' },
    ...options,
    chart: {
      type: 'line',
      animations: { enabled: false },
      ...(options.chart || {}),
    },
  })
  await chart.render()
  return chart
}

describe('the factor (1E)', () => {
  it.each([
    [null, 1],
    ['1', 1],
    ['0.5', 0.5],
    ['0', 0],
    ['1.5', 1.5],
    ['-2', 0],
    ['abc', 1],
  ])('--apx-radius-factor %s reads as %s', async (factor, expected) => {
    const chart = await chartAt(factor)
    expect(chart.w.globals.radiusFactor).toBe(expected)
    chart.destroy()
  })

  it('is read with the other tokens, once a render', async () => {
    const chart = await chartAt('0.5')
    const reads = () =>
      page.reads.filter((n) => n === '--apx-radius-factor').length
    const before = reads()
    expect(before).toBe(1)
    await chart.refreshTokens()
    expect(reads()).toBe(before + 1)
    chart.destroy()
  })

  it('theme.tokens: false ignores it, in JS and in the stylesheet', async () => {
    const chart = await chartAt('0.5', { theme: { tokens: false } })
    expect(chart.w.globals.radiusFactor).toBe(1)
    const style = chart.w.dom.elWrap.style
    expect(style.getPropertyValue('--apx-radius-factor')).toBe('initial')
    chart.destroy()
  })

  it('writes no inline style while tokens are on', async () => {
    const chart = await chartAt('0.5')
    const style = chart.w.dom.elWrap.style
    expect(style.getPropertyValue('--apx-radius-factor')).toBe('')
    chart.destroy()
  })
})

describe('Theme.radius', () => {
  /** @param {number | undefined} f */
  const w = (f) => /** @type {any} */ ({ globals: { radiusFactor: f } })

  it('leaves every radius as it was at 1', () => {
    for (const px of [2, 3, 4, 5]) {
      expect(`${Theme.radius(w(1), px)}px`).toBe(`${px}px`)
      expect(String(Theme.radius(w(1), px))).toBe(String(px))
    }
  })

  it('squares at 0 and halves at 0.5', () => {
    expect(Theme.radius(w(0), 4)).toBe(0)
    expect(Theme.radius(w(0.5), 4)).toBe(2)
    expect(Theme.radius(w(0.5), 5)).toBe(2.5)
  })

  it('reads an unset factor as 1', () => {
    expect(Theme.radius(w(undefined), 3)).toBe(3)
  })
})

describe('the radii drawn in JS (1E)', () => {
  /** @param {any} chart */
  const strip = (chart) =>
    chart.el.querySelector('.apexcharts-heatmap-gradient-legend rect')

  it.each([
    [null, '2'],
    ['0', '0'],
    ['0.5', '1'],
  ])('heatmap gradient strip at %s: rx %s', async (factor, rx) => {
    const chart = await chartAt(factor, {
      chart: { type: 'heatmap', height: 320, width: 600 },
      series: [
        {
          name: 'A',
          data: [
            { x: '1', y: 10 },
            { x: '2', y: 60 },
          ],
        },
        {
          name: 'B',
          data: [
            { x: '1', y: 30 },
            { x: '2', y: 90 },
          ],
        },
      ],
      xaxis: {},
      legend: { show: true, position: 'bottom' },
      dataLabels: { enabled: false },
      plotOptions: {
        heatmap: { colorScale: { gradientLegend: { enabled: true } } },
      },
    })
    expect(strip(chart).getAttribute('rx')).toBe(rx)
    chart.destroy()
  })

  it.each([
    [null, '4'],
    ['0', '0'],
    ['0.5', '2'],
  ])('measure readout box at %s: rx %s', async (factor, rx) => {
    const chart = await chartAt(factor, {
      chart: { measure: { enabled: true } },
    })
    const m = chart.ctx.measure
    const g = m.graphics.group()
    m._readout(g, ['1'], 0, 0, 40, 20, '#16a34a')
    const box = g.node.querySelector('.apexcharts-measure-label-bg')
    expect(box.getAttribute('rx')).toBe(rx)
    chart.destroy()
  })

  it.each([
    [1, '4px'],
    [0, '0px'],
    [0.5, '2px'],
  ])('breadcrumb chip over the plot at %s: %s', (factor, radius) => {
    const nav = document.createElement('div')
    const w = /** @type {any} */ ({
      layout: { translateY: 0 },
      dom: { elWrap: null },
      globals: { radiusFactor: factor },
      config: { theme: { mode: 'light' } },
    })
    expect(placeInReservedBand(w, null, nav, {})).toBe(false)
    expect(nav.style.borderRadius).toBe(radius)
  })
})

describe('the stylesheet radii (1E)', () => {
  const css = CSS.replace(/\/\*[\s\S]*?\*\//g, '')

  it('scales all 20 fixed px radii, at 1 the same px', () => {
    const scaled = [
      ...css.matchAll(
        /border-radius: calc\((\d+)px \* var\(--apx-radius-factor, 1\)\)/g,
      ),
    ]
    expect(scaled.length).toBe(20)
    /** @type {Record<string, number>} */
    const byPx = {}
    for (const m of scaled) byPx[m[1]] = (byPx[m[1]] || 0) + 1
    // the radii before 1E: 3px x3, 4px x2, 5px x8, 6px x1, 8px x6
    expect(byPx).toEqual({ 3: 3, 4: 2, 5: 8, 6: 1, 8: 6 })
  })

  it('leaves no unscaled px radius, and the circles round', () => {
    expect(css).not.toMatch(/border-radius:\s*\d+px/)
    expect(css.match(/border-radius: 50%/g)?.length).toBe(4)
  })
})
