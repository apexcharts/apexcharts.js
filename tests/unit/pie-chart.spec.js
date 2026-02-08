import Pie from '../../src/charts/Pie.js'
import { createChartWithOptions } from './utils/utils.js'

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
      expect(chart.w.globals.series).toBeDefined()
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
  })

  describe('globals', () => {
    it('should compute seriesPercent', () => {
      const chart = pieChart({ series: [25, 25, 25, 25] })
      const w = chart.w

      expect(w.globals.seriesPercent).toBeDefined()
      expect(w.globals.seriesPercent.length).toBe(4)
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
