import { createChartWithOptions } from './utils/utils.js'

// Opt-in jitter (raw observations) overlaid on boxPlot charts. Shares the
// implementation with violin via src/charts/common/Jitter.js.

function boxChart(opts = {}) {
  return createChartWithOptions({
    chart: { type: 'boxPlot', width: 600, height: 400, ...opts.chart },
    series: opts.series || [
      {
        name: 'A',
        data: [
          { x: 'G1', y: [10, 20, 40, 50, 70], points: [12, 18, 25, 33, 41, 48, 55, 62] },
          { x: 'G2', y: [25, 30, 35, 45, 60], points: [27, 31, 36, 42, 50] },
        ],
      },
    ],
    plotOptions: opts.plotOptions || { boxPlot: { points: { show: true } } },
    dataLabels: { enabled: false },
    ...opts.extra,
  })
}

describe('boxPlot jitter — opt-in, non-breaking', () => {
  test('a boxPlot with no points option and no points data renders no jitter', () => {
    createChartWithOptions({
      chart: { type: 'boxPlot', width: 600, height: 400 },
      series: [{ name: 'A', data: [{ x: 'G1', y: [10, 20, 40, 50, 70] }] }],
    })
    expect(document.querySelectorAll('.apexcharts-boxPlot-points').length).toBe(0)
  })

  test('points data + show:true renders one packed path per box (not one per point)', () => {
    boxChart()
    const pts = document.querySelectorAll('.apexcharts-boxPlot-points')
    expect(pts.length).toBe(2) // one per box, not 13 (the point count)
    // G1 packs its 8 observations into a single path
    expect((pts[0].getAttribute('d').match(/M/g) || []).length).toBe(8)
  })

  test('supplying points but leaving show:false (the default) renders no jitter', () => {
    boxChart({ plotOptions: { boxPlot: { points: { show: false } } } })
    expect(document.querySelectorAll('.apexcharts-boxPlot-points').length).toBe(0)
  })

  test('jitter dots default to a darker shade of the series colour with a white outline', () => {
    const chart = boxChart()
    const pts = document.querySelector('.apexcharts-boxPlot-points')
    expect(pts.getAttribute('stroke')).toBe('#fff')
    const fill = pts.getAttribute('fill')
    expect(fill).toMatch(/^rgb\(/)
    const src = chart.w.globals.colors[0].replace('#', '')
    const srcSum =
      parseInt(src.slice(0, 2), 16) +
      parseInt(src.slice(2, 4), 16) +
      parseInt(src.slice(4, 6), 16)
    const [r, g, b] = fill.match(/\d+/g).map(Number)
    expect(r + g + b).toBeLessThan(srcSum)
  })

  test('jitter is non-interactive and rendered visible when there is no entrance animation', () => {
    // harness disables animations → no path-grow animation to reveal a delayed
    // overlay, so jitter must render visible (never stuck at opacity:0)
    boxChart()
    const wrap = document.querySelector('.apexcharts-boxPlot-points-wrap')
    expect(wrap).not.toBeNull()
    expect(wrap.classList.contains('apexcharts-element-hidden')).toBe(false)
    expect(
      document.querySelector('.apexcharts-boxPlot-points').style.pointerEvents,
    ).toBe('none')
  })

  test('outlier observations beyond the box min/max widen the axis extent', () => {
    const chart = boxChart({
      series: [
        {
          name: 'A',
          // box max is 70, but an outlier observation sits at 95
          data: [{ x: 'G1', y: [10, 20, 40, 50, 70], points: [12, 95] }],
        },
      ],
    })
    expect(chart.w.globals.maxY).toBeGreaterThanOrEqual(95)
  })

  test('points.colorScale buckets boxPlot dots into value-graded shade paths', () => {
    const many = Array.from({ length: 400 }, (_, k) => 10 + (k % 60)) // 10..69
    boxChart({
      series: [{ name: 'A', data: [{ x: 'G1', y: [10, 25, 40, 55, 70], points: many }] }],
      plotOptions: {
        boxPlot: {
          points: {
            show: true,
            colorScale: { colors: ['#000004', '#fcffa4'], min: 10, max: 70, steps: 8 },
          },
        },
      },
    })
    const pts = document.querySelectorAll('.apexcharts-boxPlot-points')
    expect(pts.length).toBeGreaterThan(1)
    expect(pts.length).toBeLessThanOrEqual(8)
    expect(pts[0].getAttribute('fill')).toMatch(/^rgb\(/)
  })

  test('jitter persists (visible, not stuck hidden) after a re-render — zoom/update regression', async () => {
    const chart = boxChart()

    // a re-render (zoom/update sets globals.dataChanged) used to leave the
    // jitter wrap registered-but-never-revealed → stuck at opacity:0
    await chart.updateSeries([
      {
        name: 'A',
        type: 'boxPlot',
        data: [
          { x: 'G1', y: [11, 21, 41, 51, 71], points: [13, 19, 26, 34, 42, 49] },
          { x: 'G2', y: [26, 31, 36, 46, 61], points: [28, 32, 37, 43, 51] },
        ],
      },
    ])

    const wrap = document.querySelector('.apexcharts-boxPlot-points-wrap')
    expect(wrap).not.toBeNull()
    // dots still drawn...
    expect(document.querySelectorAll('.apexcharts-boxPlot-points').length).toBe(2)
    // ...and now revealed (no longer hidden)
    expect(wrap.classList.contains('apexcharts-element-hidden')).toBe(false)
  })

  test('horizontal boxPlot scatters jitter along the value (x) axis', () => {
    boxChart({
      series: [
        {
          name: 'A',
          // a single box with a wide value spread so x-mapping is observable
          data: [{ x: 'G1', y: [10, 20, 40, 50, 70], points: [12, 25, 38, 50, 62] }],
        },
      ],
      plotOptions: { bar: { horizontal: true }, boxPlot: { points: { show: true } } },
    })
    const pts = document.querySelectorAll('.apexcharts-boxPlot-points')
    // still one packed path per box (5 observations → 5 move commands)
    expect(pts.length).toBe(1)
    expect((pts[0].getAttribute('d').match(/M/g) || []).length).toBe(5)
    // each sub-path starts with "M <x> <y>"; in horizontal mode the value maps
    // to x, so the dot x-coordinates must span a wide range (not stay pinned to
    // a single category column as they would in vertical mode)
    const xs = [...pts[0].getAttribute('d').matchAll(/M\s+([-\d.]+)\s+([-\d.]+)/g)].map(
      (m) => parseFloat(m[1]),
    )
    const xSpread = Math.max(...xs) - Math.min(...xs)
    expect(xSpread).toBeGreaterThan(50)
  })

  test('candlestick charts never get jitter (no raw-observation channel)', () => {
    createChartWithOptions({
      chart: { type: 'candlestick', width: 600, height: 400 },
      // even if a stray points array is supplied, candlesticks ignore it
      series: [{ name: 'A', data: [{ x: 'D1', y: [10, 20, 5, 15], points: [11, 12] }] }],
      plotOptions: { boxPlot: { points: { show: true } } },
    })
    expect(document.querySelectorAll('.apexcharts-boxPlot-points').length).toBe(0)
  })
})
