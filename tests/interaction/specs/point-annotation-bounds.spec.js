/**
 * Point annotation labels near the plot edges (apexcharts/apexcharts.js#5106).
 *
 * A point annotation's label is centered on its point's x position by
 * default, with no width limit. When the point sits near the left or right
 * edge of the plot area and the label text is long, half the label used to
 * render outside the chart's SVG viewport and get clipped there (the SVG
 * element defaults to `overflow: hidden`). The fix nudges the label inward
 * just enough to keep its full rendered width inside the grid.
 *
 * Determinism note: `basic-line` has a percentage width (`chart.width`
 * defaults to '100%'), so it is watched by the container ResizeObserver
 * `apexcharts.js` wires up at mount (`addResizeListener` on `el.parentNode`).
 * That observer's first callback reports the container's current size, and
 * on a busy machine a stray sub-pixel reflow between mount and that callback
 * is enough for `getResizeSignature()` to read as changed, which schedules a
 * debounced (150ms) full `ctx.update()`. Nothing stops that rebuild from
 * landing between this test adding the annotations and reading their
 * geometry, which would read a mid-rebuild or since-replaced label. Turning
 * `redrawOnParentResize` off before adding the annotations removes that
 * rebuild instead of racing it.
 */

import { test, expect } from '../fixtures/base.js'

const LEFT_LABEL = 'A sufficiently long annotation label near the left edge'
const RIGHT_LABEL = 'A sufficiently long annotation label near the right edge'

// Sub-pixel rounding tolerance for the bounding-box comparisons below.
const TOLERANCE_PX = 1

test.describe('Point annotation labels stay inside the plot area', () => {
  test('long labels on edge points are nudged inside the grid horizontally', async ({
    page,
    loadChart,
  }) => {
    await loadChart('line', 'basic-line')

    // Remove the container-resize rebuild as a source of interference (see
    // the file header comment) before adding the annotations under test.
    await page.evaluate(() => {
      window.chart.updateOptions({ chart: { redrawOnParentResize: false } })
    })
    await page.waitForFunction(
      () => window.chart.w.globals.animationEnded === true,
    )

    await page.evaluate(
      ({ leftLabel, rightLabel }) => {
        // First and last category ('Jan' / 'Dec') put the marker right at
        // the grid's left / right edge, which is where a centered label
        // used to overflow the chart.
        window.chart.addPointAnnotation({
          x: 'Jan',
          y: 210,
          marker: { size: 5 },
          label: { text: leftLabel },
        })
        window.chart.addPointAnnotation({
          x: 'Dec',
          y: 1520,
          marker: { size: 5 },
          label: { text: rightLabel },
        })
      },
      { leftLabel: LEFT_LABEL, rightLabel: RIGHT_LABEL },
    )

    // Wait for the actual render outcome, not just presence: both labels
    // must exist AND have a real, non-zero, on-screen size. A bare element
    // count can be satisfied mid-mutation (e.g. while the label text node is
    // present but not yet laid out), which is not a state worth measuring.
    await page.waitForFunction(() => {
      const labels = document.querySelectorAll(
        '.apexcharts-point-annotation-label',
      )
      if (labels.length !== 2) return false
      return Array.from(labels).every((el) => {
        const r = el.getBoundingClientRect()
        return r.width > 0 && r.height > 0
      })
    })

    const bounds = await page.evaluate(() => {
      const grid = document
        .querySelector('.apexcharts-grid')
        .getBoundingClientRect()
      const labels = Array.from(
        document.querySelectorAll('.apexcharts-point-annotation-label'),
      )
      return {
        gridLeft: grid.left,
        gridRight: grid.right,
        labels: labels.map((el) => {
          const r = el.getBoundingClientRect()
          return { text: el.textContent, left: r.left, right: r.right }
        }),
      }
    })

    expect(bounds.labels).toHaveLength(2)

    for (const label of bounds.labels) {
      expect(label.left).toBeGreaterThanOrEqual(
        bounds.gridLeft - TOLERANCE_PX,
      )
      expect(label.right).toBeLessThanOrEqual(bounds.gridRight + TOLERANCE_PX)
    }
  })
})
