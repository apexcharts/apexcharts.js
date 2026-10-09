import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SSRRenderer } from '../../../src/ssr/SSRRenderer.js'
import { BrowserAPIs } from '../../../src/ssr/BrowserAPIs.js'

// Register all chart types and features as side-effects. SSRRenderer imports the
// bare ApexCharts class directly, so chart types must be pre-registered here.
import '../../../src/entries/standard.js'

describe('SSRRenderer', () => {
  describe('_encodeConfig()', () => {
    it('should encode config to base64', () => {
      const config = {
        series: [{ data: [30, 40, 35] }],
        chart: { type: 'bar' },
      }

      const encoded = SSRRenderer._encodeConfig(config)

      expect(typeof encoded).toBe('string')
      expect(encoded.length).toBeGreaterThan(0)
      // Verify it's valid base64 (no whitespace, only valid base64 characters)
      expect(/^[A-Za-z0-9+/]+=*$/.test(encoded)).toBe(true)
    })

    it('should handle complex nested objects', () => {
      const config = {
        series: [{ data: [1, 2, 3] }],
        chart: {
          type: 'line',
          animations: {
            enabled: true,
            speed: 800,
            dynamicAnimation: {
              enabled: true,
              speed: 350,
            },
          },
        },
        xaxis: { categories: ['A', 'B', 'C'] },
      }

      const encoded = SSRRenderer._encodeConfig(config)
      expect(typeof encoded).toBe('string')
      expect(encoded.length).toBeGreaterThan(0)
    })

    it('should handle arrays in config', () => {
      const config = {
        series: [
          { name: 'Series 1', data: [30, 40, 35] },
          { name: 'Series 2', data: [50, 60, 55] },
        ],
      }

      const encoded = SSRRenderer._encodeConfig(config)
      expect(typeof encoded).toBe('string')
      expect(encoded.length).toBeGreaterThan(0)
    })

    it('should handle empty objects', () => {
      const encoded = SSRRenderer._encodeConfig({})
      expect(typeof encoded).toBe('string')
      expect(encoded).toBe('e30=') // Base64 for '{}'
    })
  })

  describe('_decodeConfig()', () => {
    it('should decode base64 to config object', () => {
      const config = {
        series: [{ data: [30, 40, 35] }],
        chart: { type: 'bar' },
        xaxis: { categories: ['A', 'B', 'C'] },
      }

      const encoded = SSRRenderer._encodeConfig(config)
      const decoded = SSRRenderer._decodeConfig(encoded)

      expect(decoded).toEqual(config)
    })

    it('should handle complex nested objects', () => {
      const config = {
        series: [{ data: [1, 2, 3] }],
        chart: {
          type: 'line',
          animations: {
            enabled: true,
            speed: 800,
            dynamicAnimation: {
              enabled: true,
              speed: 350,
            },
          },
        },
      }

      const encoded = SSRRenderer._encodeConfig(config)
      const decoded = SSRRenderer._decodeConfig(encoded)

      expect(decoded).toEqual(config)
    })

    it('should handle arrays in config', () => {
      const config = {
        series: [
          { name: 'Series 1', data: [30, 40, 35] },
          { name: 'Series 2', data: [50, 60, 55] },
        ],
      }

      const encoded = SSRRenderer._encodeConfig(config)
      const decoded = SSRRenderer._decodeConfig(encoded)

      expect(decoded).toEqual(config)
    })

    it('should throw error for invalid base64', () => {
      expect(() => {
        SSRRenderer._decodeConfig('invalid-base64-!@#$%')
      }).toThrow()
    })

    it('should throw error for invalid JSON after decode', () => {
      // Valid base64 but invalid JSON
      const invalidBase64 = Buffer.from('not valid json').toString('base64')
      expect(() => {
        SSRRenderer._decodeConfig(invalidBase64)
      }).toThrow()
    })
  })

  describe('_applyScale()', () => {
    it('should scale SVG width and height', () => {
      const svgString = '<svg width="400" height="300"></svg>'
      const scaled = SSRRenderer._applyScale(svgString, 2)

      expect(scaled).toContain('width="800"')
      expect(scaled).toContain('height="600"')
    })

    it('should handle scale of 1 (no change)', () => {
      const svgString = '<svg width="400" height="300"></svg>'
      const scaled = SSRRenderer._applyScale(svgString, 1)

      expect(scaled).toContain('width="400"')
      expect(scaled).toContain('height="300"')
    })

    it('should handle fractional scale', () => {
      const svgString = '<svg width="400" height="300"></svg>'
      const scaled = SSRRenderer._applyScale(svgString, 0.5)

      expect(scaled).toContain('width="200"')
      expect(scaled).toContain('height="150"')
    })

    it('should handle large scale factors', () => {
      const svgString = '<svg width="100" height="100"></svg>'
      const scaled = SSRRenderer._applyScale(svgString, 5)

      expect(scaled).toContain('width="500"')
      expect(scaled).toContain('height="500"')
    })

    it('should preserve SVG without dimensions', () => {
      const svgString = '<svg></svg>'
      const scaled = SSRRenderer._applyScale(svgString, 2)

      expect(scaled).toBe('<svg></svg>')
    })

    it('should preserve other SVG attributes', () => {
      const svgString =
        '<svg width="400" height="300" viewBox="0 0 400 300" class="my-chart"></svg>'
      const scaled = SSRRenderer._applyScale(svgString, 2)

      expect(scaled).toContain('viewBox="0 0 400 300"')
      expect(scaled).toContain('class="my-chart"')
      expect(scaled).toContain('width="800"')
      expect(scaled).toContain('height="600"')
    })

    it('should not scale SVG with only width (needs both dimensions)', () => {
      const svgString = '<svg width="400"></svg>'
      const scaled = SSRRenderer._applyScale(svgString, 2)

      // _applyScale only works when both width AND height are present
      expect(scaled).toBe('<svg width="400"></svg>')
    })

    it('should not scale SVG with only height (needs both dimensions)', () => {
      const svgString = '<svg height="300"></svg>'
      const scaled = SSRRenderer._applyScale(svgString, 2)

      // _applyScale only works when both width AND height are present
      expect(scaled).toBe('<svg height="300"></svg>')
    })
  })

  // ── End-to-end renderToString / renderToHTML ──────────────────────────────
  //
  // These tests simulate a true Node.js (SSR) environment by nulling out
  // window, document, and navigator — the same technique used by
  // environment.spec.js. BrowserAPIs shim is reset between tests so
  // state from one render doesn't leak into the next.

  describe('renderToString() — SSR environment simulation', () => {
    let savedWindow, savedDocument, savedNavigator

    beforeEach(() => {
      savedWindow = global.window
      savedDocument = global.document
      savedNavigator = global.navigator

      // Simulate Node.js: no window, no document, no navigator
      global.window = undefined
      global.document = undefined
      global.navigator = undefined

      // Reset the BrowserAPIs shim so each test starts clean
      BrowserAPIs._resetShim()
    })

    afterEach(() => {
      global.window = savedWindow
      global.document = savedDocument
      global.navigator = savedNavigator
      BrowserAPIs._resetShim()
    })

    it('renders a line chart to an SVG string without throwing', async () => {
      const svg = await SSRRenderer.renderToString({
        series: [{ name: 'Sales', data: [30, 40, 35, 50, 49, 60] }],
        chart: { type: 'line' },
        xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
      })

      expect(typeof svg).toBe('string')
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
    })

    it('renders a bar chart to an SVG string without throwing', async () => {
      const svg = await SSRRenderer.renderToString({
        series: [{ name: 'Revenue', data: [10, 20, 30] }],
        chart: { type: 'bar' },
        xaxis: { categories: ['Q1', 'Q2', 'Q3'] },
      })

      expect(typeof svg).toBe('string')
      expect(svg).toContain('<svg')
    })

    it('renders a highlight-filter part as the final frame', async () => {
      await import('../../../src/features/highlight-filter.js')
      const svg = await SSRRenderer.renderToString({
        series: [{ name: 'Revenue', data: [10, 20, 30], highlightData: [4, 8, 12] }],
        chart: { type: 'bar' },
        xaxis: { categories: ['Q1', 'Q2', 'Q3'] },
      })

      // three parts drawn solid, every whole faded
      expect(svg.match(/apexcharts-bar-highlight-part/g)?.length).toBe(3)
      expect(svg).toContain('fill-opacity="0.2"')
      // the parts are solid: the wholes' ink, landed at full strength
      const parts = svg.match(/<path[^>]*apexcharts-bar-highlight-part[^>]*>/g)
      for (const p of parts) {
        expect(p).toMatch(/fill="rgb\(/)
        expect(p).toContain('fill-opacity="1"')
      }
    })

    it('renders a highlighted donut as the final frame', async () => {
      await import('../../../src/features/highlight-filter.js')
      const svg = await SSRRenderer.renderToString({
        chart: { type: 'donut', width: 400, height: 400 },
        series: [40, 30, 20, 10],
        labels: ['North', 'South', 'East', 'West'],
        dataLabels: { enabled: true },
        plotOptions: {
          pie: { donut: { labels: { show: true, total: { show: true } } } },
        },
        highlightFilter: { data: [20, 15, 5, null] },
      })
      // three parts solid, every slice faded, the centre stating the parts
      expect(svg.match(/apexcharts-pie-highlight-part/g)?.length).toBe(3)
      expect(svg.match(/fill-opacity="0.2"/g)?.length).toBe(4)
      expect(svg).toMatch(/>Total<\/text><text[^>]*>40</)
      // each label states its part, none is left mid-ride, and the slice
      // with no part has none
      for (const l of ['20.0%', '15.0%', '5.0%']) {
        expect(svg).toMatch(new RegExp(`<text(?![^>]*transform)[^>]*>${l}<`))
      }
      expect(svg).not.toContain('>10.0%<')
    })

    it('renders a highlighted gauge and rings as the final frame', async () => {
      await import('../../../src/features/highlight-filter.js')
      // (A radialBar's centre labels do not server-render yet, highlight or
      // not: Pie.renderInnerDataLabels finds no labels group there.)
      const plotOptions = { radialBar: { dataLabels: { show: false } } }
      const gauge = await SSRRenderer.renderToString({
        chart: { type: 'gauge', width: 400, height: 400 },
        series: [70],
        plotOptions,
        highlightFilter: { data: [40], radialBar: { indicator: 'arc' } },
      })
      // an arc gauge splits its arc: the ring faded, the part solid on it
      expect(gauge.match(/apexcharts-radialbar-highlight-part/g)?.length).toBe(
        1,
      )
      expect(gauge).toContain('stroke-opacity="0.2"')
      expect(gauge).not.toContain('apexcharts-gauge-needle-highlight')
      const dial = await SSRRenderer.renderToString({
        chart: { type: 'gauge', width: 400, height: 400 },
        series: [70],
        plotOptions: { radialBar: { ...plotOptions.radialBar, shape: 'needle' } },
        highlightFilter: { data: [40] },
      })
      // a needle gauge: the second needle at the part, landed, and its own
      // needle faded as the whole
      expect(dial).toMatch(
        /class="apexcharts-gauge-needle-highlight"[^>]*transform="rotate\(-27/,
      )
      expect(dial).toMatch(/class="apexcharts-gauge-needle"[^>]*opacity="0.2"/)
      const rings = await SSRRenderer.renderToString({
        chart: { type: 'radialBar', width: 400, height: 400 },
        series: [70, 50],
        plotOptions,
        highlightFilter: { data: [40, 80] },
      })
      // each ring faded, its part solid on it (one past its whole, whose end
      // a landed tick marks)
      expect(rings.match(/apexcharts-radialbar-highlight-part/g)?.length).toBe(
        2,
      )
      expect(rings.match(/stroke-opacity="0.2"/g)?.length).toBe(2)
      expect(rings).toContain('apexcharts-highlight-part')
      expect(
        rings.match(
          /<path[^>]*apexcharts-radialbar-highlight-edge[^>]*stroke-opacity="0.75"|<path[^>]*stroke-opacity="0.75"[^>]*apexcharts-radialbar-highlight-edge/g,
        )?.length,
      ).toBe(1)
    })

    it('renders a single dial split in lanes, its centre included', async () => {
      await import('../../../src/features/highlight-filter.js')
      const svg = await SSRRenderer.renderToString({
        chart: { type: 'gauge', width: 400, height: 400 },
        series: [70],
        highlightFilter: { data: [40], radialBar: { indicator: 'lanes' } },
      })
      // the ring hidden under its two lanes, landed, and the inner lane's
      // own track beside the ring's
      expect(svg.match(/apexcharts-radialbar-highlight-lane/g)?.length).toBe(2)
      expect(svg).toMatch(
        /<path[^>]*stroke-opacity="0"[^>]*apexcharts-radialbar-slice-0/,
      )
      expect(svg).toMatch(
        /<path[^>]*stroke-opacity="0.45"[^>]*apexcharts-radialbar-highlight-whole/,
      )
      expect(svg).toContain('apexcharts-radialbar-highlight-track')
      expect(svg).not.toContain('apexcharts-radialbar-highlight-edge')
      // the centre: the part, and the whole under it, at full strength
      expect(svg).toMatch(/>40%<\/text>/)
      expect(svg).toMatch(
        /<text(?![^>]*opacity="0")[^>]*apexcharts-datalabel-whole[^>]*>\/ 70%<\/text>/,
      )
    })

    it('renders a highlighted line and area as the final frame', async () => {
      await import('../../../src/features/highlight-filter.js')
      const series = [
        { name: 'Visits', data: [10, 20, 30], highlightData: [4, 8, 12] },
      ]
      const line = await SSRRenderer.renderToString({
        series,
        chart: { type: 'line' },
        dataLabels: { enabled: true },
        xaxis: { categories: ['Q1', 'Q2', 'Q3'] },
      })
      // the whole dashed, the part solid, the labels stating the part
      expect(line.match(/apexcharts-line-highlight-part/g)?.length).toBe(1)
      expect(line).toContain('stroke-dasharray="4"')
      expect(line).toMatch(/>12<\/t/)
      const area = await SSRRenderer.renderToString({
        series,
        chart: { type: 'area' },
        xaxis: { categories: ['Q1', 'Q2', 'Q3'] },
      })
      expect(area.match(/apexcharts-line-highlight-part/g)?.length).toBe(2)
      expect(area).toContain('fill-opacity="0.2"')
    })

    it('renders a highlighted stacked column and stacked area as the final frame', async () => {
      await import('../../../src/features/highlight-filter.js')
      const series = [
        { name: 'A', data: [10, 20, 30], highlightData: [4, 8, 12] },
        { name: 'B', data: [6, 5, 4], highlightData: [3, null, 2] },
      ]
      const column = await SSRRenderer.renderToString({
        series,
        chart: { type: 'bar', stacked: true },
        dataLabels: { enabled: true },
        plotOptions: { bar: { dataLabels: { total: { enabled: true } } } },
        xaxis: { categories: ['Q1', 'Q2', 'Q3'] },
      })
      // a part per non-null datum, every whole segment faded, the segment
      // labels and the totals stating the parts
      expect(column.match(/apexcharts-bar-highlight-part/g)?.length).toBe(5)
      expect(column.match(/fill-opacity="0.2"/g)?.length).toBe(6)
      expect(column).toMatch(/>12<\/t/)
      expect(column).toMatch(/>14<\/t/)
      expect(column).not.toMatch(/>34<\/t/)
      const area = await SSRRenderer.renderToString({
        series,
        chart: { type: 'area', stacked: true },
        xaxis: { categories: ['Q1', 'Q2', 'Q3'] },
      })
      // per series a part fill and a part stroke over the faded whole
      expect(area.match(/apexcharts-line-highlight-part/g)?.length).toBe(4)
      expect(area.match(/fill-opacity="0\.\d+"/g)?.length).toBeGreaterThan(1)
      // no tween ran: nothing is held at a first frame
      expect(area).not.toContain('fill-opacity="0"')
      expect(column).not.toContain('fill-opacity="0"')
    })

    it('renders a highlighted treemap, flat and nested, as the final frame', async () => {
      await import('../../../src/features/highlight-filter.js')
      const flat = await SSRRenderer.renderToString({
        chart: { type: 'treemap', width: 500, height: 300 },
        series: [
          {
            name: 'S',
            data: [
              { x: 'A', y: 40, highlight: 10 },
              { x: 'B', y: 30, highlight: 15 },
              { x: 'C', y: 20 },
            ],
          },
        ],
      })
      // every tile filled by its own gradient at the landed share
      expect(flat.match(/fill="url\(#SvgjsGradient\d+\)"/g)?.length).toBe(3)
      expect(flat).toMatch(/<stop offset="0\.25"[^>]*stop-opacity="1"/)
      expect(flat).toMatch(/<stop offset="0\.25"[^>]*stop-opacity="0\.2"/)
      expect(flat).toContain('data:hl-share="0.5"')
      expect(flat).toContain('apexcharts-highlight-tile')
      const nested = await SSRRenderer.renderToString({
        chart: { type: 'treemap', width: 500, height: 300 },
        series: [
          {
            name: 'Shop',
            data: [
              { x: 'G1', children: [{ x: 'a', y: 40, highlight: 30 }, { x: 'b', y: 20 }] },
              { x: 'G2', children: [{ x: 'c', y: 30, highlight: 3 }] },
            ],
          },
        ],
      })
      expect(nested.match(/fill="url\(#SvgjsGradient\d+\)"/g)?.length).toBe(3)
      expect(nested).toMatch(/<stop offset="0\.75"[^>]*stop-opacity="0\.2"/)
      expect(nested).toContain('data:hl-share="0.1"')
    })

    it('renders a pie chart to an SVG string without throwing', async () => {
      const svg = await SSRRenderer.renderToString({
        series: [44, 55, 13],
        chart: { type: 'pie' },
        labels: ['Team A', 'Team B', 'Team C'],
      })

      expect(typeof svg).toBe('string')
      expect(svg).toContain('<svg')
    })

    it('respects custom width and height', async () => {
      const svg = await SSRRenderer.renderToString(
        {
          series: [{ data: [1, 2, 3] }],
          chart: { type: 'line' },
        },
        { width: 600, height: 400 }
      )

      expect(svg).toMatch(/width="600"/)
      expect(svg).toMatch(/height="400"/)
    })

    it('applies scale factor to the output SVG dimensions', async () => {
      const svg = await SSRRenderer.renderToString(
        {
          series: [{ data: [1, 2, 3] }],
          chart: { type: 'line' },
        },
        { width: 400, height: 300, scale: 2 }
      )

      expect(svg).toMatch(/width="800"/)
      expect(svg).toMatch(/height="600"/)
    })

    it('renderToHTML wraps the SVG in a hydration-ready div', async () => {
      const html = await SSRRenderer.renderToHTML({
        series: [{ data: [1, 2, 3] }],
        chart: { type: 'line' },
      })

      expect(html).toContain('data-apexcharts-hydrate')
      expect(html).toContain('data-apexcharts-config=')
      expect(html).toContain('<svg')
      expect(html).toContain('apexcharts-ssr-wrapper')
    })

    it('renders multiple chart types in sequence without state leaking', async () => {
      const types = ['line', 'bar']
      for (const type of types) {
        const svg = await SSRRenderer.renderToString({
          series: [{ data: [1, 2, 3] }],
          chart: { type },
        })
        expect(svg).toContain('<svg')
      }
    })

    it('bar chart: renders exactly N bar paths and N datalabel groups for N data points', async () => {
      const data = [44, 55, 57, 56, 61]
      const svg = await SSRRenderer.renderToString({
        chart: { type: 'bar', height: 300 },
        series: [{ name: 'Visitors', data }],
        xaxis: { categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun'] },
      })

      const barPaths = svg.match(/class="apexcharts-bar-area/g)
      const dataLabels = svg.match(/class="apexcharts-datalabels"/g)

      expect(barPaths).not.toBeNull()
      expect(barPaths.length).toBe(data.length)
      expect(dataLabels).not.toBeNull()
      // One datalabels group per series (not per data point)
      expect(dataLabels.length).toBe(1)
    })

    it('horizontal bar chart: centres each data label on its bar', async () => {
      const fontSize = 12
      const svg = await SSRRenderer.renderToString(
        {
          chart: {
            type: 'bar',
            width: 600,
            height: 180,
            animations: { enabled: false },
          },
          series: [{ name: 'Count', data: [4, 2] }],
          xaxis: { categories: ['First', 'Second'] },
          plotOptions: {
            bar: { horizontal: true, dataLabels: { position: 'center' } },
          },
          dataLabels: { enabled: true, style: { fontSize: `${fontSize}px` } },
        },
        { width: 600, height: 180 }
      )

      const bars = [
        ...svg.matchAll(
          /<path d="M [\d.]+ ([\d.]+) L[^>]*barHeight="([\d.]+)"/g
        ),
      ].map((m) => parseFloat(m[1]) + parseFloat(m[2]) / 2)
      const labels = [
        ...svg.matchAll(
          /<text x="[\d.]+" y="([\d.]+)"[^>]*apexcharts-datalabel"/g
        ),
      ].map((m) => parseFloat(m[1]))

      expect(bars.length).toBe(2)
      expect(labels.length).toBe(2)

      labels.forEach((baseline, i) => {
        // `y` on a text element is the alphabetic baseline, so it sits below
        // the visual centre by roughly a third of the font size.
        expect(baseline).toBeGreaterThan(bars[i])
        expect(baseline - bars[i]).toBeLessThan(fontSize / 2)
      })
    })
  })
})
