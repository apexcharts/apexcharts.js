import { createChartWithOptions } from './utils/utils.js'

/**
 * Guards the CSP-safe export path (#5146): the exported SVG must carry no
 * `<style>` tag, and everything the removed stylesheet used to provide has to
 * survive as inline styles instead. Each assertion below maps to a rule in
 * `src/assets/apexcharts-legend.css`; if that file gains a rule that affects
 * layout, it belongs here too.
 */

// The transform under test, applied to the clone the exporter serializes.
//
// Asserted on the clone (and on its serialization) rather than on the output
// of `getSvgString()`: under jsdom that call always returns a `<parsererror>`
// because jsdom's XMLSerializer emits `xmlns` on the `<svg>` root in addition
// to the one svg.js already set, and the re-parse rejects the duplicate. That
// predates this file and is jsdom-only, but it makes `getSvgString()` useless
// as an assertion target here.
function styledClone(chart) {
  const clone = chart.w.dom.elWrap.cloneNode(true)
  chart.ctx.exports.applyExportStyles(clone)
  return clone
}

// Exactly the string the exporter embeds in the exported SVG.
function serializedClone(chart) {
  return new XMLSerializer().serializeToString(styledClone(chart))
}

function styleOf(root, selector) {
  const el = root.querySelector(selector)
  return el ? el.getAttribute('style') || '' : null
}

