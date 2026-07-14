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

test.describe('Ink Layer: inline label editing', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'ink-draggable-annotations')
  })

  test('double-clicking a callout edits its label text', async ({ page }) => {
    await page.evaluate(() => {
      window.__edited = null
      window.chart.addEventListener('annotationEdited', (c, o) => { window.__edited = o })
    })

    const before = await page.evaluate(
      () => window.chart.w.config.annotations.points.find((p) => p.id === 'peak').label.text,
    )
    expect(before).toBe('Peak')

    // dblclick the label -> an editor input appears prefilled
    await page.evaluate(() => {
      window.chart.el
        .querySelector('.apexcharts-point-annotation-label.peak')
        .dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }))
    })
    const editorVal = await page.evaluate(() => {
      const i = window.chart.el.querySelector('input.apexcharts-ink-editor')
      return i ? i.value : null
    })
    expect(editorVal).toBe('Peak')

    // type a new label and commit with Enter
    await page.evaluate(() => {
      const i = window.chart.el.querySelector('input.apexcharts-ink-editor')
      i.value = 'Launch'
      i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })
    await page.waitForFunction(
      () => window.chart.w.config.annotations.points.find((p) => p.id === 'peak').label.text === 'Launch',
    )

    const after = await page.evaluate(() => ({
      text: window.chart.w.config.annotations.points.find((p) => p.id === 'peak').label.text,
      labelText: window.chart.el.querySelector('.apexcharts-point-annotation-label.peak').textContent,
      editorGone: !window.chart.el.querySelector('input.apexcharts-ink-editor'),
      bgCount: window.chart.el.querySelectorAll('rect.peak').length,
      edited: window.__edited,
    }))
    expect(after.text).toBe('Launch')
    expect(after.labelText).toBe('Launch')
    expect(after.editorGone).toBe(true)
    expect(after.bgCount).toBe(1) // background re-added once (no stale/dup)
    expect(after.edited.id).toBe('peak')
    expect(after.edited.text).toBe('Launch')
  })
})

test.describe('Ink Layer: click-to-create', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'ink-draggable-annotations')
  })

  test('the palette arms create mode and a plot click drops a note', async ({ page }) => {
    await page.evaluate(() => {
      window.__created = null
      window.chart.addEventListener('annotationCreated', (c, o) => { window.__created = o })
    })

    const before = await page.evaluate(() => window.chart.w.config.annotations.points.length)

    // click "+ Note" to arm, then click the middle of the grid
    await page.evaluate(() => {
      window.chart.el
        .querySelector('.apexcharts-ink-add')
        .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
    })
    expect(await page.evaluate(() => window.chart.ink._creating)).toBe(true)

    const created = await page.evaluate(() => {
      const g = window.chart.el.querySelector('.apexcharts-grid').getBoundingClientRect()
      const svg = window.chart.el.querySelector('.apexcharts-svg')
      svg.dispatchEvent(new MouseEvent('click', {
        bubbles: true, cancelable: true, view: window,
        clientX: g.left + g.width * 0.5, clientY: g.top + g.height * 0.5,
      }))
      const pts = window.chart.w.config.annotations.points
      const anno = pts[pts.length - 1]
      return {
        count: pts.length,
        draggable: anno.draggable,
        text: anno.label.text,
        markerDrawn: !!window.chart.el.querySelector('.apexcharts-point-annotation-marker.' + anno.id),
        editorOpen: !!window.chart.el.querySelector('input.apexcharts-ink-editor'),
        creating: window.chart.ink._creating,
        event: window.__created,
      }
    })

    expect(created.count).toBe(before + 1)
    expect(created.draggable).toBe(true)
    expect(created.text).toBe('Note')
    expect(created.markerDrawn).toBe(true)
    expect(created.editorOpen).toBe(true) // opens the label editor immediately
    expect(created.creating).toBe(false) // single-shot
    expect(created.event).toBeTruthy()
  })
})

test.describe('Ink Layer: axis annotations', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'ink-draggable-annotations')
  })

  // Drag an element (by CSS selector) from a start point by a client delta.
  async function dragEl(page, selector, startAt, dx, dy) {
    return page.evaluate(
      ({ selector, startAt, dx, dy }) => {
        const el = window.chart.el.querySelector(selector)
        const r = el.getBoundingClientRect()
        const sx = startAt === 'left' ? r.left + 2 : r.left + r.width / 2
        const sy = r.top + r.height / 2
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, clientX: sx, clientY: sy, button: 0 }))
        document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, view: window, clientX: sx + dx, clientY: sy + dy, button: 0 }))
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, clientX: sx + dx, clientY: sy + dy, button: 0 }))
      },
      { selector, startAt, dx, dy },
    )
  }

  test('a yaxis line annotation drags vertically', async ({ page }) => {
    const before = await page.evaluate(() => window.chart.w.config.annotations.yaxis[0].y)
    await dragEl(page, 'line.target', 'center', 0, -40) // up -> y increases
    const after = await page.evaluate(() => window.chart.w.config.annotations.yaxis[0].y)
    expect(after).toBeGreaterThan(before)
  })

  test('an xaxis range moves as a whole and resizes from an edge', async ({ page }) => {
    const before = await page.evaluate(() => ({ ...window.chart.w.config.annotations.xaxis[0] }))
    // move: drag the middle right -> both edges shift, span preserved
    await dragEl(page, 'rect.window', 'center', 40, 0)
    const moved = await page.evaluate(() => ({ x: window.chart.w.config.annotations.xaxis[0].x, x2: window.chart.w.config.annotations.xaxis[0].x2 }))
    expect(moved.x).toBeGreaterThan(before.x)
    expect(moved.x2).toBeGreaterThan(before.x2)
    expect(moved.x2 - moved.x).toBeCloseTo(before.x2 - before.x, 5)

    // resize: grab the left edge -> x changes, x2 fixed
    await dragEl(page, 'rect.window', 'left', 22, 0)
    const resized = await page.evaluate(() => ({ x: window.chart.w.config.annotations.xaxis[0].x, x2: window.chart.w.config.annotations.xaxis[0].x2 }))
    expect(resized.x).toBeGreaterThan(moved.x)
    expect(resized.x2).toBeCloseTo(moved.x2, 5)
  })
})
