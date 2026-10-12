import { describe, it, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

const tick = () => new Promise((r) => setTimeout(r, 0))

describe('tooltip.cssClass', () => {
  it('takes a space-separated list of classes', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      series: [{ name: 'a', data: [1, 2, 3] }],
      tooltip: { cssClass: 'one  two' },
    })
    await tick()
    const el = chart.w.globals.tooltip.getElTooltip()
    expect(el).not.toBeNull()
    expect(el.classList.contains('one')).toBe(true)
    expect(el.classList.contains('two')).toBe(true)
    chart.destroy()
  })
})

describe('y-axis tooltip nodes follow a re-render', () => {
  it('after updateOptions the cached y-axis tooltip nodes are the live ones', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      series: [{ name: 'a', data: [1, 2, 3, 4] }],
      yaxis: { tooltip: { enabled: true } },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    tt.handleMouseOut({ tooltipEl: tt.getElTooltip() })
    expect(tt.yaxisTTEls[0].isConnected).toBe(true)

    await chart.updateOptions({ title: { text: 'x' } })
    expect(chart.w.globals.tooltip).toBe(tt)
    tt.handleMouseOut({ tooltipEl: tt.getElTooltip() })
    tt.tooltipPosition.moveYAxisTooltip(0)
    expect(tt.yaxisTTEls[0].isConnected).toBe(true)
    chart.destroy()
  })

  it('adding a y-axis does not make moveYAxisTooltip throw', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      series: [{ name: 'a', data: [1, 2, 3, 4] }],
      yaxis: { tooltip: { enabled: true } },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    tt.handleMouseOut({ tooltipEl: tt.getElTooltip() })
    await chart.updateOptions({
      yaxis: [
        { tooltip: { enabled: true } },
        { opposite: true, tooltip: { enabled: true } },
      ],
      series: [
        { name: 'a', data: [1, 2, 3, 4] },
        { name: 'b', data: [4, 3, 2, 1] },
      ],
    })
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-yaxistooltip').length,
    ).toBe(2)
    expect(() => tt.tooltipPosition.moveYAxisTooltip(1)).not.toThrow()
    chart.destroy()
  })
})

describe('isBarShared follows the render', () => {
  it('is false for horizontal bars', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 400, height: 300 },
      plotOptions: { bar: { horizontal: true } },
      series: [{ name: 'a', data: [1, 2, 3] }],
      tooltip: { shared: true, intersect: false },
    })
    await tick()
    expect(chart.w.globals.isBarHorizontal).toBe(true)
    expect(chart.w.globals.tooltip.isBarShared).toBe(false)
    chart.destroy()
  })

  it('follows tooltip.shared through updateOptions', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 400, height: 300 },
      series: [{ name: 'a', data: [1, 2, 3] }],
      tooltip: { shared: false },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    expect(tt.isBarShared).toBe(false)
    await chart.updateOptions({ tooltip: { shared: true, intersect: false } })
    expect(chart.w.globals.tooltip.isBarShared).toBe(true)
    chart.destroy()
  })
})