describe('Export styles (CSP-safe)', () => {
  describe('no injected stylesheet', () => {
    it('serializes no <style> tag even with the legend shown', () => {
      const chart = createChartWithOptions({
        chart: { type: 'line', width: 600, height: 400 },
        series: [
          { name: 'A', data: [10, 20, 30] },
          { name: 'B', data: [15, 25, 35] },
        ],
        legend: { show: true },
      })

      // Sanity check: the live chart *does* inject the stylesheet inside
      // elWrap (Legend's appendToForeignObject), so this test would pass
      // vacuously if that ever stopped being true.
      expect(chart.w.dom.elWrap.querySelectorAll('style').length).toBe(1)

      expect(styledClone(chart).querySelectorAll('style').length).toBe(0)
      expect(serializedClone(chart)).not.toMatch(/<style/i)
    })

    it('serializes no <style> tag with injectStyleSheet disabled', () => {
      const chart = createChartWithOptions({
        chart: {
          type: 'line',
          width: 600,
          height: 400,
          injectStyleSheet: false,
        },
        series: [
          { name: 'A', data: [10, 20, 30] },
          { name: 'B', data: [15, 25, 35] },
        ],
        legend: { show: true },
      })

      expect(serializedClone(chart)).not.toMatch(/<style/i)
    })

    it('carries the inlined legend styles through serialization', () => {
      const chart = createChartWithOptions({
        chart: { type: 'line', width: 600, height: 400 },
        series: [
          { name: 'A', data: [10, 20, 30] },
          { name: 'B', data: [15, 25, 35] },
        ],
        legend: { show: true, fontSize: '20px' },
      })

      expect(serializedClone(chart)).toMatch(/font-size:\s*20px/)
    })
  })

  describe('transient overlays', () => {
    it('hides every yaxis tooltip, not just the first', () => {
      const chart = createChartWithOptions({
        chart: { type: 'line', width: 600, height: 400 },
        series: [
          { name: 'A', data: [10, 20, 30] },
          { name: 'B', data: [150, 250, 350] },
        ],
        yaxis: [
          { seriesName: 'A', tooltip: { enabled: true } },
          { seriesName: 'B', opposite: true, tooltip: { enabled: true } },
        ],
      })

      const clone = styledClone(chart)
      const tooltips = clone.querySelectorAll('.apexcharts-yaxistooltip')
      expect(tooltips.length).toBe(2)
      tooltips.forEach((el) => {
        expect(el.getAttribute('style')).toMatch(/display:\s*none/)
      })
    })

    it('hides the tooltip and toolbar', () => {
      const chart = createChartWithOptions({
        chart: {
          type: 'line',
          width: 600,
          height: 400,
          toolbar: { show: true },
        },
        series: [{ name: 'A', data: [10, 20, 30] }],
      })

      const clone = styledClone(chart)
      expect(styleOf(clone, '.apexcharts-tooltip')).toMatch(/display:\s*none/)
      expect(styleOf(clone, '.apexcharts-toolbar')).toMatch(/display:\s*none/)
    })
  })

  describe('legend layout', () => {
    it('keeps the configured legend.fontSize instead of hardcoding 14px', () => {
      const chart = createChartWithOptions({
        chart: { type: 'line', width: 600, height: 400 },
        series: [
          { name: 'A', data: [10, 20, 30] },
          { name: 'B', data: [15, 25, 35] },
        ],
        legend: { show: true, fontSize: '20px' },
      })

      const style = styleOf(styledClone(chart), '.apexcharts-legend-text')
      expect(style).toMatch(/font-size:\s*20px/)
      expect(style).not.toMatch(/font-size:\s*14px/)
    })

    it('stacks a left-positioned legend into a column', () => {
      const chart = createChartWithOptions({
        chart: { type: 'line', width: 600, height: 400 },
        series: [
          { name: 'A', data: [10, 20, 30] },
          { name: 'B', data: [15, 25, 35] },
        ],
        legend: { show: true, position: 'left' },
      })

      const style = styleOf(styledClone(chart), '.apexcharts-legend')
      expect(style).toMatch(/flex-direction:\s*column/)
      expect(style).toMatch(/justify-content:\s*flex-start/)
    })

    it('lets a bottom legend wrap and honours horizontalAlign', () => {
      const chart = createChartWithOptions({
        chart: { type: 'line', width: 600, height: 400 },
        series: [
          { name: 'A', data: [10, 20, 30] },
          { name: 'B', data: [15, 25, 35] },
        ],
        legend: { show: true, position: 'bottom', horizontalAlign: 'right' },
      })

      const style = styleOf(styledClone(chart), '.apexcharts-legend')
      expect(style).toMatch(/flex-wrap:\s*wrap/)
      expect(style).toMatch(/justify-content:\s*flex-end/)
    })

    it('gives legend markers position: relative', () => {
      const chart = createChartWithOptions({
        chart: { type: 'line', width: 600, height: 400 },
        series: [
          { name: 'A', data: [10, 20, 30] },
          { name: 'B', data: [15, 25, 35] },
        ],
        legend: { show: true },
      })

      const style = styleOf(
        styledClone(chart),
        '.apexcharts-legend-series > .apexcharts-legend-marker',
      )
      expect(style).toMatch(/position:\s*relative/)
      expect(style).toMatch(/display:\s*flex/)
    })

    it('does not style the legend when it is hidden', () => {
      const chart = createChartWithOptions({
        chart: { type: 'line', width: 600, height: 400 },
        series: [{ name: 'A', data: [10, 20, 30] }],
        legend: { show: false },
      })

      const legend = styledClone(chart).querySelector('.apexcharts-legend')
      if (legend) {
        expect(legend.getAttribute('style') || '').not.toMatch(
          /display:\s*flex/,
        )
      }
    })
  })

  describe('module-set inline styles win over the stylesheet defaults', () => {
    it('preserves the heatmap gradient legend wrap overrides', () => {
      const chart = createChartWithOptions({
        chart: { type: 'heatmap', width: 600, height: 320 },
        series: [
          {
            name: 'Mon',
            data: [
              { x: '1', y: 10 },
              { x: '2', y: 30 },
              { x: '3', y: 50 },
            ],
          },
          {
            name: 'Tue',
            data: [
              { x: '1', y: 5 },
              { x: '2', y: 25 },
              { x: '3', y: 45 },
            ],
          },
        ],
        legend: { show: true, position: 'bottom' },
        plotOptions: {
          heatmap: { colorScale: { gradientLegend: { enabled: true } } },
        },
      })

      // Only meaningful if the gradient legend really took over the wrap.
      expect(chart.w.dom.elLegendWrap.style.display).toBe('block')

      const style = styleOf(styledClone(chart), '.apexcharts-legend')
      expect(style).toMatch(/display:\s*block/)
      expect(style).toMatch(/overflow:\s*visible/)
      expect(style).not.toMatch(/display:\s*flex/)
      expect(style).not.toMatch(/overflow:\s*auto/)
    })
  })

  describe('flip classes', () => {
    it('inlines the mirror transform for rounded stacked bars', () => {
      const chart = createChartWithOptions({
        chart: { type: 'bar', stacked: true, width: 600, height: 400 },
        plotOptions: {
          bar: { borderRadius: 5, borderRadiusApplication: 'end' },
        },
        series: [
          { name: 'A', data: [10, 20, 30] },
          { name: 'B', data: [15, 25, 35] },
        ],
        legend: { show: false },
      })

      const live = chart.w.dom.elWrap.querySelectorAll(
        '.apexcharts-flip-x, .apexcharts-flip-y',
      )
      expect(live.length).toBeGreaterThan(0)

      const flipped = styledClone(chart).querySelectorAll(
        '.apexcharts-flip-x, .apexcharts-flip-y',
      )
      expect(flipped.length).toBe(live.length)
      flipped.forEach((el) => {
        expect(el.getAttribute('style')).toMatch(/transform:\s*scaleY\(-1\)/)
      })
    })
  })
})
