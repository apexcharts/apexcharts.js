// A series name is data: the legend and the tooltip row label wrote it as
// HTML, so a name such as '<img src=x onerror=...>' became a live element.
// Names now show as text; markup a legend.formatter or tooltip title
// formatter adds is still written as the HTML those options document.
import { describe, it, expect } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import TooltipLabels from '../../src/modules/tooltip/Labels.js'

const EVIL = '<img src=x onerror="window.__pwned=1">'

async function mount(extra = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    chart: { type: 'line', height: 300, animations: { enabled: false } },
    series: [
      { name: EVIL, data: [1, 2] },
      { name: 'R&amp;D', data: [2, 3] },
    ],
    legend: { show: true, showForSingleSeries: true },
    ...extra,
  })
  await chart.render()
  return chart
}

const legendTexts = () => [
  ...document.querySelectorAll('.apexcharts-legend-text'),
]

describe('series names render as text', () => {
  it('the legend shows a name with markup as its literal text', async () => {
    const chart = await mount()
    const [a, b] = legendTexts()
    expect(a.querySelector('img')).toBeNull()
    expect(a.textContent).toBe(EVIL)
    expect(b.textContent).toBe('R&amp;D')
    chart.destroy()
  })

  it('markup a legend.formatter adds is still HTML', async () => {
    const chart = await mount({
      legend: { formatter: (name, o) => `<b>${o.seriesIndex}</b>` },
    })
    expect(legendTexts()[0].querySelector('b').textContent).toBe('0')
    chart.destroy()
  })

  it('a multi-line name is joined and shown as text', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'line', height: 300, animations: { enabled: false } },
      series: [
        { name: ['<i>a</i>', 'b'], data: [1, 2] },
        { name: 'c', data: [2, 3] },
      ],
    })
    await chart.render()
    const el = legendTexts()[0]
    expect(el.querySelector('i')).toBeNull()
    expect(el.textContent).toBe('<i>a</i> b')
    chart.destroy()
  })

  it('the tooltip row label escapes the name, keeps formatter markup', async () => {
    const chart = await mount()
    const labels = new TooltipLabels({ w: chart.w })
    const name = (fn) =>
      labels.getSeriesName({ fn, index: 0, seriesIndex: 0, j: 0 })
    // the default title formatter shape: name + ': '
    expect(name((s) => (s ? s + ': ' : ''))).toBe(
      '&lt;img src=x onerror="window.__pwned=1">: ',
    )
    // a formatter that hands the name back untouched
    expect(name((s) => s)).toBe('&lt;img src=x onerror="window.__pwned=1">')
    // markup a formatter adds stays markup
    expect(name(() => '<b>Sales</b>')).toBe('<b>Sales</b>')
    const amp = labels.getSeriesName({
      fn: (s) => s + ': ',
      index: 1,
      seriesIndex: 1,
      j: 0,
    })
    expect(amp).toBe('R&amp;amp;D: ')
    chart.destroy()
  })

  it('a legend hover keeps names text, also on reset', async () => {
    const chart = await mount({
      legend: {
        tooltipHoverFormatter: (n, o) => `${n} <b>${o.dataPointIndex}</b>`,
      },
    })
    const tt = chart.w.globals.tooltip
    tt.applyLegendHoverText(1, 0, false)
    expect(legendTexts()[0].querySelector('img')).toBeNull()
    expect(legendTexts()[0].textContent).toBe(EVIL)
    expect(legendTexts()[1].querySelector('b').textContent).toBe('0')
    tt.applyLegendHoverText(-1, 0, false)
    expect(legendTexts()[1].textContent).toBe('R&amp;D')
    chart.destroy()
  })

  it('a legend.formatter item keeps its markup after a hover reset', async () => {
    const chart = await mount({
      legend: {
        formatter: (n, o) => `<b>${o.seriesIndex}</b>`,
        tooltipHoverFormatter: (n) => n,
      },
    })
    const tt = chart.w.globals.tooltip
    tt.applyLegendHoverText(0, 0, false)
    tt.applyLegendHoverText(-1, 0, false)
    expect(legendTexts()[1].querySelector('b').textContent).toBe('1')
    chart.destroy()
  })

  it('the default rangeBar tooltip escapes the series name', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'rangeBar', height: 300, animations: { enabled: false } },
      series: [{ name: EVIL, data: [{ x: 'a', y: [1, 3] }] }],
    })
    await chart.render()
    const w = chart.w
    const html = w.config.tooltip.custom({
      ctx: chart,
      series: w.seriesData.series,
      seriesIndex: 0,
      dataPointIndex: 0,
      y1: 1,
      y2: 3,
      w,
    })
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
    chart.destroy()
  })

  it('category titles and the x-axis tooltip show a category as text', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'bar', height: 300, animations: { enabled: false } },
      series: [{ name: 's', data: [1, 2] }],
      xaxis: { categories: [EVIL, ['<i>a</i>', 'b']] },
    })
    await chart.render()
    const l = chart.w.globals.tooltip.tooltipLabels
    const v0 = l.getValuesToPrint({ i: 0, j: 0 })
    expect(v0.xVal).toBe('&lt;img src=x onerror="window.__pwned=1">')
    expect(v0.xAxisTTVal).toBe(v0.xVal)
    expect(l.getValuesToPrint({ i: 0, j: 1 }).xVal).toBe('&lt;i>a&lt;/i> b')
    chart.destroy()
  })

  it('markup a tooltip.x.formatter adds stays markup', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'bar', height: 300, animations: { enabled: false } },
      series: [{ name: 's', data: [1, 2] }],
      xaxis: { categories: ['a', 'b'] },
      tooltip: { x: { formatter: (x) => `<b>${x}</b>` } },
    })
    await chart.render()
    const v = chart.w.globals.tooltip.tooltipLabels.getValuesToPrint({
      i: 0,
      j: 0,
    })
    expect(v.xVal).toBe('<b>a</b>')
    chart.destroy()
  })

  it('a goal name shows as text and its colour cannot leave the style', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'bar', height: 300, animations: { enabled: false } },
      series: [
        {
          name: 's',
          data: [
            {
              x: 'a',
              y: 5,
              goals: [
                { name: EVIL, value: 4, strokeColor: 'red"><img src=y>' },
              ],
            },
          ],
        },
      ],
    })
    await chart.render()
    const tt = chart.w.globals.tooltip
    tt.tooltipLabels.drawSeriesTexts({
      shared: false,
      ttItems: tt.ttItems,
      i: 0,
      j: 0,
    })
    const label = document.querySelector('.apexcharts-tooltip-text-goals-label')
    expect(label.querySelector('img')).toBeNull()
    expect(label.textContent).toContain(EVIL)
    chart.destroy()
  })
})
