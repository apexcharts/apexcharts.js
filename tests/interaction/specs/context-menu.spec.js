/**
 * Radial Actions (#chrome) - right-click context menu.
 *
 * Uses the context-menu fixture (line chart with chart.contextMenu.enabled +
 * measure + ink, plus a custom "Copy value" item). Exercises the real
 * right-click gesture and the point-anchored actions with browser events the
 * jsdom unit env can't:
 *   - contextmenu on the plot opens an anchored menu of resolved items
 *   - "Add note here" drops a point annotation at the click and closes the menu
 *   - "Measure from here" seeds the ruler; a second click pins it
 *   - a custom item's onClick fires with the clicked data context
 *   - Escape / outside-click dismiss; the measure item hides when disabled
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

async function items(page) {
  return page.evaluate(() => {
    const m = window.chart.el.querySelector('.apexcharts-context-menu')
    return m
      ? Array.from(m.querySelectorAll('.apexcharts-context-menu-item')).map((b) => b.textContent)
      : null
  })
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

const markers = (page) =>
  page.evaluate(() => window.chart.el.querySelectorAll('.apexcharts-point-annotation-marker').length)

test.describe('Context menu (Radial Actions)', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'context-menu')
  })

  test('right-click opens an anchored menu with the resolved items', async ({ page }) => {
    await rightClick(page, await gridPoint(page, 0.4, 0.5))
    expect(await items(page)).toEqual(['Add note here', 'Measure from here', 'Copy value'])
  })

  test('"Add note here" drops an editable, config-backed note and opens its editor', async ({
    page,
  }) => {
    const before = await markers(page)
    await rightClick(page, await gridPoint(page, 0.4, 0.5))
    expect(await clickItem(page, 'Add note here')).toBe(true)
    await page.waitForTimeout(120)
    expect(await markers(page)).toBe(before + 1)
    expect(await items(page)).toBeNull() // menu closed

    // The note routed through the ink layer: it lives in the annotations config
    // (draggable / persistable / undoable) and its editor card is open with the
    // text preselected for an immediate rename.
    const r = await page.evaluate(() => {
      const pts = window.chart.w.config.annotations.points
      const input = window.chart.el.querySelector('input.apexcharts-ink-editor')
      return {
        cfgCount: pts.length,
        draggable: pts.length ? pts[pts.length - 1].draggable : null,
        cardOpen: !!window.chart.el.querySelector('.apexcharts-ink-card'),
        inputValue: input ? input.value : null,
      }
    })
    expect(r.cfgCount).toBe(1)
    expect(r.draggable).toBe(true)
    expect(r.cardOpen).toBe(true)
    expect(r.inputValue).toBe('Note')

    // Renaming through the card commits to the config and the drawn label.
    await page.evaluate(() => {
      const input = window.chart.el.querySelector('input.apexcharts-ink-editor')
      input.value = 'Launch day'
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    })
    const renamed = await page.evaluate(() => ({
      text: window.chart.w.config.annotations.points[0].label.text,
      cardGone: !window.chart.el.querySelector('.apexcharts-ink-card'),
    }))
    expect(renamed.text).toBe('Launch day')
    expect(renamed.cardGone).toBe(true)
  })

  test('"Measure from here" seeds a ruler that a second click pins', async ({ page }) => {
    await rightClick(page, await gridPoint(page, 0.2, 0.7))
    await clickItem(page, 'Measure from here')
    await page.waitForTimeout(40)
    const finish = await gridPoint(page, 0.7, 0.3)
    await page.evaluate((pt) => {
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, view: window, clientX: pt.x, clientY: pt.y }))
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, clientX: pt.x, clientY: pt.y, button: 0 }))
    }, finish)
    await page.waitForTimeout(80)
    const pinned = await page.evaluate(
      () => window.chart.el.querySelectorAll('.apexcharts-measure-pins .apexcharts-measure-band').length,
    )
    expect(pinned).toBeGreaterThan(0)
  })

  test('a custom item runs its onClick with the clicked data context', async ({ page }) => {
    await rightClick(page, await gridPoint(page, 0.5, 0.5))
    await clickItem(page, 'Copy value')
    await page.waitForTimeout(60)
    const readout = await page.evaluate(() => document.getElementById('cm-readout').textContent)
    expect(readout).toContain('Copied')
  })

  test('Escape closes the menu', async ({ page }) => {
    await rightClick(page, await gridPoint(page, 0.5, 0.5))
    expect(await items(page)).not.toBeNull()
    await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
    await page.waitForTimeout(40)
    expect(await items(page)).toBeNull()
  })

  test('the measure item hides when the measure tool is disabled', async ({ page }) => {
    await page.evaluate(() => window.chart.updateOptions({ chart: { measure: { enabled: false } } }))
    await page.waitForTimeout(60)
    await rightClick(page, await gridPoint(page, 0.5, 0.5))
    const list = await items(page)
    expect(list).toContain('Add note here')
    expect(list).not.toContain('Measure from here')
  })
})
