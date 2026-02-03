import { chartVisualTest } from '../utils'

chartVisualTest(
  'line',
  'line-with-annotations-zoom-level',
  null,
  async (page) => {
    // Verify annotation label backgrounds are correctly positioned
    // even when the chart is rendered inside a container with CSS zoom: 80%
    const annotationRects = await page.$$eval(
      '.apexcharts-yaxis-annotations rect, .apexcharts-xaxis-annotations rect, .apexcharts-point-annotations rect',
      (rects) =>
        rects.map((r) => ({
          x: parseFloat(r.getAttribute('x')),
          y: parseFloat(r.getAttribute('y')),
          width: parseFloat(r.getAttribute('width')),
          height: parseFloat(r.getAttribute('height')),
        }))
    )

    const annotationLabels = await page.$$eval(
      '.apexcharts-yaxis-annotations text, .apexcharts-xaxis-annotations text, .apexcharts-point-annotations text',
      (texts) =>
        texts.map((t) => {
          const bbox = t.getBBox()
          return {
            x: bbox.x,
            y: bbox.y,
            width: bbox.width,
            height: bbox.height,
          }
        })
    )

    // For each annotation label with a background rect, verify the rect
    // encloses the text (with some padding tolerance)
    const maxPadding = 20
    annotationLabels.forEach((label, i) => {
      if (label.width === 0 && label.height === 0) return
      if (!annotationRects[i]) return

      const rect = annotationRects[i]

      // The background rect should enclose the text label
      expect(rect.x).toBeLessThanOrEqual(label.x + maxPadding)
      expect(rect.y).toBeLessThanOrEqual(label.y + maxPadding)
      expect(rect.width).toBeGreaterThan(0)
      expect(rect.height).toBeGreaterThan(0)
    })
  }
)
