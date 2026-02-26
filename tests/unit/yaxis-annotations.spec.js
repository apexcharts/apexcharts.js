import Annotations from '../../src/modules/annotations/Annotations.js'
import YAxisAnnotations from '../../src/modules/annotations/YAxisAnnotations.js'
import { createChartWithOptions } from './utils/utils.js'

describe('YAxisAnnotations', () => {
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

  // =========================================================================
  // Horizontal line annotations (no y2)
  // =========================================================================
  describe('horizontal line annotations', () => {
    it('should render a line with correct stroke attributes', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          yaxis: [
            {
              y: 25,
              borderColor: '#775dd0',
              borderWidth: 3,
              strokeDashArray: 4,
            },
          ],
        },
      })

      const line = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-yaxis-annotations line'
      )
      expect(line).not.toBeNull()
      expect(line.getAttribute('stroke')).toBe('#775dd0')
      expect(line.getAttribute('stroke-width')).toBe('3')
      expect(line.getAttribute('stroke-dasharray')).toBe('4')
    })

    it('should add the annotation id as a CSS class on the line', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          yaxis: [
            {
              y: 25,
              id: 'my-yaxis-line',
              borderColor: '#775dd0',
            },
          ],
        },
      })

      const el = chart.w.globals.dom.baseEl.querySelector('.my-yaxis-line')
      expect(el).not.toBeNull()
      expect(el.tagName.toLowerCase()).toBe('line')
    })

    it('should render multiple lines with distinct stroke colors', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          yaxis: [
            { y: 15, borderColor: '#00e396' },
            { y: 30, borderColor: '#775dd0' },
            { y: 45, borderColor: '#feb019' },
          ],
        },
      })

      const lines = chart.w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-yaxis-annotations line'
      )
      expect(lines.length).toBe(3)
      expect(lines[0].getAttribute('stroke')).toBe('#00e396')
      expect(lines[1].getAttribute('stroke')).toBe('#775dd0')
      expect(lines[2].getAttribute('stroke')).toBe('#feb019')
    })
  })

  // =========================================================================
  // Range rect annotations (y + y2)
  // =========================================================================
  describe('range rect annotations', () => {
    it('should render a rect with correct fill and opacity', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          yaxis: [
            {
              y: 20,
              y2: 40,
              fillColor: '#ff0000',
              opacity: 0.5,
            },
          ],
        },
      })

      const rect = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-yaxis-annotations .apexcharts-annotation-rect'
      )
      expect(rect).not.toBeNull()
      expect(rect.getAttribute('fill')).toBe('#ff0000')
      expect(rect.getAttribute('opacity')).toBe('0.5')
    })

    it('should apply clip-path referencing gridRectMask', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          yaxis: [
            {
              y: 20,
              y2: 40,
              fillColor: '#feb019',
            },
          ],
        },
      })

      const rect = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-yaxis-annotations .apexcharts-annotation-rect'
      )
      expect(rect).not.toBeNull()
      expect(rect.getAttribute('clip-path')).toContain('gridRectMask')
    })

    it('should add the annotation id as a CSS class on the rect', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          yaxis: [
            {
              y: 20,
              y2: 40,
              id: 'my-yaxis-rect',
              fillColor: '#feb019',
            },
          ],
        },
      })

      const el = chart.w.globals.dom.baseEl.querySelector('.my-yaxis-rect')
      expect(el).not.toBeNull()
      expect(el.classList.contains('apexcharts-annotation-rect')).toBe(true)
    })

    it('should produce a non-negative rect height when y and y2 are swapped', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          yaxis: [
            {
              y: 40,
              y2: 20,
              fillColor: '#feb019',
            },
          ],
        },
      })

      const rect = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-yaxis-annotations .apexcharts-annotation-rect'
      )
      expect(rect).not.toBeNull()
      const height = parseFloat(rect.getAttribute('height'))
      expect(height).toBeGreaterThanOrEqual(0)
    })
  })

  // =========================================================================
  // Label rendering
  // =========================================================================
  describe('label rendering', () => {
    it('should render a label with correct font attributes', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          yaxis: [
            {
              y: 25,
              borderColor: '#775dd0',
              label: {
                text: 'Styled',
                style: {
                  fontSize: '16px',
                  fontFamily: 'Arial',
                  fontWeight: 'bold',
                  color: '#ff0000',
                  cssClass: 'my-custom-label',
                },
              },
            },
          ],
        },
      })

      const label = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-yaxis-annotation-label'
      )
      expect(label).not.toBeNull()
      expect(label.getAttribute('font-size')).toBe('16px')
      expect(label.getAttribute('font-family')).toBe('Arial')
      expect(label.getAttribute('font-weight')).toBe('bold')
      expect(label.getAttribute('fill')).toBe('#ff0000')
      expect(label.classList.contains('my-custom-label')).toBe(true)
    })

    it('should set incremental rel attributes on multiple labels', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          yaxis: [
            { y: 15, borderColor: '#00e396', label: { text: 'A' } },
            { y: 30, borderColor: '#775dd0', label: { text: 'B' } },
          ],
        },
      })

      const labels = chart.w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-yaxis-annotation-label'
      )
      expect(labels.length).toBe(2)
      expect(labels[0].getAttribute('rel')).toBe('0')
      expect(labels[1].getAttribute('rel')).toBe('1')
    })

    it('should include annotation id in label cssClass', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          yaxis: [
            {
              y: 25,
              id: 'anno-with-id',
              borderColor: '#775dd0',
              label: { text: 'With ID' },
            },
          ],
        },
      })

      const label = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-yaxis-annotation-label'
      )
      expect(label).not.toBeNull()
      expect(label.classList.contains('anno-with-id')).toBe(true)
    })
  })

  // =========================================================================
  // drawYAxisAnnotations group
  // =========================================================================
  describe('drawYAxisAnnotations', () => {
    it('should create the group element even with no annotations', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: { yaxis: [] },
      })

      const group = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-yaxis-annotations'
      )
      expect(group).not.toBeNull()
      expect(group.querySelectorAll('line').length).toBe(0)
    })
  })

  // =========================================================================
  // _getYAxisAnnotationWidth
  // =========================================================================
  describe('_getYAxisAnnotationWidth', () => {
    it('should return percentage of gridWidth for percent string', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      const annoCtx = new Annotations(chart.w)
      const yAxis = new YAxisAnnotations(annoCtx)

      const width = yAxis._getYAxisAnnotationWidth({ width: '50%', offsetX: 0 })
      expect(width).toBe(chart.getState().gridWidth * 0.5)
    })

    it('should return parsed integer for numeric string', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      const annoCtx = new Annotations(chart.w)
      const yAxis = new YAxisAnnotations(annoCtx)

      const width = yAxis._getYAxisAnnotationWidth({ width: '200', offsetX: 0 })
      expect(width).toBe(200)
    })

    it('should add offsetX to the computed width', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      const annoCtx = new Annotations(chart.w)
      const yAxis = new YAxisAnnotations(annoCtx)

      const width = yAxis._getYAxisAnnotationWidth({
        width: '100',
        offsetX: 50,
      })
      expect(width).toBe(150)
    })
  })
})
