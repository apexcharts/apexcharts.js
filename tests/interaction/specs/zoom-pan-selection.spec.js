/**
 * ZoomPanSelection interaction tests.
 *
 * Covers the primary branches in ZoomPanSelection.js using real Playwright
 * browser events — the only way to exercise getBoundingClientRect, classList,
 * and event dispatch that jsdom cannot handle.
 *
 * Fixture: samples/vanilla-js/line/zoom-pan-selection.html
 *   - 20-point numeric line chart, zoom type='x', autoSelected='zoom'
 *   - animations disabled so state settles synchronously
 *
 * Branch coverage targets:
 *   - drag-zoom: mousedown → mousemove → mouseup path through selectionDrawing
 *     + selectionDrawn (zoomEnabled branch)
 *   - zoomed event fires with correct xaxis bounds
 *   - resetZoom restores original minX/maxX (w.interact.zoomed reset)
 *   - pan mode: mousedown → mousemove updates moveDirection + calls panScrolled
 *   - scrolled event fires during pan
 *   - selection mode: selectionDrawn fires selection event with xaxis bounds
 *   - mousewheel zoom in (deltaY < 0) and zoom out (deltaY > 0)
 *   - no JS errors thrown for any of the above
 */

import { test, expect } from '../fixtures/base.js'
import {
  dragOnChart,
  wheelOnChart,
  getXRange,
} from '../helpers/chart.js'

const CHART = 'line'
const FIXTURE = 'zoom-pan-selection'

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Get the chart grid dimensions from the live instance so drag coordinates
 * are always relative to the actual rendered grid, regardless of viewport.
 */
async function getGridLayout(page) {
  return page.evaluate(() => {
    const w = window.chart.w
    return {
      gridWidth: w.layout.gridWidth,
      gridHeight: w.layout.gridHeight,
      translateX: w.layout.translateX,
      translateY: w.layout.translateY,
      initialMinX: w.globals.initialMinX,
      initialMaxX: w.globals.initialMaxX,
    }
  })
}

/**
 * Arm a one-shot capture for a named chart event.
 * Writes the event args to window.__capturedZoomEvent.
 */
async function armZoomEvent(page, eventName) {
  await page.evaluate((name) => {
    window.__capturedZoomEvent = null
    const prev = window.chart.w.config.chart.events[name]
    window.chart.w.config.chart.events[name] = (_ctx, opts) => {
      window.__capturedZoomEvent = JSON.parse(JSON.stringify(opts))
      if (prev) prev(_ctx, opts)
    }
  }, eventName)
}

async function waitForZoomEvent(page, timeout = 3_000) {
  await page.waitForFunction(() => window.__capturedZoomEvent !== null, { timeout })
  return page.evaluate(() => {
    const r = window.__capturedZoomEvent
    window.__capturedZoomEvent = null
    return r
  })
}

// ─── zoom tests ─────────────────────────────────────────────────────────────

