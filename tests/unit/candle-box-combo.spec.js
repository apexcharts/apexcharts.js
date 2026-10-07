import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/full.js'
import Graphics from '../../src/modules/Graphics'
// The canvas renderer is an opt-in feature, not part of `entries/full.js`.
import '../../src/features/renderer-canvas.js'

/**
 * Candles and boxes beside a series of another type (the shipped
 * candlestick/candlestick-line demo: a moving average line over candles).
 *
 * BoxCandleStick classed its marks by the chart's type, so the candles of a
 * line chart were `apexcharts-line-area`. Nothing that looks for a candle
 * found them: on SVG the intersect tooltip showed nothing, while the canvas
 * renderer, which hit-tests the painted path, did show one. It also told a
 * box from a candle by the chart's type or by the config series at the
 * series' place within its own type, so a box plot beside a line was drawn
 * as a candle. Each series now takes both from its own type.
 */

const T0 = Date.UTC(2026, 0, 1)
const DAY = 864e5

const candles = [
  [30, 50, 20, 40],
  [40, 45, 25, 30],
  [30, 60, 28, 55],
  [55, 58, 35, 42],
].map((y, j) => ({ x: T0 + j * DAY, y }))

const boxes = [
  [10, 20, 30, 40, 50],
  [15, 25, 35, 45, 55],
  [5, 22, 31, 38, 60],
  [12, 18, 26, 44, 52],
].map((y, j) => ({ x: T0 + j * DAY, y }))

const line = [35, 38, 41, 44].map((y, j) => ({ x: T0 + j * DAY, y }))

function combo(chartType, series, renderer) {
  return createChartWithOptions({
    chart: { type: chartType, width: 600, height: 400, renderer },
    series,
    xaxis: { type: 'datetime' },
    dataLabels: { enabled: false },
  })
}

/** The series group drawn for the series at this realIndex. */
function seriesGroup(realIndex) {
  return [...document.querySelectorAll('.apexcharts-series')].find(
    (g) => g.getAttribute('data:realIndex') === String(realIndex),
  )
}

/** Class of every mark path the series draws. */
function markClasses(realIndex) {
  return [...seriesGroup(realIndex).querySelectorAll('path[j]')].map((p) =>
    p.getAttribute('class'),
  )
}

/** How many paths the series draws for data point j. */
function pathsAt(realIndex, j) {
  return seriesGroup(realIndex).querySelectorAll(`path[j='${j}']`).length
}

