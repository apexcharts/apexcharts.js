/**
 * Rewind (#3) interaction regressions from the 6.0 audit.
 *
 *   - COW capture correctness: mutating a kept series array in place and
 *     passing the SAME reference to updateSeries must still capture the new
 *     values (the old copy-on-write shared the previous clone on reference
 *     identity, so redo restored stale data).
 *   - Runtime enable: history can be switched on via updateOptions after the
 *     chart is live (config is re-read on every mounted/updated).
 *
 * Fixtures: ink-draggable-annotations (history enabled) for the COW case;
 * context-menu (history NOT configured) for the runtime-enable case.
 */

import { test, expect } from '../fixtures/base.js'

// history capture coalesces on a timer; give it room after each mutation
const settle = (page) => page.waitForTimeout(400)

test.describe('History: copy-on-write capture correctness', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'ink-draggable-annotations')
  })

  test('in-place mutation + same-reference updateSeries is captured; undo/redo round-trips', async ({
    page,
  }) => {
    const valueAt2 = () =>
      page.evaluate(() => window.chart.w.config.series[0].data[2][1])

    const original = await valueAt2()
    await settle(page) // baseline checkpoint

    // The audited failure mode: reuse the SAME outer series array, mutate a
    // point in place, and hand the identical reference back to updateSeries.
    await page.evaluate(async () => {
      const sameRef = window.chart.w.config.series
      sameRef[0].data[2] = [sameRef[0].data[2][0], 999]
      await window.chart.updateSeries(sameRef, false)
    })
    await settle(page)
    expect(await valueAt2()).toBe(999)

    // undo -> original value
    await page.evaluate(() => window.chart.history.undo(false))
    await page.waitForFunction(
      (orig) => window.chart.w.config.series[0].data[2][1] === orig,
      original,
    )

    // redo -> the MUTATED value. The old identity-based COW stored the stale
    // pre-mutation series in the post-mutation checkpoint, so redo restored
    // the original value here instead of 999.
    await page.evaluate(() => window.chart.history.redo(false))
    await page.waitForFunction(
      () => window.chart.w.config.series[0].data[2][1] === 999,
    )
    expect(await valueAt2()).toBe(999)
  })
})

test.describe('History: runtime enable via updateOptions', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'context-menu')
  })

  test('enabling chart.history after render starts capturing; undo works', async ({
    page,
  }) => {
    const before = await page.evaluate(() => ({
      hasModule: !!window.chart.history,
      entries: window.chart.history ? window.chart.history.entries().length : -1,
    }))
    expect(before.hasModule).toBe(true)
    expect(before.entries).toBe(0) // disabled: nothing captured

    await page.evaluate(async () => {
      await window.chart.updateOptions(
        { chart: { history: { enabled: true, coalesceMs: 20 } } },
        false,
        false,
      )
    })
    await settle(page)

    // First capture after enabling acts as the baseline...
    const baseline = await page.evaluate(() => window.chart.history.entries().length)
    expect(baseline).toBeGreaterThanOrEqual(1)

    // ...and a subsequent change becomes an undoable step.
    await page.evaluate(async () => {
      await window.chart.updateOptions({ title: { text: 'Runtime history' } }, false, false)
    })
    await settle(page)
    expect(await page.evaluate(() => window.chart.history.canUndo())).toBe(true)

    await page.evaluate(() => window.chart.history.undo(false))
    await page.waitForFunction(
      () => window.chart.w.config.title.text !== 'Runtime history',
    )
    expect(
      await page.evaluate(() => window.chart.w.config.title.text),
    ).not.toBe('Runtime history')
  })

  test('disabling at runtime stops capturing but keeps the stack', async ({ page }) => {
    await page.evaluate(async () => {
      await window.chart.updateOptions(
        { chart: { history: { enabled: true, coalesceMs: 20 } } },
        false,
        false,
      )
      await window.chart.updateOptions({ title: { text: 'step 1' } }, false, false)
    })
    await settle(page)
    const withHistory = await page.evaluate(() => window.chart.history.entries().length)
    expect(withHistory).toBeGreaterThanOrEqual(1)

    await page.evaluate(async () => {
      await window.chart.updateOptions(
        { chart: { history: { enabled: false } } },
        false,
        false,
      )
      await window.chart.updateOptions({ title: { text: 'step 2' } }, false, false)
    })
    await settle(page)
    const after = await page.evaluate(() => ({
      entries: window.chart.history.entries().length,
      title: window.chart.w.config.title.text,
    }))
    expect(after.title).toBe('step 2')
    expect(after.entries).toBe(withHistory) // no new checkpoints while disabled
  })
})
