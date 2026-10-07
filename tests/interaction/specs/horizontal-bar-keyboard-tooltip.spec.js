/**
 * Keyboard focus on a horizontal bar puts the tooltip where the pointer does:
 * a tooltip that is not intersect-only captions the whole row, above it
 * (below it when there is no room above), and an intersect one with an arrow
 * goes around the focused bar alone, the arrow on it.
 *
 * It used to sit past the bar's end, centred on the bar vertically, with no
 * limit on the right. A bar near the axis maximum pushed the box out of the
 * chart and over whatever stood beside it on the page; on
 * column/dynamic-loaded-chart that was the quarterly chart. The arrow kept the
 * side the last pointer placement had left, so it pointed at nothing.
 *
 * The pointer never did this on that demo at a desktop width. The overlap a
 * page-wide sweep reported there on hover is the quarterly chart parked under
 * the yearly one (translateX(-50%), z-index -2) before a bar is clicked:
 * hidden, so nothing on screen is covered. On a phone the two charts stand
 * side by side, each too narrow for a column's box beside it, which ran
 * under the other chart or off the screen; the box now goes above the column
 * instead. The pointer cases are checked once the quarterly chart is in view.
 */

import { test, expect } from '../fixtures/base.js'

const TT = '.apexcharts-tooltip:not(.apexcharts-annotation-tooltip)'

const rectOf = (page, sel) =>
  page
    .locator(sel)
    .first()
    .evaluate((el) => {
      const r = el.getBoundingClientRect()
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
    })

/** How far two rects overlap along the narrower axis (0 if they don't). */
function overlap(a, b) {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left)
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
  return Math.max(0, Math.min(w, h))
}

/** Distance from point `p` to rect `r` (0 inside or on it). */
function distance(p, r) {
  const dx = Math.max(r.left - p.x, 0, p.x - r.right)
  const dy = Math.max(r.top - p.y, 0, p.y - r.bottom)
  return Math.hypot(dx, dy)
}

// The active box inside `scope`, its placement, and where its arrow tip is:
// the corner of the rotated arrow square that points away from the box.
function readBox(page, scope) {
  return page.evaluate(
    ([scope, TT]) => {
      const tt = document.querySelector(`${scope} ${TT}.apexcharts-active`)
      if (!tt) return null
      const b = tt.getBoundingClientRect()
      const box = { left: b.left, top: b.top, right: b.right, bottom: b.bottom }
      const placement = tt.dataset.placement ?? null
      const arrow = tt.querySelector('.apexcharts-tooltip-arrow')
      let tip = null
      if (arrow) {
        const a = arrow.getBoundingClientRect()
        const mx = (a.left + a.right) / 2
        const my = (a.top + a.bottom) / 2
        const half = a.width / 2
        tip = {
          top: { x: mx, y: my + half },
          bottom: { x: mx, y: my - half },
          right: { x: mx - half, y: my },
          left: { x: mx + half, y: my },
        }[placement]
      }
      return { box, placement, tip }
    },
    [scope, TT],
  )
}

/** The box sits right above or right below `bar`, across its middle. */
function expectOnBar(t, bar, label) {
  expect(['top', 'bottom'], `${label}: above or below the bar`).toContain(
    t.placement,
  )
  const gap =
    t.placement === 'top' ? bar.top - t.box.bottom : t.box.top - bar.bottom
  expect(gap, `${label}: next to the bar`).toBeGreaterThan(4)
  expect(gap, `${label}: next to the bar`).toBeLessThan(10)
  const mid = (bar.left + bar.right) / 2
  expect(mid, `${label}: across the bar's middle`).toBeGreaterThan(t.box.left)
  expect(mid, `${label}: across the bar's middle`).toBeLessThan(t.box.right)
}

// Clicking a yearly bar slides the quarterly chart out from under the yearly
// one; wait until the two sit side by side and the update has drawn.
async function showQuarterChart(page) {
  await page.locator('#chart-year .apexcharts-bar-area').first().click()
  // Off both charts, so the hover tooltip goes away.
  await page.mouse.move(2, 2)
  await page.waitForFunction(() => {
    const y = document.querySelector('#chart-year').getBoundingClientRect()
    const q = document.querySelector('#chart-quarter').getBoundingClientRect()
    return (
      q.left >= y.right - 1 &&
      window.chartQuarter.w.globals.animationEnded === true &&
      document.querySelectorAll('#chart-quarter .apexcharts-bar-area').length
    )
  })
  await expect(page.locator(`${TT}.apexcharts-active`)).toHaveCount(0)
}

// Focus the chart's svg as a keyboard user would. The click above left focus
// on it as a pointer focus, which keyboard navigation ignores.
async function focusWithKeyboard(page, sel) {
  await page.evaluate((sel) => {
    document.activeElement?.blur?.()
    document.querySelector(`${sel} .apexcharts-svg`).focus()
  }, sel)
  await page.waitForSelector(`${sel} ${TT}.apexcharts-active`)
}