describe('candles and boxes in a combo take their own type', () => {
  it('a candle beside a line is a candlestick mark, not a line area', () => {
    const chart = combo('line', [
      { name: 'MA', type: 'line', data: line },
      { name: 'Price', type: 'candlestick', data: candles },
    ])
    const classes = markClasses(1)
    expect(classes.length).toBe(candles.length)
    for (const c of classes) expect(c).toBe('apexcharts-candlestick-area')
    expect(
      document.querySelectorAll(
        '.apexcharts-candlestick-series .apexcharts-line-area',
      ).length,
    ).toBe(0)
    // one path per candle, not the two halves of a box
    expect(pathsAt(1, 2)).toBe(1)
    chart.destroy()
  })

  it('painted to canvas, the cached mark says candlestick too', () => {
    const chart = combo(
      'line',
      [
        { name: 'MA', type: 'line', data: line },
        { name: 'Price', type: 'candlestick', data: candles },
      ],
      'canvas',
    )
    expect(chart.w.globals.activeRenderer.kind).toBe('canvas')
    const cached = chart.w.globals.barCanvasCoords[1]
    for (let j = 0; j < candles.length; j++) {
      expect(cached[j].type, `j ${j}`).toBe('candlestick')
    }
    chart.destroy()
  })

  it('a box beside a line is drawn as a box, under its own class', () => {
    const chart = combo('line', [
      { name: 'Mean', type: 'line', data: line },
      { name: 'Spread', type: 'boxPlot', data: boxes },
    ])
    for (const c of markClasses(1)) expect(c).toBe('apexcharts-boxPlot-area')
    // a box is two paths per datum (lower and upper half), a candle one
    for (let j = 0; j < boxes.length; j++) expect(pathsAt(1, j)).toBe(2)
    chart.destroy()
  })

  it("a box beside a line is outlined in its own series' stroke colour", () => {
    const stroke = { colors: ['#112233', '#445566'] }
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 400 },
      series: [
        { name: 'Mean', type: 'line', data: line },
        { name: 'Spread', type: 'boxPlot', data: boxes },
      ],
      stroke,
      xaxis: { type: 'datetime' },
      dataLabels: { enabled: false },
    })
    const box = seriesGroup(1).querySelector('path[j]')
    expect(box.getAttribute('stroke')).toBe('#445566')
    chart.destroy()
  })

  it('candles and boxes in one chart each keep their own shape and class', () => {
    // The box plot is the first series of its type but not of the chart:
    // read at its place in its own group, the config said candlestick.
    const chart = combo('candlestick', [
      { name: 'Price', type: 'candlestick', data: candles },
      { name: 'Spread', type: 'boxPlot', data: boxes },
    ])
    for (const c of markClasses(0)) {
      expect(c).toBe('apexcharts-candlestick-area')
    }
    for (const c of markClasses(1)) expect(c).toBe('apexcharts-boxPlot-area')
    for (let j = 0; j < candles.length; j++) {
      expect(pathsAt(0, j), `candle ${j}`).toBe(1)
      expect(pathsAt(1, j), `box ${j}`).toBe(2)
    }
    chart.destroy()
  })

  it("a candle in a 'boxPlot' chart is read and drawn as a candle", () => {
    // The parser told a box from a candle by the chart's type first, so the
    // candle's [o, h, l, c] was stored as a box's five numbers with no close,
    // and once drawn as a candle every body ran to the floor.
    const chart = combo('boxPlot', [
      { name: 'Spread', type: 'boxPlot', data: boxes },
      { name: 'Price', type: 'candlestick', data: candles },
    ])
    const cd = chart.w.candleData
    expect(cd.seriesCandleO[1]).toEqual(candles.map((c) => c.y[0]))
    expect(cd.seriesCandleH[1]).toEqual(candles.map((c) => c.y[1]))
    expect(cd.seriesCandleL[1]).toEqual(candles.map((c) => c.y[2]))
    expect(cd.seriesCandleC[1]).toEqual(candles.map((c) => c.y[3]))
    // the box beside it keeps its five numbers
    expect(cd.seriesCandleC[0]).toEqual(boxes.map((b) => b.y[4]))
    for (const c of markClasses(1)) {
      expect(c).toBe('apexcharts-candlestick-area')
    }
    for (let j = 0; j < candles.length; j++) expect(pathsAt(1, j)).toBe(1)
    chart.destroy()
  })

  it('a candle of a line combo grows in on mount, as in a candle chart', () => {
    // The line draw-in (the stroke traced in place) took any class starting
    // `apexcharts-line`, which the candles of a 'line' chart once carried.
    document.body.innerHTML = '<div id="chart" />'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'line', width: 600, height: 400 },
      series: [
        { name: 'MA', type: 'line', data: line },
        { name: 'Price', type: 'candlestick', data: candles },
      ],
      xaxis: { type: 'datetime' },
    })
    chart.render()
    const paths = [...seriesGroup(1).querySelectorAll('path[j]')]
    expect(paths.length).toBe(candles.length)
    // first frame: from where it grows, not drawn at its final shape
    for (const p of paths) {
      expect(p.getAttribute('d')).toBe(p.getAttribute('pathFrom'))
      expect(p.getAttribute('d')).not.toBe(p.getAttribute('pathTo'))
    }
    // a class that only starts like the line's takes no draw-in either
    const g = new Graphics(chart.w, chart.ctx)
    const opts = {
      j: 0,
      realIndex: 0,
      pathFrom: 'M 1 1 L 2 2',
      pathTo: 'M 5 5 L 9 9',
      stroke: '#000',
      strokeWidth: 1,
      fill: 'none',
      animationDelay: 0,
      initialSpeed: 0,
      dataChangeSpeed: 0,
      chartType: 'line',
    }
    const other = g.renderPaths({ ...opts, className: 'apexcharts-line-area' })
    expect(other.node.getAttribute('d')).toBe('M 1 1 L 2 2')
    const own = g.renderPaths({ ...opts, className: 'apexcharts-line' })
    expect(own.node.getAttribute('d')).toBe('M 5 5 L 9 9')
    chart.destroy()
  })

  it('a chart of one type is unchanged', () => {
    let chart = combo('candlestick', [{ name: 'Price', data: candles }])
    for (const c of markClasses(0)) {
      expect(c).toBe('apexcharts-candlestick-area')
    }
    chart.destroy()
    chart = combo('boxPlot', [{ name: 'Spread', data: boxes }])
    for (const c of markClasses(0)) expect(c).toBe('apexcharts-boxPlot-area')
    expect(pathsAt(0, 1)).toBe(2)
    chart.destroy()
  })
})