test.describe('Drag zoom (type=x)', () => {
  test('dragging right narrows the visible xaxis range', async ({ page, loadChart }) => {
    await loadChart(CHART, FIXTURE)
    const layout = await getGridLayout(page)

    const { initialMinX, initialMaxX } = layout
    const initialRange = initialMaxX - initialMinX

    // Drag across the middle 40% of the grid width.
    const startX = layout.translateX + layout.gridWidth * 0.3
    const endX   = layout.translateX + layout.gridWidth * 0.7
    const midY   = layout.translateY + layout.gridHeight / 2

    await dragOnChart(page, { x: startX, y: midY }, { x: endX, y: midY })

    // Wait for the zoom update to propagate.
    await page.waitForFunction(
      () => window.chart.w.interact.zoomed === true,
      { timeout: 3_000 },
    )

    const { minX, maxX } = await getXRange(page)
    const newRange = maxX - minX

    expect(newRange).toBeLessThan(initialRange)
    expect(minX).toBeGreaterThan(initialMinX)
    expect(maxX).toBeLessThan(initialMaxX)
  })

  test('zoomed event fires with xaxis.min < xaxis.max', async ({ page, loadChart }) => {
    await loadChart(CHART, FIXTURE)
    const layout = await getGridLayout(page)

    await armZoomEvent(page, 'zoomed')

    const startX = layout.translateX + layout.gridWidth * 0.2
    const endX   = layout.translateX + layout.gridWidth * 0.6
    const midY   = layout.translateY + layout.gridHeight / 2

    await dragOnChart(page, { x: startX, y: midY }, { x: endX, y: midY })

    const eventArgs = await waitForZoomEvent(page)
    expect(eventArgs).not.toBeNull()
    expect(eventArgs.xaxis.min).toBeLessThan(eventArgs.xaxis.max)
  })

  test('w.interact.zoomed is true after drag zoom', async ({ page, loadChart }) => {
    await loadChart(CHART, FIXTURE)
    const layout = await getGridLayout(page)

    const startX = layout.translateX + layout.gridWidth * 0.25
    const endX   = layout.translateX + layout.gridWidth * 0.75
    const midY   = layout.translateY + layout.gridHeight / 2

    await dragOnChart(page, { x: startX, y: midY }, { x: endX, y: midY })
    await page.waitForFunction(
      () => window.chart.w.interact.zoomed === true,
      { timeout: 3_000 },
    )

    const zoomed = await page.evaluate(() => window.chart.w.interact.zoomed)
    expect(zoomed).toBe(true)
  })

  test('resetZoom restores original xaxis range', async ({ page, loadChart }) => {
    await loadChart(CHART, FIXTURE)
    const layout = await getGridLayout(page)

    // First zoom in.
    const startX = layout.translateX + layout.gridWidth * 0.3
    const endX   = layout.translateX + layout.gridWidth * 0.6
    const midY   = layout.translateY + layout.gridHeight / 2

    await dragOnChart(page, { x: startX, y: midY }, { x: endX, y: midY })
    await page.waitForFunction(
      () => window.chart.w.interact.zoomed === true,
      { timeout: 3_000 },
    )

    // Reset via toolbar's handleZoomReset (same as clicking the reset button).
    await page.evaluate(() => window.chart.toolbar.handleZoomReset())
    await page.waitForFunction(
      () => window.chart.w.interact.zoomed === false,
      { timeout: 3_000 },
    )

    const { minX, maxX } = await getXRange(page)
    expect(minX).toBeCloseTo(layout.initialMinX, -1)
    expect(maxX).toBeCloseTo(layout.initialMaxX, -1)
  })

  test('short drag (< 10px) does not trigger zoom', async ({ page, loadChart }) => {
    await loadChart(CHART, FIXTURE)
    const layout = await getGridLayout(page)
    const { initialMinX, initialMaxX } = layout

    const midX = layout.translateX + layout.gridWidth / 2
    const midY = layout.translateY + layout.gridHeight / 2

    // 5px drag — below the 10px threshold in selectionDrawn.
    await dragOnChart(page, { x: midX, y: midY }, { x: midX + 5, y: midY }, 2)
    await page.waitForTimeout(300)

    const { minX, maxX } = await getXRange(page)
    expect(minX).toBeCloseTo(initialMinX, -1)
    expect(maxX).toBeCloseTo(initialMaxX, -1)
  })

  test('no JS errors thrown during drag zoom', async ({ page, loadChart }) => {
    await loadChart(CHART, FIXTURE)
    const layout = await getGridLayout(page)

    const startX = layout.translateX + layout.gridWidth * 0.1
    const endX   = layout.translateX + layout.gridWidth * 0.9
    const midY   = layout.translateY + layout.gridHeight / 2

    await dragOnChart(page, { x: startX, y: midY }, { x: endX, y: midY })
    // consoleErrors check runs automatically in the base fixture.
  })
})

// ─── pan tests ───────────────────────────────────────────────────────────────

