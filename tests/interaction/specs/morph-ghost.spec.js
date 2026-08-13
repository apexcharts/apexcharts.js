/**
 * Cross-type morph: the exit of the OUTGOING marks.
 *
 * The morph engine tears the old chart down before the new one draws its first
 * frame, so a mark with no successor in the destination simply stopped
 * existing. That is fine for bar -> pie, where every wedge starts life as the
 * literal path of the bar it replaces, and wrong for the unit pairs, where one
 * bar becomes N dots (and back). Those pairs now keep a detached copy of the
 * outgoing marks and fade it over the incoming animation.
 *
 * These tests pin the parts that are invisible to a unit test: that the copy
 * lands pixel-for-pixel over where the originals were, that it is always
 * cleaned up, that it never appears for a pair which inherits its shapes, and
 * that it stays off under reduced motion.
 */

import { test } from '../fixtures/base.js'
import { expect } from '@playwright/test'

const GHOST = '.apexcharts-morph-ghost'
const UNIT_BTN = '.actions button[data-type="unit"]'
const COLUMN_BTN = '.actions button[data-type="bar"][data-horizontal="false"]'

test.describe('Cross-type morph ghost', () => {
  test('column -> unit: the ghost copies the outgoing bars exactly', async ({
    page,
    loadChart,
  }) => {
    await loadChart('misc', 'chart-type-morph')

    const r = await page.evaluate(async ([ghostSel, unitBtn]) => {
      const boxes = (sel) =>
        Array.from(document.querySelectorAll(sel)).map((p) => {
          const b = p.getBoundingClientRect()
          return [+b.x.toFixed(1), +b.y.toFixed(1), +b.width.toFixed(1), +b.height.toFixed(1)]
        })

      const before = boxes('.apexcharts-bar-series path[pathTo]')
      document.querySelector(unitBtn).click()
      await new Promise((res) => requestAnimationFrame(res))

      const ghost = boxes(`${ghostSel} .apexcharts-bar-series path[pathTo]`)
      const drift = before
        .map((b, i) => (ghost[i] ? Math.max(...b.map((v, k) => Math.abs(v - ghost[i][k]))) : null))
        .filter((d) => d != null)

      return {
        nBefore: before.length,
        nGhost: ghost.length,
        maxDrift: drift.length ? Math.max(...drift) : null,
        // The incoming dots are already mounted underneath on the same frame.
        liveDots: document.querySelectorAll(
          `.apexcharts-svg:not(${ghostSel}) .apexcharts-unit-area`,
        ).length,
      }
    }, [GHOST, UNIT_BTN])

    expect(r.nBefore).toBeGreaterThan(0)
    expect(r.nGhost).toBe(r.nBefore)
    // Same nodes, same box: the copy is not re-derived geometry, so any drift
    // at all means the overlay is mispositioned.
    expect(r.maxDrift).toBeLessThan(0.5)
    expect(r.liveDots).toBeGreaterThan(0)
  })

  test('column -> unit: the ghost fades and is removed', async ({ page, loadChart }) => {
    await loadChart('misc', 'chart-type-morph')

    const r = await page.evaluate(async ([ghostSel, unitBtn]) => {
      const op = () => {
        const g = document.querySelector(ghostSel)
        return g ? +getComputedStyle(g).opacity : null
      }
      document.querySelector(unitBtn).click()
      const ramp = []
      for (let k = 0; k < 70; k++) {
        await new Promise((res) => requestAnimationFrame(res))
        const v = op()
        if (v != null) ramp.push(v)
      }
      await new Promise((res) => setTimeout(res, 1200))
      return {
        frames: ramp.length,
        firstOpacity: ramp[0] ?? null,
        lastOpacity: ramp[ramp.length - 1] ?? null,
        monotonic: ramp.every((v, i) => i === 0 || v <= ramp[i - 1] + 1e-6),
        ghostsAfter: document.querySelectorAll(ghostSel).length,
        canvases: document.querySelectorAll('.apexcharts-canvas').length,
      }
    }, [GHOST, UNIT_BTN])

    expect(r.frames).toBeGreaterThan(10)
    expect(r.firstOpacity).toBeGreaterThan(0.9)
    expect(r.lastOpacity).toBeLessThan(0.2)
    expect(r.monotonic).toBe(true)
    expect(r.ghostsAfter).toBe(0)
    expect(r.canvases).toBe(1)
  })

  test('unit -> column: the dots get the exit instead', async ({ page, loadChart }) => {
    await loadChart('misc', 'chart-type-morph')
    await page.click(UNIT_BTN)
    await page.waitForSelector('.apexcharts-unit-area')
    await page.waitForTimeout(1500)

    const r = await page.evaluate(async ([ghostSel, columnBtn]) => {
      const dotsBefore = document.querySelectorAll('.apexcharts-unit-area').length
      document.querySelector(columnBtn).click()
      await new Promise((res) => requestAnimationFrame(res))
      const ghostDots = document.querySelectorAll(`${ghostSel} .apexcharts-unit-area`).length
      await new Promise((res) => setTimeout(res, 1600))
      return {
        dotsBefore,
        ghostDots,
        ghostsAfter: document.querySelectorAll(ghostSel).length,
        liveBars: document.querySelectorAll('.apexcharts-bar-series path[pathTo]').length,
      }
    }, [GHOST, COLUMN_BTN])

    expect(r.dotsBefore).toBeGreaterThan(0)
    // Every dot is carried into the copy: without it they vanish on frame 1,
    // hidden by an incoming bar that starts out the size of the whole cloud.
    expect(r.ghostDots).toBe(r.dotsBefore)
    expect(r.ghostsAfter).toBe(0)
    expect(r.liveBars).toBeGreaterThan(0)
  })

  test('bar -> pie never ghosts: the wedge already starts as the bar', async ({
    page,
    loadChart,
  }) => {
    await loadChart('misc', 'chart-type-morph')

    const anyGhost = await page.evaluate(async (ghostSel) => {
      let seen = false
      document.querySelector('.actions button[data-type="pie"]').click()
      for (let k = 0; k < 70; k++) {
        await new Promise((res) => requestAnimationFrame(res))
        if (document.querySelectorAll(ghostSel).length) seen = true
      }
      return seen
    }, GHOST)

    // A copy here would double the image at t=0, since the incoming wedge is
    // seeded with the outgoing bar's own `d`.
    expect(anyGhost).toBe(false)
  })

  test('re-morphing mid-transition never stacks ghosts', async ({ page, loadChart }) => {
    await loadChart('misc', 'chart-type-morph')

    const r = await page.evaluate(async ([ghostSel, unitBtn, columnBtn]) => {
      let peak = 0
      document.querySelector(unitBtn).click()
      await new Promise((res) => setTimeout(res, 90))
      document.querySelector(columnBtn).click()
      await new Promise((res) => setTimeout(res, 90))
      document.querySelector(unitBtn).click()
      for (let k = 0; k < 60; k++) {
        await new Promise((res) => requestAnimationFrame(res))
        peak = Math.max(peak, document.querySelectorAll(ghostSel).length)
      }
      await new Promise((res) => setTimeout(res, 1400))
      return {
        peak,
        after: document.querySelectorAll(ghostSel).length,
        canvases: document.querySelectorAll('.apexcharts-canvas').length,
      }
    }, [GHOST, UNIT_BTN, COLUMN_BTN])

    expect(r.peak).toBeLessThanOrEqual(1)
    expect(r.after).toBe(0)
    expect(r.canvases).toBe(1)
  })

  test('reduced motion skips the ghost', async ({ page, loadChart }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await loadChart('misc', 'chart-type-morph')

    const r = await page.evaluate(async ([ghostSel, unitBtn]) => {
      let peak = 0
      document.querySelector(unitBtn).click()
      for (let k = 0; k < 40; k++) {
        await new Promise((res) => requestAnimationFrame(res))
        peak = Math.max(peak, document.querySelectorAll(ghostSel).length)
      }
      return { peak, dots: document.querySelectorAll('.apexcharts-unit-area').length }
    }, [GHOST, UNIT_BTN])

    expect(r.peak).toBe(0)
    // The chart still changes type; only the transition is dropped.
    expect(r.dots).toBeGreaterThan(0)
  })
})
