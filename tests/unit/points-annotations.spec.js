import Annotations from '../../src/modules/annotations/Annotations.js'
import PointsAnnotations from '../../src/modules/annotations/PointsAnnotations.js'
import { createChartWithOptions } from './utils/utils.js'

describe('PointsAnnotations', () => {
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
  // Marker rendering
  // =========================================================================
  describe('marker rendering', () => {
    it('should render a marker with correct fill, stroke, and stroke-width', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          points: [
            {
              x: 2,
              y: 30,
              marker: {
                size: 6,
                fillColor: '#ff0000',
                strokeColor: '#00ff00',
                strokeWidth: 3,
              },
            },
          ],
        },
      })

      const marker = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-point-annotation-marker'
      )
      expect(marker).not.toBeNull()
      expect(marker.getAttribute('fill')).toBe('#ff0000')
      expect(marker.getAttribute('stroke')).toBe('#00ff00')
      expect(marker.getAttribute('stroke-width')).toBe('3')
    })

    it('should include the annotation id in marker CSS class', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          points: [
            {
              x: 2,
              y: 30,
              id: 'my-point-id',
              marker: { size: 6 },
            },
          ],
        },
      })

      const marker = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-point-annotation-marker'
      )
      expect(marker).not.toBeNull()
      expect(marker.classList.contains('my-point-id')).toBe(true)
    })

    it('should render the correct number of markers for multiple annotations', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          points: [
            { x: 1, y: 20, marker: { size: 6 } },
            { x: 2, y: 30, marker: { size: 6 } },
            { x: 3, y: 40, marker: { size: 6 } },
          ],
        },
      })

      const markers = chart.w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-point-annotation-marker'
      )
      expect(markers.length).toBe(3)
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
          points: [
            {
              x: 2,
              y: 30,
              marker: { size: 6 },
              label: {
                text: 'Styled',
                style: {
                  fontSize: '14px',
                  fontFamily: 'Arial',
                  fontWeight: 'bold',
                  color: '#ff0000',
                  cssClass: 'my-point-label',
                },
              },
            },
          ],
        },
      })

      const label = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-point-annotation-label'
      )
      expect(label).not.toBeNull()
      expect(label.getAttribute('font-size')).toBe('14px')
      expect(label.getAttribute('font-family')).toBe('Arial')
      expect(label.getAttribute('font-weight')).toBe('bold')
      expect(label.getAttribute('fill')).toBe('#ff0000')
      expect(label.classList.contains('my-point-label')).toBe(true)
    })

    it('should set incremental rel attributes on multiple labels', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          points: [
            { x: 1, y: 20, marker: { size: 4 }, label: { text: 'A' } },
            { x: 2, y: 30, marker: { size: 4 }, label: { text: 'B' } },
          ],
        },
      })

      const labels = chart.w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-point-annotation-label'
      )
      expect(labels.length).toBe(2)
      expect(labels[0].getAttribute('rel')).toBe('0')
      expect(labels[1].getAttribute('rel')).toBe('1')
    })

    it('should include annotation id in label CSS class', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          points: [
            {
              x: 2,
              y: 30,
              id: 'labeled-point',
              marker: { size: 6 },
              label: { text: 'With ID' },
            },
          ],
        },
      })

      const label = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-point-annotation-label'
      )
      expect(label).not.toBeNull()
      expect(label.classList.contains('labeled-point')).toBe(true)
    })
  })

  // =========================================================================
  // Custom SVG
  // =========================================================================
  describe('custom SVG', () => {
    it('should render a custom SVG group with correct class and content', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          points: [
            {
              x: 2,
              y: 30,
              marker: { size: 0 },
              customSVG: {
                SVG: '<circle cx="0" cy="0" r="10" fill="red"/>',
                cssClass: 'my-custom-svg',
                offsetX: 0,
                offsetY: 0,
              },
            },
          ],
        },
      })

      const group = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-point-annotations-custom-svg'
      )
      expect(group).not.toBeNull()
      expect(group.classList.contains('my-custom-svg')).toBe(true)
      expect(group.innerHTML).toContain('<circle')
      expect(group.getAttribute('transform')).toContain('translate(')
    })

    it('should not render custom SVG group when SVG property is missing', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          points: [
            {
              x: 2,
              y: 30,
              marker: { size: 6 },
              customSVG: {
                cssClass: 'test',
              },
            },
          ],
        },
      })

      const groups = chart.w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-point-annotations-custom-svg'
      )
      expect(groups.length).toBe(0)
    })
  })

  // =========================================================================
  // Image annotations
  // =========================================================================
  describe('image annotations', () => {
    const imagePath =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

    it('should render an image with correct width and height', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          points: [
            {
              x: 2,
              y: 30,
              marker: { size: 0 },
              image: {
                path: imagePath,
                width: 50,
                height: 40,
              },
            },
          ],
        },
      })

      const img = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-point-annotations image'
      )
      expect(img).not.toBeNull()
      expect(img.getAttribute('width')).toBe('50')
      expect(img.getAttribute('height')).toBe('40')
    })

    it('should not render an image element when path is missing', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          points: [
            {
              x: 2,
              y: 30,
              marker: { size: 6 },
              image: {
                width: 30,
                height: 30,
              },
            },
          ],
        },
      })

      const images = chart.w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-point-annotations image'
      )
      expect(images.length).toBe(0)
    })
  })

  // =========================================================================
  // Event listeners
  // =========================================================================
  describe('event listeners', () => {
    it('should invoke click handler when marker is clicked', () => {
      const clickSpy = vi.fn()

      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: {
          points: [
            {
              x: 2,
              y: 30,
              marker: { size: 6 },
              click: clickSpy,
            },
          ],
        },
      })

      const marker = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-point-annotation-marker'
      )
      expect(marker).not.toBeNull()
      marker.dispatchEvent(new Event('click'))

      expect(clickSpy).toHaveBeenCalledTimes(1)
    })
  })

  // =========================================================================
  // Early returns / negative tests
  // =========================================================================
  describe('early returns', () => {
    it('should not add annotation when x is not a number', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
      })

      const annoCtx = new Annotations(chart.w)
      const points = new PointsAnnotations(annoCtx)
      const parent = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-point-annotations'
      )

      const initialChildCount = parent.childNodes.length

      points.addPointAnnotation(
        {
          x: undefined,
          y: 30,
          yAxisIndex: 0,
          marker: { size: 6 },
        },
        parent,
        0
      )

      expect(parent.childNodes.length).toBe(initialChildCount)
    })

    it('should not add annotation when seriesIndex is collapsed', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [
          { name: 'Series 1', data: [10, 20, 30] },
          { name: 'Series 2', data: [15, 25, 35] },
        ],
      })

      // Mark series 1 as collapsed
      chart.w.globals.collapsedSeriesIndices = [1]

      const annoCtx = new Annotations(chart.w)
      const points = new PointsAnnotations(annoCtx)
      const parent = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-point-annotations'
      )

      const initialChildCount = parent.childNodes.length

      points.addPointAnnotation(
        {
          x: 2,
          y: 35,
          seriesIndex: 1,
          marker: { size: 8 },
        },
        parent,
        0
      )

      expect(parent.childNodes.length).toBe(initialChildCount)
    })
  })

  // =========================================================================
  // drawPointAnnotations group
  // =========================================================================
  describe('drawPointAnnotations', () => {
    it('should create the group element even with empty annotations', () => {
      chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ data: [10, 20, 30, 40, 50] }],
        annotations: { points: [] },
      })

      const group = chart.w.globals.dom.baseEl.querySelector(
        '.apexcharts-point-annotations'
      )
      expect(group).not.toBeNull()
      expect(
        group.querySelectorAll('.apexcharts-point-annotation-marker').length
      ).toBe(0)
    })
  })
})
