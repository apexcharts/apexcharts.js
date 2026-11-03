import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/trellis.js'

/**
 * A trellis host rebuilds its panels from its merged options on every
 * updateOptions, and never runs updateThemeOptions, which is what puts a
 * single chart's foreColor on the new mode's default. Panels count a
 * foreColor in those options as the page's (theme-explicit-forecolor.spec.js),
 * so a built-in default the page stated for the old mode would outlive a
 * mode-only update: near-white labels on a white paper. v8.7.0 swapped it,
 * and that is what these pin, along with a custom colour staying put.
 */

const LIGHT = '#373d3f'
const DARK = '#f6f7f8'

beforeAll(() => {
  Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
    writable: true,
    value: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  })
})

beforeEach(() => {
  document.body.innerHTML = ''
  if (typeof Apex !== 'undefined') Apex._chartInstances = []
})

const mk = (k) =>
  Array.from({ length: 4 }, (_, i) => ({ x: 'c' + i, y: i * 3 + k }))

/** @param {Record<string, any>} [opts] */
async function host(opts = {}) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const chart = new ApexCharts(el, {
    ...opts,
    chart: { type: 'line', animations: { enabled: false }, ...opts.chart },
    series: [
      { name: 'U', region: 'North', data: mk(1) },
      { name: 'U', region: 'South', data: mk(2) },
    ],
    trellis: { by: 'region', columns: 2 },
  })
  await chart.render()
  return chart
}

/** The foreColor every panel reports and draws its x-axis labels in. */
function panelFores(chart) {
  const panels = chart.getPanels().filter((p) => p.chart)
  expect(panels.length).toBe(2)
  return [
    ...new Set(
      panels.flatMap((p) => [
        p.chart.w.config.chart.foreColor,
        ...Array.from(p.el.querySelectorAll('.apexcharts-xaxis-label'), (l) =>
          l.getAttribute('fill'),
        ),
      ]),
    ),
  ]
}

describe('trellis host: mode-only updateOptions and a stated foreColor', () => {
  it.each([
    ['dark', DARK, 'light', LIGHT],
    ['light', LIGHT, 'dark', DARK],
  ])(
    '%s mode with its default %s stated, then %s: panels take %s',
    async (from, fore, to, expected) => {
      const chart = await host({
        theme: { mode: from },
        chart: { foreColor: fore },
      })
      expect(panelFores(chart)).toEqual([fore])
      await chart.updateOptions({ theme: { mode: to } })
      expect(panelFores(chart)).toEqual([expected])
      chart.destroy()
    },
  )

  it('a payload naming both the mode and the foreColor keeps that foreColor', async () => {
    const chart = await host({
      theme: { mode: 'dark' },
      chart: { foreColor: DARK },
    })
    await chart.updateOptions({
      theme: { mode: 'light' },
      chart: { foreColor: DARK },
    })
    expect(panelFores(chart)).toEqual([DARK])
    chart.destroy()
  })

  it('a custom foreColor stays through a mode-only update, as in v8.7.0', async () => {
    const chart = await host({
      theme: { mode: 'dark' },
      chart: { foreColor: '#ff0000' },
    })
    await chart.updateOptions({ theme: { mode: 'light' } })
    expect(panelFores(chart)).toEqual(['#ff0000'])
    chart.destroy()
  })

  it.each([
    ['dark', 'light', LIGHT],
    ['light', 'dark', DARK],
  ])(
    'no foreColor: %s then %s gives %s (unchanged)',
    async (from, to, expected) => {
      const chart = await host({ theme: { mode: from } })
      await chart.updateOptions({ theme: { mode: to } })
      expect(panelFores(chart)).toEqual([expected])
      chart.destroy()
    },
  )

  it('an update that does not set the mode leaves a stated default alone', async () => {
    const chart = await host({
      theme: { mode: 'dark' },
      chart: { foreColor: DARK },
    })
    await chart.updateOptions({ theme: { palette: 'palette2' } })
    expect(panelFores(chart)).toEqual([DARK])
    chart.destroy()
  })

  it('does not touch the options object the page passed', async () => {
    const chartOpts = { type: 'line', foreColor: DARK }
    const el = document.createElement('div')
    document.body.appendChild(el)
    const chart = new ApexCharts(el, {
      theme: { mode: 'dark' },
      chart: chartOpts,
      series: [
        { name: 'U', region: 'North', data: mk(1) },
        { name: 'U', region: 'South', data: mk(2) },
      ],
      trellis: { by: 'region', columns: 2 },
    })
    await chart.render()
    await chart.updateOptions({ theme: { mode: 'light' } })
    expect(chartOpts.foreColor).toBe(DARK)
    chart.destroy()
  })
})