describe('bar hover reset leaves untouched bars alone', () => {
  const cats = Array.from({ length: 10 }, (_, k) => 'c' + k)
  const mk = (n) => cats.map((_, k) => k + n)

  it('handleMouseOut does not call dataPointMouseLeave for untouched bars', async () => {
    const leave = vi.fn()
    const chart = createChartWithOptions({
      chart: {
        type: 'bar',
        width: 400,
        height: 300,
        events: { dataPointMouseLeave: leave },
      },
      series: [
        { name: 'a', data: mk(1) },
        { name: 'b', data: mk(2) },
        { name: 'c', data: mk(3) },
      ],
      xaxis: { categories: cats },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-bar-area').length,
    ).toBe(30)
    tt.handleMouseOut({ tooltipEl: tt.getElTooltip() })
    expect(leave).toHaveBeenCalledTimes(0)
    chart.destroy()
  })

  it('a shared bar tooltip leaves only the column it entered', async () => {
    const enter = vi.fn()
    const leave = vi.fn()
    const chart = createChartWithOptions({
      chart: {
        type: 'bar',
        width: 400,
        height: 300,
        events: { dataPointMouseEnter: enter, dataPointMouseLeave: leave },
      },
      series: [
        { name: 'a', data: mk(1) },
        { name: 'b', data: mk(2) },
      ],
      xaxis: { categories: cats },
      tooltip: { shared: true, intersect: false },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    tt.deactivateHoverFilter()
    expect(leave).toHaveBeenCalledTimes(0)

    vi.spyOn(
      tt.tooltipPosition,
      'moveStickyTooltipOverBars',
    ).mockImplementation(() => {})
    // The move neither forces a layout on the bar groups nor scans markers.
    const groups = [...tt.tooltipUtil.getElBars()]
    const bbox = groups.map((g) => {
      g.getBBox = vi.fn(() => ({ x: 0, y: 0, width: 0, height: 0 }))
      return g.getBBox
    })
    const markers = vi.spyOn(tt.tooltipUtil, 'getAllMarkers')
    tt.create({ type: 'mousemove' }, tt, 0, 3, tt.ttItems)
    bbox.forEach((s) => expect(s).not.toHaveBeenCalled())
    expect(markers).not.toHaveBeenCalled()
    expect(enter).toHaveBeenCalledTimes(2)
    expect(enter.mock.calls.map((c) => c[2].dataPointIndex)).toEqual([3, 3])

    tt.handleMouseOut({ tooltipEl: tt.getElTooltip() })
    expect(leave).toHaveBeenCalledTimes(2)
    expect(leave.mock.calls.map((c) => c[2].dataPointIndex)).toEqual([3, 3])
    chart.destroy()
  })
})

describe('a non-shared tooltip row takes the hovered series config', () => {
  it('reads enabledOnSeries, marker.fillColors and markers.shape by series', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      series: [
        { name: 'a', data: [1, 2, 3] },
        { name: 'b', data: [3, 2, 1] },
      ],
      markers: { size: 4, shape: ['circle', 'square'] },
      tooltip: {
        shared: false,
        enabledOnSeries: [1],
        marker: { fillColors: ['#ff0000', '#00ff00'] },
      },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    expect(tt.ttItems.length).toBe(1)
    const row = tt.ttItems[0]
    const marker = row.querySelector('.apexcharts-tooltip-marker')

    tt.tooltipLabels.drawSeriesTexts({
      shared: false,
      ttItems: tt.ttItems,
      i: 1,
      j: 0,
    })
    expect(row.style.display).not.toBe('none')
    expect(marker.style.color).toBe('rgb(0, 255, 0)')
    expect(marker.getAttribute('shape')).toBe('square')

    tt.tooltipLabels.drawSeriesTexts({
      shared: false,
      ttItems: tt.ttItems,
      i: 0,
      j: 0,
    })
    expect(row.style.display).toBe('none')
    expect(marker.getAttribute('shape')).toBe('circle')
    chart.destroy()
  })
})

describe('enabledOnSeries on the plot-wide sticky listener', () => {
  const mount = async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      series: [
        { name: 'a', data: [1, 2, 3] },
        { name: 'b', data: [3, 2, 1] },
      ],
      tooltip: { shared: false, intersect: false, enabledOnSeries: [1] },
    })
    await tick()
    return chart
  }

  it('reaches the sticky handler instead of hiding at once', async () => {
    const chart = await mount()
    const tt = chart.w.globals.tooltip
    const out = vi.spyOn(tt, 'handleMouseOut')
    const sticky = vi
      .spyOn(tt, 'handleStickyTooltip')
      .mockImplementation(() => {})
    const hoverArea = chart.w.dom.Paper.node
    // Inside the plot (jsdom measures the svg at the origin).
    const x = chart.w.layout.translateX + 10
    const y = chart.w.layout.translateY + 10
    tt.axisChartsTooltips({
      e: { type: 'mousemove', clientX: x, clientY: y, target: hoverArea },
      opt: {
        paths: hoverArea,
        hoverArea,
        elGrid: tt.getElGrid(),
        tooltipEl: tt.getElTooltip(),
        ttItems: tt.ttItems,
        clientX: x,
        clientY: y,
      },
    })
    expect(out).not.toHaveBeenCalled()
    expect(sticky).toHaveBeenCalled()
    chart.destroy()
  })

  it('hides for a resolved series it excludes, and shows one it includes', async () => {
    const chart = await mount()
    const tt = chart.w.globals.tooltip
    const out = vi.spyOn(tt, 'handleMouseOut')
    const texts = vi
      .spyOn(tt.tooltipLabels, 'drawSeriesTexts')
      .mockImplementation(() => {})
    vi.spyOn(tt.tooltipPosition, 'moveMarkers').mockImplementation(() => {})
    vi.spyOn(tt.tooltipPosition, 'moveDynamicPointOnHover').mockImplementation(
      () => {},
    )

    tt.create({ type: 'mousemove' }, tt, 0, 1, tt.ttItems)
    expect(out).toHaveBeenCalledTimes(1)
    expect(texts).not.toHaveBeenCalled()

    tt.create({ type: 'mousemove' }, tt, 1, 1, tt.ttItems)
    expect(out).toHaveBeenCalledTimes(1)
    expect(texts).toHaveBeenCalledTimes(1)
    chart.destroy()
  })
})

