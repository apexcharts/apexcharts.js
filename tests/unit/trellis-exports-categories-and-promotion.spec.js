/**
 * Trellis composed export.
 *
 * - The grid CSV names each row of a plain-array (positional) trellis by its
 *   category label, as the axis shows it, not by its 0-based position.
 * - Exporting while a panel is promoted exports what is on screen: the
 *   promoted panel alone. Parked cells are display:none, so their rects
 *   collapse to the wrap origin; composing them stacked every hidden panel
 *   and its header there.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/trellis.js'

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

async function render(options) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const chart = new ApexCharts(el, {
    chart: { type: 'bar', height: 300, animations: { enabled: false } },
    trellis: { by: 'region' },
    ...options,
  })
  await chart.render()
  return chart
}

const plainSeries = [
  { name: 'Revenue', region: 'North', data: [1, 2, 3] },
  { name: 'Revenue', region: 'South', data: [4, 5, 6] },
]

describe('grid CSV x column for plain-array series', () => {
  it('writes xaxis.categories, not positions', async () => {
    const chart = await render({
      series: plainSeries,
      xaxis: { categories: ['Jan', 'Feb', 'Mar'] },
    })
    const lines = chart.trellis.exports.csv().split('\n')
    expect(lines[0]).toBe('x,facet,Revenue')
    expect(lines.slice(1)).toEqual([
      'Jan,North,1',
      'Feb,North,2',
      'Mar,North,3',
      'Jan,South,4',
      'Feb,South,5',
      'Mar,South,6',
    ])
    chart.destroy()
  })

  it('joins a multi-line category with a space, as a plain chart does', async () => {
    const chart = await render({
      series: plainSeries,
      xaxis: { categories: [['Jan', '2024'], 'Feb', 'Mar'] },
    })
    expect(chart.trellis.exports.csv().split('\n')[1]).toBe('Jan 2024,North,1')
    chart.destroy()
  })

  it('falls back to labels, then to the 1-based index the axis shows', async () => {
    const withLabels = await render({
      series: plainSeries,
      labels: ['Q1', 'Q2', 'Q3'],
    })
    expect(withLabels.trellis.exports.csv().split('\n')[1]).toBe('Q1,North,1')
    withLabels.destroy()

    const bare = await render({ series: plainSeries })
    const rows = bare.trellis.exports.csv().split('\n').slice(1, 4)
    expect(rows.map((r) => r.split(',')[0])).toEqual(['1', '2', '3'])
    bare.destroy()
  })

  it('keyed data keeps its own x', async () => {
    const chart = await render({
      series: [
        { name: 'Revenue', region: 'North', data: [{ x: 'A', y: 1 }] },
        { name: 'Revenue', region: 'South', data: [{ x: 'B', y: 2 }] },
      ],
      xaxis: { categories: ['ignored'] },
    })
    const rows = chart.trellis.exports.csv().split('\n').slice(1)
    expect(rows).toEqual(['A,North,1', 'B,North,', 'A,South,', 'B,South,2'])
    chart.destroy()
  })
})

describe('export while a panel is promoted', () => {
  async function promoted() {
    const chart = await render({
      chart: { type: 'line', height: 300, animations: { enabled: false } },
      series: [
        { name: 'Revenue', region: 'North', data: [1, 2, 3] },
        { name: 'Revenue', region: 'South', data: [4, 5, 6] },
        { name: 'Revenue', region: 'East', data: [7, 8, 9] },
      ],
    })
    // jsdom cannot serialize a panel; stub each panel's own export path
    // with a marker naming the panel.
    chart.getPanels().forEach((p) => {
      p.chart.getSvgString = async () => `<svg id="panel-${p.key}"/>`
    })
    await chart.promotePanel('South')
    return chart
  }

  it('the SVG composes the promoted panel and its header only', async () => {
    const chart = await promoted()
    const svg = await chart.trellis.exports.svgString()
    expect(svg).toContain('panel-South')
    expect(svg).not.toContain('panel-North')
    expect(svg).not.toContain('panel-East')
    const texts = chart.trellis.exports._chromeTexts().map((t) => t.text)
    expect(texts).toContain('South')
    expect(texts).not.toContain('North')
    expect(texts).not.toContain('East')

    // Restoring brings every panel back into the export.
    await chart.restorePanels()
    const all = await chart.trellis.exports.svgString()
    expect(all).toContain('panel-North')
    expect(all).toContain('panel-South')
    expect(all).toContain('panel-East')
    chart.destroy()
  })
})
