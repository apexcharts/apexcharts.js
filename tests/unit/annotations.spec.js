import Annotations from '../../src/modules/annotations/Annotations.js'
import { createChartWithOptions } from './utils/utils.js'

describe('Annotations', () => {
  let chart

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
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      const annoCtx = new Annotations(chart)
      expect(annoCtx.ctx).toBeDefined()
      expect(annoCtx.w).toBeDefined()
      expect(annoCtx.graphics).toBeDefined()
      expect(annoCtx.helpers).toBeDefined()
      expect(annoCtx.xAxisAnnotations).toBeDefined()
      expect(annoCtx.yAxisAnnotations).toBeDefined()
      expect(annoCtx.pointsAnnotations).toBeDefined()
    })

    it('should set invertAxis for horizontal bar charts', () => {
      chart = createChartWithOptions({
        chart: { type: 'bar' },
        plotOptions: {
          bar: { horizontal: true },
        },
        series: [{ data: [10, 20, 30] }],
      })

      const annoCtx = new Annotations(chart)
      expect(annoCtx.invertAxis).toBe(true)
    })

    it('should set inversedReversedAxis for reversed horizontal bar charts', () => {
      chart = createChartWithOptions({
        chart: { type: 'bar' },
        plotOptions: {
          bar: { horizontal: true },
        },
        yaxis: [{ reversed: true }],
        series: [{ data: [10, 20, 30] }],
      })

      const annoCtx = new Annotations(chart)
      expect(annoCtx.inversedReversedAxis).toBe(true)
    })

    it('should calculate xDivision correctly', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      const annoCtx = new Annotations(chart)
      const expectedXDivision =
        chart.w.globals.gridWidth / chart.w.globals.dataPoints
      expect(annoCtx.xDivision).toBe(expectedXDivision)
    })
  })

  describe('drawAxesAnnotations', () => {
    it('should draw annotations on axis charts', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 2,
              borderColor: '#00E396',
              label: {
                text: 'X Annotation',
              },
            },
          ],
          yaxis: [
            {
              y: 30,
              borderColor: '#775DD0',
              label: {
                text: 'Y Annotation',
              },
            },
          ],
        },
      })

      const xAxisAnnotations = chart.w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-xaxis-annotations'
      )
      const yAxisAnnotations = chart.w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-yaxis-annotations'
      )

      expect(xAxisAnnotations.length).toBeGreaterThan(0)
      expect(yAxisAnnotations.length).toBeGreaterThan(0)
    })

    it('should not draw annotations on non-axis charts', () => {
      chart = createChartWithOptions({
        chart: { type: 'pie' },
        series: [10, 20, 30],
        labels: ['A', 'B', 'C'],
      })

      const annotations = chart.w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-xaxis-annotations, .apexcharts-yaxis-annotations'
      )

      expect(annotations.length).toBe(0)
    })
  })

  describe('drawImageAnnos', () => {
    it('should draw image annotations', () => {
      const imagePath =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          images: [
            {
              path: imagePath,
              x: 100,
              y: 100,
              width: 30,
              height: 30,
            },
          ],
        },
      })

      const annoCtx = new Annotations(chart)
      annoCtx.drawImageAnnos()

      const images = chart.w.globals.dom.baseEl.querySelectorAll('image')
      expect(images.length).toBeGreaterThan(0)
    })

    it('should handle multiple image annotations', () => {
      const imagePath =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          images: [
            { path: imagePath, x: 100, y: 100, width: 30, height: 30 },
            { path: imagePath, x: 200, y: 200, width: 30, height: 30 },
          ],
        },
      })

      const annoCtx = new Annotations(chart)
      annoCtx.drawImageAnnos()

      const images = chart.w.globals.dom.baseEl.querySelectorAll('image')
      expect(images.length).toBeGreaterThan(0)
    })
  })

  describe('drawTextAnnos', () => {
    it('should draw text annotations', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          texts: [
            {
              x: 100,
              y: 100,
              text: 'Test Annotation',
              fontSize: '14px',
            },
          ],
        },
      })

      const annoCtx = new Annotations(chart)
      annoCtx.drawTextAnnos()

      const textElements =
        chart.w.globals.dom.baseEl.querySelectorAll('.apexcharts-text')
      expect(textElements.length).toBeGreaterThan(0)
    })

    it('should handle multiple text annotations', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          texts: [
            { x: 100, y: 100, text: 'First' },
            { x: 200, y: 200, text: 'Second' },
          ],
        },
      })

      const annoCtx = new Annotations(chart)
      annoCtx.drawTextAnnos()

      const textElements =
        chart.w.globals.dom.baseEl.querySelectorAll('.apexcharts-text')
      expect(textElements.length).toBeGreaterThan(0)
    })
  })

  describe('addText', () => {
    it('should add text with default properties', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      const annoCtx = new Annotations(chart)
      annoCtx.addText({
        x: 100,
        y: 100,
        text: 'Test Text',
      })

      const textElements =
        chart.w.globals.dom.baseEl.querySelectorAll('.apexcharts-text')
      expect(textElements.length).toBeGreaterThan(0)
    })
  })

  describe('External Annotation Methods', () => {
    it('should add xaxis annotation externally', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      chart.addXaxisAnnotation({
        x: 2,
        borderColor: '#00E396',
        label: {
          text: 'External X Annotation',
        },
      })

      const xAxisAnnotations = chart.w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-xaxis-annotation-label'
      )
      expect(xAxisAnnotations.length).toBeGreaterThan(0)
    })

    it('should add yaxis annotation externally', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      chart.addYaxisAnnotation({
        y: 25,
        borderColor: '#775DD0',
        label: {
          text: 'External Y Annotation',
        },
      })

      const yAxisAnnotations = chart.w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-yaxis-annotation-label'
      )
      expect(yAxisAnnotations.length).toBeGreaterThan(0)
    })

    it('should add point annotation externally', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      chart.addPointAnnotation({
        x: 2,
        y: 30,
        marker: {
          size: 6,
        },
        label: {
          text: 'Point',
        },
      })

      const pointAnnotations = chart.w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-point-annotation-label'
      )
      expect(pointAnnotations.length).toBeGreaterThan(0)
    })

    it('should add annotation with pushToMemory flag', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      const initialMemoryLength = chart.w.globals.memory.methodsToExec.length

      chart.addXaxisAnnotation(
        {
          x: 2,
          id: 'test-annotation',
          borderColor: '#00E396',
        },
        true
      )

      expect(chart.w.globals.memory.methodsToExec.length).toBe(
        initialMemoryLength + 1
      )
    })
  })

  describe('clearAnnotations', () => {
    it('should clear all annotations', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [{ x: 2, borderColor: '#00E396' }],
          yaxis: [{ y: 25, borderColor: '#775DD0' }],
          points: [{ x: 3, y: 30, marker: { size: 6 } }],
        },
      })

      chart.clearAnnotations()

      const xAxisAnnotations = chart.w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-xaxis-annotations line, .apexcharts-xaxis-annotations rect'
      )
      const yAxisAnnotations = chart.w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-yaxis-annotations line, .apexcharts-yaxis-annotations rect'
      )
      const pointAnnotations = chart.w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-point-annotations circle'
      )

      // Should be empty after clearing
      expect(xAxisAnnotations.length).toBe(0)
      expect(yAxisAnnotations.length).toBe(0)
      expect(pointAnnotations.length).toBe(0)
    })

    it('should clear annotations from memory', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      chart.addXaxisAnnotation(
        {
          x: 2,
          borderColor: '#00E396',
        },
        true
      )

      chart.clearAnnotations()

      const annotationMethods = chart.w.globals.memory.methodsToExec.filter(
        (m) => m.label === 'addAnnotation' || m.label === 'addText'
      )
      expect(annotationMethods.length).toBe(0)
    })
  })

  describe('removeAnnotation', () => {
    it('should remove annotation by id', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 2,
              id: 'annotation-to-remove',
              borderColor: '#00E396',
            },
          ],
        },
      })

      chart.removeAnnotation('annotation-to-remove')

      const annotation = chart.w.globals.dom.baseEl.querySelector(
        '.annotation-to-remove'
      )
      expect(annotation).toBeNull()
    })

    it('should remove annotation from config', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 2,
              id: 'test-annotation',
              borderColor: '#00E396',
            },
          ],
        },
      })

      expect(chart.w.config.annotations.xaxis.length).toBe(1)

      chart.removeAnnotation('test-annotation')

      expect(chart.w.config.annotations.xaxis.length).toBe(0)
    })

    it('should remove annotation from memory', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      chart.addXaxisAnnotation(
        {
          x: 2,
          id: 'memory-annotation',
          borderColor: '#00E396',
        },
        true
      )

      const beforeLength = chart.w.globals.memory.methodsToExec.length

      chart.removeAnnotation('memory-annotation')

      expect(chart.w.globals.memory.methodsToExec.length).toBeLessThan(
        beforeLength
      )
    })
  })

  describe('Annotation with different chart types', () => {
    it('should work with area charts', () => {
      chart = createChartWithOptions({
        chart: { type: 'area' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [{ x: 2, borderColor: '#00E396' }],
        },
      })

      const xAxisAnnotations = chart.w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-xaxis-annotations'
      )
      expect(xAxisAnnotations.length).toBeGreaterThan(0)
    })

    it('should work with scatter charts', () => {
      chart = createChartWithOptions({
        chart: { type: 'scatter' },
        series: [
          {
            data: [
              [10, 20],
              [20, 30],
              [30, 40],
            ],
          },
        ],
        annotations: {
          points: [{ x: 20, y: 30, marker: { size: 8 } }],
        },
      })

      const pointAnnotations = chart.w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-point-annotations'
      )
      expect(pointAnnotations.length).toBeGreaterThan(0)
    })
  })
})
