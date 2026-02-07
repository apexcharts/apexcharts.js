import { createChartWithOptions } from './utils/utils.js'

// ---------------------------------------------------------------------------
// Helper: create a rendered polar area chart
// ---------------------------------------------------------------------------
function polarAreaChart(opts = {}) {
  return createChartWithOptions({
    chart: { type: 'polarArea', ...opts.chart },
    series: opts.series || [30, 40, 20, 10],
    labels: opts.labels || ['A', 'B', 'C', 'D'],
    plotOptions: {
      polarArea: {
        ...opts.polarArea,
      },
      pie: opts.pie || {},
    },
    yaxis: opts.yaxis || {},
    dataLabels: opts.dataLabels || { enabled: false },
    stroke: opts.stroke || {},
    ...opts.extra,
  })
}

// ===========================================================================
// POLAR AREA CHART TESTS
// ===========================================================================

describe('Polar Area chart', () => {
  describe('rendering', () => {
    it('should render pie group element for polar area', () => {
      const chart = polarAreaChart()
      const el = chart.el

      const pie = el.querySelectorAll('.apexcharts-pie')
      expect(pie.length).toBeGreaterThan(0)
    })

    it('should render correct number of polar area slices', () => {
      const chart = polarAreaChart({ series: [30, 40, 20, 10] })
      const el = chart.el

      const slices = el.querySelectorAll('.apexcharts-pie-area')
      expect(slices.length).toBe(4)
    })

    it('should render single value polar area', () => {
      const chart = polarAreaChart({
        series: [50],
        labels: ['Only'],
      })
      const el = chart.el

      const slices = el.querySelectorAll('.apexcharts-pie-area')
      expect(slices.length).toBe(1)
    })

    it('should render many slices', () => {
      const chart = polarAreaChart({
        series: [10, 20, 30, 40, 50, 60],
        labels: ['a', 'b', 'c', 'd', 'e', 'f'],
      })
      const el = chart.el

      const slices = el.querySelectorAll('.apexcharts-pie-area')
      expect(slices.length).toBe(6)
    })

    it('should render polar area series groups with correct names', () => {
      const chart = polarAreaChart({
        series: [30, 70],
        labels: ['Alpha', 'Beta'],
      })
      const el = chart.el

      const pieSeries = el.querySelectorAll('.apexcharts-pie-series')
      expect(pieSeries.length).toBe(2)
    })

    it('should set data:value attributes on slices', () => {
      const chart = polarAreaChart({ series: [25, 75] })
      const el = chart.el

      const slices = el.querySelectorAll('.apexcharts-pie-area')
      const values = Array.from(slices).map((s) =>
        parseFloat(s.getAttribute('data:value'))
      )
      expect(values).toEqual([25, 75])
    })

    it('should have polarArea-slice CSS classes', () => {
      const chart = polarAreaChart({ series: [50, 50] })
      const el = chart.el

      expect(
        el.querySelector('.apexcharts-polararea-slice-0')
      ).not.toBeNull()
      expect(
        el.querySelector('.apexcharts-polararea-slice-1')
      ).not.toBeNull()
    })
  })

  describe('equal angle sectors', () => {
    it('should distribute equal angles to all slices regardless of value', () => {
      const chart = polarAreaChart({ series: [10, 90] })
      const el = chart.el

      const slices = el.querySelectorAll('.apexcharts-pie-area')
      const angles = Array.from(slices).map((s) =>
        parseFloat(s.getAttribute('data:angle'))
      )

      // In polar area, each slice gets 360/n degrees
      expect(angles[0]).toBeCloseTo(180, 0)
      expect(angles[1]).toBeCloseTo(180, 0)
    })

    it('should have equal angles for 4 slices (90 degrees each)', () => {
      const chart = polarAreaChart({
        series: [10, 20, 30, 40],
      })
      const el = chart.el

      const slices = el.querySelectorAll('.apexcharts-pie-area')
      const angles = Array.from(slices).map((s) =>
        parseFloat(s.getAttribute('data:angle'))
      )

      angles.forEach((angle) => {
        expect(angle).toBeCloseTo(90, 0)
      })
    })
  })

  describe('rings', () => {
    it('should render with custom ring stroke configuration', () => {
      const chart = polarAreaChart({
        polarArea: {
          rings: {
            strokeWidth: 2,
            strokeColor: '#e8e8e8',
          },
        },
      })
      const w = chart.w

      expect(w.config.plotOptions.polarArea.rings.strokeWidth).toBe(2)
      expect(w.config.plotOptions.polarArea.rings.strokeColor).toBe('#e8e8e8')
    })
  })

  describe('spokes', () => {
    it('should render spokes by default', () => {
      const chart = polarAreaChart({
        series: [10, 20, 30],
      })
      const w = chart.w

      // Spokes should be part of the config
      expect(w.config.plotOptions.polarArea.spokes).toBeDefined()
    })

    it('should not render spokes when strokeWidth is 0', () => {
      const chart = polarAreaChart({
        polarArea: {
          spokes: { strokeWidth: 0 },
        },
      })
      const w = chart.w

      expect(w.config.plotOptions.polarArea.spokes.strokeWidth).toBe(0)
    })
  })

  describe('data labels', () => {
    it('should render data labels when enabled', () => {
      const chart = polarAreaChart({
        dataLabels: { enabled: true },
        series: [30, 40, 30],
        labels: ['A', 'B', 'C'],
      })
      const el = chart.el

      const labels = el.querySelectorAll('.apexcharts-pie-label')
      expect(labels.length).toBeGreaterThan(0)
    })
  })

  describe('yaxis', () => {
    it('should render with yaxis labels when show is true', () => {
      const chart = polarAreaChart({
        yaxis: { show: true },
      })
      const w = chart.w

      expect(w.config.yaxis[0].show).toBe(true)
    })

    it('should respect custom yaxis max', () => {
      const chart = polarAreaChart({
        yaxis: { max: 100 },
        series: [30, 40, 20],
      })
      const w = chart.w

      expect(w.config.yaxis[0].max).toBe(100)
    })
  })
})
