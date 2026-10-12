import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Utils from '../../src/utils/Utils.js'
import Series from '../../src/modules/Series.js'
import BarStacked from '../../src/charts/BarStacked.js'
import Pie from '../../src/charts/Pie.js'
import Treemap from '../../src/charts/Treemap.js'
import ApexCharts from '../../src/entries/standard.js'
import { captureCircle } from '../../src/modules/animations/CircleTransition.js'

// Each case pins a piece of work whose result nothing read: the call must
// no longer happen, and the chart must still render the same.

const tick = () => new Promise((r) => setTimeout(r, 0))

afterEach(() => vi.restoreAllMocks())

describe('parsed data is not deep-cloned into a dead snapshot', () => {
  it('a parsing config does not clone the raw rows', () => {
    const clone = vi.spyOn(Utils, 'clone')
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      parsing: { x: 'k', y: 'v' },
      series: [
        {
          name: 'a',
          data: [
            { k: 1, v: 3 },
            { k: 2, v: 5 },
          ],
        },
      ],
    })
    const rawClones = clone.mock.calls.filter(
      ([a]) => Array.isArray(a) && a[0]?.data?.[0]?.k !== undefined,
    )
    expect(rawClones).toHaveLength(0)
    expect('originalSeries' in chart.w.globals).toBe(false)
    expect(chart.w.globals.series[0]).toEqual([3, 5])
    chart.destroy()
  })
})

describe('a render does not copy the x range onto the toolbar', () => {
  it('the toolbar reads the range at click time, so nothing caches it', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      xaxis: { type: 'numeric' },
      series: [
        {
          name: 'a',
          data: [
            [1, 2],
            [2, 3],
            [3, 1],
          ],
        },
      ],
    })
    await chart.updateSeries([
      {
        name: 'a',
        data: [
          [1, 3],
          [2, 2],
          [4, 1],
        ],
      },
    ])
    const tb = chart.ctx.toolbar
    expect('minX' in tb).toBe(false)
    expect('maxX' in tb).toBe(false)
    expect(tb._currentXRange()).toEqual({ minX: 1, maxX: 4 })
    chart.destroy()
  })
})

describe('a crosshair move does not copy the x labels', () => {
  it('moveXCrosshairs leaves labels unsliced', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      series: [{ name: 'a', data: [1, 2, 3] }],
      xaxis: { categories: ['a', 'b', 'c'] },
    })
    await tick()
    const slice = vi.spyOn(chart.w.labelData.labels, 'slice')
    chart.w.globals.tooltip.tooltipPosition.moveXCrosshairs(40)
    expect(slice).not.toHaveBeenCalled()
    chart.destroy()
  })
})

describe('whole-series paths get no per-point listeners', () => {
  it('line and area paths bind no mouseenter/leave/down', () => {
    const add = vi.spyOn(Element.prototype, 'addEventListener')
    const chart = createChartWithOptions({
      chart: { type: 'area', width: 400, height: 300 },
      series: [
        { name: 'a', data: [1, null, 3, 4] },
        { name: 'b', data: [2, 3, null, 1] },
      ],
    })
    const onPaths = add.mock.contexts.filter(
      (el, k) =>
        el?.classList?.contains('apexcharts-area') &&
        ['mouseenter', 'mouseleave', 'mousedown'].includes(
          add.mock.calls[k][0],
        ),
    )
    expect(onPaths).toHaveLength(0)
    expect(
      chart.w.dom.baseEl.querySelectorAll('path.apexcharts-area').length,
    ).toBeGreaterThan(0)
    chart.destroy()
  })
})

describe('a side legend is placed without measuring it', () => {
  it('legendAlignVertical does not read the legend rect', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      series: [
        { name: 'a', data: [1, 2] },
        { name: 'b', data: [2, 1] },
      ],
      legend: { position: 'right', offsetX: 5 },
    })
    await tick()
    const legend = chart.ctx.legend
    const dims = vi.spyOn(legend.legendHelpers, 'getLegendDimensions')
    legend.legendAlignVertical()
    expect(dims).not.toHaveBeenCalled()
    const wrap = chart.w.dom.elLegendWrap
    expect(wrap.style.left).toBe('auto')
    expect(wrap.style.right).toBe('30px')
    chart.destroy()
  })
})

describe('a stacked draw builds no second Bar', () => {
  it('BarStacked.draw runs no Bar constructor work', () => {
    const byGroup = vi.spyOn(
      Series.prototype,
      'getActiveConfigSeriesIndexByGroup',
    )
    const draw = BarStacked.prototype.draw
    let inDraw = 0
    vi.spyOn(BarStacked.prototype, 'draw').mockImplementation(function (
      ...args
    ) {
      const before = byGroup.mock.calls.length
      const out = draw.apply(this, args)
      inDraw += byGroup.mock.calls.length - before
      return out
    })
    const chart = createChartWithOptions({
      chart: { type: 'bar', stacked: true, width: 400, height: 300 },
      series: [
        { name: 'a', data: [1, 2, 3] },
        { name: 'b', data: [3, 2, 1] },
      ],
    })
    expect(BarStacked.prototype.draw).toHaveBeenCalled()
    expect(inDraw).toBe(0)
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-bar-area').length,
    ).toBe(6)
    chart.destroy()
  })
})

