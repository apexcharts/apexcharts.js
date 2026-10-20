import Pie from '../../src/charts/Pie.js'
import ApexCharts from '../../src/entries/standard.js'
import { createChartWithOptions } from './utils/utils.js'
import Graphics from '../../src/modules/Graphics.js'
import { measureLabelWidth } from '../../src/charts/common/OuterLabels.js'

// ---------------------------------------------------------------------------
// Helper: create a rendered pie/donut chart
// ---------------------------------------------------------------------------
function pieChart(opts = {}) {
  return createChartWithOptions({
    chart: { type: 'pie', ...opts.chart },
    series: opts.series || [30, 40, 20, 10],
    labels: opts.labels || ['A', 'B', 'C', 'D'],
    plotOptions: { pie: { ...opts.pie } },
    dataLabels: opts.dataLabels || { enabled: false },
    stroke: opts.stroke || {},
    ...opts.extra,
  })
}

function donutChart(opts = {}) {
  return createChartWithOptions({
    chart: { type: 'donut', ...opts.chart },
    series: opts.series || [30, 40, 20, 10],
    labels: opts.labels || ['A', 'B', 'C', 'D'],
    plotOptions: {
      pie: {
        donut: { size: '50%', ...opts.donut },
        ...opts.pie,
      },
    },
    dataLabels: opts.dataLabels || { enabled: false },
    stroke: opts.stroke || {},
    ...opts.extra,
  })
}

// ===========================================================================
// PIE CHART TESTS
// ===========================================================================

