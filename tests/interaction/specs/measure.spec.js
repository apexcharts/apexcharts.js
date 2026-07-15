/**
 * Measure ruler (#18) - measure ruler interaction tests.
 *
 * Uses the measure fixture (line chart, chart.measure.enabled). Exercises the
 * real gesture path with browser events the jsdom unit env can't:
 *   - arming lays a capture pane; a drag draws a live ruler then pins it
 *   - the `measured` event reports the data-space deltas
 *   - a pinned ruler re-projects (stays data-anchored) across a re-render
 */

import { test, expect } from '../fixtures/base.js'

// Drag A->B across the plot's capture pane; returns nothing (assert via DOM/state).
async function dragMeasure(page, fracAx, fracAy, fracBx, fracBy) {
  await page.evaluate(
    ({ fracAx, fracAy, fracBx, fracBy }) => {
      const pane = window.chart.el.querySelector('.apexcharts-measure-capture')
      const r = pane.getBoundingClientRect()
      const ax = r.left + r.width * fracAx
      const ay = r.top + r.height * fracAy
      const bx = r.left + r.width * fracBx
      const by = r.top + r.height * fracBy
      pane.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, clientX: ax, clientY: ay, button: 0 }))
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, view: window, clientX: bx, clientY: by }))
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, clientX: bx, clientY: by }))
    },
    { fracAx, fracAy, fracBx, fracBy },
  )
}

test.describe('Measure ruler', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'measure')
  })

  test('arming lays a capture pane and a drag pins a span ruler + fires measured', async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.__measured = null
      window.chart.addEventListener('measured', (c, o) => (window.__measured = o))
      window.chart.startMeasure()
    })

    expect(
      await page.evaluate(() => !!window.chart.el.querySelector('.apexcharts-measure-capture')),
    ).toBe(true)

    // drag left -> right across a rising series: dx > 0 and (span-snapped) dy > 0
    await dragMeasure(page, 0.25, 0.75, 0.75, 0.25)

    // span mode draws a shaded band; the live overlay is gone
    const dom = await page.evaluate(() => ({
      band: !!window.chart.el.querySelector('.apexcharts-measure-pins .apexcharts-measure-band'),
      live: !!window.chart.el.querySelector('.apexcharts-measure-live'),
      measured: window.__measured,
    }))
    expect(dom.band).toBe(true)
    expect(dom.live).toBe(false)
    expect(dom.measured).toBeTruthy()
    expect(dom.measured.dx).toBeGreaterThan(0)
    expect(dom.measured.dy).toBeGreaterThan(0)
  })

  test('mode:free draws a diagonal ruler between two arbitrary points', async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.chart.updateOptions({ chart: { measure: { mode: 'free' } } })
      window.chart.startMeasure()
    })
    await dragMeasure(page, 0.25, 0.75, 0.75, 0.25)
    const dom = await page.evaluate(() => ({
      line: !!window.chart.el.querySelector('.apexcharts-measure-pins .apexcharts-measure-line'),
      band: !!window.chart.el.querySelector('.apexcharts-measure-pins .apexcharts-measure-band'),
    }))
    expect(dom.line).toBe(true)
    expect(dom.band).toBe(false)
  })

  test('a pinned ruler re-projects across a re-render (data-anchored)', async ({
    page,
  }) => {
    await page.evaluate(() => window.chart.startMeasure())
    await dragMeasure(page, 0.2, 0.7, 0.8, 0.3)

    const x1Before = await page.evaluate(() =>
      parseFloat(window.chart.el.querySelector('.apexcharts-measure-pins line').getAttribute('x1')),
    )

    // change the x domain -> the pin must re-project to new pixel coords
    await page.evaluate(() => window.chart.updateOptions({ xaxis: { min: 0, max: 30 } }))
    await page.waitForFunction(
      () => window.chart.w.globals.maxX === 30,
    )

    const after = await page.evaluate(() => {
      const line = window.chart.el.querySelector('.apexcharts-measure-pins line')
      return { present: !!line, x1: line ? parseFloat(line.getAttribute('x1')) : null }
    })
    expect(after.present).toBe(true)
    expect(after.x1).not.toBe(x1Before)
  })

  test('clearMeasures removes all pinned rulers', async ({ page }) => {
    await page.evaluate(() => window.chart.startMeasure())
    await dragMeasure(page, 0.25, 0.75, 0.75, 0.25)
    expect(
      await page.evaluate(() => !!window.chart.el.querySelector('.apexcharts-measure-pins .apexcharts-measure-band')),
    ).toBe(true)

    await page.evaluate(() => window.chart.clearMeasures())
    expect(
      await page.evaluate(() => !!window.chart.el.querySelector('.apexcharts-measure-pins .apexcharts-measure-band')),
    ).toBe(false)
  })
})

