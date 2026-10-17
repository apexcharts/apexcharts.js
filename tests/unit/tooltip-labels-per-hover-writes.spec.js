// What one hover asks of Labels: the title and the x-axis label written once,
// not once per series row; the title formatter run once per row; no rows
// formatted under a tooltip.custom that replaced them; the data format asked
// once a render; the non-shared row taken from the rows already held.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Data from '../../src/modules/Data'

const tick = () => new Promise((r) => setTimeout(r, 0))
const INNER = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML')

/** Counts innerHTML writes to `el`. */
function countWrites(el) {
  const c = { n: 0 }
  Object.defineProperty(el, 'innerHTML', {
    configurable: true,
    get() {
      return INNER.get.call(this)
    },
    set(v) {
      c.n++
      INNER.set.call(this, v)
    },
  })
  return c
}

const four = (extra = {}) =>
  createChartWithOptions({
    chart: { type: 'line', width: 500, height: 300 },
    series: ['a', 'b', 'c', 'd'].map((name, k) => ({
      name,
      data: [1, 2, 3, 4, 5].map((v) => v + k),
    })),
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      tooltip: { enabled: true },
    },
    ...extra,
    tooltip: { shared: true, intersect: false, ...extra.tooltip },
  })

const hover = (tt, j, shared = true) =>
  tt.tooltipLabels.drawSeriesTexts({ shared, ttItems: tt.ttItems, i: 0, j })

afterEach(() => {
  vi.restoreAllMocks()
})

describe('shared tooltip', () => {
  it('writes the title and the x-axis label once a hover, not once a row', async () => {
    const chart = four()
    await tick()
    const tt = chart.w.globals.tooltip
    expect(tt.ttItems.length).toBe(4)
    const title = countWrites(tt.tooltipTitle)
    const xLabel = countWrites(tt.xaxisTooltipText)

    hover(tt, 2)
    expect(title.n).toBe(1)
    expect(xLabel.n).toBe(1)
    expect(tt.tooltipTitle.textContent).toBe('Wed')
    expect(tt.xaxisTooltipText.textContent).toBe('Wed')
    chart.destroy()
  })

  it('runs the title formatter once a row, for that row', async () => {
    const title = vi.fn((name) => `${name}:`)
    const chart = four({ tooltip: { y: { title: { formatter: title } } } })
    await tick()
    const tt = chart.w.globals.tooltip
    title.mockClear()

    hover(tt, 1)
    expect(title).toHaveBeenCalledTimes(4)
    expect(title.mock.calls.map((c) => c[0])).toEqual(['a', 'b', 'c', 'd'])
    const labels = tt.ttItems.map(
      (r) => r.querySelector('.apexcharts-tooltip-text-y-label').textContent,
    )
    expect(labels).toEqual(['a:', 'b:', 'c:', 'd:'])
    chart.destroy()
  })
})

describe('tooltip.custom', () => {
  it('formats no row its markup replaced, and still writes the x-axis label', async () => {
    const yFormat = vi.fn((v) => `${v} u`)
    const chart = four({
      tooltip: {
        y: { formatter: yFormat },
        custom: ({ dataPointIndex }) =>
          `<div class="mine">${dataPointIndex}</div>`,
      },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    const xLabel = countWrites(tt.xaxisTooltipText)
    yFormat.mockClear()

    hover(tt, 3)
    expect(tt.getElTooltip().querySelector('.mine').textContent).toBe('3')
    expect(yFormat).not.toHaveBeenCalled()
    expect(xLabel.n).toBe(1)
    expect(tt.xaxisTooltipText.textContent).toBe('Thu')
    chart.destroy()
  })

  it('still fills the built-in rows while a custom function returns nothing', async () => {
    const yFormat = vi.fn((v) => `${v} u`)
    const chart = four({
      tooltip: { y: { formatter: yFormat }, custom: () => null },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    yFormat.mockClear()

    hover(tt, 0)
    expect(yFormat).toHaveBeenCalledTimes(4)
    const values = tt.ttItems.map(
      (r) => r.querySelector('.apexcharts-tooltip-text-y-value').textContent,
    )
    expect(values).toEqual(['1 u', '2 u', '3 u', '4 u'])
    expect(tt.tooltipTitle.textContent).toBe('Mon')
    chart.destroy()
  })
})

describe('getValuesToPrint', () => {
  it('asks the data format once a render, and warns about mixed data once', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 500, height: 300 },
      series: [
        {
          name: 'a',
          data: [{ x: 'p', y: 1 }, null, { x: 'r', y: 3 }],
        },
      ],
      tooltip: { shared: true, intersect: false },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    const isXY = vi.spyOn(Data.prototype, 'isFormatXY')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const L = tt.tooltipLabels

    const xs = [0, 1, 2, 0, 2].map((j) => L.getValuesToPrint({ i: 0, j }).xVal)
    expect(xs).toEqual(['p', '', 'r', 'p', 'r'])
    expect(isXY).toHaveBeenCalledTimes(1)
    expect(
      warn.mock.calls.filter((c) => /mixed formats/.test(c[0])).length,
    ).toBe(1)

    // A render asks again.
    await chart.updateSeries([{ name: 'a', data: [{ x: 'q', y: 2 }] }])
    await tick()
    expect(
      chart.w.globals.tooltip.tooltipLabels.getValuesToPrint({ i: 0, j: 0 })
        .xVal,
    ).toBe('q')
    expect(isXY.mock.calls.length).toBeGreaterThan(1)
    chart.destroy()
  })
})

describe('non-shared tooltip', () => {
  it('activates the row it holds, without a query per hover', async () => {
    const chart = four({ tooltip: { shared: false } })
    await tick()
    const tt = chart.w.globals.tooltip
    expect(tt.ttItems.length).toBe(1)
    const baseEl = chart.w.dom.baseEl
    const qs = vi.spyOn(baseEl, 'querySelector')

    for (let k = 0; k < 5; k++) hover(tt, k, false)
    const rowQueries = qs.mock.calls.filter(([s]) =>
      String(s).includes('tooltip-series-group-'),
    ).length
    expect(rowQueries).toBe(0)
    expect(tt.ttItems[0].classList.contains('apexcharts-active')).toBe(true)
    expect(tt.ttItems[0].style.display).toBe(
      chart.w.config.tooltip.items.display,
    )
    chart.destroy()
  })
})
