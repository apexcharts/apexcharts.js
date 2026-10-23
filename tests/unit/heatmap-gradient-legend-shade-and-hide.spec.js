import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Two heatmap gradient legend defects users saw:
// - the strip was shaded against the raw data extent while the cells shade
//   against the niced y extent, so the end labelled with the max value was
//   visibly lighter than the max cell (a one-sided colorScale.max past the
//   data even shaded it toward black, and treemap tiles scale the shade);
// - after legend.show:false the old strip stayed alive, still listening to
//   cell hovers and repositioning the emptied legend wrap every render.

const rgb = (c) => {
  c = String(c).trim()
  if (c.startsWith('#')) {
    return [1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16))
  }
  return c.match(/[\d.]+/g).slice(0, 3).map(Number)
}

const heatmap = (legend, data, colorScale = {}, type = 'heatmap') =>
  createChartWithOptions({
    chart: { type, height: 320, width: 600 },
    colors: ['#008FFB'],
    series: [{ name: 'r1', data: data.map((y, i) => ({ x: `c${i}`, y })) }],
    legend,
    plotOptions: {
      [type]: {
        enableShades: true,
        colorScale: { gradientLegend: { enabled: true }, ...colorScale },
      },
    },
    dataLabels: { enabled: false },
  })

// strip stop colours, and the fill of the cell (or tile) holding value v
const read = (chart, type = 'heatmap') => {
  const stops = [...chart.el.querySelectorAll('.apexcharts-gradient-legend stop')]
  const cells = [...chart.el.querySelectorAll(`.apexcharts-${type}-rect`)]
  const s = chart.w.seriesData.series
  return {
    stops: stops.map((st) => rgb(st.getAttribute('stop-color'))),
    cell: (v) =>
      rgb(
        cells
          .find((c) => s[c.getAttribute('i')][c.getAttribute('j')] === v)
          .getAttribute('fill'),
      ),
  }
}
const near = (a, b) =>
  a.forEach((v, k) => expect(Math.abs(v - b[k])).toBeLessThanOrEqual(2))

describe('heatmap gradient legend shade and teardown', () => {
  it.each(['heatmap', 'treemap'])(
    'shades the %s strip ends like the min and max cells',
    (type) => {
      const chart = heatmap({ show: true, position: 'bottom' }, [13, 40, 98], {}, type)
      const { stops, cell } = read(chart, type)
      near(stops[0], cell(13))
      near(stops[stops.length - 1], cell(98))
    },
  )

  // A treemap tile, or a distributed heatmap cell, shades against its own
  // row's extent, so no single strip fits every row of a multi-row chart.
  // The strip shades against the range its labels and arrow span: a smooth
  // gradient from the labelled min to max, never a run of saturated stops.
  const twoRows = (type, plot = {}) =>
    createChartWithOptions({
      chart: { type, height: 320, width: 600 },
      colors: ['#008FFB'],
      series: [
        { name: 'r1', data: [10, 40, 100].map((y, i) => ({ x: `a${i}`, y })) },
        { name: 'r2', data: [200, 500].map((y, i) => ({ x: `b${i}`, y })) },
      ],
      legend: { show: true, position: 'bottom' },
      plotOptions: {
        [type]: {
          enableShades: true,
          ...plot,
          colorScale: { gradientLegend: { enabled: true } },
        },
      },
      dataLabels: { enabled: false },
    })
  // every stop strictly darker than the one before it
  const smooth = (stops) => {
    const sum = (c) => c[0] + c[1] + c[2]
    for (let k = 1; k < stops.length; k++) {
      expect(sum(stops[k])).toBeLessThan(sum(stops[k - 1]))
    }
  }

  it.each([
    ['treemap', {}],
    ['heatmap', { distributed: true }],
    ['heatmap', {}],
  ])('shades a multi-row %s strip as one gradient (%j)', (type, plot) => {
    const chart = twoRows(type, plot)
    const { stops, cell } = read(chart, type)
    smooth(stops)
    expect(chart.legend.heatmapGradientLegend._min).toBe(10)
    expect(chart.legend.heatmapGradientLegend._max).toBe(500)
    // a plain heatmap shades every cell against one extent: the strip ends
    // are its min and max cells
    if (type === 'heatmap' && !plot.distributed) {
      near(stops[0], cell(10))
      near(stops[stops.length - 1], cell(500))
    }
  })

  it('keeps the strip a gradient when the first row is hidden', () => {
    const chart = twoRows('heatmap', { distributed: true })
    chart.hideSeries('r1')
    const { stops } = read(chart)
    smooth(stops)
    stops.forEach((st) => expect(st).not.toEqual([255, 255, 255]))
  })

  it.each([
    [[13, 40, 60], 60, { max: 100 }],
    [[13, 40, 100], 100, { max: 200 }],
  ])(
    'never shades past the max cell with a one-sided colorScale.max (%j)',
    (data, top, cs) => {
      const chart = heatmap({ show: true, position: 'bottom' }, data, cs)
      const { stops, cell } = read(chart)
      const max = cell(top)
      near(stops[stops.length - 1], max)
      // no stop is darker than the darkest cell
      const sum = (c) => c[0] + c[1] + c[2]
      stops.forEach((st) => expect(sum(st)).toBeGreaterThanOrEqual(sum(max) - 2))
    },
  )

  it('drops the strip and its hover listeners when the legend is hidden', async () => {
    const chart = heatmap({ show: true }, [10, 90])
    const old = chart.legend.heatmapGradientLegend
    expect(chart.w.globals.events.dataPointMouseEnter).toContain(old._onCellEnter)

    await chart.updateOptions({ legend: { show: false } })

    expect(chart.legend.heatmapGradientLegend).toBeNull()
    expect(chart.w.globals.events.dataPointMouseEnter || []).not.toContain(
      old._onCellEnter,
    )
  })
})