// Pins live in data space on the eager Measure module, not in w.config, so they
// are captured into the shared ViewState and restored by both Perspectives
// (shareable URL) and Rewind (undo). These exercise the full round-trips.
test.describe('Measure ruler: persistence', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'measure')
  })

  test('a pinned ruler survives a Perspectives encode/apply URL round-trip', async ({
    page,
  }) => {
    await page.evaluate(() => window.chart.startMeasure())
    await dragMeasure(page, 0.2, 0.7, 0.8, 0.3)

    // Encode to the same base64 string a shared URL would carry (this is where a
    // non-JSON-safe value would break), wipe the pins, then apply the string.
    const out = await page.evaluate(() => {
      const token = window.chart.perspectives.capture()
      const pinsInToken = token.view.measure ? token.view.measure.pins.length : 0
      const encoded = window.chart.perspectives.encode()
      window.chart.clearMeasures()
      const afterClear = window.chart.el.querySelectorAll(
        '.apexcharts-measure-pins .apexcharts-measure-band',
      ).length
      window.chart.perspectives.apply(encoded, { animate: false })
      return { pinsInToken, afterClear, encodedIsString: typeof encoded === 'string' }
    })
    expect(out.pinsInToken).toBeGreaterThan(0)
    expect(out.afterClear).toBe(0)
    expect(out.encodedIsString).toBe(true)

    // The restored pin re-projects onto the current view.
    await page.waitForTimeout(80)
    const restored = await page.evaluate(
      () => window.chart.el.querySelectorAll('.apexcharts-measure-pins .apexcharts-measure-band').length,
    )
    expect(restored).toBeGreaterThan(0)
  })

  test('pinning a ruler is undoable and redoable via Rewind (history)', async ({
    page,
  }) => {
    // History wires its listeners at construction, so rebuild the chart with
    // chart.history.enabled. Reuse the same container.
    await page.evaluate(async () => {
      const el = window.chart.el
      window.chart.destroy()
      const data = []
      for (let i = 0; i < 40; i++) data.push([i, 100 + i * 2])
      window.chart = new ApexCharts(el, {
        chart: {
          type: 'line',
          height: 380,
          animations: { enabled: false },
          toolbar: { show: false },
          measure: { enabled: true },
          history: { enabled: true },
        },
        series: [{ name: 'Price', data }],
        xaxis: { type: 'numeric' },
      })
      await window.chart.render()
      window.chart.startMeasure()
    })

    await dragMeasure(page, 0.2, 0.7, 0.8, 0.3)

    const counts = await page.evaluate(async () => {
      const sel = '.apexcharts-measure-pins .apexcharts-measure-band'
      const q = () => window.chart.el.querySelectorAll(sel).length
      const afterPin = q()
      window.chart.history.undo(false)
      await new Promise((r) => setTimeout(r, 90))
      const afterUndo = q()
      window.chart.history.redo(false)
      await new Promise((r) => setTimeout(r, 90))
      const afterRedo = q()
      return { afterPin, afterUndo, afterRedo }
    })
    expect(counts.afterPin).toBeGreaterThan(0)
    expect(counts.afterUndo).toBe(0)
    expect(counts.afterRedo).toBeGreaterThan(0)
  })
})

// The measure-persistence demo wires the share URL + Rewind end to end; this
// asserts its headline behavior: draw a ruler, open the shared #apex= URL in a
// fresh navigation, and the ruler restores on load.
test.describe('Measure ruler: persistence demo', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'measure-persistence')
  })

  test('rulers restore on load from the shared #apex= URL', async ({ page }) => {
    await page.evaluate(() => window.chart.startMeasure())
    await dragMeasure(page, 0.2, 0.7, 0.8, 0.3)

    const pinned = await page.evaluate(
      () => window.chart.el.querySelectorAll('.apexcharts-measure-pins .apexcharts-measure-band').length,
    )
    expect(pinned).toBeGreaterThan(0)

    // Build the shareable fragment and open it in a fresh navigation.
    const frag = await page.evaluate(() => {
      const url = window.chart.perspectives.toURL()
      return url.slice(url.indexOf('#'))
    })
    const base = page.url().split('#')[0]
    await page.goto(base + frag)
    await page.waitForFunction(
      () =>
        typeof window.chart !== 'undefined' &&
        window.chart.w.globals.animationEnded === true,
      { timeout: 10_000 },
    )
    await page.waitForTimeout(100)

    const restored = await page.evaluate(
      () => window.chart.el.querySelectorAll('.apexcharts-measure-pins .apexcharts-measure-band').length,
    )
    expect(restored).toBeGreaterThan(0)
  })
})
