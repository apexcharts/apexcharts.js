import Radar from '../../src/charts/Radar.js'
import { createChartWithOptions } from './utils/utils.js'

// ---------------------------------------------------------------------------
// Helper: create a rendered radar chart
// ---------------------------------------------------------------------------
function radarChart(opts = {}) {
  return createChartWithOptions({
    chart: { type: 'radar', ...opts.chart },
    series: opts.series || [
      { name: 'Series 1', data: [80, 50, 30, 40, 100, 20] },
    ],
    xaxis: {
      categories: opts.categories || [
        'Cat1',
        'Cat2',
        'Cat3',
        'Cat4',
        'Cat5',
        'Cat6',
      ],
      ...opts.xaxis,
    },
    yaxis: opts.yaxis || {},
    plotOptions: { radar: { ...opts.radar } },
    dataLabels: opts.dataLabels || { enabled: false },
    stroke: opts.stroke || {},
    markers: opts.markers || {},
    ...opts.extra,
  })
}

// ===========================================================================
// RADAR CHART TESTS
// ===========================================================================

describe('Radar chart', () => {
  describe('rendering', () => {
    it('should render radar series group', () => {
      const chart = radarChart()
      const el = chart.el

      const radarSeries = el.querySelectorAll('.apexcharts-radar-series')
      expect(radarSeries.length).toBeGreaterThan(0)
    })

    it('should render radar path elements', () => {
      const chart = radarChart()
      const el = chart.el

      const radarPaths = el.querySelectorAll('.apexcharts-radar')
      expect(radarPaths.length).toBeGreaterThan(0)
    })

    it('should render correct number of series groups', () => {
      const chart = radarChart({
        series: [
          { name: 'A', data: [80, 50, 30] },
          { name: 'B', data: [60, 70, 40] },
        ],
        categories: ['X', 'Y', 'Z'],
      })
      const el = chart.el

      const seriesGroups = el.querySelectorAll(
        '.apexcharts-radar-series .apexcharts-series'
      )
      expect(seriesGroups.length).toBe(2)
    })

    it('should render markers for data points', () => {
      const chart = radarChart({
        markers: { size: 4 },
      })
      const el = chart.el

      const markers = el.querySelectorAll('.apexcharts-marker')
      // 6 data points = 6 markers
      expect(markers.length).toBe(6)
    })

    it('should render multi-series with markers', () => {
      const chart = radarChart({
        series: [
          { name: 'A', data: [80, 50, 30, 40] },
          { name: 'B', data: [60, 70, 40, 50] },
        ],
        categories: ['X', 'Y', 'Z', 'W'],
        markers: { size: 4 },
      })
      const el = chart.el

      const markers = el.querySelectorAll('.apexcharts-marker')
      // At least 4 data points * 2 series worth of markers
      expect(markers.length).toBeGreaterThanOrEqual(8)
    })

    it('should render series with seriesName attribute', () => {
      const chart = radarChart({
        series: [
          { name: 'Speed', data: [80, 50, 30] },
          { name: 'Power', data: [60, 70, 40] },
        ],
        categories: ['X', 'Y', 'Z'],
      })
      const el = chart.el

      const series = el.querySelectorAll(
        '.apexcharts-radar-series .apexcharts-series'
      )
      const names = Array.from(series).map((s) =>
        s.getAttribute('seriesName')
      )
      expect(names).toContain('Speed')
      expect(names).toContain('Power')
    })
  })

  describe('xaxis labels', () => {
    it('should render xaxis labels by default', () => {
      const chart = radarChart()
      const el = chart.el

      const xaxis = el.querySelector('.apexcharts-xaxis')
      expect(xaxis).not.toBeNull()
    })

    it('should render correct number of xaxis labels', () => {
      const chart = radarChart({
        series: [{ data: [10, 20, 30] }],
        categories: ['Alpha', 'Beta', 'Gamma'],
      })
      const el = chart.el

      const labels = el.querySelectorAll('.apexcharts-xaxis-label')
      expect(labels.length).toBe(3)
    })

    it('should hide xaxis labels when configured', () => {
      const chart = radarChart({
        xaxis: { labels: { show: false } },
      })
      const el = chart.el

      const xaxis = el.querySelector(
        '.apexcharts-radar-series > .apexcharts-xaxis'
      )
      expect(xaxis).toBeNull()
    })
  })

  describe('polygons', () => {
    it('should render polygon grid', () => {
      const chart = radarChart()
      const el = chart.el

      // Radar renders polygon elements for the grid
      const polygons = el.querySelectorAll('polygon')
      expect(polygons.length).toBeGreaterThan(0)
    })
  })

  describe('data labels', () => {
    it('should render data labels when enabled', () => {
      const chart = radarChart({
        dataLabels: { enabled: true },
      })
      const el = chart.el

      const dlGroups = el.querySelectorAll('.apexcharts-datalabels')
      expect(dlGroups.length).toBeGreaterThan(0)
    })

    it('should not render data label text elements when disabled', () => {
      const chart = radarChart({
        dataLabels: { enabled: false },
      })
      const el = chart.el

      const dataLabelTexts = el.querySelectorAll(
        '.apexcharts-datalabels .apexcharts-data-labels'
      )
      expect(dataLabelTexts.length).toBe(0)
    })
  })

  describe('yaxis', () => {
    it('should render yaxis labels when show is true', () => {
      const chart = radarChart({
        yaxis: { show: true },
      })
      const el = chart.el

      const yaxis = el.querySelector('.apexcharts-yaxis')
      expect(yaxis).not.toBeNull()
    })
  })

  describe('configuration', () => {
    it('should respect custom radar size', () => {
      const chart = radarChart({
        radar: { size: 120 },
      })
      const w = chart.w

      expect(w.config.plotOptions.radar.size).toBe(120)
    })

    it('should respect offset configuration', () => {
      const chart = radarChart({
        radar: { offsetX: 10, offsetY: 20 },
      })
      const w = chart.w

      expect(w.config.plotOptions.radar.offsetX).toBe(10)
      expect(w.config.plotOptions.radar.offsetY).toBe(20)
    })

    it('should handle custom polygon colors', () => {
      const chart = radarChart({
        radar: {
          polygons: {
            strokeColors: '#ccc',
            connectorColors: '#ddd',
          },
        },
      })
      const w = chart.w

      expect(w.config.plotOptions.radar.polygons.strokeColors).toBe('#ccc')
    })
  })

  describe('edge cases', () => {
    it('should handle single data point series', () => {
      const chart = radarChart({
        series: [{ data: [50] }],
        categories: ['Only'],
      })
      const el = chart.el

      // Should not throw
      expect(el).toBeDefined()
    })

    it('should handle 3-point (triangle) radar', () => {
      const chart = radarChart({
        series: [{ data: [80, 60, 40] }],
        categories: ['A', 'B', 'C'],
      })
      const el = chart.el

      const radarPaths = el.querySelectorAll('.apexcharts-radar')
      expect(radarPaths.length).toBeGreaterThan(0)
    })

    it('should handle all-zero values', () => {
      const chart = radarChart({
        series: [{ data: [0, 0, 0, 0] }],
        categories: ['A', 'B', 'C', 'D'],
      })
      const el = chart.el

      expect(el).toBeDefined()
    })

    it('should handle all-equal values', () => {
      const chart = radarChart({
        series: [{ data: [50, 50, 50, 50, 50] }],
        categories: ['A', 'B', 'C', 'D', 'E'],
      })
      const el = chart.el

      const radarPaths = el.querySelectorAll('.apexcharts-radar')
      expect(radarPaths.length).toBeGreaterThan(0)
    })
  })
})

