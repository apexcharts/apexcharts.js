import { createChartWithOptions } from './utils/utils.js'

// ---------------------------------------------------------------------------
// A small, deterministic density profile + raw observations per category.
// ---------------------------------------------------------------------------
const density = [
  [0, 0.02],
  [1, 0.1],
  [2, 0.35],
  [3, 0.5],
  [4, 0.35],
  [5, 0.1],
  [6, 0.02],
]

function violinChart(opts = {}) {
  return createChartWithOptions({
    // jsdom reports 0-size elements, so set explicit dimensions for real coords
    chart: { type: 'violin', width: 600, height: 400, ...opts.chart },
    series: opts.series || [
      {
        name: 'A',
        data: [
          { x: 'G1', y: { density, points: [1, 2, 2.5, 3, 3.2, 4, 4.5] } },
          { x: 'G2', y: { density, points: [0.5, 1.5, 3, 3.5, 5] } },
        ],
      },
    ],
    plotOptions: opts.plotOptions || {},
    dataLabels: { enabled: false },
    stroke: opts.stroke || {},
    ...opts.extra,
  })
}

describe('violin chart — data parsing', () => {
  test('parses density + points into the violinData slice', () => {
    const chart = violinChart()
    const vd = chart.w.violinData

    expect(vd.seriesViolinDensity[0]).toHaveLength(2)
    expect(vd.seriesViolinDensity[0][0].values).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(vd.seriesViolinDensity[0][0].maxWeight).toBe(0.5)
    expect(vd.seriesViolinPoints[0][0]).toEqual([1, 2, 2.5, 3, 3.2, 4, 4.5])
  })

  test('extent (min/max) includes both density values and raw points', () => {
    const chart = violinChart({
      series: [
        {
          name: 'A',
          // a raw point (9) lies beyond the density value range (0..6)
          data: [{ x: 'G1', y: { density, points: [1, 9] } }],
        },
      ],
    })
    const vd = chart.w.violinData
    expect(vd.seriesViolinMin[0][0]).toBe(0)
    expect(vd.seriesViolinMax[0][0]).toBe(9)
  })

  test('y-axis scales to the data extent (does not force a 0 baseline)', () => {
    const highDensity = [
      [60, 0.1],
      [70, 0.5],
      [80, 1.0],
      [90, 0.5],
      [100, 0.1],
    ]
    const chart = violinChart({
      series: [
        {
          name: 'W',
          data: [{ x: 'A', y: { density: highDensity, points: [65, 95] } }],
        },
      ],
    })
    // min should sit near the data (60), not collapse to 0
    expect(chart.w.globals.minY).toBeGreaterThan(40)
  })

  test('representative y placeholder is the density mode', () => {
    const chart = violinChart()
    // mode of the density is value 3 (weight 0.5)
    expect(chart.w.seriesData.series[0][0]).toBe(3)
  })

  test('zoom/pan is disabled by default (category distribution chart)', () => {
    const chart = violinChart()
    expect(chart.w.config.chart.zoom.enabled).toBe(false)
  })

  test('an explicit zoom.enabled:true still overrides the violin default', () => {
    const chart = violinChart({ chart: { zoom: { enabled: true } } })
    expect(chart.w.config.chart.zoom.enabled).toBe(true)
  })

  test('y-axis labels round to at most 2 decimals (no trailing zeros)', () => {
    const chart = violinChart()
    const f = chart.w.formatters.yLabelFormatters[0]
    expect(f(41.666667)).toBe('41.67')
    expect(f(42)).toBe('42')
    expect(f(42.5)).toBe('42.5')
  })

  test('a user-supplied y-axis formatter overrides the violin rounding', () => {
    const chart = violinChart({
      extra: { yaxis: { labels: { formatter: (v) => Math.round(v) + ' u' } } },
    })
    expect(chart.w.formatters.yLabelFormatters[0](42.6)).toBe('43 u')
  })
})

