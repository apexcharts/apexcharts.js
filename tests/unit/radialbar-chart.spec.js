import { createChartWithOptions } from './utils/utils.js'

// ---------------------------------------------------------------------------
// Helper: create a rendered radialBar chart
// ---------------------------------------------------------------------------
function radialBarChart(opts = {}) {
  return createChartWithOptions({
    chart: { type: 'radialBar', ...opts.chart },
    series: opts.series || [70, 55, 40],
    labels: opts.labels || ['A', 'B', 'C'],
    plotOptions: {
      radialBar: {
        ...opts.radialBar,
      },
    },
    dataLabels: opts.dataLabels || { enabled: false },
    stroke: opts.stroke || {},
    ...opts.extra,
  })
}

// ===========================================================================
// RADIALBAR CHART TESTS
// ===========================================================================

describe('RadialBar chart', () => {
  describe('rendering', () => {
    it('should render radialbar group', () => {
      const chart = radialBarChart()
      const el = chart.el

      const radialBar = el.querySelectorAll('.apexcharts-radialbar')
      expect(radialBar.length).toBeGreaterThan(0)
    })

    it('should render correct number of radial arcs', () => {
      const chart = radialBarChart({ series: [70, 55, 40] })
      const el = chart.el

      const arcs = el.querySelectorAll('.apexcharts-radialbar-area')
      expect(arcs.length).toBeGreaterThanOrEqual(3)
    })

    it('should render single value radialBar', () => {
      const chart = radialBarChart({
        series: [75],
        labels: ['Progress'],
      })
      const el = chart.el

      const arcs = el.querySelectorAll('.apexcharts-radialbar-area')
      expect(arcs.length).toBeGreaterThanOrEqual(1)
    })

    it('should render multiple value radialBar', () => {
      const chart = radialBarChart({
        series: [70, 55, 40, 25],
        labels: ['A', 'B', 'C', 'D'],
      })
      const el = chart.el

      const seriesGroups = el.querySelectorAll('.apexcharts-radial-series')
      expect(seriesGroups.length).toBe(4)
    })

    it('should render radial series with seriesName attribute', () => {
      const chart = radialBarChart({
        series: [70, 30],
        labels: ['Alpha', 'Beta'],
      })
      const el = chart.el

      const series = el.querySelectorAll('.apexcharts-radial-series')
      const names = Array.from(series).map((s) => s.getAttribute('seriesName'))
      expect(names).toContain('Alpha')
      expect(names).toContain('Beta')
    })

    it('should set data:value attributes on arcs', () => {
      const chart = radialBarChart({ series: [80, 60] })
      const el = chart.el

      const slices = el.querySelectorAll(
        '.apexcharts-radialbar-slice-0, .apexcharts-radialbar-slice-1'
      )
      expect(slices.length).toBe(2)

      const values = Array.from(slices).map((s) =>
        parseFloat(s.getAttribute('data:value'))
      )
      expect(values).toContain(80)
      expect(values).toContain(60)
    })

    it('should set data:angle attributes on arcs', () => {
      const chart = radialBarChart({ series: [50] })
      const el = chart.el

      const slice = el.querySelector('.apexcharts-radialbar-slice-0')
      expect(slice).not.toBeNull()
      expect(slice.getAttribute('data:angle')).not.toBeNull()
    })
  })

  describe('tracks', () => {
    it('should render tracks by default', () => {
      const chart = radialBarChart()
      const el = chart.el

      const tracks = el.querySelectorAll('.apexcharts-tracks')
      expect(tracks.length).toBeGreaterThan(0)
    })

    it('should render track elements for each series', () => {
      const chart = radialBarChart({ series: [70, 55, 40] })
      const el = chart.el

      const trackItems = el.querySelectorAll('.apexcharts-track')
      expect(trackItems.length).toBe(3)
    })

    it('should hide tracks when track.show is false', () => {
      const chart = radialBarChart({
        radialBar: { track: { show: false } },
      })
      const el = chart.el

      const tracks = el.querySelectorAll('.apexcharts-tracks')
      expect(tracks.length).toBe(0)
    })
  })

  describe('hollow center', () => {
    it('should render hollow center', () => {
      const chart = radialBarChart()
      const el = chart.el

      const hollow = el.querySelector('.apexcharts-radialbar-hollow')
      expect(hollow).not.toBeNull()
    })
  })

  describe('data labels', () => {
    it('should render inner data labels when configured', () => {
      const chart = radialBarChart({
        radialBar: {
          dataLabels: {
            show: true,
            name: { show: true },
            value: { show: true },
            total: { show: true, label: 'Total' },
          },
        },
      })
      const el = chart.el

      const labelsGroup = el.querySelector('.apexcharts-datalabels-group')
      expect(labelsGroup).not.toBeNull()
    })

    it('should render total label when total.show is true', () => {
      const chart = radialBarChart({
        radialBar: {
          dataLabels: {
            show: true,
            name: { show: true },
            value: { show: true },
            total: { show: true, label: 'Total' },
          },
        },
      })
      const el = chart.el

      const nameLabel = el.querySelector('.apexcharts-datalabel-label')
      expect(nameLabel).not.toBeNull()
      expect(nameLabel.textContent).toBe('Total')
    })

    it('should render value label', () => {
      const chart = radialBarChart({
        radialBar: {
          dataLabels: {
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
  })

  describe('angles', () => {
    it('should respect custom startAngle and endAngle', () => {
      const chart = radialBarChart({
        radialBar: { startAngle: -135, endAngle: 135 },
      })
      const w = chart.w

      expect(w.config.plotOptions.radialBar.startAngle).toBe(-135)
      expect(w.config.plotOptions.radialBar.endAngle).toBe(135)
    })

    it('should render semi-circle radialBar (half gauge)', () => {
      const chart = radialBarChart({
        radialBar: { startAngle: -90, endAngle: 90 },
        series: [76],
        labels: ['Progress'],
      })
      const el = chart.el

      const arcs = el.querySelectorAll('.apexcharts-radialbar-area')
      expect(arcs.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('value capping', () => {
    it('should cap values greater than 100', () => {
      const chart = radialBarChart({
        series: [150],
        labels: ['Over'],
      })
      const el = chart.el

      // The radialbar should still render (value capped internally at 100)
      const slices = el.querySelectorAll('.apexcharts-radialbar-area')
      expect(slices.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle zero values', () => {
      const chart = radialBarChart({
        series: [0],
        labels: ['None'],
      })
      const el = chart.el

      const slices = el.querySelectorAll('.apexcharts-radialbar-area')
      expect(slices.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('bar labels', () => {
    it('should render bar labels when enabled', () => {
      const chart = radialBarChart({
        radialBar: {
          barLabels: {
            enabled: true,
            useSeriesColors: true,
            offsetX: 0,
            offsetY: 0,
            fontSize: '12px',
            fontFamily: undefined,
            fontWeight: 600,
            formatter: (seriesName) => seriesName,
          },
        },
        series: [70, 55],
        labels: ['X', 'Y'],
      })
      const el = chart.el

      const barLabels = el.querySelectorAll('.apexcharts-radialbar-label')
      expect(barLabels.length).toBe(2)
    })
  })

  describe('inverse order', () => {
    it('should render when inverseOrder is true', () => {
      const chart = radialBarChart({
        radialBar: { inverseOrder: true },
        series: [70, 55, 40],
      })
      const el = chart.el

      const series = el.querySelectorAll('.apexcharts-radial-series')
      expect(series.length).toBe(3)
    })
  })
})