// ===========================================================================
// Radar – isolated unit tests
// ===========================================================================

describe('Radar.getDataPointsPos', () => {
  function makeRadar() {
    const radar = Object.create(Radar.prototype)
    radar.dataPointsLen = 4
    return radar
  }

  it('should calculate positions using polar coordinates', () => {
    const radar = makeRadar()
    const radii = [50, 100, 75, 25]
    const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]

    const positions = radar.getDataPointsPos(radii, angles, 4)

    expect(positions.length).toBe(4)

    // Point at angle 0: x = r*sin(0) = 0, y = -r*cos(0) = -50
    expect(positions[0].x).toBeCloseTo(0, 5)
    expect(positions[0].y).toBeCloseTo(-50, 5)

    // Point at angle PI/2: x = r*sin(PI/2) = 100, y = -r*cos(PI/2) = 0
    expect(positions[1].x).toBeCloseTo(100, 5)
    expect(positions[1].y).toBeCloseTo(0, 3)

    // Point at angle PI: x = r*sin(PI) = 0, y = -r*cos(PI) = 75
    expect(positions[2].x).toBeCloseTo(0, 3)
    expect(positions[2].y).toBeCloseTo(75, 5)
  })

  it('should return empty array for empty input', () => {
    const radar = makeRadar()
    const positions = radar.getDataPointsPos([], [], 0)

    expect(positions).toEqual([])
  })
})

