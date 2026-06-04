import { createChartWithOptions } from './utils/utils.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRow(name, values) {
  return {
    name,
    data: values.map((v, i) => ({ x: String(i + 1), y: v })),
  }
}

function heatmapChart(opts = {}) {
  return createChartWithOptions({
    chart: { type: 'heatmap', height: 320, width: 600, ...opts.chart },
    series: opts.series || [
      makeRow('Mon', [10, 30, 50, 70, 90]),
      makeRow('Tue', [5, 25, 45, 65, 85]),
      makeRow('Wed', [15, 35, 55, 75, 0]),
    ],
    legend: { show: true, position: 'bottom', ...opts.legend },
    plotOptions: {
      heatmap: {
        ...opts.heatmap,
      },
    },
    colors: opts.colors,
    dataLabels: { enabled: false },
  })
}

function getGradientSvg(chart) {
  return chart.el.querySelector('.apexcharts-heatmap-gradient-legend')
}

function getGradientWrap(chart) {
  return chart.el.querySelector(
    '.apexcharts-legend.apexcharts-heatmap-gradient-legend-wrap',
  )
}

function getHeatmapCells(chart) {
  return chart.el.querySelectorAll('.apexcharts-heatmap-rect')
}

// ===========================================================================
// Bug fix 1: determineColor with min === max
// ===========================================================================
describe('Heatmap color mapping — flat-data fix', () => {
  it('renders cells with a valid fill when every value is identical', () => {
    // All zeros — used to hit the `total === 0` branch where the fallback
    // divisor was `total - 0.000001` (a negative number), producing a
    // huge negative percent and an invalid color string.
    const chart = heatmapChart({
      series: [
        makeRow('A', [0, 0, 0, 0]),
        makeRow('B', [0, 0, 0, 0]),
      ],
    })

    const cells = getHeatmapCells(chart)
    expect(cells.length).toBeGreaterThan(0)
    for (const c of cells) {
      const fill = c.getAttribute('fill') || ''
      // Old behavior produced '#aN...' (NaN.toString(16)). Anything matching
      // a valid color (#hex or rgb/rgba) is acceptable.
      expect(/^(#[0-9a-fA-F]{3,8}|rgb|rgba)/.test(fill)).toBe(true)
      expect(fill.toLowerCase()).not.toContain('nan')
    }
  })

  it('renders cells with a valid fill when every value is the same non-zero number', () => {
    const chart = heatmapChart({
      series: [
        makeRow('A', [42, 42, 42]),
        makeRow('B', [42, 42, 42]),
      ],
    })

    for (const c of getHeatmapCells(chart)) {
      const fill = c.getAttribute('fill') || ''
      expect(fill.toLowerCase()).not.toContain('nan')
    }
  })
})

// ===========================================================================
// Bug fix 2: legend hover boundary matches color-assignment boundary
// ===========================================================================
describe('Heatmap legend hover — boundary inclusive on both sides', () => {
  it('highlights the boundary cell when hovering the range that owns it', () => {
    // Range A owns 0..50 (inclusive); a cell of value exactly 50 was
    // colored by range A but the old hover code (`val < range.to`)
    // would NOT highlight it for range A — it would only highlight for
    // range B (since `val === rangeMax` covered just the global max).
    const chart = heatmapChart({
      series: [
        makeRow('row', [10, 30, 50, 70, 90]),
      ],
      heatmap: {
        colorScale: {
          ranges: [
            { from: 0, to: 50, name: 'Low', color: '#00A100' },
            { from: 51, to: 100, name: 'High', color: '#FF0000' },
          ],
        },
      },
    })

    // Locate the legend item for "Low" (rel="1") and dispatch the
    // mousemove that Legend.onLegendHovered listens for.
    const lowLegend = chart.el.querySelector(
      '.apexcharts-legend-series[rel="1"]',
    )
    expect(lowLegend).not.toBeNull()

    const evt = new MouseEvent('mousemove', { bubbles: true, cancelable: true })
    lowLegend.dispatchEvent(evt)

    const cells = chart.el.querySelectorAll('.apexcharts-heatmap-rect')
    // Pick out the cells matching values 10, 30, 50 — all should stay active.
    const activeCellsForLowRange = Array.from(cells).filter((c) => {
      const v = Number(c.getAttribute('val'))
      return v >= 0 && v <= 50
    })
    expect(activeCellsForLowRange.length).toBeGreaterThan(0)
    for (const c of activeCellsForLowRange) {
      expect(c.classList.contains('apexcharts-inactive-legend')).toBe(false)
    }

    // Cells in the High range must be marked inactive when Low is hovered.
    const inactiveCellsForHighRange = Array.from(cells).filter((c) => {
      const v = Number(c.getAttribute('val'))
      return v > 50
    })
    for (const c of inactiveCellsForHighRange) {
      expect(c.classList.contains('apexcharts-inactive-legend')).toBe(true)
    }
  })
})

// ===========================================================================
// Gradient legend — opt-in gating
// ===========================================================================
describe('Heatmap gradient legend — enabled flag', () => {
  it('renders the standard categorical legend when gradientLegend.enabled !== true', () => {
    const chart = heatmapChart({
      heatmap: {
        colorScale: {
          ranges: [
            { from: 0, to: 50, name: 'Low', color: '#00A100' },
            { from: 51, to: 100, name: 'High', color: '#FF0000' },
          ],
        },
      },
    })

    expect(getGradientSvg(chart)).toBeNull()
    // Standard categorical legend items present.
    expect(
      chart.el.querySelectorAll('.apexcharts-legend-series').length,
    ).toBeGreaterThan(0)
  })

  it('renders the gradient strip when gradientLegend.enabled is true', () => {
    const chart = heatmapChart({
      heatmap: {
        colorScale: {
          gradientLegend: { enabled: true },
        },
      },
    })

    expect(getGradientSvg(chart)).not.toBeNull()
    // No categorical items rendered alongside the gradient.
    expect(
      chart.el.querySelectorAll('.apexcharts-legend-series').length,
    ).toBe(0)
  })
})

// ===========================================================================
// Gradient legend — DOM structure
// ===========================================================================
describe('Heatmap gradient legend — DOM structure', () => {
  it('contains a linearGradient with multiple stops, a strip rect, and an arrow polygon', () => {
    const chart = heatmapChart({
      heatmap: { colorScale: { gradientLegend: { enabled: true } } },
    })

    const svg = getGradientSvg(chart)
    expect(svg).not.toBeNull()

    const linearGrad = svg.querySelector('linearGradient')
    expect(linearGrad).not.toBeNull()
    expect(linearGrad.querySelectorAll('stop').length).toBeGreaterThan(1)

    // Strip is the only rect inside the gradient legend SVG and must reference
    // the gradient via fill="url(#...)".
    const rect = svg.querySelector('rect')
    expect(rect).not.toBeNull()
    expect(rect.getAttribute('fill') || '').toMatch(/^url\(#/)

    // Arrow polygon present (hidden until hover).
    const polygon = svg.querySelector('polygon.apexcharts-heatmap-gradient-arrow')
    expect(polygon).not.toBeNull()
    expect(polygon.getAttribute('opacity')).toBe('0')
  })

  it('places hard color stops at each range boundary in ranges mode', () => {
    const chart = heatmapChart({
      heatmap: {
        colorScale: {
          ranges: [
            { from: 0, to: 50, color: '#00A100' },
            { from: 51, to: 100, color: '#FF0000' },
          ],
          gradientLegend: { enabled: true },
        },
      },
    })

    const stops = getGradientSvg(chart).querySelectorAll('stop')
    const colors = Array.from(stops).map((s) =>
      (s.getAttribute('stop-color') || '').toLowerCase(),
    )
    // 2 ranges × 2 stops each (boundary doubled to produce a hard band).
    expect(colors.length).toBe(4)
    expect(colors).toContain('#00a100')
    expect(colors).toContain('#ff0000')
  })
})

// ===========================================================================
// Gradient legend — min/max derived from series data
// (regression: globals.minY/maxY are uninitialized at legend.init() time)
// ===========================================================================
describe('Heatmap gradient legend — min/max derivation', () => {
  it('labels the strip with the actual data min and max, not Number.MAX_VALUE', () => {
    const chart = heatmapChart({
      series: [
        makeRow('A', [0, 25, 50, 75, 90]),
        makeRow('B', [10, 35, 60, 85, 88]),
      ],
      heatmap: {
        colorScale: {
          gradientLegend: {
            enabled: true,
            showLabels: true,
            formatter: (v) => String(Math.round(v)),
          },
        },
      },
    })

    const labels = Array.from(
      getGradientSvg(chart).querySelectorAll('text'),
    ).map((t) => t.textContent)

    expect(labels).toContain('0')
    expect(labels).toContain('90')
    // Specifically guard against the Number.MAX_VALUE regression.
    for (const lbl of labels) {
      expect(lbl).not.toMatch(/e\+/i)
    }
  })

  it('respects colorScale.min / colorScale.max bounds', () => {
    const chart = heatmapChart({
      series: [makeRow('A', [10, 20, 30])],
      heatmap: {
        colorScale: {
          min: -20,
          max: 50,
          gradientLegend: {
            enabled: true,
            formatter: (v) => String(Math.round(v)),
          },
        },
      },
    })

    const labels = Array.from(
      getGradientSvg(chart).querySelectorAll('text'),
    ).map((t) => t.textContent)
    expect(labels).toContain('-20')
    expect(labels).toContain('50')
  })
})

// ===========================================================================
// Gradient legend — wrap alignment positioning
// ===========================================================================
describe('Heatmap gradient legend — alignment', () => {
  // Chart canvas: 600 × 320. We deliberately use a small strip (30%) so
  // there's enough slack between start/center/end positions for the
  // assertions to be clearly distinct.
  const SMALL = '30%'

  // Horizontal placements — align controls `left`.
  // chartWidth=600, stripLen=180, svgWidth=236, slack≈340.
  // start: ~0.02, center: ~0.30, end: ~0.59
  const horizontalCases = [
    ['top', 'start', 'left', 'start'],
    ['top', 'center', 'left', 'center'],
    ['top', 'end', 'left', 'end'],
    ['bottom', 'start', 'left', 'start'],
    ['bottom', 'center', 'left', 'center'],
    ['bottom', 'end', 'left', 'end'],
  ]

  // Vertical placements — align controls `top`.
  // chartHeight=320, stripLen=96, svgHeight=136, slack≈160.
  // start: ~0.04, center: ~0.29, end: ~0.54
  const verticalCases = [
    ['left', 'start', 'top', 'start'],
    ['left', 'center', 'top', 'center'],
    ['left', 'end', 'top', 'end'],
    ['right', 'start', 'top', 'start'],
    ['right', 'center', 'top', 'center'],
    ['right', 'end', 'top', 'end'],
  ]

  for (const [position, align, axis, band] of [...horizontalCases, ...verticalCases]) {
    it(`positions wrap correctly for position=${position}, align=${align}`, () => {
      const chart = heatmapChart({
        legend: { position },
        heatmap: {
          colorScale: {
            gradientLegend: { enabled: true, align, width: SMALL, height: SMALL },
          },
        },
      })

      const wrap = getGradientWrap(chart)
      expect(wrap).not.toBeNull()

      const px = parseFloat(wrap.style[axis])
      expect(Number.isFinite(px)).toBe(true)

      const chartDim = axis === 'left' ? 600 : 320
      const ratio = px / chartDim

      if (band === 'start') {
        // Strip pinned near the leading edge.
        expect(ratio).toBeLessThan(0.15)
      } else if (band === 'center') {
        // Roughly halfway through the available slack.
        expect(ratio).toBeGreaterThan(0.15)
        expect(ratio).toBeLessThan(0.45)
      } else {
        // align: end → far past the start, into the trailing half.
        expect(ratio).toBeGreaterThan(0.4)
      }
    })
  }

  it('resolves percentage widths against the chart SVG width', () => {
    const chartA = heatmapChart({
      legend: { position: 'bottom' },
      heatmap: {
        colorScale: {
          gradientLegend: { enabled: true, width: '50%', align: 'start' },
        },
      },
    })
    const chartB = heatmapChart({
      legend: { position: 'bottom' },
      heatmap: {
        colorScale: {
          gradientLegend: { enabled: true, width: '90%', align: 'start' },
        },
      },
    })

    const widthA = parseFloat(getGradientWrap(chartA).style.width)
    const widthB = parseFloat(getGradientWrap(chartB).style.width)

    // Wider config → wider wrap.
    expect(widthB).toBeGreaterThan(widthA)
    // Both are reasonable percentages of the 600px chart (with label padding).
    expect(widthA).toBeGreaterThan(200)
    expect(widthA).toBeLessThan(450)
    expect(widthB).toBeGreaterThan(450)
  })

  it('accepts a pixel number for width and uses it verbatim', () => {
    const chart = heatmapChart({
      legend: { position: 'bottom' },
      heatmap: {
        colorScale: {
          gradientLegend: { enabled: true, width: 200, align: 'start' },
        },
      },
    })

    // svgWidth = stripLength + 2 * labelPadAlongStrip(28) = 200 + 56 = 256
    const wrapWidth = parseFloat(getGradientWrap(chart).style.width)
    expect(wrapWidth).toBe(256)
  })
})
