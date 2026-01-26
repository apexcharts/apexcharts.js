require('./__mocks__/ResizeObserver.js')
import Position from '../../src/modules/tooltip/Position.js'
import Intersect from '../../src/modules/tooltip/Intersect.js'

describe('Tooltip keepInBoundary option', () => {
  describe('Position.moveTooltip', () => {
    const createMockTooltipContext = () => {
      const mockTooltipEl = {
        style: { left: '', top: '' }
      }
      return {
        w: {
          config: {
            tooltip: {
              keepInBoundary: true,
              followCursor: false
            }
          },
          globals: {
            translateX: 0,
            translateY: 0,
            gridWidth: 500,
            gridHeight: 300,
            isBarHorizontal: false
          }
        },
        tooltipRect: { ttWidth: 100, ttHeight: 50 },
        getElTooltip: () => mockTooltipEl,
        fixedTooltip: false
      }
    }

    it('should clamp negative position to 0 when keepInBoundary is true', () => {
      const mockCtx = createMockTooltipContext()
      const position = new Position(mockCtx)

      position.moveTooltip(-50, -50, 1)

      const tooltipEl = mockCtx.getElTooltip()
      expect(parseFloat(tooltipEl.style.left)).toBe(0)
      expect(parseFloat(tooltipEl.style.top)).toBe(0)
    })
  })

  describe('Intersect.handleHeatTreeTooltip', () => {
    const createMockIntersectContext = () => {
      return {
        w: {
          config: {
            chart: { type: 'heatmap' },
            tooltip: {
              keepInBoundary: true,
              followCursor: false
            },
            plotOptions: {
              bar: { rangeBarGroupRows: false }
            }
          },
          globals: {
            gridWidth: 500,
            gridHeight: 300,
            capturedSeriesIndex: -1,
            capturedDataPointIndex: -1,
            isBarHorizontal: false,
            dom: {
              elWrap: {
                getBoundingClientRect: () => ({ left: 0, top: 0 })
              }
            }
          }
        },
        tooltipRect: { ttWidth: 100, ttHeight: 50 },
        tooltipLabels: {
          drawSeriesTexts: () => { }
        },
        tooltipPosition: {
          moveXCrosshairs: () => { }
        }
      }
    }

    it('should clamp negative positions to 0 when keepInBoundary is true', () => {
      const mockCtx = createMockIntersectContext()
      const intersect = new Intersect(mockCtx)

      // Mock event that doesn't match heatmap rect class
      const mockEvent = {
        target: {
          classList: {
            contains: () => false
          }
        }
      }

      const result = intersect.handleHeatTreeTooltip({
        e: mockEvent,
        opt: {},
        x: -50,
        y: -30,
        type: 'heatmap'
      })

      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
    })
  })

  describe('Intersect.handleMarkerTooltip', () => {
    const createMockIntersectContext = () => {
      return {
        w: {
          config: {
            chart: { type: 'line' },
            tooltip: {
              keepInBoundary: true,
              shared: false
            },
            plotOptions: {
              bar: { rangeBarGroupRows: false }
            }
          },
          globals: {
            capturedSeriesIndex: -1,
            capturedDataPointIndex: -1,
            isBarHorizontal: false
          }
        },
        tooltipRect: { ttWidth: 100, ttHeight: 50 },
        intersect: false,
        showOnIntersect: false,
        tooltipLabels: {
          drawSeriesTexts: () => { }
        },
        marker: {
          enlargeCurrentPoint: () => { }
        },
        e: { clientY: 0 },
        getElGrid: () => ({ getBoundingClientRect: () => ({ top: 0 }) })
      }
    }

    it('should clamp negative positions to 0 when keepInBoundary is true', () => {
      const mockCtx = createMockIntersectContext()
      const intersect = new Intersect(mockCtx)

      const mockEvent = {
        target: {
          classList: {
            contains: () => false
          }
        }
      }

      const result = intersect.handleMarkerTooltip({
        e: mockEvent,
        opt: { paths: null },
        x: -50,
        y: -30
      })

      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
    })
  })
})