describe('Pie chart', () => {
  describe('rendering', () => {
    it('should render pie series group', () => {
      const chart = pieChart()
      const el = chart.el

      const pieSeries = el.querySelectorAll('.apexcharts-pie')
      expect(pieSeries.length).toBeGreaterThan(0)
    })

    it('should render correct number of pie slices', () => {
      const chart = pieChart({ series: [30, 40, 20, 10] })
      const el = chart.el

      const slices = el.querySelectorAll('.apexcharts-pie-area')
      expect(slices.length).toBe(4)
    })

    it('should render single-value pie chart', () => {
      const chart = pieChart({
        series: [100],
        labels: ['Only'],
      })
      const el = chart.el

      const slices = el.querySelectorAll('.apexcharts-pie-area')
      expect(slices.length).toBe(1)
    })

    it('should render two-value pie chart', () => {
      const chart = pieChart({
        series: [60, 40],
        labels: ['A', 'B'],
      })
      const el = chart.el

      const slices = el.querySelectorAll('.apexcharts-pie-area')
      expect(slices.length).toBe(2)
    })

    it('should render many slices', () => {
      const chart = pieChart({
        series: [10, 20, 15, 25, 30, 5, 8, 12],
        labels: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
      })
      const el = chart.el

      const slices = el.querySelectorAll('.apexcharts-pie-area')
      expect(slices.length).toBe(8)
    })

    it('should handle empty series gracefully', () => {
      const chart = pieChart({
        series: [],
        labels: [],
      })
      // Should not throw
      expect(chart.getState().series).toBeDefined()
    })

    it('should set data:value attributes on slices', () => {
      const chart = pieChart({ series: [30, 70] })
      const el = chart.el

      const slices = el.querySelectorAll('.apexcharts-pie-area')
      const values = Array.from(slices).map((s) =>
        parseFloat(s.getAttribute('data:value'))
      )
      expect(values).toEqual([30, 70])
    })

    it('should set data:angle attributes on slices', () => {
      const chart = pieChart({ series: [50, 50] })
      const el = chart.el

      const slices = el.querySelectorAll('.apexcharts-pie-area')
      const angles = Array.from(slices).map((s) =>
        parseFloat(s.getAttribute('data:angle'))
      )
      // Equal series should have equal angles
      expect(angles[0]).toBeCloseTo(angles[1], 0)
    })

    it('should render apexcharts-slices group', () => {
      const chart = pieChart()
      const el = chart.el

      const slicesGroup = el.querySelectorAll('.apexcharts-slices')
      expect(slicesGroup.length).toBeGreaterThan(0)
    })

    it('should render series groups with seriesName attribute', () => {
      const chart = pieChart({
        series: [30, 70],
        labels: ['Alpha', 'Beta'],
      })
      const el = chart.el

      const pieSeries = el.querySelectorAll('.apexcharts-pie-series')
      expect(pieSeries.length).toBe(2)

      const seriesNames = Array.from(pieSeries).map((s) =>
        s.getAttribute('seriesName')
      )
      expect(seriesNames).toContain('Alpha')
      expect(seriesNames).toContain('Beta')
    })
  })

  describe('data labels', () => {
    it('should render data labels when enabled', () => {
      const chart = pieChart({
        dataLabels: { enabled: true },
        series: [30, 40, 30],
        labels: ['A', 'B', 'C'],
      })
      const el = chart.el

      const labels = el.querySelectorAll('.apexcharts-pie-label')
      expect(labels.length).toBeGreaterThan(0)
    })

    it('should not render data labels when disabled', () => {
      const chart = pieChart({
        dataLabels: { enabled: false },
      })
      const el = chart.el

      const labels = el.querySelectorAll('.apexcharts-pie-label')
      expect(labels.length).toBe(0)
    })

    it('should skip data labels for very small angles when minAngleToShowLabel is set', () => {
      const chart = pieChart({
        dataLabels: { enabled: true },
        pie: { dataLabels: { minAngleToShowLabel: 30 } },
        // One very small slice (1 out of 101 total = ~3.6 degrees)
        series: [50, 50, 1],
        labels: ['A', 'B', 'Tiny'],
      })
      const el = chart.el

      // The tiny slice label should not be rendered
      const labels = el.querySelectorAll('.apexcharts-pie-label')
      expect(labels.length).toBe(2)
    })

    it('fades slice labels in after the entrance sweep, on the opacity attribute', async () => {
      document.body.innerHTML = '<div id="chart"></div>'
      const ApexCharts = (await import('../../src/entries/standard.js')).default
      const chart = new ApexCharts(document.querySelector('#chart'), {
        chart: { type: 'pie', width: 400, height: 400 },
        series: [30, 40, 30],
        labels: ['A', 'B', 'C'],
        dataLabels: { enabled: true },
      })
      await chart.render()
      const opacities = () =>
        [...chart.el.querySelectorAll('.apexcharts-pie-label')].map((t) =>
          t.getAttribute('opacity'),
        )
      // Hidden until the sweep lands; the animation runner fades them in.
      expect(opacities()).toEqual(['0', '0', '0'])
      // No CSS animation the transitions cannot read.
      expect(chart.el.querySelector('.apexcharts-pie-label-delay')).toBe(null)

      // A data change rides the labels to their new slices instead.
      await chart.updateSeries([20, 50, 30])
      expect(opacities()).not.toContain('0')
      chart.destroy()
    })
  })

  describe('globals', () => {
    it('should compute seriesPercent', () => {
      const chart = pieChart({ series: [25, 25, 25, 25] })
      const w = chart.w

      expect(w.globals.seriesPercent).toBeDefined()
      expect(w.globals.seriesPercent.length).toBe(4)
    })
  })

  describe('outer name labels', () => {
    it('should not render outer name labels by default', () => {
      const chart = pieChart()
      const el = chart.el

      expect(el.querySelectorAll('.apexcharts-pie-name-label').length).toBe(0)
      expect(el.querySelectorAll('.apexcharts-pie-label-connector').length).toBe(
        0
      )
    })

    it('should render one outer name label per slice when name.show is true', () => {
      const chart = pieChart({
        series: [63, 20, 8, 6, 3],
        labels: ['Webform', 'Call', 'Email', 'Webchat', 'Other'],
        pie: { dataLabels: { external: { show: true } } },
      })
      const el = chart.el

      const names = el.querySelectorAll('.apexcharts-pie-name-label')
      expect(names.length).toBe(5)
      const texts = Array.from(names).map((n) => n.textContent)
      expect(texts).toContain('Webform')
      expect(texts).toContain('Other')
    })

    it('should render connector lines when name.show is true', () => {
      const chart = pieChart({
        series: [63, 20, 8, 6, 3],
        labels: ['Webform', 'Call', 'Email', 'Webchat', 'Other'],
        pie: { dataLabels: { external: { show: true } } },
      })
      const el = chart.el

      expect(
        el.querySelectorAll('.apexcharts-pie-label-connector').length
      ).toBe(5)
    })

    it('should omit connector lines when connector.show is false', () => {
      const chart = pieChart({
        series: [60, 40],
        labels: ['A', 'B'],
        pie: {
          dataLabels: { external: { show: true, connector: { show: false } } },
        },
      })
      const el = chart.el

      expect(el.querySelectorAll('.apexcharts-pie-name-label').length).toBe(2)
      expect(
        el.querySelectorAll('.apexcharts-pie-label-connector').length
      ).toBe(0)
    })

    it('should apply the name formatter', () => {
      const chart = pieChart({
        series: [60, 40],
        labels: ['A', 'B'],
        pie: {
          dataLabels: {
            external: {
              show: true,
              formatter: (name, { percent }) =>
                `${name} (${Math.round(percent)}%)`,
            },
          },
        },
      })
      const el = chart.el

      const texts = Array.from(
        el.querySelectorAll('.apexcharts-pie-name-label')
      ).map((n) => n.textContent)
      expect(texts).toContain('A (60%)')
      expect(texts).toContain('B (40%)')
    })

    it('should stack multiple lines when the formatter returns an array', () => {
      const chart = pieChart({
        series: [60, 40],
        labels: ['Webform', 'Call'],
        pie: {
          dataLabels: {
            external: {
              show: true,
              formatter: (name, { percent }) => [name, `${Math.round(percent)}%`],
            },
          },
        },
      })
      const el = chart.el

      const labels = el.querySelectorAll('.apexcharts-pie-name-label')
      expect(labels.length).toBe(2)
      // each label is one <text> with one <tspan> per line
      labels.forEach((label) => {
        expect(label.getElementsByTagName('tspan').length).toBe(2)
      })
      const webform = Array.from(labels).find((l) =>
        l.textContent.includes('Webform')
      )
      expect(webform.textContent).toContain('60%')
    })

    it('should shrink the pie radius to make room for outer labels', () => {
      const baseline = pieChart({
        chart: { width: 400, height: 400 },
        series: [60, 40],
        labels: ['A', 'B'],
      })
      const withLabels = pieChart({
        chart: { width: 400, height: 400 },
        series: [60, 40],
        labels: ['LongCategoryNameHere', 'AnotherLongCategory'],
        pie: { dataLabels: { external: { show: true } } },
      })

      expect(withLabels.w.globals.radialSize).toBeLessThan(
        baseline.w.globals.radialSize
      )
      expect(withLabels.w.globals.pieExternalLabelMarginY).toBeGreaterThan(0)
    })

    it('reserves the gutter at the weight the labels are drawn at', () => {
      const spy = vi.spyOn(Graphics.prototype, 'getTextRects')
      try {
        const chart = pieChart({
          chart: { width: 400, height: 400 },
          series: [60, 40],
          labels: ['LongCategoryNameHere', 'AnotherLongCategory'],
          dataLabels: { enabled: false, style: { fontWeight: 600 } },
          pie: { dataLabels: { external: { show: true } } },
        })
        const measured = spy.mock.calls.filter(
          (c) => c[0] === 'LongCategoryNameHere',
        )
        expect(measured.length).toBeGreaterThan(0)
        measured.forEach((c) => expect(c[5]).toBe(600))

        // The shared outer-label measure forwards the weight too.
        spy.mockClear()
        measureLabelWidth(chart.w, ['Bold label'], { fontWeight: 700 })
        expect(spy.mock.calls[0][5]).toBe(700)
      } finally {
        spy.mockRestore()
      }
    })

    it('keeps a crowded gutter column inside the chart', () => {
      // Fifteen two-line labels all crowd the bottom of the right gutter; a
      // column pulled up as a block used to run off the top of the chart.
      const small = Array(15).fill(1)
      const chart = pieChart({
        chart: { width: 400, height: 400 },
        series: [470, ...small, 500],
        labels: ['Big', ...small.map((_, i) => `S${i}`), 'Rest'],
        pie: {
          dataLabels: {
            external: {
              show: true,
              formatter: (name, { percent }) => [name, `${Math.round(percent)}%`],
            },
          },
        },
      })
      const w = chart.w
      const top =
        w.globals.circleGeometry.cy -
        w.globals.radialSize -
        w.globals.pieExternalLabelMarginY
      const ys = [...chart.el.querySelectorAll('.apexcharts-pie-name-label')].map(
        (t) => Number(t.getAttribute('y')),
      )
      expect(ys.length).toBe(17)
      expect(Math.min(...ys)).toBeGreaterThanOrEqual(top)
    })
  })

  // A slice that covers the whole turn used to stroke a line from the centre
  // to the rim: the wedge path draws both radii, and a 0.01° overlap clamp
  // leaves them a hair apart (#5084).
  describe('stroke of a full turn', () => {
    const stroke = { show: true, width: 4, colors: ['#fff'] }

    const slicesOf = (chart) => [
      ...chart.el.querySelectorAll('.apexcharts-pie-area'),
    ]

    // Line commands in a wedge: the two radii. roundPathCorners fillets the
    // apex, so the line no longer ends on the centre, but a closed circle
    // has no line command at all.
    const lineCommands = (d) => {
      if (!d) return 0
      return d.trim().split(/[\s,]+/).filter((t) => t === 'L').length
    }

    const arcCount = (d) => (d && d.match(/A/g) ? d.match(/A/g).length : 0)

    it('draws a single series as a closed circle with its stroke and no radial seam', () => {
      const chart = pieChart({
        chart: { width: 400, height: 400 },
        series: [44],
        labels: ['Only'],
        stroke,
      })
      const slice = slicesOf(chart)[0]
      const d = slice.getAttribute('d')

      expect(slice.getAttribute('stroke-width')).toBe('4')
      expect(parseFloat(slice.getAttribute('data:angle'))).toBeCloseTo(360, 5)
      // Two 180° arcs, closed, and no line back to the centre.
      expect(arcCount(d)).toBe(2)
      expect(d.toLowerCase()).toContain('z')
      expect(lineCommands(d)).toBe(0)
    })

    it('draws no radial seam when the other values are zero', () => {
      const chart = pieChart({
        chart: { width: 400, height: 400 },
        series: [44, 0, 0],
        labels: ['A', 'B', 'C'],
        stroke,
      })
      const slices = slicesOf(chart)
      expect(slices).toHaveLength(3)

      const full = slices.find(
        (s) => parseFloat(s.getAttribute('data:angle')) > 359
      )
      expect(full.getAttribute('stroke-width')).toBe('4')
      expect(arcCount(full.getAttribute('d'))).toBe(2)
      expect(lineCommands(full.getAttribute('d'))).toBe(0)

      // A zero-value sibling is not a slice. Its wedge degenerates to the
      // same centre-to-rim line, so it must not paint one either.
      for (const s of slices) {
        expect(lineCommands(s.getAttribute('d'))).toBe(0)
      }
    })

    it('draws a single polarArea series as a closed circle', () => {
      const chart = pieChart({
        chart: { type: 'polarArea', width: 400, height: 400 },
        series: [44],
        labels: ['Only'],
        stroke,
      })
      const slice = slicesOf(chart)[0]
      const d = slice.getAttribute('d')

      expect(slice.getAttribute('stroke-width')).toBe('4')
      expect(parseFloat(slice.getAttribute('data:angle'))).toBeCloseTo(360, 5)
      expect(arcCount(d)).toBe(2)
      expect(lineCommands(d)).toBe(0)
    })

    it('keeps the configured stroke on a single-slice semicircle', () => {
      const chart = pieChart({
        chart: { width: 400, height: 400 },
        series: [44],
        labels: ['Half'],
        pie: { startAngle: -90, endAngle: 90 },
        stroke,
      })
      const slice = slicesOf(chart)[0]
      const d = slice.getAttribute('d')

      expect(slice.getAttribute('stroke-width')).toBe('4')
      expect(parseFloat(slice.getAttribute('data:angle'))).toBeCloseTo(180, 5)
      // The flat edge is a real border, so the radii stay.
      expect(lineCommands(d)).toBeGreaterThan(0)
      expect(arcCount(d)).toBe(1)
    })

    it('keeps radial borders and the configured stroke on a multi-slice pie', () => {
      const chart = pieChart({
        chart: { width: 400, height: 400 },
        series: [44, 55, 13],
        labels: ['A', 'B', 'C'],
        stroke,
      })
      const slices = slicesOf(chart)
      expect(slices).toHaveLength(3)

      for (const s of slices) {
        const angle = parseFloat(s.getAttribute('data:angle'))
        expect(s.getAttribute('stroke-width')).toBe('4')
        expect(angle).toBeGreaterThan(0)
        expect(angle).toBeLessThan(360)
        expect(lineCommands(s.getAttribute('d'))).toBeGreaterThan(0)
        expect(arcCount(s.getAttribute('d'))).toBe(1)
      }
    })

    it('draws a closed circle after the legend collapses every sibling', () => {
      const chart = pieChart({
        chart: { width: 400, height: 400 },
        series: [44, 55, 13],
        labels: ['A', 'B', 'C'],
        stroke,
      })
      chart.toggleSeries('B')
      chart.toggleSeries('C')

      const slices = slicesOf(chart)
      const full = slices.find(
        (s) => parseFloat(s.getAttribute('data:angle')) > 359
      )
      expect(full).toBeTruthy()
      expect(full.getAttribute('stroke-width')).toBe('4')
      expect(arcCount(full.getAttribute('d'))).toBe(2)
      expect(lineCommands(full.getAttribute('d'))).toBe(0)
    })

    it('ends an animated full-circle sweep on a closed circle', async () => {
      vi.useFakeTimers({
        toFake: [
          'setTimeout',
          'clearTimeout',
          'Date',
          'requestAnimationFrame',
          'cancelAnimationFrame',
          'performance',
        ],
      })
      try {
        document.body.innerHTML = '<div id="chart" />'
        const chart = new ApexCharts(document.querySelector('#chart'), {
          chart: {
            type: 'pie',
            width: 400,
            height: 400,
            animations: { enabled: true, speed: 800 },
          },
          series: [44],
          labels: ['Only'],
          dataLabels: { enabled: false },
          stroke,
        })
        const rendered = chart.render()
        await vi.advanceTimersByTimeAsync(2000)
        await rendered

        const slice = chart.el.querySelector('.apexcharts-pie-area')
        const d = slice.getAttribute('d')
        expect(slice.getAttribute('stroke-width')).toBe('4')
        expect(parseFloat(slice.getAttribute('data:angle'))).toBeCloseTo(
          360,
          5
        )
        expect(arcCount(d)).toBe(2)
        expect(d.toLowerCase()).toContain('z')
        expect(lineCommands(d)).toBe(0)
        chart.destroy()
      } finally {
        vi.useRealTimers()
      }
    })
  })
})

