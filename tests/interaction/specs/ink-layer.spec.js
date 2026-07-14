/**
 * Ink Layer (#7) interaction tests: dragging point annotations.
 *
 * Uses real browser events (getBoundingClientRect, transform, dispatch) that
 * jsdom cannot do. The base fixture auto-fails on any uncaught page error.
 *
 * Fixture: samples/vanilla-js/misc/ink-draggable-annotations.html
 *   numeric line chart, chart.ink.enabled, two draggable point annotations
 *   ('peak', 'dip'), animations disabled.
 */

import { test, expect } from '../fixtures/base.js'

// Drag an annotation (by its id) by a client-space delta; returns the
// before/after config x/y and the marker's drop error in pixels.
async function dragAnnotation(page, id, dx, dy) {
  return page.evaluate(
    ({ id, dx, dy }) => {
      const chart = window.chart
      const idx = chart.w.config.annotations.points.findIndex((p) => p.id === id)
      const marker = () =>
        chart.el.querySelector(`.apexcharts-point-annotation-marker.${id}`)
      const center = (el) => {
        const r = el.getBoundingClientRect()
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      }
      const before = {
        x: chart.w.config.annotations.points[idx].x,
        y: chart.w.config.annotations.points[idx].y,
      }
      const c0 = center(marker())
      const m0 = marker()
      m0.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, clientX: c0.x, clientY: c0.y, button: 0 }))
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, view: window, clientX: c0.x + dx, clientY: c0.y + dy, button: 0 }))
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, clientX: c0.x + dx, clientY: c0.y + dy, button: 0 }))

      const c1 = center(marker())
      return {
        before,
        after: {
          x: chart.w.config.annotations.points[idx].x,
          y: chart.w.config.annotations.points[idx].y,
        },
        dropErrorPx: Math.round(Math.hypot(c1.x - (c0.x + dx), c1.y - (c0.y + dy))),
        residualTransform: marker().getAttribute('transform'),
      }
    },
    { id, dx, dy },
  )
}

test.describe('Ink Layer: drag point annotations', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'ink-draggable-annotations')
  })

  test('dragging a callout updates its data x/y and drops where released', async ({ page }) => {
    // arm the annotationDragged event
    await page.evaluate(() => {
      window.__dragged = null
      window.chart.addEventListener('annotationDragged', (c, o) => { window.__dragged = o })
    })

    // drag 'peak' right and up: x increases, y increases (y axis inverted)
    const r = await dragAnnotation(page, 'peak', 70, -50)
    expect(r.after.x).toBeGreaterThan(r.before.x)
    expect(r.after.y).toBeGreaterThan(r.before.y)
    expect(r.dropErrorPx).toBeLessThanOrEqual(4) // pixel -> data -> pixel round-trip
    expect(r.residualTransform).toBeFalsy()

    const dragged = await page.evaluate(() => window.__dragged)
    expect(dragged.id).toBe('peak')
    expect(dragged.x).toBe(r.after.x)
  })

  test('a second drag of the same annotation continues from its new spot', async ({ page }) => {
    const first = await dragAnnotation(page, 'dip', 40, 30) // right + down
    expect(first.after.x).toBeGreaterThan(first.before.x)
    expect(first.after.y).toBeLessThan(first.before.y) // dragged down -> y down

    const second = await dragAnnotation(page, 'dip', -30, -20) // left + up
    expect(second.before.x).toBeCloseTo(first.after.x, 5) // starts where it landed
    expect(second.after.x).toBeLessThan(second.before.x)
    expect(second.after.y).toBeGreaterThan(second.before.y)
    expect(second.dropErrorPx).toBeLessThanOrEqual(4)
  })
})