describe('legend.tooltipHoverFormatter', () => {
  const legendText = (chart, i) =>
    chart.w.dom.baseEl.querySelector(`.apexcharts-legend-text[i="${i}"]`)

  it('pie: decoded name, the hovered item under inverseOrder, then reset', async () => {
    const fmt = vi.fn((name, o) => name + ': ' + o.seriesIndex)
    const chart = createChartWithOptions({
      chart: { type: 'pie', width: 400, height: 300 },
      series: [44, 55, 13],
      labels: ['North America', 'Europe', 'Asia'],
      legend: { tooltipHoverFormatter: fmt, inverseOrder: true },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    const slices = chart.w.dom.baseEl.querySelectorAll('.apexcharts-pie-series')
    const hover = (k, type = 'mousemove') =>
      tt.nonAxisChartsTooltips({
        e: { type, target: slices[k], clientX: 10, clientY: 10 },
        opt: {
          paths: slices[k],
          tooltipEl: tt.getElTooltip(),
          ttItems: tt.ttItems,
        },
        tooltipRect: { ttWidth: 10, ttHeight: 10 },
      })

    hover(0)
    expect(legendText(chart, 0).innerHTML).toBe('North America: 0')
    expect(legendText(chart, 2).innerHTML).toBe('Asia')

    hover(1)
    expect(legendText(chart, 0).innerHTML).toBe('North America')
    expect(legendText(chart, 1).innerHTML).toBe('Europe: 1')

    hover(1, 'mouseout')
    expect(legendText(chart, 1).innerHTML).toBe('Europe')
    chart.destroy()
  })

  it('cartesian: formats the hovered series, or every visible one when shared', async () => {
    const fmt = vi.fn(
      (name, o) => `${name}=${o.seriesIndex}@${o.dataPointIndex}`,
    )
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      series: [
        { name: 'a b', data: [1, 2, 3] },
        { name: 'c', data: [3, 2, 1] },
      ],
      legend: { tooltipHoverFormatter: fmt, show: true },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    tt.applyLegendHoverText(1, 2, false)
    expect(legendText(chart, 0).innerHTML).toBe('a b')
    expect(legendText(chart, 1).innerHTML).toBe('c=1@2')
    expect(fmt).toHaveBeenCalledTimes(1)

    tt.applyLegendHoverText(0, 1, true)
    expect(legendText(chart, 0).innerHTML).toBe('a b=0@1')
    expect(legendText(chart, 1).innerHTML).toBe('c=1@1')

    tt.handleMouseOut({ tooltipEl: tt.getElTooltip() })
    expect(legendText(chart, 0).innerHTML).toBe('a b')
    expect(legendText(chart, 1).innerHTML).toBe('c')
    chart.destroy()
  })
})

describe('custom tooltip y1/y2 on a sticky rangeArea', () => {
  const y1y2 = async (series, xaxis) => {
    const chart = createChartWithOptions({
      chart: { type: 'rangeArea', width: 400, height: 300 },
      series,
      xaxis,
      tooltip: { custom: () => '<div></div>' },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    const texts = vi
      .spyOn(tt.tooltipLabels, 'drawSeriesTexts')
      .mockImplementation(() => {})
    vi.spyOn(tt.tooltipPosition, 'moveMarkers').mockImplementation(() => {})
    vi.spyOn(tt.tooltipPosition, 'moveDynamicPointOnHover').mockImplementation(
      () => {},
    )
    tt.create({ type: 'mousemove' }, tt, 0, 1, tt.ttItems, false)
    const { y1, y2 } = texts.mock.calls[0][0]
    chart.destroy()
    return [y1, y2]
  }

  it('reads the datum range for 2D-array input', async () => {
    const got = await y1y2(
      [
        {
          name: 'a',
          data: [
            [1, [1, 5]],
            [2, [2, 6]],
            [3, [3, 7]],
          ],
        },
      ],
      { type: 'numeric' },
    )
    expect(got).toEqual([2, 6])
  })

  it('reads the datum range when an x repeats', async () => {
    const got = await y1y2([
      {
        name: 'a',
        data: [
          { x: 'p', y: [1, 5] },
          { x: 'p', y: [2, 6] },
          { x: 'q', y: [3, 7] },
        ],
      },
    ])
    expect(got).toEqual([2, 6])
  })
})

describe('range tooltip values follow the series type', () => {
  it('prints a line beside a rangeArea as one value', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'rangeArea', width: 400, height: 300 },
      series: [
        {
          name: 'r',
          type: 'rangeArea',
          data: [
            { x: 'a', y: [1, 5] },
            { x: 'b', y: [2, 6] },
          ],
        },
        {
          name: 'l',
          type: 'line',
          data: [
            { x: 'a', y: 4 },
            { x: 'b', y: 3 },
          ],
        },
      ],
    })
    await tick()
    const L = chart.w.globals.tooltip.tooltipLabels
    expect(L.formatYValue(L.getFormatters(1), 1, 0)).not.toContain(' - ')
    expect(L.formatYValue(L.getFormatters(0), 0, 0)).toContain(' - ')
    chart.destroy()
  })

  it('still prints a plain rangeArea series as a range', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'rangeArea', width: 400, height: 300 },
      series: [{ name: 'r', data: [{ x: 'a', y: [1, 5] }] }],
    })
    await tick()
    const L = chart.w.globals.tooltip.tooltipLabels
    expect(L.formatYValue(L.getFormatters(0), 0, 0)).toContain(' - ')
    chart.destroy()
  })
})