test.describe('Horizontal bars: the keyboard tooltip', () => {
  test('stays in the yearly chart, off the quarterly one, arrow on the bar', async ({
    page,
    loadChart,
  }) => {
    await loadChart('column', 'dynamic-loaded-chart')
    await showQuarterChart(page)
    const year = await rectOf(page, '#chart-year')
    const quarter = await rectOf(page, '#chart-quarter')

    await focusWithKeyboard(page, '#chart-year')
    const n = await page.locator('#chart-year .apexcharts-bar-area').count()
    expect(n).toBe(6)
    const steps = []
    for (let k = 0; k < n; k++) {
      if (k > 0) await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(250)
      const focused = '#chart-year .apexcharts-keyboard-focused'
      const j = await page.locator(focused).getAttribute('j')
      const t = await readBox(page, '#chart-year')
      expect(t, `bar ${j}: a tooltip`).toBeTruthy()
      steps.push({ label: `bar ${j}`, t, bar: await rectOf(page, focused) })
    }
    // every bar was focused, the one reaching the axis maximum among them
    expect(new Set(steps.map((s) => s.label)).size).toBe(6)

    for (const { label, t } of steps) {
      expect(
        t.box.left,
        `${label}: inside the yearly chart`,
      ).toBeGreaterThanOrEqual(year.left)
      expect(
        t.box.right,
        `${label}: inside the yearly chart`,
      ).toBeLessThanOrEqual(year.right)
      expect(overlap(t.box, quarter), `${label}: off the quarterly chart`).toBe(
        0,
      )
    }
    for (const { label, t, bar } of steps) {
      expectOnBar(t, bar, label)
      expect(t.tip, `${label}: an arrow`).toBeTruthy()
      expect(
        distance(t.tip, bar),
        `${label}: arrow tip on the bar`,
      ).toBeLessThan(1.5)
    }
  })

  test('on a multi-series timeline sits on the focused series, not the row', async ({
    page,
    loadChart,
  }) => {
    // Not shared, and following the cursor as a timeline does by default: the
    // pointer goes around the one bar under it, not the row, and so does the
    // keyboard. The bars at one index belong to different rows here, so the
    // union of them is nowhere near either.
    await loadChart('timelines', 'multi-series')
    await focusWithKeyboard(page, '#chart')
    await page.keyboard.press('ArrowDown')
    const series = new Set()
    for (let k = 0; k < 3; k++) {
      if (k > 0) await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(250)
      const focused = '#chart .apexcharts-keyboard-focused'
      series.add(
        await page.evaluate(
          (sel) =>
            document
              .querySelector(sel)
              .closest('.apexcharts-series')
              .getAttribute('data:realIndex'),
          focused,
        ),
      )
      const t = await readBox(page, '#chart')
      expect(t, `step ${k}: a tooltip`).toBeTruthy()
      expectOnBar(t, await rectOf(page, focused), `series 1, step ${k}`)
    }
    expect([...series]).toEqual(['1'])
  })

  // On a phone the charts stand side by side, each too narrow for a box
  // beside a column: the quarterly chart's ran under the yearly one or off
  // the screen.
  for (const width of [414, 360, 320]) {
    test(`a ${width}px phone: the pointer and the keyboard keep each chart of the demo in its own space, on screen`, async ({
      page,
      loadChart,
    }) => {
      await page.setViewportSize({ width, height: 800 })
      await loadChart('column', 'dynamic-loaded-chart')
      await showQuarterChart(page)
      const rects = {
        '#chart-year': await rectOf(page, '#chart-year'),
        '#chart-quarter': await rectOf(page, '#chart-quarter'),
      }
      for (const [own, other] of [
        ['#chart-year', '#chart-quarter'],
        ['#chart-quarter', '#chart-year'],
      ]) {
        const bars = page.locator(`${own} .apexcharts-bar-area`)
        const n = await bars.count()
        expect(n).toBeGreaterThan(0)
        const check = (t, label) => {
          expect(t, `${label}: a tooltip`).toBeTruthy()
          expect(
            overlap(t.box, rects[other]),
            `${label}: clear of ${other}`,
          ).toBe(0)
          expect(t.box.left, `${label}: on screen`).toBeGreaterThanOrEqual(-0.5)
          expect(t.box.right, `${label}: on screen`).toBeLessThanOrEqual(
            width + 0.5,
          )
        }
        for (let k = 0; k < n; k++) {
          const b = await bars.nth(k).boundingBox()
          await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
          await page.waitForTimeout(250)
          check(await readBox(page, own), `${own} pointer, bar ${k}`)
        }
        await page.mouse.move(1, 1)
        await page.waitForTimeout(250)
        await focusWithKeyboard(page, own)
        for (let k = 0; k < n; k++) {
          if (k > 0) await page.keyboard.press('ArrowRight')
          await page.waitForTimeout(250)
          check(await readBox(page, own), `${own} keyboard, step ${k}`)
        }
        await page.keyboard.press('Escape')
      }
    })
  }

  test('the pointer keeps each chart of the demo in its own space', async ({
    page,
    loadChart,
  }) => {
    await loadChart('column', 'dynamic-loaded-chart')
    await showQuarterChart(page)
    const rects = {
      '#chart-year': await rectOf(page, '#chart-year'),
      '#chart-quarter': await rectOf(page, '#chart-quarter'),
    }
    for (const [own, other] of [
      ['#chart-year', '#chart-quarter'],
      ['#chart-quarter', '#chart-year'],
    ]) {
      const bars = page.locator(`${own} .apexcharts-bar-area`)
      const n = await bars.count()
      expect(n).toBeGreaterThan(0)
      for (let k = 0; k < n; k++) {
        const b = await bars.nth(k).boundingBox()
        await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
        await page.waitForTimeout(250)
        const t = await readBox(page, own)
        expect(t, `${own} bar ${k}: a tooltip`).toBeTruthy()
        expect(
          overlap(t.box, rects[other]),
          `${own} bar ${k}: clear of ${other}`,
        ).toBe(0)
      }
    }
  })
})
