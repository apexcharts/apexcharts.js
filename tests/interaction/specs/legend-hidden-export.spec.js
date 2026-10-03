/**
 * Export, a series hidden from the legend draws nothing.
 *
 * A hidden series is drawn to its exit target so hiding animates (a line
 * flattens onto the baseline, a stacked layer onto its neighbour, a radar into
 * its center, points shrink away). That shape used to stay in the DOM at rest,
 * unpainted only by the stylesheet (`.apexcharts-series-collapsed`, opacity 0),
 * and an export cannot rely on the stylesheet (#5146): an exported stacked
 * chart drew the hidden series' line over its neighbour. Now the shape is
 * cleared once the exit is over (Series.settleCollapsedShapes), so there is
 * nothing to export.
 */

import { test, expect } from '@playwright/test'
import { mountChart, toggleLegend } from '../helpers/frames.js'
import { advance } from '../helpers/virtual-time.js'

const NAMES = ['Alpha', 'Beta', 'Gamma']
const CATS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6']

const CASES = {
  'area, stacked': { chart: { type: 'area', stacked: true }, xaxis: { categories: CATS } },
  line: { chart: { type: 'line' }, xaxis: { categories: CATS } },
  radar: { chart: { type: 'radar' }, xaxis: { categories: CATS } },
  scatter: { chart: { type: 'scatter' }, xaxis: { type: 'numeric' }, points: true },
  // A hidden slice closes to zero angle: a line from the center to the rim
  // that its outline still strokes, in its own colour when stroke.colors is
  // per slice (Pie.animateArc clears it once it has closed).
  pie: { chart: { type: 'pie' }, nonAxis: true },
  donut: { chart: { type: 'donut' }, nonAxis: true, stroke: { colors: ['#e53935', '#43a047', '#1e88e5'] } },
}

for (const [id, c] of Object.entries(CASES)) {
  test(`${id}: the exported SVG does not draw a hidden series`, async ({ page }) => {
    const errors = await mountChart(page, {
      chart: { ...c.chart, height: 320, width: 640, toolbar: { show: false } },
      dataLabels: { enabled: false },
      legend: { show: true },
      ...(c.nonAxis
        ? { series: [44, 33, 23], labels: NAMES, ...(c.stroke && { stroke: c.stroke }) }
        : {
            series: NAMES.map((name, k) => ({
              name,
              data: CATS.map((_, i) => (c.points ? [i * 10 + k, 40 + k * 15 + i * 7] : 40 + k * 15 + i * 7)),
            })),
            xaxis: c.xaxis,
          }),
    })
    await toggleLegend(page, 'Beta')
    await advance(page, 4000)

    const drawn = await page.evaluate(async () => {
      const svg = await window.chart.exports.getSvgString()
      const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
      const g = doc.querySelector('.apexcharts-series[seriesName="Beta"]')
      if (!g) return []
      // Anything in the hidden series that would draw: a path with geometry,
      // or any other shape element.
      return [...g.querySelectorAll('path, rect, circle, ellipse, polygon, polyline, line')]
        .filter((el) => el.tagName !== 'path' || (el.getAttribute('d') || '').trim())
        .map((el) => `${el.tagName}.${el.getAttribute('class') || ''}`)
    })

    expect(drawn, 'the hidden series still exports drawable elements').toEqual([])
    expect(errors).toEqual([])
  })
}