describe('violin chart — rendering', () => {
  test('renders a violin series group with a body path', () => {
    violinChart()
    const series = document.querySelector('.apexcharts-violin-series')
    expect(series).not.toBeNull()
    const bodies = document.querySelectorAll('.apexcharts-violin-area')
    expect(bodies.length).toBeGreaterThanOrEqual(2)
  })

  test('jitter renders one packed path per violin (not one node per point)', () => {
    violinChart() // single series, two violins (G1, G2)
    const pointPaths = document.querySelectorAll('.apexcharts-violin-points')
    // one node per violin — NOT one per observation
    expect(pointPaths.length).toBe(2)
    // each path packs many sub-paths (multiple "M" move commands)
    const d = pointPaths[0].getAttribute('d')
    expect((d.match(/M/g) || []).length).toBeGreaterThan(3)
  })

  test('jitter dots default to a darker shade of the violin colour with a white outline', () => {
    const chart = violinChart()
    const pts = document.querySelector('.apexcharts-violin-points')
    // white outline by default
    expect(pts.getAttribute('stroke')).toBe('#fff')
    expect(Number(pts.getAttribute('stroke-width'))).toBeGreaterThan(0)
    // fill is a darkened (rgb) tone of the violin's own colour — not white,
    // not the raw violin colour
    const fill = pts.getAttribute('fill')
    expect(fill).toMatch(/^rgb\(/)
    expect(fill).not.toBe('#fff')
    expect(fill).not.toBe(chart.w.globals.colors[0])
    // overall brightness must drop (darker than the source colour)
    const src = chart.w.globals.colors[0].replace('#', '')
    const srcSum =
      parseInt(src.slice(0, 2), 16) +
      parseInt(src.slice(2, 4), 16) +
      parseInt(src.slice(4, 6), 16)
    const [fr, fg, fb] = fill.match(/\d+/g).map(Number)
    expect(fr + fg + fb).toBeLessThan(srcSum)
  })

  test('points.colorScale buckets dots into value-graded shade paths', () => {
    // one violin, many points spanning the value range → multiple shade
    // groups, each a distinct fill, but still far fewer nodes than points
    const many = Array.from({ length: 600 }, (_, k) => (k % 60) / 10) // 0..5.9
    violinChart({
      series: [
        { name: 'A', data: [{ x: 'G1', y: { density, points: many } }] },
      ],
      plotOptions: {
        violin: {
          points: {
            colorScale: {
              colors: ['#000004', '#fcffa4'],
              min: 0,
              max: 6,
              steps: 8,
            },
          },
        },
      },
    })
    const pts = document.querySelectorAll('.apexcharts-violin-points')
    // multiple shade groups for the single violin...
    expect(pts.length).toBeGreaterThan(1)
    // ...but bounded by `steps`, never approaching the 600 points
    expect(pts.length).toBeLessThanOrEqual(8)
    // distinct fills along the ramp (first ≠ last shade)
    const fills = new Set([...pts].map((p) => p.getAttribute('fill')))
    expect(fills.size).toBeGreaterThan(1)
    // ramp endpoints interpolate between the supplied stops (rgb output)
    ;[...pts].forEach((p) => expect(p.getAttribute('fill')).toMatch(/^rgb\(/))
  })

  test("fillColor:'series' colours each jitter cloud by its own violin", () => {
    const chart = violinChart({
      plotOptions: {
        bar: { distributed: true },
        violin: { points: { fillColor: 'series' } },
      },
    })
    const w = chart.w
    const pts = document.querySelectorAll('.apexcharts-violin-points')
    expect(pts.length).toBe(2)
    expect(pts[0].getAttribute('fill')).toBe(w.globals.colors[0])
    expect(pts[1].getAttribute('fill')).toBe(w.globals.colors[1])
    expect(pts[0].getAttribute('fill')).not.toBe(pts[1].getAttribute('fill'))
  })

  test('jitter uses the widened bar mask and is drawn above the violin bodies', () => {
    violinChart()
    const series = document.querySelector(
      '.apexcharts-violin-series .apexcharts-series',
    )
    const kids = Array.from(series.children).map((c) => c.getAttribute('class'))
    // points path must be the LAST child → painted on top of all bodies
    expect(kids[kids.length - 1]).toContain('apexcharts-violin-points')
    // and clipped by the widened bar mask (same as the body) so outer halves
    // of edge violins are not clipped
    const clip = document
      .querySelector('.apexcharts-violin-points')
      .getAttribute('clip-path')
    expect(clip).toContain('gridRectBarMask')
  })

  test('jitter renders visible when there is no entrance animation (never stuck hidden)', () => {
    // harness disables animations → no path-grow animation to reveal a delayed
    // overlay, so the jitter wrap must render visible rather than stay hidden
    // (this is what kept it from disappearing on zoom/update too)
    violinChart()
    const wrap = document.querySelector('.apexcharts-violin-points-wrap')
    expect(wrap).not.toBeNull()
    expect(wrap.classList.contains('apexcharts-element-hidden')).toBe(false)
  })

  test('jitter overlay is non-interactive (no hover flicker)', () => {
    violinChart()
    const pts = document.querySelector('.apexcharts-violin-points')
    expect(pts.style.pointerEvents).toBe('none')
  })

  test('body paths expose j + cx so the shared tooltip can position over them', () => {
    violinChart()
    // moveStickyTooltipOverBars() resolves the hovered violin via this selector
    const body = document.querySelector(
      ".apexcharts-violin-series .apexcharts-series[rel='1'] path[j='0']",
    )
    expect(body).not.toBeNull()
    expect(body.classList.contains('apexcharts-violin-area')).toBe(true)
    expect(Number(body.getAttribute('cx'))).toBeGreaterThan(0)
  })

  test('body cy is re-anchored to the violin middle (not the axis base)', () => {
    const chart = violinChart()
    const gridH = chart.w.layout.gridHeight
    const bodies = document.querySelectorAll('.apexcharts-violin-area')
    bodies.forEach((b) => {
      const cy = Number(b.getAttribute('cy'))
      // tooltip reads this cy; it must sit inside the grid (near the
      // representative value), not collapse to the baseline / chart base
      expect(cy).toBeGreaterThan(0)
      expect(cy).toBeLessThan(gridH)
    })
  })

  test('points.show:false omits the points path entirely', () => {
    violinChart({ plotOptions: { violin: { points: { show: false } } } })
    expect(document.querySelectorAll('.apexcharts-violin-points').length).toBe(
      0,
    )
  })

  test('a violin with no raw points draws no points path', () => {
    violinChart({
      series: [{ name: 'A', data: [{ x: 'G1', y: { density, points: [] } }] }],
    })
    expect(document.querySelectorAll('.apexcharts-violin-points').length).toBe(
      0,
    )
  })

  test('horizontal mode renders', () => {
    violinChart({ plotOptions: { bar: { horizontal: true } } })
    expect(document.querySelector('.apexcharts-violin-series')).not.toBeNull()
    expect(
      document.querySelectorAll('.apexcharts-violin-area').length,
    ).toBeGreaterThanOrEqual(2)
  })

  test('horizontal mode keeps the category axis (no cat→numeric) and scales the value axis to the data', () => {
    // Regression: horizontal violin used to fall through to cat→numeric
    // conversion (only bar/boxPlot were guarded), collapsing the value
    // extent to the default 0..100 and emptying the value-axis labels.
    const chart = violinChart({ plotOptions: { bar: { horizontal: true } } })
    const w = chart.w
    expect(w.axisFlags.isXNumeric).toBe(false)
    // density spans 0..6 across the two groups → value axis tracks it,
    // not a forced 0..100
    expect(w.globals.minY).toBe(0)
    expect(w.globals.maxY).toBeLessThanOrEqual(10)
    expect(w.globals.maxY).toBeGreaterThanOrEqual(6)
    // category labels resolve to the group names, not numeric indices
    expect(w.globals.labels).toEqual(['G1', 'G2'])
  })
})

describe('violin chart — distributed colors & normalize', () => {
  const denseDensity = [
    [0, 0.05],
    [1, 0.4],
    [2, 1.0],
    [3, 0.4],
    [4, 0.05],
  ] // peak weight 1.0
  const flatDensity = [
    [0, 0.1],
    [1, 0.2],
    [2, 0.3],
    [3, 0.2],
    [4, 0.1],
  ] // peak weight 0.3

  function twoViolins(plotOptions) {
    return createChartWithOptions({
      chart: { type: 'violin', width: 600, height: 400 },
      colors: ['#ff0000', '#0000ff'],
      series: [
        {
          name: 'S',
          data: [
            { x: 'A', y: { density: denseDensity, points: [] } },
            { x: 'B', y: { density: flatDensity, points: [] } },
          ],
        },
      ],
      dataLabels: { enabled: false },
      plotOptions,
    })
  }

  test('distributed gives each violin its own fill color', () => {
    twoViolins({ bar: { distributed: true } })
    const bodies = document.querySelectorAll('.apexcharts-violin-area')
    const f0 = bodies[0].getAttribute('fill')
    const f1 = bodies[1].getAttribute('fill')
    expect(f0).not.toBe(f1)
  })

  test("normalize:'group' narrows the less-dense violin; 'individual' does not", () => {
    twoViolins({ violin: { normalize: 'individual' } })
    const indivB = document
      .querySelectorAll('.apexcharts-violin-area')[1]
      .getAttribute('d')
    twoViolins({ violin: { normalize: 'group' } })
    const groupA = document
      .querySelectorAll('.apexcharts-violin-area')[0]
      .getAttribute('d')
    const groupB = document
      .querySelectorAll('.apexcharts-violin-area')[1]
      .getAttribute('d')
    twoViolins({ violin: { normalize: 'individual' } })
    const indivA = document
      .querySelectorAll('.apexcharts-violin-area')[0]
      .getAttribute('d')

    // densest violin (A) is unchanged — it already sets the group scale
    expect(groupA).toBe(indivA)
    // the flatter violin (B) is rescaled (narrower) under group normalization
    expect(groupB).not.toBe(indivB)
  })
})

describe('violin chart — deterministic jitter', () => {
  test('identical input produces an identical points path (SSR-safe)', () => {
    violinChart()
    const d1 = document
      .querySelector('.apexcharts-violin-points')
      .getAttribute('d')
    violinChart()
    const d2 = document
      .querySelector('.apexcharts-violin-points')
      .getAttribute('d')
    expect(d1).toBe(d2)
  })

  test('maxPoints stride-thins large point arrays', () => {
    const many = Array.from({ length: 10000 }, (_, k) => (k % 7) + 0.5)
    violinChart({
      series: [
        { name: 'A', data: [{ x: 'G1', y: { density, points: many } }] },
      ],
      plotOptions: { violin: { points: { maxPoints: 100 } } },
    })
    const d = document
      .querySelector('.apexcharts-violin-points')
      .getAttribute('d')
    const circles = (d.match(/M/g) || []).length
    // stride = ceil(10000/100) = 100 → ~100 circles, definitely far below 10000
    expect(circles).toBeLessThanOrEqual(120)
    expect(circles).toBeGreaterThan(50)
  })
})