test.describe('Pan mode', () => {
  test('switching to pan mode enables w.interact.panEnabled', async ({ page, loadChart }) => {
    await loadChart(CHART, FIXTURE)
    // Use the toolbar API — the same path triggered by clicking the pan icon.
    await page.evaluate(() => window.chart.toolbar.enableZoomPanFromToolbar('pan'))

    const panEnabled = await page.evaluate(() => window.chart.w.interact.panEnabled)
    expect(panEnabled).toBe(true)
  })

  test('pan drag shifts the visible xaxis range', async ({ page, loadChart }) => {
    await loadChart(CHART, FIXTURE)

    // First zoom in so there is room to pan.
    const layout = await getGridLayout(page)
    const startX = layout.translateX + layout.gridWidth * 0.3
    const endX   = layout.translateX + layout.gridWidth * 0.6
    const midY   = layout.translateY + layout.gridHeight / 2

    await dragOnChart(page, { x: startX, y: midY }, { x: endX, y: midY })
    await page.waitForFunction(
      () => window.chart.w.interact.zoomed === true,
      { timeout: 3_000 },
    )

    const { minX: zoomedMinX, maxX: zoomedMaxX } = await getXRange(page)

    // Switch to pan mode via toolbar API.
    await page.evaluate(() => window.chart.toolbar.enableZoomPanFromToolbar('pan'))

    // Pan left (drag from right to left) — shifts range toward higher values.
    const layout2 = await getGridLayout(page)
    const panStart = layout2.translateX + layout2.gridWidth * 0.7
    const panEnd   = layout2.translateX + layout2.gridWidth * 0.3
    const panY     = layout2.translateY + layout2.gridHeight / 2

    await dragOnChart(page, { x: panStart, y: panY }, { x: panEnd, y: panY })
    await page.waitForTimeout(400)

    const { minX: pannedMinX, maxX: pannedMaxX } = await getXRange(page)

    // After panning left the range should shift right (higher minX/maxX).
    expect(pannedMinX + pannedMaxX).toBeGreaterThan(zoomedMinX + zoomedMaxX)
  })

  test('scrolled event fires during pan', async ({ page, loadChart }) => {
    await loadChart(CHART, FIXTURE)

    // Zoom in first so pan has somewhere to go.
    const layout = await getGridLayout(page)
    await dragOnChart(
      page,
      { x: layout.translateX + layout.gridWidth * 0.3, y: layout.translateY + layout.gridHeight / 2 },
      { x: layout.translateX + layout.gridWidth * 0.6, y: layout.translateY + layout.gridHeight / 2 },
    )
    await page.waitForFunction(
      () => window.chart.w.interact.zoomed === true,
      { timeout: 3_000 },
    )

    // Switch to pan and arm the scrolled event listener.
    await page.evaluate(() => window.chart.toolbar.enableZoomPanFromToolbar('pan'))
    await armZoomEvent(page, 'scrolled')

    const layout2 = await getGridLayout(page)
    await dragOnChart(
      page,
      { x: layout2.translateX + layout2.gridWidth * 0.7, y: layout2.translateY + layout2.gridHeight / 2 },
      { x: layout2.translateX + layout2.gridWidth * 0.3, y: layout2.translateY + layout2.gridHeight / 2 },
    )

    const eventArgs = await waitForZoomEvent(page)
    expect(eventArgs).not.toBeNull()
    expect(typeof eventArgs.xaxis.min).toBe('number')
    expect(typeof eventArgs.xaxis.max).toBe('number')
  })

  test('no JS errors thrown during pan', async ({ page, loadChart }) => {
    await loadChart(CHART, FIXTURE)

    const layout = await getGridLayout(page)
    // Zoom in first.
    await dragOnChart(
      page,
      { x: layout.translateX + layout.gridWidth * 0.3, y: layout.translateY + layout.gridHeight / 2 },
      { x: layout.translateX + layout.gridWidth * 0.6, y: layout.translateY + layout.gridHeight / 2 },
    )
    await page.waitForFunction(() => window.chart.w.interact.zoomed === true, { timeout: 3_000 })

    await page.evaluate(() => window.chart.toolbar.enableZoomPanFromToolbar('pan'))
    const layout2 = await getGridLayout(page)
    await dragOnChart(
      page,
      { x: layout2.translateX + layout2.gridWidth * 0.6, y: layout2.translateY + layout2.gridHeight / 2 },
      { x: layout2.translateX + layout2.gridWidth * 0.2, y: layout2.translateY + layout2.gridHeight / 2 },
    )
    // consoleErrors check runs automatically.
  })
})

// ─── selection mode ──────────────────────────────────────────────────────────

test.describe('Selection mode', () => {
  async function enableSelection(page) {
    // First configure selection via updateOptions so the selection rect is
    // initialised, then toggle it on via the toolbar API.
    await page.evaluate(() => {
      window.chart.updateOptions({
        chart: {
          selection: { enabled: true, type: 'x' },
          zoom: { enabled: false },
        },
      })
    })
    await page.waitForFunction(
      () => window.chart.w.globals.animationEnded === true,
      { timeout: 5_000 },
    )
    // Toggle selection on through the toolbar controller.
    await page.evaluate(() => window.chart.toolbar.toggleZoomSelection('selection'))
  }

  test('selection event fires with xaxis bounds after drag', async ({ page, loadChart }) => {
    await loadChart(CHART, FIXTURE)
    await enableSelection(page)

    await armZoomEvent(page, 'selection')

    const layout = await getGridLayout(page)
    const startX = layout.translateX + layout.gridWidth * 0.2
    const endX   = layout.translateX + layout.gridWidth * 0.7
    const midY   = layout.translateY + layout.gridHeight / 2

    await dragOnChart(page, { x: startX, y: midY }, { x: endX, y: midY })

    const eventArgs = await waitForZoomEvent(page)
    expect(eventArgs).not.toBeNull()
    expect(eventArgs.xaxis.min).toBeLessThan(eventArgs.xaxis.max)
  })

  test('w.interact.selectionEnabled is true in selection mode', async ({ page, loadChart }) => {
    await loadChart(CHART, FIXTURE)
    await enableSelection(page)

    const selEnabled = await page.evaluate(() => window.chart.w.interact.selectionEnabled)
    expect(selEnabled).toBe(true)
  })

  test('selection rect appears in DOM after drag', async ({ page, loadChart }) => {
    await loadChart(CHART, FIXTURE)
    await enableSelection(page)

    const layout = await getGridLayout(page)
    const startX = layout.translateX + layout.gridWidth * 0.2
    const endX   = layout.translateX + layout.gridWidth * 0.6
    const midY   = layout.translateY + layout.gridHeight / 2

    await dragOnChart(page, { x: startX, y: midY }, { x: endX, y: midY })

    // The selection rect should have non-zero width after a visible drag.
    const rectWidth = await page.evaluate(() => {
      const rect = document.querySelector('.apexcharts-selection-rect')
      return rect ? parseFloat(rect.getAttribute('width') || '0') : 0
    })
    expect(rectWidth).toBeGreaterThan(0)
  })

  test('no JS errors thrown during selection drag', async ({ page, loadChart }) => {
    await loadChart(CHART, FIXTURE)
    await enableSelection(page)

    const layout = await getGridLayout(page)
    await dragOnChart(
      page,
      { x: layout.translateX + layout.gridWidth * 0.1, y: layout.translateY + layout.gridHeight / 2 },
      { x: layout.translateX + layout.gridWidth * 0.8, y: layout.translateY + layout.gridHeight / 2 },
    )
    // consoleErrors check runs automatically.
  })
})

