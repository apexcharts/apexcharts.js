/**
 * Perspectives (#10) + context menu, against a real render.
 *
 * Uses the perspectives-view-state fixture (line chart with
 * chart.contextMenu + chart.ink enabled, no measure). Verifies:
 *   - the menu opens with the annotation verbs and auto-hides the measure
 *     item (the tool is not enabled in this fixture)
 *   - notes and dashed lines dropped from the menu are part of the captured
 *     view state: clear them, apply the token, and they come back drawn,
 *     config-backed and still ink-draggable
 *   - the zoom window round-trips through the same token
 */

import { test, expect } from '../fixtures/base.js'

async function gridPoint(page, fx, fy) {
  return page.evaluate(
    ({ fx, fy }) => {
      const g = window.chart.el.querySelector('.apexcharts-grid').getBoundingClientRect()
      return { x: g.left + g.width * fx, y: g.top + g.height * fy }
    },
    { fx, fy },
  )
}

async function rightClick(page, pt) {
  await page.evaluate((pt) => {
    const svg = window.chart.w.dom.Paper.node
    svg.dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, cancelable: true, view: window, clientX: pt.x, clientY: pt.y, button: 2 }),
    )
  }, pt)
}

async function clickItem(page, label) {
  return page.evaluate((label) => {
    const el = Array.from(window.chart.el.querySelectorAll('.apexcharts-context-menu-item')).find(
      (b) => b.textContent === label,
    )
    if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
    return !!el
  }, label)
}

async function commitEditor(page) {
  await page.evaluate(() => {
    const input = window.chart.el.querySelector('input.apexcharts-ink-editor')
    if (input) {
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      )
    }
  })
}

test.describe('Perspectives: view state + context-menu annotations', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'perspectives-view-state')
  })

  test('the menu opens with the annotation verbs; measure auto-hides', async ({ page }) => {
    await rightClick(page, await gridPoint(page, 0.5, 0.5))
    const items = await page.evaluate(() =>
      Array.from(window.chart.el.querySelectorAll('.apexcharts-context-menu-item')).map(
        (b) => b.textContent,
      ),
    )
    expect(items).toEqual(['Add note here', 'Annotate here', 'Mark this level'])
    await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
  })

  test('menu-dropped note and dashed line round-trip through a view token', async ({
    page,
  }) => {
    // Drop a note and a vertical dashed line from the menu, committing each
    // editor card so the pending text lands in the config.
    await rightClick(page, await gridPoint(page, 0.35, 0.4))
    expect(await clickItem(page, 'Add note here')).toBe(true)
    await page.waitForTimeout(100)
    await commitEditor(page)
    await rightClick(page, await gridPoint(page, 0.65, 0.5))
    expect(await clickItem(page, 'Annotate here')).toBe(true)
    await page.waitForTimeout(100)
    await commitEditor(page)

    // Capture the encoded token, then wipe the annotations entirely.
    const wiped = await page.evaluate(async () => {
      window.__tok = window.chart.perspectives.encode()
      await window.chart.updateOptions({ annotations: { points: [], xaxis: [] } }, false, false)
      return {
        points: window.chart.w.config.annotations.points.length,
        xaxis: window.chart.w.config.annotations.xaxis.length,
        markers: window.chart.el.querySelectorAll('.apexcharts-point-annotation-marker').length,
      }
    })
    expect(wiped).toEqual({ points: 0, xaxis: 0, markers: 0 })

    // Apply the token: both annotations come back, drawn and ink-managed.
    await page.evaluate(() => window.chart.perspectives.apply(window.__tok, { animate: false }))
    await page.waitForTimeout(150)
    const restored = await page.evaluate(() => {
      const pts = window.chart.w.config.annotations.points
      const xs = window.chart.w.config.annotations.xaxis
      const a = xs[0]
      const line = a && window.chart.el.querySelector('.apexcharts-xaxis-annotations line.' + a.id)
      return {
        points: pts.length,
        noteText: pts[0] && pts[0].label.text,
        noteDraggable: pts[0] && pts[0].draggable,
        xaxis: xs.length,
        x2: a ? a.x2 : 'missing',
        dash: line && line.getAttribute('stroke-dasharray'),
        markerDrawn: !!window.chart.el.querySelector('.apexcharts-point-annotation-marker'),
        inkBound: !!window.chart.el.querySelector('.apexcharts-ink-draggable'),
      }
    })
    expect(restored.points).toBe(1)
    expect(restored.noteText).toBe('Note')
    expect(restored.noteDraggable).toBe(true)
    expect(restored.xaxis).toBe(1)
    expect(restored.x2).toBeNull() // still a line, not a rectangle
    expect(restored.dash).toBe('4')
    expect(restored.markerDrawn).toBe(true)
    expect(restored.inkBound).toBe(true)
  })

  test('the zoom window rides the same token', async ({ page }) => {
    const zoomed = await page.evaluate(async () => {
      window.chart.zoomX(10, 20)
      await new Promise((r) => setTimeout(r, 120))
      window.__tok = window.chart.perspectives.encode()
      window.chart.resetSeries(true, true)
      await new Promise((r) => setTimeout(r, 120))
      return { afterReset: window.chart.w.config.xaxis.min }
    })
    expect(zoomed.afterReset).toBeUndefined()

    const applied = await page.evaluate(async () => {
      window.chart.perspectives.apply(window.__tok, { animate: false })
      await new Promise((r) => setTimeout(r, 150))
      return { min: window.chart.w.globals.minX, max: window.chart.w.globals.maxX }
    })
    expect(applied.min).toBe(10)
    expect(applied.max).toBe(20)
  })
})
