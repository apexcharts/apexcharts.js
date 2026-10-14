/**
 * Wheel zoom is only offered when the zoom can be undone.
 *
 * Regression for: a chart with `toolbar: { show: false }` still zoomed on the
 * mouse wheel and preventDefault'd the event, so scrolling the page over the
 * chart left the viewer in a zoomed window with no reset button to get out of
 * it (found on the histogram latency-distribution demo). `allowMouseWheelZoom`
 * now defaults to 'auto': bound only when the toolbar's reset button is there.
 * An explicit `true` still forces it on, for pages that supply their own reset.
 *
 * Asserts both halves of the symptom: the x-window does not move, AND the wheel
 * event is left cancelable so the page scrolls normally.
 *
 * The 'auto' wheel is also cooperative: dashboard users reported that a page
 * of zoomable charts could not be scrolled, since every chart the pointer
 * crossed swallowed the wheel and zoomed. A bare wheel now scrolls the page
 * (with a short "Ctrl + scroll" hint) and Ctrl/Cmd + wheel zooms. `true`
 * keeps the greedy wheel.
 *
 * Fixture: samples/vanilla-js/line/zoom-pan-selection.html
 */

import { test, expect } from '../fixtures/base.js'
import { getXRange } from '../helpers/chart.js'

const CHART = 'line'
const FIXTURE = 'zoom-pan-selection'

/** Dispatch one cancelable wheel notch over the grid; report if it was eaten. */
async function wheelWasConsumed(page, deltaY, mods = {}) {
  const consumed = await page.evaluate(
    ({ dy, mods }) => {
      const svg = document.querySelector('.apexcharts-svg')
      const rect = svg.getBoundingClientRect()
      const e = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        deltaY: dy,
        ...mods,
      })
      svg.dispatchEvent(e)
      return e.defaultPrevented
    },
    { dy: deltaY, mods },
  )
  await page.waitForTimeout(300)
  return consumed
}

const hintVisible = (page) =>
  page.evaluate(
    () => !!document.querySelector('.apexcharts-wheel-hint-visible'),
  )

async function applyOptions(page, options) {
  await page.evaluate((o) => window.chart.updateOptions(o), options)
  await page.waitForFunction(
    () => window.chart.w.globals.animationEnded === true,
    { timeout: 5_000 },
  )
}

test.describe("Wheel zoom needs a way back ('auto')", () => {
  test('a hidden toolbar leaves the wheel alone: no zoom, page still scrolls', async ({
    page,
    loadChart,
  }) => {
    await loadChart(CHART, FIXTURE)
    await applyOptions(page, {
      chart: { toolbar: { show: false }, zoom: { enabled: true } },
    })

    const before = await getXRange(page)
    const consumed = await wheelWasConsumed(page, -100)
    const after = await getXRange(page)

    expect(consumed).toBe(false)
    expect(after.minX).toBe(before.minX)
    expect(after.maxX).toBe(before.maxX)
  })

  test('explicit true still zooms with the toolbar hidden', async ({
    page,
    loadChart,
  }) => {
    await loadChart(CHART, FIXTURE)
    await applyOptions(page, {
      chart: {
        toolbar: { show: false },
        zoom: { enabled: true, allowMouseWheelZoom: true },
      },
    })

    const before = await getXRange(page)
    const consumed = await wheelWasConsumed(page, -100)
    const after = await getXRange(page)

    expect(consumed).toBe(true)
    expect(after.maxX - after.minX).toBeLessThan(before.maxX - before.minX)
  })
})

test.describe("The 'auto' wheel is cooperative", () => {
  test('a bare wheel scrolls the page and shows the hint, then the hint fades', async ({
    page,
    loadChart,
  }) => {
    await loadChart(CHART, FIXTURE)

    const before = await getXRange(page)
    const consumed = await wheelWasConsumed(page, -100)
    const after = await getXRange(page)

    expect(consumed).toBe(false)
    expect(after.minX).toBe(before.minX)
    expect(after.maxX).toBe(before.maxX)
    expect(await hintVisible(page)).toBe(true)
    expect(
      await page.evaluate(
        () => document.querySelector('.apexcharts-wheel-hint').textContent,
      ),
    ).toMatch(/^Use (Ctrl|⌘) \+ scroll to zoom$/)

    await page.waitForTimeout(1200)
    expect(await hintVisible(page)).toBe(false)
  })

  for (const mod of ['ctrlKey', 'metaKey']) {
    test(`${mod} + wheel zooms and takes the wheel`, async ({
      page,
      loadChart,
    }) => {
      await loadChart(CHART, FIXTURE)

      const before = await getXRange(page)
      const consumed = await wheelWasConsumed(page, -100, { [mod]: true })
      const after = await getXRange(page)

      expect(consumed).toBe(true)
      expect(after.maxX - after.minX).toBeLessThan(before.maxX - before.minX)
      expect(await hintVisible(page)).toBe(false)
    })
  }

  test('a zoom gesture keeps the wheel after the key comes up (momentum tail)', async ({
    page,
    loadChart,
  }) => {
    await loadChart(CHART, FIXTURE)

    const tail = await page.evaluate(() => {
      const svg = document.querySelector('.apexcharts-svg')
      const rect = svg.getBoundingClientRect()
      const fire = (ctrlKey) => {
        const e = new WheelEvent('wheel', {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2,
          deltaY: -10,
          ctrlKey,
        })
        svg.dispatchEvent(e)
        return e.defaultPrevented
      }
      fire(true)
      return fire(false) // same frame: the gesture has not settled
    })

    expect(tail).toBe(true)
  })

  test('wheelHint: false scrolls the page without a hint', async ({
    page,
    loadChart,
  }) => {
    await loadChart(CHART, FIXTURE)
    await applyOptions(page, { chart: { zoom: { wheelHint: false } } })

    expect(await wheelWasConsumed(page, -100)).toBe(false)
    expect(await hintVisible(page)).toBe(false)
  })

  test('a sideways swipe shows no hint', async ({ page, loadChart }) => {
    await loadChart(CHART, FIXTURE)

    expect(await wheelWasConsumed(page, 0, { deltaX: 80 })).toBe(false)
    expect(await hintVisible(page)).toBe(false)
  })
})