// ===========================================================================
// DONUT CHART TESTS
// ===========================================================================

describe('Donut chart', () => {
  describe('rendering', () => {
    it('should render donut chart with inner circle', () => {
      const chart = donutChart()
      const el = chart.el

      const slices = el.querySelectorAll('.apexcharts-pie-area')
      expect(slices.length).toBe(4)
    })

    it('should render correct number of donut slices', () => {
      const chart = donutChart({ series: [10, 20, 30] })
      const el = chart.el

      const slices = el.querySelectorAll('.apexcharts-pie-area')
      expect(slices.length).toBe(3)
    })

    it('should render donut series groups', () => {
      const chart = donutChart({ series: [10, 20, 30] })
      const el = chart.el

      const pieSeries = el.querySelectorAll('.apexcharts-pie-series')
      expect(pieSeries.length).toBe(3)
    })

    it('should render pie group element', () => {
      const chart = donutChart()
      const el = chart.el

      const pie = el.querySelectorAll('.apexcharts-pie')
      expect(pie.length).toBeGreaterThan(0)
    })

    it('should set data:value on donut slices', () => {
      const chart = donutChart({ series: [25, 75] })
      const el = chart.el

      const slices = el.querySelectorAll('.apexcharts-pie-area')
      const values = Array.from(slices).map((s) =>
        parseFloat(s.getAttribute('data:value'))
      )
      expect(values).toEqual([25, 75])
    })

    it('should have donut-slice CSS classes', () => {
      const chart = donutChart({ series: [50, 50] })
      const el = chart.el

      expect(el.querySelector('.apexcharts-donut-slice-0')).not.toBeNull()
      expect(el.querySelector('.apexcharts-donut-slice-1')).not.toBeNull()
    })
  })

  describe('donut inner labels', () => {
    it('should render inner data labels when configured', () => {
      const chart = donutChart({
        donut: {
          labels: {
            show: true,
            name: { show: true },
            value: { show: true },
            total: {
              show: true,
              label: 'Total',
            },
          },
        },
      })
      const el = chart.el

      const labelsGroup = el.querySelector('.apexcharts-datalabels-group')
      expect(labelsGroup).not.toBeNull()
    })

    it('should render total label text when total.show is true', () => {
      const chart = donutChart({
        donut: {
          labels: {
            show: true,
            name: { show: true },
            value: { show: true },
            total: {
              show: true,
              label: 'Total',
            },
          },
        },
      })
      const el = chart.el

      const nameLabel = el.querySelector('.apexcharts-datalabel-label')
      expect(nameLabel).not.toBeNull()
      expect(nameLabel.textContent).toBe('Total')
    })

    it('should render value in inner label', () => {
      const chart = donutChart({
        donut: {
          labels: {
            show: true,
            value: { show: true },
            total: { show: true, label: 'Total' },
          },
        },
      })
      const el = chart.el

      const valueLabel = el.querySelector('.apexcharts-datalabel-value')
      expect(valueLabel).not.toBeNull()
    })

    it('should not render inner labels when show is false', () => {
      const chart = donutChart({
        donut: {
          labels: { show: false },
        },
      })
      const el = chart.el

      const labelsGroup = el.querySelector('.apexcharts-datalabels-group')
      // The group element exists but should be empty or invisible
      if (labelsGroup) {
        const nameLabel = labelsGroup.querySelector(
          '.apexcharts-datalabel-label'
        )
        const valueLabel = labelsGroup.querySelector(
          '.apexcharts-datalabel-value'
        )
        expect(nameLabel).toBeNull()
        expect(valueLabel).toBeNull()
      }
    })

    it('centres the value by the text, not the container, when total.label is empty', () => {
      const valueLift = (height) => {
        const chart = donutChart({
          chart: { width: 400, height },
          donut: {
            labels: { show: true, total: { show: true, label: '' } },
          },
        })
        const value = chart.el.querySelector('.apexcharts-datalabel-value')
        return Number(value.getAttribute('y')) - chart.w.layout.gridHeight / 2
      }
      // The empty name row is dropped, so the value sits at value.offsetY from
      // the centre in a short card and in a tall one alike.
      expect(valueLift(400)).toBe(10)
      expect(valueLift(1200)).toBe(10)
    })
  })

  describe('stroke of a full turn', () => {
    const stroke = { show: true, width: 4, colors: ['#fff'] }

    const arcRadii = (d) => {
      const radii = []
      const re = /A\s+([-\d.e]+)/g
      let m
      while ((m = re.exec(d))) radii.push(parseFloat(m[1]))
      return radii
    }

    const expectAnnulus = (chart) => {
      const slice = chart.el.querySelector('.apexcharts-donut-slice-0')
      const d = slice.getAttribute('d')
      const outer = chart.w.globals.radialSize
      const inner =
        (outer * parseInt(chart.w.config.plotOptions.pie.donut.size, 10)) / 100
      const radii = arcRadii(d)

      expect(slice.getAttribute('stroke-width')).toBe('4')
      expect(parseFloat(slice.getAttribute('data:angle'))).toBeCloseTo(360, 5)
      // Outer circle and reverse inner circle: two arcs each, no connector.
      expect(radii.filter((r) => Math.abs(r - outer) < 0.01)).toHaveLength(2)
      expect(radii.filter((r) => Math.abs(r - inner) < 0.01)).toHaveLength(2)
      expect(d).not.toMatch(/\bL\b/)
    }

    it('keeps the inner and outer border on a single-slice donut', () => {
      const chart = donutChart({
        chart: { width: 400, height: 400 },
        series: [44],
        labels: ['Only'],
        stroke,
      })
      expectAnnulus(chart)
    })

    it('keeps the inner and outer border when sibling values are zero', () => {
      const chart = donutChart({
        chart: { width: 400, height: 400 },
        series: [44, 0, 0],
        labels: ['A', 'B', 'C'],
        stroke,
      })
      expectAnnulus(chart)
      const slices = [...chart.el.querySelectorAll('.apexcharts-pie-area')]
      expect(slices).toHaveLength(3)
      for (const s of slices) {
        expect(s.getAttribute('stroke-width')).toBe('4')
        expect(s.getAttribute('d') || '').not.toMatch(/\bL\b/)
      }
    })

    it('keeps the stroke and both rims of a single-slice semicircle donut', () => {
      const chart = donutChart({
        chart: { width: 400, height: 400 },
        series: [44],
        labels: ['Half'],
        pie: { startAngle: -90, endAngle: 90 },
        stroke,
      })
      const slice = chart.el.querySelector('.apexcharts-donut-slice-0')
      const d = slice.getAttribute('d')
      const radii = arcRadii(d)
      const outer = chart.w.globals.radialSize
      const inner =
        (outer * parseInt(chart.w.config.plotOptions.pie.donut.size, 10)) / 100

      expect(slice.getAttribute('stroke-width')).toBe('4')
      expect(parseFloat(slice.getAttribute('data:angle'))).toBeCloseTo(180, 5)
      // Half a ring still has two radial edges, so the stroke stays on them.
      expect(d).toMatch(/\bL\b/)
      expect(radii.filter((r) => Math.abs(r - outer) < 0.01)).toHaveLength(1)
      expect(radii.filter((r) => Math.abs(r - inner) < 0.01)).toHaveLength(1)
    })

    it('keeps the radial borders of a multi-slice donut', () => {
      const chart = donutChart({
        chart: { width: 400, height: 400 },
        series: [44, 55],
        labels: ['A', 'B'],
        stroke,
      })
      const slices = [...chart.el.querySelectorAll('.apexcharts-pie-area')]
      expect(slices).toHaveLength(2)
      for (const s of slices) {
        expect(s.getAttribute('stroke-width')).toBe('4')
        expect(parseFloat(s.getAttribute('data:angle'))).toBeLessThan(360)
        // Outer arc, line to the inner rim, inner arc, line back.
        expect(s.getAttribute('d')).toMatch(/\bL\b/)
        expect(arcRadii(s.getAttribute('d'))).toHaveLength(2)
      }
    })
  })
})

