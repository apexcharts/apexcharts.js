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
    annoCtx = new Annotations(chart.w)
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
      const annoCtx2 = new Annotations(chart.w)
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

    it('measures from the grid origin, not the grid element edge', () => {
      // The rect is drawn in the annotation group's local coordinates, so the
      // offset to it has to be measured from the grid's local (0, 0). That is
      // NOT the grid element's rendered left edge whenever the grid draws
      // outside its own box -- a datetime axis whose first timescale tick is
      // floored to before minX, or a numeric bar chart whose gridlines run out
      // to -barPadForNumericAxis.
      //
      // getBBox is stubbed to x: 0 in tests/unit/setup.js, which is precisely
      // the value at which measuring from either point gives the same answer,
      // so it has to be overridden here or this test cannot fail.
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          yaxis: [{ y: 30, label: { text: 'Label', position: 'left' } }],
        },
      })
      const annoCtx2 = new Annotations(chart.w)
      const helpers2 = new Helpers(annoCtx2)

      const baseEl = chart.w.dom.baseEl
      const gridEl = baseEl.querySelector('.apexcharts-grid')
      const annoEl = baseEl.querySelector('.apexcharts-yaxis-annotation-label')

      // The grid renders 20px left and 5px above its own origin, so that origin
      // sits at client (100, 15) while the element's edge is at (80, 10).
      vi.spyOn(gridEl, 'getBBox').mockReturnValue({
        x: -20,
        y: -5,
        width: 720,
        height: 400,
      })
      vi.spyOn(gridEl, 'getBoundingClientRect').mockReturnValue({
        left: 80,
        top: 10,
        width: 720, // width / bbox width => a zoom of 1
        height: 400,
      })
      vi.spyOn(annoEl, 'getBoundingClientRect').mockReturnValue({
        left: 150,
        top: 30,
        width: 40,
        height: 12,
      })

      const anno = {
        label: {
          text: 'Label',
          style: { padding: { left: 4, right: 4, top: 2, bottom: 2 } },
        },
      }

      const elRect = helpers2.addBackgroundToAnno(annoEl, anno)

      // (150 - 100) - 4 = 46, and (30 - 15) - 2 = 13. Measuring from the
      // element edge instead gives 66 and 18: the background drawn a full
      // overhang right of, and below, the text it belongs behind.
      expect(Number(elRect.node.getAttribute('x'))).toBeCloseTo(46, 5)
      expect(Number(elRect.node.getAttribute('y'))).toBeCloseTo(13, 5)
    })
  })

  describe('getY1Y2', () => {
    it('should calculate Y position for numeric values', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      const annoCtx2 = new Annotations(chart.w)
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

      const annoCtx2 = new Annotations(chart.w)
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

      const annoCtx2 = new Annotations(chart.w)
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

      const annoCtx2 = new Annotations(chart.w)
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

      const annoCtx2 = new Annotations(chart.w)
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

      const annoCtx2 = new Annotations(chart.w)
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

      const annoCtx2 = new Annotations(chart.w)
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

      const annoCtx2 = new Annotations(chart.w)
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

      const annoCtx2 = new Annotations(chart.w)
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

      const annoCtx2 = new Annotations(chart.w)
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

      const annoCtx2 = new Annotations(chart.w)
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

      const annoCtx2 = new Annotations(chart.w)
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

      const annoCtx2 = new Annotations(chart.w)
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

      const annoCtx2 = new Annotations(chart.w)
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

      const annoCtx2 = new Annotations(chart.w)
      const helpers2 = new Helpers(annoCtx2)

      const result = helpers2.getStringX('Line 1 Line 2')

      expect(typeof result === 'number' || typeof result === 'string').toBe(
        true
      )
    })
  })
})
