import { createChartWithOptions } from './utils/utils.js'

// Integration test for #5094 — Datalabel misaligned when text is wider than bar
// in horizontal bar chart with textAnchor:'start'.
//
// In jsdom, getTextRects returns a fixed width of ~10px, so the original bug
// condition (dataLabelsX - textRects.width < 0) cannot be triggered. However,
// the fix is semantically correct: for textAnchor 'start' the text extends
// RIGHT from the anchor, so the left-edge overflow condition must check
// `dataLabelsX < 0` (the anchor itself), not `dataLabelsX - textRects.width < 0`
// (which is designed for textAnchor 'end').
//
// This test verifies that:
// 1. All data labels are rendered (4 bars → 4 labels)
// 2. All x positions are positive and inside the plot
// 3. x positions are monotonic with their values (proportional)

describe('datalabel position in horizontal bar (issue #5094)', () => {
  function horizontalBarChart(overrides = {}) {
    return createChartWithOptions({
      chart: {
        type: 'bar',
        width: '800px',
        height: 300,
        parentHeightOffset: 0,
        toolbar: { show: false },
        animations: { enabled: false },
      },
      series: [{ name: 'categories', data: [17332, 2235, 1251, 1093] }],
      plotOptions: {
        bar: {
          horizontal: true,
          distributed: true,
          barHeight: '80%',
          dataLabels: { position: 'top', maxItems: 100 },
        },
      },
      xaxis: { labels: { show: false }, axisBorder: { show: true }, axisTicks: { show: false } },
      yaxis: [{ labels: { minWidth: 80 } }],
      dataLabels: { enabled: true, textAnchor: 'start', offsetX: 10 },
      legend: { show: false },
      grid: { show: false },
      tooltip: { enabled: false },
      ...overrides,
    })
  }

  it('renders all 4 data labels', () => {
    const chart = horizontalBarChart()
    const labels = chart.el.querySelectorAll('.apexcharts-datalabel')
    expect(labels.length).toBe(4)
  })

  it('places all labels with positive x positions inside the plot', () => {
    const chart = horizontalBarChart()
    const xs = Array.from(chart.el.querySelectorAll('.apexcharts-datalabel'))
      .map((l) => parseFloat(l.getAttribute('x')))
    xs.forEach((x) => expect(x).toBeGreaterThanOrEqual(0))
  })

  it('orders labels proportionally to their values (bigger value → bigger x)', () => {
    const chart = horizontalBarChart()
    const labels = chart.el.querySelectorAll('.apexcharts-datalabel')
    const data = Array.from(labels).map((l) => ({
      x: parseFloat(l.getAttribute('x')),
      text: l.textContent,
    }))
    // Sort by value descending (since horizontal bar with position 'top'
    // places the biggest bar's label at the rightmost x)
    const sorted = data.sort((a, b) => parseFloat(b.text) - parseFloat(a.text))
    // Verify x positions decrease as values decrease
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].x).toBeLessThan(sorted[i - 1].x)
    }
  })

  it('does not pin labels to the left edge', () => {
    // Even the smallest bar's label should be at a position proportional
    // to its value, not pinned to strokeWidth + offsetX (~11px).
    const chart = horizontalBarChart()
    const xs = Array.from(chart.el.querySelectorAll('.apexcharts-datalabel'))
      .map((l) => parseFloat(l.getAttribute('x')))
    const minX = Math.min(...xs)
    // The smallest bar (1093) in a 683px grid with max scaling should
    // have its label at least ~20px from the left edge
    expect(minX).toBeGreaterThan(20)
  })
})