// ─── mousewheel zoom ─────────────────────────────────────────────────────────

test.describe('Mouse wheel zoom', () => {
  async function enableWheelZoom(page) {
    await page.evaluate(() => {
      window.chart.updateOptions({
        chart: { zoom: { enabled: true, allowMouseWheelZoom: true } },
      })
    })
    await page.waitForFunction(
      () => window.chart.w.globals.animationEnded === true,
      { timeout: 5_000 },
    )
  }

  test('scroll up (deltaY < 0) zooms in — range narrows', async ({ page, loadChart }) => {
    await loadChart(CHART, FIXTURE)
    await enableWheelZoom(page)

    const layout = await getGridLayout(page)
    const { initialMinX, initialMaxX } = layout
    const initialRange = initialMaxX - initialMinX

    const midX = layout.translateX + layout.gridWidth / 2
    const midY = layout.translateY + layout.gridHeight / 2

    await wheelOnChart(page, { x: midX, y: midY }, -100)

    await page.waitForFunction(
      () => window.chart.w.interact.zoomed === true,
      { timeout: 3_000 },
    )

    const { minX, maxX } = await getXRange(page)
    expect(maxX - minX).toBeLessThan(initialRange)
  })

  test('scroll down (deltaY > 0) zooms out — range widens or stays bounded', async ({
    page,
    loadChart,
  }) => {
    await loadChart(CHART, FIXTURE)
    await enableWheelZoom(page)

    // First zoom in so we have room to zoom out.
    const layout = await getGridLayout(page)
    const midX = layout.translateX + layout.gridWidth / 2
    const midY = layout.translateY + layout.gridHeight / 2

    await wheelOnChart(page, { x: midX, y: midY }, -100)
    await page.waitForFunction(() => window.chart.w.interact.zoomed === true, { timeout: 3_000 })

    const { minX: zoomedMin, maxX: zoomedMax } = await getXRange(page)

    // Now zoom back out.
    await wheelOnChart(page, { x: midX, y: midY }, 100)
    await page.waitForTimeout(500)

    const { minX: outMin, maxX: outMax } = await getXRange(page)
    // Range should be wider after zooming out.
    expect(outMax - outMin).toBeGreaterThanOrEqual(zoomedMax - zoomedMin)
  })

  test('zoomed event fires on wheel zoom in', async ({ page, loadChart }) => {
    await loadChart(CHART, FIXTURE)
    await enableWheelZoom(page)

    await armZoomEvent(page, 'zoomed')

    const layout = await getGridLayout(page)
    const midX = layout.translateX + layout.gridWidth / 2
    const midY = layout.translateY + layout.gridHeight / 2

    await wheelOnChart(page, { x: midX, y: midY }, -100)

    const eventArgs = await waitForZoomEvent(page)
    expect(eventArgs).not.toBeNull()
    expect(eventArgs.xaxis.min).toBeLessThan(eventArgs.xaxis.max)
  })

  test('no JS errors on wheel zoom', async ({ page, loadChart }) => {
    await loadChart(CHART, FIXTURE)
    await enableWheelZoom(page)

    const layout = await getGridLayout(page)
    const midX = layout.translateX + layout.gridWidth / 2
    const midY = layout.translateY + layout.gridHeight / 2

    await wheelOnChart(page, { x: midX, y: midY }, -100)
    await wheelOnChart(page, { x: midX, y: midY }, 100)
    // consoleErrors check runs automatically.
  })
})