describe('Radar.getTextPos', () => {
  function makeRadar() {
    return Object.create(Radar.prototype)
  }

  it('should set textAnchor to "start" for positive x beyond limit', () => {
    const radar = makeRadar()
    const result = radar.getTextPos({ x: 50, y: 0 }, 100)

    expect(result.textAnchor).toBe('start')
    expect(result.newX).toBe(60) // x + 10
  })

  it('should set textAnchor to "end" for negative x beyond limit', () => {
    const radar = makeRadar()
    const result = radar.getTextPos({ x: -50, y: 0 }, 100)

    expect(result.textAnchor).toBe('end')
    expect(result.newX).toBe(-60) // x - 10
  })

  it('should set textAnchor to "middle" for x near center', () => {
    const radar = makeRadar()
    const result = radar.getTextPos({ x: 5, y: 0 }, 100)

    expect(result.textAnchor).toBe('middle')
    expect(result.newX).toBe(5)
  })

  it('should offset y for positions near top edge', () => {
    const radar = makeRadar()
    const result = radar.getTextPos({ x: 0, y: -95 }, 100)

    expect(result.newY).toBe(-105) // y - 10
  })

  it('should offset y for positions near bottom edge', () => {
    const radar = makeRadar()
    const result = radar.getTextPos({ x: 0, y: 95 }, 100)

    expect(result.newY).toBe(105) // y + 10
  })
})

describe('Radar.getPreviousPath', () => {
  function makeRadar(previousPaths) {
    const radar = Object.create(Radar.prototype)
    radar.w = {
      globals: { previousPaths: previousPaths || [] },
    }
    return radar
  }

  it('should return null when no previous paths exist', () => {
    const radar = makeRadar()
    expect(radar.getPreviousPath(0)).toBeNull()
  })

  it('should return matching path d when found', () => {
    const radar = makeRadar([
      { realIndex: 0, paths: [{ d: 'M 10 20 L 30 40 Z' }] },
    ])

    expect(radar.getPreviousPath(0)).toBe('M 10 20 L 30 40 Z')
  })

  it('should return null when realIndex does not match', () => {
    const radar = makeRadar([
      { realIndex: 5, paths: [{ d: 'M 10 20 L 30 40 Z' }] },
    ])

    expect(radar.getPreviousPath(0)).toBeNull()
  })

  it('should handle string realIndex via parseInt', () => {
    const radar = makeRadar([
      { realIndex: '2', paths: [{ d: 'M 1 2 Z' }] },
    ])

    expect(radar.getPreviousPath(2)).toBe('M 1 2 Z')
  })

  it('should skip entries with empty paths', () => {
    const radar = makeRadar([
      { realIndex: 0, paths: [] },
      { realIndex: 0, paths: [{ d: 'M 99 99 Z' }] },
    ])

    expect(radar.getPreviousPath(0)).toBe('M 99 99 Z')
  })
})

describe('Radar.createPaths', () => {
  function makeRadar() {
    const radar = Object.create(Radar.prototype)
    // createPaths uses this.graphics methods
    radar.graphics = {
      move: (x, y) => `M ${x} ${y} `,
      line: (x, y) => `L ${x} ${y} `,
    }
    return radar
  }

  it('should return four path arrays', () => {
    const radar = makeRadar()
    const result = radar.createPaths(
      [
        { x: 10, y: 0 },
        { x: 0, y: 10 },
        { x: -10, y: 0 },
      ],
      { x: 0, y: 0 }
    )

    expect(result.linePathsTo).toHaveLength(1)
    expect(result.linePathsFrom).toHaveLength(1)
    expect(result.areaPathsTo).toHaveLength(1)
    expect(result.areaPathsFrom).toHaveLength(1)
  })

  it('should close paths with Z', () => {
    const radar = makeRadar()
    const result = radar.createPaths(
      [
        { x: 10, y: 0 },
        { x: 0, y: 10 },
      ],
      { x: 0, y: 0 }
    )

    expect(result.linePathsTo[0]).toContain('Z')
    expect(result.areaPathsTo[0]).toContain('Z')
  })

  it('should return empty arrays for empty positions', () => {
    const radar = makeRadar()
    const result = radar.createPaths([], { x: 0, y: 0 })

    expect(result.linePathsTo).toEqual([])
    expect(result.linePathsFrom).toEqual([])
    expect(result.areaPathsTo).toEqual([])
    expect(result.areaPathsFrom).toEqual([])
  })

  it('should start from the origin for pathsFrom', () => {
    const radar = makeRadar()
    const result = radar.createPaths(
      [{ x: 50, y: 50 }],
      { x: 5, y: 10 }
    )

    expect(result.linePathsFrom[0]).toContain('M 5 10')
    expect(result.areaPathsFrom[0]).toContain('M 5 10')
  })
})
