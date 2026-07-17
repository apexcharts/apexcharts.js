/**
 * Scatter/bubble dynamics:
 *
 * 1. Jitter strip plots (numeric band axis) must stay usable under zoom.
 *    A zoom window arrives with fractional bounds, and band tick labels only
 *    render on integer positions, so without snapping every x label formats
 *    to '' (the "labels disappear on zoom" bug). Snapping also restores the
 *    padded full frame on zoom-out, so the outer bands are never half-cropped
 *    (the "chart cut off from both sides" bug).
 *
 * 2. Scatter and bubble charts get dynamic (data-update) animations: markers
 *    ride value updates and zoom re-projections via transform tweens, and
 *    bubbles additionally scale between old and new radius on z changes.
 */

import { test, expect } from '../fixtures/base.js'

test.describe('Scatter jitter band axis under zoom', () => {
  test('zoom-in snaps to whole bands: labels stay and markers ride', async ({
    page,
    loadChart,
  }) => {
    await loadChart('scatter', 'scatter-with-jitter')

    const result = await page.evaluate(async () => {
      const ridingCounts = []
      const timer = setInterval(() => {
        ridingCounts.push(
          [...document.querySelectorAll('.apexcharts-marker')].filter((n) =>
            n.getAttribute('transform'),
          ).length,
        )
      }, 40)
      window.chart.zoomX(0.6, 2.4)
      await new Promise((r) => setTimeout(r, 900))
      clearInterval(timer)
      const labels = [
        ...document.querySelectorAll(
          '.apexcharts-xaxis-texts-g text:not(.apexcharts-tick-ghost)',
        ),
      ]
        .map((t) => t.querySelector('tspan')?.textContent ?? '')
        .filter(Boolean)
      return {
        min: window.chart.w.config.xaxis.min,
        max: window.chart.w.config.xaxis.max,
        labels,
        maxRiding: Math.max(...ridingCounts),
        settledRiding: ridingCounts[ridingCounts.length - 1],
      }
    })

    // fractional 0.6..2.4 snaps to band centers 1..2 plus one pad band per side
    expect(result.min).toBe(0)
    expect(result.max).toBe(3)
    // every tick in the window is labelled (nothing formats to '')
    expect(result.labels).toEqual([
      'Frankfurt',
      'Mumbai',
      'Oregon',
      'Singapore',
    ])
    // markers glide to their re-projected positions rather than snapping
    expect(result.maxRiding).toBeGreaterThan(0)
    expect(result.settledRiding).toBe(0)
  })

  test('zoom-out restores the padded frame: outer bands are not cropped', async ({
    page,
    loadChart,
  }) => {
    await loadChart('scatter', 'scatter-with-jitter')

    const result = await page.evaluate(async () => {
      window.chart.zoomX(0.6, 2.4)
      await new Promise((r) => setTimeout(r, 700))
      // toolbar zoom-out from the 2-band window
      document
        .querySelector('.apexcharts-zoomout-icon')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await new Promise((r) => setTimeout(r, 700))
      const labels = [
        ...document.querySelectorAll(
          '.apexcharts-xaxis-texts-g text:not(.apexcharts-tick-ghost)',
        ),
      ]
        .map((t) => t.querySelector('tspan')?.textContent ?? '')
        .filter(Boolean)
      return {
        minX: window.chart.w.globals.minX,
        maxX: window.chart.w.globals.maxX,
        labels,
      }
    })

    // full padded frame (-1..n), NOT the raw data bounds (0..n-1) that leave
    // the first/last dot clouds half-cropped at the plot edges
    expect(result.minX).toBe(-1)
    expect(result.maxX).toBe(5)
    expect(result.labels).toEqual([
      'Frankfurt',
      'Mumbai',
      'Oregon',
      'Singapore',
      'Virginia',
    ])
  })

  test('wheel zoom-out lands on the padded frame, not the data bounds', async ({
    page,
    loadChart,
  }) => {
    await loadChart('scatter', 'scatter-with-jitter')

    const grid = await page.evaluate(() => {
      const r = document.querySelector('.apexcharts-grid').getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    })
    await page.mouse.move(grid.x, grid.y)
    await page.mouse.wheel(0, -120) // in
    await page.waitForTimeout(600)
    await page.mouse.wheel(0, 120) // out
    await page.waitForTimeout(600)

    const result = await page.evaluate(() => ({
      minX: window.chart.w.globals.minX,
      maxX: window.chart.w.globals.maxX,
      nonEmptyLabels: [
        ...document.querySelectorAll(
          '.apexcharts-xaxis-texts-g text:not(.apexcharts-tick-ghost)',
        ),
      ]
        .map((t) => t.querySelector('tspan')?.textContent ?? '')
        .filter(Boolean).length,
    }))

    expect(result.minX).toBe(-1)
    expect(result.maxX).toBe(5)
    expect(result.nonEmptyLabels).toBe(5)
  })
})

test.describe('Scatter/bubble dynamic-update animations', () => {
  test('scatter markers ride a value update via transform tweens', async ({
    page,
    loadChart,
  }) => {
    await loadChart('scatter', 'scatter-basic')

    const result = await page.evaluate(async () => {
      const ridingCounts = []
      const timer = setInterval(() => {
        ridingCounts.push(
          [...document.querySelectorAll('.apexcharts-marker')].filter((n) =>
            n.getAttribute('transform'),
          ).length,
        )
      }, 40)
      const shifted = window.chart.w.config.series.map((s) => ({
        ...s,
        data: s.data.map(([x, y]) => [x, +(y + 8).toFixed(2)]),
      }))
      window.chart.updateSeries(shifted)
      await new Promise((r) => setTimeout(r, 900))
      clearInterval(timer)
      return {
        maxRiding: Math.max(...ridingCounts),
        settledRiding: ridingCounts[ridingCounts.length - 1],
      }
    })

    expect(result.maxRiding).toBeGreaterThan(10)
    // transforms are removed once the tween lands on the final positions
    expect(result.settledRiding).toBe(0)
  })

  test('bubble markers scale between radii on a z update', async ({
    page,
    loadChart,
  }) => {
    await loadChart('bubble', 'simple-bubble')

    const result = await page.evaluate(async () => {
      const pick = () =>
        [...document.querySelectorAll('.apexcharts-marker')].find(
          (n) =>
            n.getAttribute('j') === '3' && n.getAttribute('index') === '0',
        )
      const parseScale = (tf) => {
        const m = /scale\(([\d.]+)\)/.exec(tf || '')
        return m ? +m[1] : null
      }
      const scaleSamples = []
      const timer = setInterval(() => {
        const s = parseScale(pick()?.getAttribute('transform'))
        if (s != null) scaleSamples.push(s)
      }, 40)
      const changed = window.chart.w.config.series.map((s) => ({
        ...s,
        data: s.data.map(([x, y, z]) => [x, y, Math.max(4, z + 30)]),
      }))
      window.chart.updateSeries(changed)
      await new Promise((r) => setTimeout(r, 1000))
      clearInterval(timer)
      return {
        scaleSamples,
        finalTransform: pick()?.getAttribute('transform') ?? null,
      }
    })

    // grows toward the new (larger) radius: mid-flight scale is < 1 and rises
    expect(result.scaleSamples.length).toBeGreaterThan(2)
    expect(Math.min(...result.scaleSamples)).toBeLessThan(0.95)
    // transform is cleaned up at settle (path data owns the final size)
    expect(result.finalTransform).toBeNull()
  })
})
