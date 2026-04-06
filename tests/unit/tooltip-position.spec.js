// @vitest-environment node
import Position from '../../src/modules/tooltip/Position.js'
import Intersect from '../../src/modules/tooltip/Intersect.js'
import Utils from '../../src/utils/Utils.js'

describe('Utils.clampToBoundary', () => {
  it('should clamp negative coordinates to 0', () => {
    const clamped = Utils.clampToBoundary({ x: -50, y: -30 })
    expect(clamped.x).toBe(0)
    expect(clamped.y).toBe(0)
  })

  it('should leave positive coordinates unchanged', () => {
    const clamped = Utils.clampToBoundary({ x: 100, y: 100 })
    expect(clamped.x).toBe(100)
    expect(clamped.y).toBe(100)
  })
})

describe('Tooltip keepInBoundary option', () => {
  describe('Position.moveTooltip', () => {
    const createMockTooltipContext = (keepInBoundary) => {
      const mockTooltipEl = {
        style: { left: '', top: '' },
      }
      return {
        w: {
          config: {
            tooltip: {
              keepInBoundary,
              followCursor: false,
            },
          },
          globals: {
            translateX: 0,
            translateY: 0,
            gridWidth: 500,
            gridHeight: 300,
            isBarHorizontal: false,
          },
          layout: {
            gridWidth: 500,
            gridHeight: 300,
            translateX: 0,
            translateY: 0,
          },
        },
        tooltipRect: { ttWidth: 100, ttHeight: 50 },
        getElTooltip: () => mockTooltipEl,
        fixedTooltip: false,
      }
    }

    it('should clamp negative position to 0 when keepInBoundary is true', () => {
      const mockCtx = createMockTooltipContext(true)
      const position = new Position(mockCtx)

      position.moveTooltip(-50, -50, 1)

      const tooltipEl = mockCtx.getElTooltip()
      expect(parseFloat(tooltipEl.style.left)).toBe(0)
      expect(parseFloat(tooltipEl.style.top)).toBe(0)
    })

    it('should allow negative position when keepInBoundary is false', () => {
      const mockCtx = createMockTooltipContext(false)
      const position = new Position(mockCtx)

      position.moveTooltip(-50, -50, 1)

      const tooltipEl = mockCtx.getElTooltip()
      // With keepInBoundary false, x gets clamped to -20 by the existing logic
      expect(parseFloat(tooltipEl.style.left)).toBeLessThan(0)
    })
  })

  describe('Intersect.handleHeatTreeTooltip', () => {
    const createMockIntersectContext = (keepInBoundary) => {
      return {
        w: {
          config: {
            chart: { type: 'heatmap' },
            tooltip: {
              keepInBoundary,
              followCursor: false,
            },
            plotOptions: {
              bar: { rangeBarGroupRows: false },
            },
          },
          globals: {
            gridWidth: 500,
            gridHeight: 300,
            capturedSeriesIndex: -1,
            capturedDataPointIndex: -1,
            isBarHorizontal: false,
            dom: {
              elWrap: {
                getBoundingClientRect: () => ({ left: 0, top: 0 }),
              },
            },
          },
          layout: {
            gridWidth: 500,
            gridHeight: 300,
          },
          interact: {},
        },
        tooltipRect: { ttWidth: 100, ttHeight: 50 },
        tooltipLabels: {
          drawSeriesTexts: () => {},
        },
        tooltipPosition: {
          moveXCrosshairs: () => {},
        },
      }
    }

    const mockEvent = {
      target: {
        classList: {
          contains: () => false,
        },
      },
    }

    it('should clamp negative positions to 0 when keepInBoundary is true', () => {
      const mockCtx = createMockIntersectContext(true)
      const intersect = new Intersect(mockCtx)

      const result = intersect.handleHeatTreeTooltip({
        e: mockEvent,
        opt: {},
        x: -50,
        y: -30,
        type: 'heatmap',
      })

      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
    })

    it('should not clamp when keepInBoundary is false', () => {
      const mockCtx = createMockIntersectContext(false)
      const intersect = new Intersect(mockCtx)

      const result = intersect.handleHeatTreeTooltip({
        e: mockEvent,
        opt: {},
        x: -50,
        y: -30,
        type: 'heatmap',
      })

      expect(result.x).toBe(-50)
      expect(result.y).toBe(-30)
    })
  })

  describe('Intersect.handleMarkerTooltip', () => {
    const createMockIntersectContext = (keepInBoundary) => {
      return {
        w: {
          config: {
            chart: { type: 'line' },
            tooltip: {
              keepInBoundary,
              shared: false,
            },
            plotOptions: {
              bar: { rangeBarGroupRows: false },
            },
          },
          globals: {
            capturedSeriesIndex: -1,
            capturedDataPointIndex: -1,
            isBarHorizontal: false,
          },
          layout: {
            gridWidth: 500,
            gridHeight: 300,
          },
          interact: {},
        },
        tooltipRect: { ttWidth: 100, ttHeight: 50 },
        intersect: false,
        showOnIntersect: false,
        tooltipLabels: {
          drawSeriesTexts: () => {},
        },
        marker: {
          enlargeCurrentPoint: () => {},
        },
        e: { clientY: 0 },
        getElGrid: () => ({ getBoundingClientRect: () => ({ top: 0 }) }),
      }
    }

    const mockEvent = {
      target: {
        classList: {
          contains: () => false,
        },
      },
    }

    it('should clamp negative positions to 0 when keepInBoundary is true', () => {
      const mockCtx = createMockIntersectContext(true)
      const intersect = new Intersect(mockCtx)

      const result = intersect.handleMarkerTooltip({
        e: mockEvent,
        opt: { paths: null },
        x: -50,
        y: -30,
      })

      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
    })

    it('should not clamp when keepInBoundary is false', () => {
      const mockCtx = createMockIntersectContext(false)
      const intersect = new Intersect(mockCtx)

      const result = intersect.handleMarkerTooltip({
        e: mockEvent,
        opt: { paths: null },
        x: -50,
        y: -30,
      })

      expect(result.x).toBe(-50)
      expect(result.y).toBe(-30)
    })
  })
})
