import Annotations from '../../src/modules/annotations/Annotations.js'
import XAxisAnnotations from '../../src/modules/annotations/XAxisAnnotations.js'
import { createChartWithOptions } from './utils/utils.js'

describe('XAxisAnnotations', () => {
  let chart
  let annoCtx
  let xAxisAnnotations

  beforeEach(() => {
    chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30, 40, 50] }],
      xaxis: {
        categories: ['A', 'B', 'C', 'D', 'E'],
      },
    })
    annoCtx = new Annotations(chart)
    xAxisAnnotations = new XAxisAnnotations(annoCtx)
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
      expect(xAxisAnnotations.w).toBeDefined()
      expect(xAxisAnnotations.annoCtx).toBeDefined()
      expect(xAxisAnnotations.helpers).toBeDefined()
    })

    it('should set invertAxis from annoCtx', () => {
      chart = createChartWithOptions({
        chart: { type: 'bar' },
        plotOptions: {
          bar: { horizontal: true },
        },
        series: [{ data: [10, 20, 30] }],
      })

      const annoCtx2 = new Annotations(chart)
      const xAxis2 = new XAxisAnnotations(annoCtx2)

      expect(xAxis2.invertAxis).toBe(true)
    })
  })

  describe('addXaxisAnnotation - vertical line', () => {
    it('should draw a vertical line with correct stroke and width', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 2,
              borderColor: '#00e396',
              borderWidth: 2,
            },
          ],
        },
      })

      const line = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-xaxis-annotations line'
      )
      expect(line).not.toBeNull()
      expect(line.getAttribute('stroke')).toBe('#00e396')
      expect(line.getAttribute('stroke-width')).toBe('2')
    })

    it('should apply strokeDashArray to the line element', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 2,
              borderColor: '#00e396',
              strokeDashArray: 5,
            },
          ],
        },
      })

      const line = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-xaxis-annotations line'
      )
      expect(line).not.toBeNull()
      expect(line.getAttribute('stroke-dasharray')).toBe('5')
    })

    it('should apply offsetX and offsetY to line coordinates', () => {
      // Render without offsets to get baseline position
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 2,
              borderColor: '#00e396',
              offsetX: 0,
              offsetY: 0,
            },
          ],
        },
      })

      const baseLine = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-xaxis-annotations line'
      )
      const baseX = parseFloat(baseLine.getAttribute('x1'))
      const baseY = parseFloat(baseLine.getAttribute('y1'))

      // Render with offsets
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 2,
              borderColor: '#00e396',
              offsetX: 10,
              offsetY: 20,
            },
          ],
        },
      })

      const offsetLine = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-xaxis-annotations line'
      )
      expect(parseFloat(offsetLine.getAttribute('x1'))).toBe(baseX + 10)
      expect(parseFloat(offsetLine.getAttribute('y1'))).toBe(baseY + 20)
    })

    it('should add id class if provided', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 2,
              id: 'custom-xaxis-line',
              borderColor: '#00e396',
            },
          ],
        },
      })

      const annotation =
        chart.w.globals.dom.baseEl.querySelector('.custom-xaxis-line')
      expect(annotation).not.toBeNull()
    })

    it('should not draw if x is not a number', () => {
      const annoCtx2 = new Annotations(chart)
      const xAxis2 = new XAxisAnnotations(annoCtx2)

      const parent = chart.w.globals.dom.baseEl.querySelector('.apexcharts-svg')
      const initialChildCount = parent.childNodes.length

      xAxis2.addXaxisAnnotation(
        {
          x: undefined,
          borderColor: '#00e396',
          label: { text: '' },
        },
        parent,
        0
      )

      expect(parent.childNodes.length).toBe(initialChildCount)
    })
  })

  describe('addXaxisAnnotation - range (rect)', () => {
    it('should draw a rectangle for x to x2 range', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 'B',
              x2: 'D',
              fillColor: '#b3f7ca',
              opacity: 0.4,
            },
          ],
        },
      })

      const rects = chart.w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-xaxis-annotations .apexcharts-annotation-rect'
      )
      expect(rects.length).toBe(1)
    })

    it('should apply fillColor to the rect element', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 'A',
              x2: 'C',
              fillColor: '#ff0000',
              opacity: 0.5,
            },
          ],
        },
      })

      const rect = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-annotation-rect'
      )
      expect(rect).not.toBeNull()
      expect(rect.getAttribute('fill')).toBe('#ff0000')
      expect(rect.getAttribute('opacity')).toBe('0.5')
    })

    it('should apply clip-path to rect', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 'A',
              x2: 'C',
              fillColor: '#b3f7ca',
            },
          ],
        },
      })

      const rect = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-annotation-rect'
      )
      expect(rect).not.toBeNull()
      expect(rect.getAttribute('clip-path')).toContain('gridRectMask')
    })

    it('should add id class to rect if provided', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 'A',
              x2: 'C',
              id: 'custom-xaxis-rect',
              fillColor: '#b3f7ca',
            },
          ],
        },
      })

      const annotation =
        chart.w.globals.dom.baseEl.querySelector('.custom-xaxis-rect')
      expect(annotation).not.toBeNull()
    })
  })

  describe('addXaxisAnnotation - labels', () => {
    it('should draw label with correct text content', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 2,
              borderColor: '#00e396',
              label: {
                text: 'Test Label',
              },
            },
          ],
        },
      })

      const label = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-xaxis-annotation-label'
      )
      expect(label).not.toBeNull()
      expect(label.textContent).toBe('Test Label')
    })

    it('should produce different y positions for top vs bottom labels', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 2,
              borderColor: '#aaa',
              label: { text: 'Top', position: 'top' },
            },
          ],
        },
      })
      const topLabel = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-xaxis-annotation-label'
      )
      const topY = parseFloat(topLabel.getAttribute('y'))

      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 2,
              borderColor: '#aaa',
              label: { text: 'Bottom', position: 'bottom' },
            },
          ],
        },
      })
      const bottomLabel = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-xaxis-annotation-label'
      )
      const bottomY = parseFloat(bottomLabel.getAttribute('y'))

      // Top and bottom should resolve to different y positions
      expect(topY).not.toBe(bottomY)
    })

    it('should apply custom label styling attributes', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 2,
              borderColor: '#00e396',
              label: {
                text: 'Styled',
                style: {
                  fontSize: '16px',
                  fontFamily: 'Arial',
                  fontWeight: 'bold',
                  color: '#ff0000',
                  cssClass: 'custom-label-class',
                },
              },
            },
          ],
        },
      })

      const label = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-xaxis-annotation-label'
      )
      expect(label).not.toBeNull()
      expect(label.getAttribute('font-size')).toBe('16px')
      expect(label.getAttribute('font-family')).toBe('Arial')
      expect(label.getAttribute('font-weight')).toBe('bold')
      expect(label.getAttribute('fill')).toBe('#ff0000')
      expect(label.classList.contains('custom-label-class')).toBe(true)
    })

    it('should set rel attribute on label', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 2,
              borderColor: '#00e396',
              label: {
                text: 'Test Label',
              },
            },
          ],
        },
      })

      const label = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-xaxis-annotation-label'
      )
      expect(label.getAttribute('rel')).toBe('0')
    })

    it('should include annotation id in label css class', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 2,
              id: 'my-annotation',
              borderColor: '#00e396',
              label: { text: 'Label' },
            },
          ],
        },
      })

      const label = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-xaxis-annotation-label'
      )
      expect(label.classList.contains('my-annotation')).toBe(true)
    })
  })

  describe('drawXAxisAnnotations', () => {
    it('should create group element for xaxis annotations', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 2,
              borderColor: '#00e396',
            },
          ],
        },
      })

      const group = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-xaxis-annotations'
      )
      expect(group).not.toBeNull()
    })

    it('should render one line per annotation for multiple annotations', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            { x: 1, borderColor: '#00e396' },
            { x: 2, borderColor: '#775dd0' },
            { x: 3, borderColor: '#feb019' },
          ],
        },
      })

      const lines = chart.w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-xaxis-annotations line'
      )
      expect(lines.length).toBe(3)
    })

    it('should apply distinct borderColor to each annotation line', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            { x: 1, borderColor: '#00e396' },
            { x: 3, borderColor: '#feb019' },
          ],
        },
      })

      const lines = chart.w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-xaxis-annotations line'
      )
      expect(lines[0].getAttribute('stroke')).toBe('#00e396')
      expect(lines[1].getAttribute('stroke')).toBe('#feb019')
    })

    it('should handle empty annotations array with no children in group', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [],
        },
      })

      const group = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-xaxis-annotations'
      )
      expect(group).not.toBeNull()
      expect(
        group.querySelectorAll('line').length +
          group.querySelectorAll('.apexcharts-annotation-rect').length
      ).toBe(0)
    })
  })

  describe('XAxis annotations with horizontal bar (inverted axis)', () => {
    it('should set invertAxis for horizontal bar annotations context', () => {
      chart = createChartWithOptions({
        chart: { type: 'bar' },
        plotOptions: {
          bar: { horizontal: true },
        },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 25,
              borderColor: '#00e396',
              label: { text: 'Threshold' },
            },
          ],
        },
      })

      const annoCtx2 = new Annotations(chart)
      expect(annoCtx2.invertAxis).toBe(true)

      const group = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-xaxis-annotations'
      )
      expect(group).not.toBeNull()
    })
  })

  describe('XAxis annotations with datetime axis', () => {
    it('should render annotation group for datetime chart', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [
          {
            data: [
              [1609459200000, 10],
              [1609545600000, 20],
              [1609632000000, 30],
            ],
          },
        ],
        xaxis: {
          type: 'datetime',
        },
        annotations: {
          xaxis: [
            {
              x: 1609545600000,
              borderColor: '#00e396',
              label: { text: 'Midpoint' },
            },
          ],
        },
      })

      const group = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-xaxis-annotations'
      )
      expect(group).not.toBeNull()
    })
  })

  describe('Edge cases', () => {
    it('should clamp out-of-bounds x without throwing', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      const annoCtx2 = new Annotations(chart)
      const xAxis2 = new XAxisAnnotations(annoCtx2)
      const parent = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-xaxis-annotations'
      )

      // Should not throw for out-of-bounds negative x
      expect(() => {
        xAxis2.addXaxisAnnotation(
          {
            x: -100,
            borderColor: '#00e396',
            label: { text: 'Clamped' },
          },
          parent,
          0
        )
      }).not.toThrow()
    })

    it('should still render line when label text is empty', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            {
              x: 2,
              borderColor: '#00e396',
              label: { text: '' },
            },
          ],
        },
      })

      const line = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-xaxis-annotations line'
      )
      expect(line).not.toBeNull()
      expect(line.getAttribute('stroke')).toBe('#00e396')
    })

    it('should set rel incrementally for multiple annotation labels', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          xaxis: [
            { x: 1, borderColor: '#aaa', label: { text: 'First' } },
            { x: 3, borderColor: '#bbb', label: { text: 'Second' } },
          ],
        },
      })

      const labels = chart.w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-xaxis-annotation-label'
      )
      expect(labels.length).toBe(2)
      expect(labels[0].getAttribute('rel')).toBe('0')
      expect(labels[1].getAttribute('rel')).toBe('1')
    })
  })
})