describe('tooltip.hideEmptySeries', () => {
  const draw = async (options, j = 0) => {
    const chart = createChartWithOptions({
      chart: { width: 400, height: 300, ...options.chart },
      ...options,
      tooltip: {
        shared: true,
        intersect: false,
        hideEmptySeries: true,
        ...options.tooltip,
      },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    tt.tooltipLabels.drawSeriesTexts({
      shared: true,
      ttItems: tt.ttItems,
      i: 0,
      j,
    })
    const rows = tt.ttItems.map((r) => ({
      text: r.querySelector('.apexcharts-tooltip-text').style.display,
      marker: r.querySelector('.apexcharts-tooltip-marker').style.display,
    }))
    chart.destroy()
    return rows
  }

  it('decides on the value, not the formatted text', async () => {
    const rows = await draw({
      chart: { type: 'line' },
      series: [
        { name: 'small', data: [0.001, 2] },
        { name: 'zero', data: [0, 2] },
      ],
      yaxis: { labels: { formatter: (v) => '$' + Number(v).toFixed(2) } },
    })
    expect(rows[0]).toEqual({ text: '', marker: '' })
    expect(rows[1]).toEqual({ text: 'none', marker: 'none' })
  })

  it('keeps a range that starts at 0', async () => {
    const rows = await draw({
      chart: { type: 'rangeArea' },
      series: [
        { name: 'r', data: [{ x: 'a', y: [0, 5] }] },
        { name: 'z', data: [{ x: 'a', y: [0, 0] }] },
      ],
    })
    expect(rows[0].text).toBe('')
    expect(rows[1].text).toBe('none')
  })

  it('does not re-show a marker that marker.show hides', async () => {
    const rows = await draw({
      chart: { type: 'line' },
      series: [{ name: 'a', data: [1, 2] }],
      tooltip: { marker: { show: false } },
    })
    expect(rows[0]).toEqual({ text: '', marker: 'none' })
  })
})

describe('non-shared tooltip marker colour', () => {
  const svgEl = (attrs) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v))
    return el
  }
  const pColor = (L, target, i = 1) =>
    L.computeSeriesRow({
      i,
      j: 0,
      tIndex: 0,
      shared: false,
      e: { target },
      basePColor: '#123456',
    }).pColor

  it('takes the fill of the hovered series own mark only', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      series: [
        { name: 'a', data: [1, 2, 3] },
        { name: 'b', data: [3, 2, 1] },
      ],
      tooltip: { shared: false, intersect: false },
    })
    await tick()
    const L = chart.w.globals.tooltip.tooltipLabels
    // a line stroke of the hovered series: fill="none"
    const line = chart.w.dom.baseEl.querySelector(
      'path.apexcharts-line[index="1"]',
    )
    expect(line.getAttribute('fill')).toBe('none')
    expect(pColor(L, line)).toBe('#123456')
    // the plot itself, and another series' mark
    expect(pColor(L, chart.w.dom.Paper.node)).toBe('#123456')
    expect(pColor(L, svgEl({ index: '0', fill: '#abcdef' }))).toBe('#123456')
    // the hovered series' own mark keeps its per-point colour
    expect(pColor(L, svgEl({ index: '1', fill: '#abcdef' }))).toBe('#abcdef')
    chart.destroy()
  })
})