describe('a donut update draws no NaN pre-frame per slice', () => {
  it('getPiePath never runs without a size', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'donut', width: 300, height: 300 },
      series: [1, 2, 3],
    })
    await chart.render()
    const piePath = vi.spyOn(Pie.prototype, 'getPiePath')
    await chart.updateSeries([3, 2, 1])
    expect(piePath).toHaveBeenCalled()
    const sizeless = piePath.mock.calls.filter(
      ([o]) => typeof o.size !== 'number' || isNaN(o.size),
    )
    expect(sizeless).toHaveLength(0)
    chart.destroy()
  })
})

describe('a radar capture measures the plot layout once', () => {
  it('captureCircle leaves the axis chart layout to captureAxisChrome', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'radar', width: 400, height: 300 },
      series: [{ name: 'a', data: [1, 2, 3, 4] }],
      xaxis: { categories: ['a', 'b', 'c', 'd'] },
    })
    await tick()
    const w = chart.w
    expect(w.globals.axisCharts).toBe(true)
    expect(w.globals.circleGeometry).toBeTruthy()
    const qsa = vi.spyOn(w.dom.baseEl, 'querySelectorAll')
    captureCircle(w)
    const layoutReads = qsa.mock.calls.filter(
      ([sel]) => sel === '.apexcharts-yaxis[rel]',
    )
    expect(layoutReads).toHaveLength(0)
    expect(w.globals.prevCircleFrame).toBeTruthy()
    expect(w.globals.prevCircleFrame.layout).toBeNull()
    expect('origin' in w.globals.prevCircleFrame).toBe(false)
    chart.destroy()
  })
})

describe('a keydown does not build keyboard navigation it opted out of', () => {
  it('navigation.enabled:false leaves the module unbuilt, keyDown still fires', async () => {
    const keyDown = vi.fn()
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
        width: 400,
        height: 300,
        events: { keyDown },
        accessibility: { keyboard: { navigation: { enabled: false } } },
      },
      series: [{ name: 'a', data: [1, 2, 3] }],
    })
    await tick()
    const area = chart.w.dom.baseEl.querySelector(chart.w.globals.chartClass)
    area.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    expect(keyDown).toHaveBeenCalledTimes(1)
    expect(chart.ctx._keyboardNavigation).toBeFalsy()
    chart.destroy()
  })

  it('destroy cancels a pending announcement', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      series: [{ name: 'a', data: [1, 2, 3] }],
    })
    await tick()
    const kn = chart.ctx.keyboardNavigation
    const region = chart.w.dom.baseEl.querySelector('.apexcharts-sr-status')
    kn._announce('Zoomed in')
    kn.destroy()
    await tick()
    expect(region.textContent).toBe('')
    chart.destroy()
  })
})

describe('a treemap draw builds no abs-valued series copy', () => {
  it('Treemap.draw does not map the series rows', () => {
    const draw = Treemap.prototype.draw
    /** @type {any[]} */
    const maps = []
    vi.spyOn(Treemap.prototype, 'draw').mockImplementation(function () {
      this.w.seriesData.series.forEach((s) => maps.push(vi.spyOn(s, 'map')))
      return draw.call(this)
    })
    const chart = createChartWithOptions({
      chart: { type: 'treemap', width: 400, height: 300 },
      series: [
        {
          data: [
            { x: 'a', y: 4 },
            { x: 'b', y: -2 },
          ],
        },
      ],
    })
    expect(maps.length).toBeGreaterThan(0)
    maps.forEach((m) => expect(m).not.toHaveBeenCalled())
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-treemap-rect').length,
    ).toBe(2)
    chart.destroy()
  })
})

describe('a parse writes its slices in place, with no copy-back', () => {
  it('leaves no mis-filed duplicates on axisFlags or seriesData', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 400, height: 300 },
      series: [{ name: 'a', data: [1, 2, 3] }],
    })
    await chart.updateSeries([{ name: 'a', data: [3, 2, 1] }])
    const w = chart.w
    for (const k of ['groups', 'hasXaxisGroups', 'seriesGroups']) {
      expect(k in w.axisFlags, k).toBe(false)
    }
    expect('noLabelsProvided' in w.seriesData).toBe(false)
    expect(chart.data.parseData(w.config.series)).toBeUndefined()
    chart.destroy()
  })
})

describe('y-axis tooltip nodes exist only for axes that show one', () => {
  it('the default (off) builds none', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      series: [{ name: 'a', data: [1, 2, 3] }],
    })
    await tick()
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-yaxistooltip').length,
    ).toBe(0)
    chart.destroy()
  })

  it('nodes are keyed by axis index, not DOM order', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      series: [
        { name: 'a', data: [1, 2, 3] },
        { name: 'b', data: [30, 20, 10] },
      ],
      yaxis: [
        { seriesName: 'a' },
        { seriesName: 'b', opposite: true, tooltip: { enabled: true } },
      ],
    })
    await tick()
    const tt = chart.w.globals.tooltip
    const els = tt.getYaxisTTEls()
    expect(els[0]).toBeNull()
    expect(els[1].classList.contains('apexcharts-yaxistooltip-1')).toBe(true)
    els[1].classList.add('apexcharts-active')
    tt.handleMouseOut({ tooltipEl: tt.getElTooltip() })
    expect(els[1].classList.contains('apexcharts-active')).toBe(false)
    expect(() => tt.tooltipPosition.moveYAxisTooltip(0)).not.toThrow()
    chart.destroy()
  })
})