// ===========================================================================
// PIE – getPiePath isolated tests
// ===========================================================================
describe('Pie.getPiePath', () => {
  function makePie(chartType = 'pie') {
    const pie = Object.create(Pie.prototype)
    pie.w = {
      config: {
        plotOptions: { pie: { startAngle: 0 } },
      },
    }
    pie.ctx = { w: pie.w }
    pie.chartType = chartType
    pie.centerX = 100
    pie.centerY = 100
    pie.donutSize = 40
    pie.fullAngle = 360
    pie.strokeWidth = 0
    return pie
  }

  it('should return a path string for pie type', () => {
    const pie = makePie('pie')
    const path = pie.getPiePath({
      me: pie,
      startAngle: 0,
      angle: 90,
      size: 80,
    })

    expect(typeof path).toBe('string')
    expect(path).toContain('M')
    expect(path).toContain('A')
    expect(path).toContain('L')
  })

  it('should return a path string for donut type', () => {
    const pie = makePie('donut')
    const path = pie.getPiePath({
      me: pie,
      startAngle: 0,
      angle: 90,
      size: 80,
    })

    expect(typeof path).toBe('string')
    // Donut paths have two arcs (outer and inner) and close with 'z'
    expect(path).toContain('A')
    expect(path.toLowerCase()).toContain('z')
  })

  it('should set largeArc flag for angles > 180', () => {
    const pie = makePie('pie')
    const path = pie.getPiePath({
      me: pie,
      startAngle: 0,
      angle: 200,
      size: 80,
    })

    // The large arc flag '1' should appear in the path
    expect(path).toContain(' 1 ')
  })

  it('should not set largeArc flag for angles <= 180', () => {
    const pie = makePie('pie')
    const path = pie.getPiePath({
      me: pie,
      startAngle: 0,
      angle: 90,
      size: 80,
    })

    // Path should have arc command with small arc flag
    expect(path).toMatch(/A\s+80\s+80\s+0\s+0/)
  })

  // A zero slice paints nothing but keeps a real path (a lone moveto at its
  // start on the rim), tested on the raw angle: the overlap clamp gives a
  // zero slice that starts within 1° of the end a sliver of up to 1° (#5084).
  it('draws a zero slice near the end of the turn as a lone moveto', () => {
    for (const type of ['pie', 'donut', 'polarArea']) {
      const pie = makePie(type)
      for (const startAngle of [0, 120, 359.2, 359.995, 360]) {
        const path = pie.getPiePath({ me: pie, startAngle, angle: 0, size: 80 })
        expect(path).toMatch(/^M [\d.e+-]+ [\d.e+-]+$/)
        const [x, y] = path.slice(2).split(' ').map(Number)
        expect(Math.hypot(x - 100, y - 100)).toBeCloseTo(80, 6)
      }
    }
  })
})

// ===========================================================================
// PIE – getChangedPath isolated test
// ===========================================================================
describe('Pie.getChangedPath', () => {
  it('should return empty string when dynamicAnim is false', () => {
    const pie = Object.create(Pie.prototype)
    pie.dynamicAnim = false
    pie.w = { globals: { dataChanged: true } }

    expect(pie.getChangedPath(0, 90)).toBe('')
  })

  it('should return empty string when data has not changed', () => {
    const pie = Object.create(Pie.prototype)
    pie.dynamicAnim = true
    pie.w = { globals: { dataChanged: false } }

    expect(pie.getChangedPath(0, 90)).toBe('')
  })
})