describe('marker hover enlargement', () => {
  it('reads the hovered marker size, not the series last one', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      series: [{ name: 'a', data: [1, 2, 3] }],
      markers: { size: 4 },
    })
    await tick()
    const marker = chart.w.globals.tooltip.marker
    const pts = chart.w.dom.baseEl.querySelectorAll('.apexcharts-marker')
    expect(pts.length).toBe(3)
    expect(pts[0].parentNode).toBe(pts[2].parentNode)
    // the last point clipped out of the plot
    pts[2].setAttribute('default-marker-size', '0')
    expect(marker.newPointSize(1, pts[0])).toBeGreaterThan(4)
    expect(marker.newPointSize(1, pts[2])).toBeUndefined()
    chart.destroy()
  })
})

describe('a fixed tooltip is not first placed at the hovered marker', () => {
  it('enlargeCurrentPoint skips moveTooltip when tooltip.fixed is on', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      series: [{ name: 'a', data: [1, 2, 3] }],
      markers: { size: 4 },
      tooltip: { fixed: { enabled: true } },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    const point = chart.w.dom.baseEl.querySelector('.apexcharts-marker')
    const move = vi.spyOn(tt.tooltipPosition, 'moveTooltip')
    const cross = vi.spyOn(tt.tooltipPosition, 'moveXCrosshairs')
    tt.marker.enlargeCurrentPoint(0, point)
    expect(cross).toHaveBeenCalled()
    expect(move).not.toHaveBeenCalled()
    chart.destroy()
  })
})
