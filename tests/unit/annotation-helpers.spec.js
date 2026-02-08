import Annotations from '../../src/modules/annotations/Annotations.js'
import Helpers from '../../src/modules/annotations/Helpers.js'
import { createChartWithOptions } from './utils/utils.js'

describe('Annotation Helpers', () => {
  let chart
  let annoCtx
  let helpers

  beforeEach(() => {
    chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30, 40, 50] }],
      xaxis: {
        categories: ['A', 'B', 'C', 'D', 'E'],
      },
    })
    annoCtx = new Annotations(chart)
    helpers = new Helpers(annoCtx)
  })

  afterEach(() => {
    if (chart && chart.destroy) {
      try {
        chart.destroy()
      } catch (e) {
        // Ignore ResizeObserver errors in tests
      }
    }
  })

  describe('Initialization', () => {
    it('should initialize with correct properties', () => {
      expect(helpers.w).toBeDefined()
      expect(helpers.annoCtx).toBeDefined()
      expect(helpers.w).toBe(annoCtx.w)
    })
  })

  describe('setOrientations', () => {
    it('should handle vertical orientation for xaxis annotations', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 2,
              borderColor: '#00E396',
              label: {
                text: 'Vertical Label',
                orientation: 'vertical',
              },
            },
          ],
        },
      })

      const annotation = chart.w.config.annotations.xaxis[0]
      const annoCtx2 = new Annotations(chart)
      const helpers2 = new Helpers(annoCtx2)

      // Call setOrientations
      helpers2.setOrientations(annotation, 0)

      const xAnno = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-xaxis-annotation-label[rel="0"]'
      )

      if (xAnno) {
        // Should have transform attribute for rotation
        expect(xAnno.hasAttribute('transform')).toBe(true)
      }
    })
  })

  describe('addBackgroundToAnno', () => {
    it('should return null if annoEl is null', () => {
      const anno = {
        label: {
          text: 'Test',
          style: {
            padding: { left: 4, right: 4, top: 2, bottom: 2 },
          },
        },
      }

      const result = helpers.addBackgroundToAnno(null, anno)
      expect(result).toBeNull()
    })

    it('should return null if label text is empty', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 2,
              borderColor: '#00E396',
              label: {
                text: 'Test',
              },
            },
          ],
        },
      })

      const annoEl = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-xaxis-annotation-label'
      )

      const anno = {
        label: {
          text: '',
          style: {
            padding: { left: 4, right: 4, top: 2, bottom: 2 },
          },
        },
      }

      const result = helpers.addBackgroundToAnno(annoEl, anno)
      expect(result).toBeNull()
    })

    it('should add background with custom styling', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 2,
              borderColor: '#00E396',
              label: {
                text: 'Test Label',
              },
            },
          ],
        },
      })

      const annoEl = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-xaxis-annotation-label'
      )

      const anno = {
        label: {
          text: 'Test Label',
          borderRadius: 4,
          borderWidth: 2,
          borderColor: '#000',
          style: {
            background: '#EFEFEF',
            padding: { left: 8, right: 8, top: 4, bottom: 4 },
          },
        },
      }

      const result = helpers.addBackgroundToAnno(annoEl, anno)
      expect(result).toBeDefined()
    })
  })

  describe('getY1Y2', () => {
    it('should calculate Y position for numeric values', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      const annoCtx2 = new Annotations(chart)
      const helpers2 = new Helpers(annoCtx2)

      const anno = { y: 25, yAxisIndex: 0 }
      const result = helpers2.getY1Y2('y1', anno)

      expect(result).toHaveProperty('yP')
      expect(result).toHaveProperty('clipped')
      expect(typeof result.yP).toBe('number')
    })

    it('should handle y2 values', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      const annoCtx2 = new Annotations(chart)
      const helpers2 = new Helpers(annoCtx2)

      const anno = { y: 20, y2: 40, yAxisIndex: 0 }
      const result = helpers2.getY1Y2('y2', anno)

      expect(result).toHaveProperty('yP')
      expect(result).toHaveProperty('clipped')
    })

    it('should handle pixel values', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      const annoCtx2 = new Annotations(chart)
      const helpers2 = new Helpers(annoCtx2)

      const anno = { y: '100px', yAxisIndex: 0 }
      const result = helpers2.getY1Y2('y1', anno)

      expect(result.yP).toBe(100)
    })

    it('should handle inverted axis', () => {
      chart = createChartWithOptions({
        chart: { type: 'bar' },
        plotOptions: {
          bar: { horizontal: true },
        },
        series: [{ data: [10, 20, 30, 40, 50] }],
        xaxis: {
          categories: ['A', 'B', 'C', 'D', 'E'],
        },
      })

      const annoCtx2 = new Annotations(chart)
      const helpers2 = new Helpers(annoCtx2)

      const anno = { y: 'B', yAxisIndex: 0 }
      const result = helpers2.getY1Y2('y1', anno)

      expect(result).toHaveProperty('yP')
    })

    it('should handle very large y values', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      const annoCtx2 = new Annotations(chart)
      const helpers2 = new Helpers(annoCtx2)

      const anno = { y: 1000, yAxisIndex: 0 }
      const result = helpers2.getY1Y2('y1', anno)

      // Value outside the chart range should be processed
      expect(result).toHaveProperty('yP')
      expect(result).toHaveProperty('clipped')
    })
  })

  describe('getX1X2', () => {
    it('should calculate X position for numeric values', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      const annoCtx2 = new Annotations(chart)
      const helpers2 = new Helpers(annoCtx2)

      const anno = { x: 2.5 }
      const result = helpers2.getX1X2('x1', anno)

      expect(result).toHaveProperty('x')
      expect(result).toHaveProperty('clipped')
      expect(typeof result.x).toBe('number')
    })

    it('should handle x2 values', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      const annoCtx2 = new Annotations(chart)
      const helpers2 = new Helpers(annoCtx2)

      const anno = { x: 1, x2: 3 }
      const result = helpers2.getX1X2('x2', anno)

      expect(result).toHaveProperty('x')
      expect(result).toHaveProperty('clipped')
    })

    it('should handle pixel values', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      const annoCtx2 = new Annotations(chart)
      const helpers2 = new Helpers(annoCtx2)

      const anno = { x: '150px' }
      const result = helpers2.getX1X2('x1', anno)

      expect(result.x).toBe(150)
    })

    it('should handle category axis', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        xaxis: {
          type: 'category',
          categories: ['A', 'B', 'C', 'D', 'E'],
        },
      })

      const annoCtx2 = new Annotations(chart)
      const helpers2 = new Helpers(annoCtx2)

      const anno = { x: 'C' }
      const result = helpers2.getX1X2('x1', anno)

      expect(result).toHaveProperty('x')
    })

    it('should handle undefined x for markers', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      const annoCtx2 = new Annotations(chart)
      const helpers2 = new Helpers(annoCtx2)

      const anno = { marker: { size: 6 } }
      const result = helpers2.getX1X2('x1', anno)

      expect(result.x).toBe(chart.w.globals.gridWidth)
    })

    it('should handle values exceeding grid width', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      const annoCtx2 = new Annotations(chart)
      const helpers2 = new Helpers(annoCtx2)

      const anno = { x: 1000000 }
      const result = helpers2.getX1X2('x1', anno)

      // Very large x value should return a result
      expect(result).toHaveProperty('x')
      expect(result).toHaveProperty('clipped')
      expect(typeof result.x).toBe('number')
    })

    it('should clip negative values', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      const annoCtx2 = new Annotations(chart)
      const helpers2 = new Helpers(annoCtx2)

      const anno = { x: -100 }
      const result = helpers2.getX1X2('x1', anno)

      expect(result.clipped).toBe(true)
      expect(result.x).toBe(0)
    })
  })

  describe('getStringX', () => {
    it('should get X position for category label', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        xaxis: {
          categories: ['A', 'B', 'C', 'D', 'E'],
        },
      })

      const annoCtx2 = new Annotations(chart)
      const helpers2 = new Helpers(annoCtx2)

      const result = helpers2.getStringX('C')

      expect(typeof result).toBe('number')
    })

    it('should handle non-existent categories', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        xaxis: {
          categories: ['A', 'B', 'C', 'D', 'E'],
        },
      })

      const annoCtx2 = new Annotations(chart)
      const helpers2 = new Helpers(annoCtx2)

      const result = helpers2.getStringX('NonExistent')

      expect(result).toBe('NonExistent')
    })

    it('should handle array labels', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30] }],
        xaxis: {
          categories: [['Line 1', 'Line 2'], 'B', 'C'],
        },
      })

      const annoCtx2 = new Annotations(chart)
      const helpers2 = new Helpers(annoCtx2)

      const result = helpers2.getStringX('Line 1 Line 2')

      expect(typeof result === 'number' || typeof result === 'string').toBe(
        true
      )
    })
  })
})
