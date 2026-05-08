/**
 * Keyboard trap tests (WCAG 2.1.2).
 *
 * Verifies that Tab moves focus IN to the chart SVG, then OUT to the next
 * focusable element on the page (and likewise for Shift+Tab in reverse). If
 * KeyboardNavigation ever swallowed Tab, focus would be trapped — these tests
 * prove it does not.
 */

import { test, expect } from '../fixtures/base.js'

const CHART = 'line'
const FIXTURE = 'zoom-pan-selection'

test.describe('Keyboard trap (WCAG 2.1.2)', () => {
  test('Tab moves focus into and out of chart SVG to a trailing button', async ({
    page,
    loadChart,
  }) => {
    await loadChart(CHART, FIXTURE)

    // Inject a focusable button before and after the chart so we can verify
    // focus traversal both directions.
    await page.evaluate(() => {
      const before = document.createElement('button')
      before.id = 'before-chart'
      before.textContent = 'Before'
      document.body.insertBefore(before, document.body.firstChild)

      const after = document.createElement('button')
      after.id = 'after-chart'
      after.textContent = 'After'
      document.body.appendChild(after)
    })

    // Focus the leading button explicitly.
    await page.focus('#before-chart')
    expect(await page.evaluate(() => document.activeElement?.id)).toBe(
      'before-chart',
    )

    // Tab → chart SVG.
    await page.keyboard.press('Tab')
    expect(
      await page.evaluate(() =>
        document.activeElement?.classList?.contains('apexcharts-svg'),
      ),
    ).toBe(true)

    // Tab again → at least one focusable element (legend or toolbar) inside or
    // after the chart should receive focus, and it must NOT be the SVG itself
    // — proving focus is not trapped on the SVG.
    let escapes = 0
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab')
      const id = await page.evaluate(() => document.activeElement?.id)
      if (id === 'after-chart') {
        escapes = i + 1
        break
      }
    }
    expect(escapes).toBeGreaterThan(0)
    expect(await page.evaluate(() => document.activeElement?.id)).toBe(
      'after-chart',
    )
  })

  test('Shift+Tab moves focus back through chart to leading button', async ({
    page,
    loadChart,
  }) => {
    await loadChart(CHART, FIXTURE)

    await page.evaluate(() => {
      const before = document.createElement('button')
      before.id = 'before-chart'
      before.textContent = 'Before'
      document.body.insertBefore(before, document.body.firstChild)

      const after = document.createElement('button')
      after.id = 'after-chart'
      after.textContent = 'After'
      document.body.appendChild(after)
    })

    await page.focus('#after-chart')

    let escapes = 0
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Shift+Tab')
      const id = await page.evaluate(() => document.activeElement?.id)
      if (id === 'before-chart') {
        escapes = i + 1
        break
      }
    }
    expect(escapes).toBeGreaterThan(0)
    expect(await page.evaluate(() => document.activeElement?.id)).toBe(
      'before-chart',
    )
  })

  test('Escape exits keyboard nav and removes focus class', async ({
    page,
    loadChart,
  }) => {
    await loadChart(CHART, FIXTURE)

    // Focus the chart SVG and navigate one step.
    await page.evaluate(() => {
      document.querySelector('.apexcharts-svg').focus()
    })
    await page.keyboard.press('ArrowRight')
    // First Escape: dismiss tooltip but stay focused.
    await page.keyboard.press('Escape')
    // Second Escape: exit keyboard nav.
    await page.keyboard.press('Escape')

    const focused = await page
      .locator('.apexcharts-keyboard-focused')
      .count()
    expect(focused).toBe(0)
  })
})
