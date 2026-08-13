/**
 * Radar tooltips, including the shared mode that never worked (#1575).
 *
 * Radar occupies a hole in the tooltip wiring. `Core` puts it in
 * `axisChartsArrTypes` but NOT in `xyChartsArrTypes`, while `Tooltip` counts it
 * as a marker-hit-tested chart. In `addSVGEvents` that means it matched none of:
 *
 *   - the shared `hoverArea` branch      (xyCharts / comboCharts only)
 *   - the datapoint branch               (gated on `showOnIntersect`)
 *   - the `!axisCharts` branch           (radar IS an axis chart)
 *
 * so whenever `showOnIntersect` was false the chart got no hover listeners at
 * all. `tooltip.shared: true` lands exactly there, because `Config` throws if
 * `shared` and `intersect` are both set, so asking for a shared tooltip forces
 * `intersect: false` and silently removed every listener. The reported symptom
 * was simply "the tooltip does not appear".
 *
 * The second, independent failure: radar is hit-tested purely through its marker
 * elements, because unlike line/area it has no plot-area hover with
 * nearest-point resolution. So `markers.size: 0` left a 0x0 marker with nothing
 * to hover and no tooltip in any mode, which is what
 * samples/source/radar/radar-multiple-series.xml configures. Radar now keeps an
 * invisible hit area for a hidden marker, at the radar default marker radius so
 * the footprint matches an ordinary visible marker.
 *
 * That radius matters and is asserted below: neighbouring series can sit ~11px
 * apart at the same category, so an over-large hit area (8 was tried first)
 * overlaps the next series' point and captions the wrong series.
 */

import { test as base, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const distPath = resolve(rootDir, 'dist', 'apexcharts.js')

const test = base.extend({
  consoleErrors: async ({ page: _page }, use) => {
    await use([])
  },
  boot: async ({ page, consoleErrors }, use) => {
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    /**
     * @param {object} tooltip tooltip config for the radar chart
     * @param {number} [markerSize] `markers.size`; omit for the radar default
     */
    const boot = async (tooltip, markerSize) => {
      await page.goto('about:blank')
      await page.setContent(
        '<div id="chart" style="width:700px;height:450px"></div>',
      )
      await page.addScriptTag({ path: distPath })
      await page.evaluate(async ([tt, ms]) => {
        window.chart = new ApexCharts(document.querySelector('#chart'), {
          chart: { type: 'radar', height: 450, animations: { enabled: false } },
          tooltip: tt,
          ...(ms === undefined ? {} : { markers: { size: ms } }),
          series: [
            { name: 'S1', data: [30, 40, 35, 50, 45] },
            { name: 'S2', data: [20, 25, 45, 30, 38] },
          ],
          xaxis: { categories: ['a', 'b', 'c', 'd', 'e'] },
        })
        await window.chart.render()
      }, [tooltip, markerSize])
      // Radar leaves globals.animationEnded unset in some paths, so wait on the
      // markers the hover targets instead.
      await page.waitForSelector('.apexcharts-marker[index][j]', {
        timeout: 8000,
      })
      await page.waitForTimeout(200)
    }

    await use(boot)

    expect(
      consoleErrors,
      `Unexpected JS errors on page:\n${consoleErrors.join('\n')}`,
    ).toHaveLength(0)
  },
})

/** Hover the second point of the first series and read the tooltip back. */
async function hoverMarkerAndRead(page) {
  await page.locator('[index="0"][j="1"]').first().hover({ force: true })
  await page.waitForTimeout(300)
  return page.evaluate(() => {
    const tip = document.querySelector('.apexcharts-tooltip')
    return {
      visible: tip?.classList.contains('apexcharts-active') ?? false,
      rows: document.querySelectorAll(
        '.apexcharts-tooltip-series-group.apexcharts-active',
      ).length,
      names: Array.from(
        document.querySelectorAll(
          '.apexcharts-tooltip-series-group.apexcharts-active .apexcharts-tooltip-text-y-label',
        ),
      ).map((n) => n.textContent.trim()),
      values: Array.from(
        document.querySelectorAll(
          '.apexcharts-tooltip-series-group.apexcharts-active .apexcharts-tooltip-text-y-value',
        ),
      ).map((n) => n.textContent.trim()),
    }
  })
}

test.describe('Radar tooltip', () => {
  test('shared tooltip shows one row per series (#1575)', async ({
    page,
    boot,
  }) => {
    // shared:true forces intersect:false, which is what used to remove every
    // hover listener from a radar chart.
    await boot({ shared: true, intersect: false })

    const tip = await hoverMarkerAndRead(page)
    expect(tip.visible).toBe(true)
    expect(tip.rows).toBe(2)
    // Second data point of each series: S1 = 40, S2 = 25.
    expect(tip.values).toEqual(['40', '25'])
  })

  test('unshared tooltip with intersect:false shows the hovered series only', async ({
    page,
    boot,
  }) => {
    // Also previously listener-less, for the same reason.
    await boot({ shared: false, intersect: false })

    const tip = await hoverMarkerAndRead(page)
    expect(tip.visible).toBe(true)
    expect(tip.rows).toBe(1)
    expect(tip.values).toEqual(['40'])
  })

  test('GUARD the default intersect:true path is unchanged', async ({
    page,
    boot,
  }) => {
    // This is the one combination that already worked, so it must keep working
    // and must stay single-series.
    await boot({ shared: false, intersect: true })

    const tip = await hoverMarkerAndRead(page)
    expect(tip.visible).toBe(true)
    expect(tip.rows).toBe(1)
    expect(tip.values).toEqual(['40'])
  })

  test('hidden markers (size:0) still show a tooltip', async ({
    page,
    boot,
  }) => {
    // The configuration of samples/source/radar/radar-multiple-series.xml: the
    // markers are deliberately invisible, which used to leave nothing hoverable.
    for (const tooltip of [
      { shared: true, intersect: false },
      { shared: false, intersect: true },
    ]) {
      await boot(tooltip, 0)
      const tip = await hoverMarkerAndRead(page)
      expect(
        tip.visible,
        `no tooltip with markers.size:0 and tooltip ${JSON.stringify(tooltip)}`,
      ).toBe(true)
      expect(tip.rows).toBe(tooltip.shared ? 2 : 1)
    }
  })

  test('the hit area kept for a hidden marker paints nothing', async ({
    page,
    boot,
  }) => {
    await boot({ shared: false, intersect: true }, 0)

    const paint = await page.evaluate(() => {
      const m = document.querySelector('.apexcharts-marker[index][j]')
      const r = m.getBoundingClientRect()
      return {
        fill: m.getAttribute('fill'),
        stroke: m.getAttribute('stroke'),
        strokeWidth: m.getAttribute('stroke-width'),
        box: Math.round(r.width),
      }
    })

    // Invisible, but with real geometry so it can receive pointer events.
    expect(paint.fill).toBe('transparent')
    expect(paint.stroke).toBe('transparent')
    expect(Number(paint.strokeWidth)).toBe(0)
    expect(paint.box).toBeGreaterThan(0)
  })

  test('a hidden hit area does not steal the neighbouring series hover', async ({
    page,
    boot,
  }) => {
    // Two series ~11px apart at the same category. An over-large hit area
    // captions the wrong series, so assert each point reports its OWN series.
    await boot({ shared: false, intersect: true }, 0)

    for (const [seriesIndex, expected] of [
      [0, '50'], // S1 point 3
      [1, '30'], // S2 point 3
    ]) {
      await page.mouse.move(3, 3)
      await page.waitForTimeout(120)
      await page.locator(`[index="${seriesIndex}"][j="3"]`).first().hover({
        force: true,
      })
      await page.waitForTimeout(300)
      const values = await page.evaluate(() =>
        Array.from(
          document.querySelectorAll('.apexcharts-tooltip-series-group'),
        )
          .filter((g) => getComputedStyle(g).display !== 'none')
          .map((g) =>
            g
              .querySelector('.apexcharts-tooltip-text-y-value')
              ?.textContent.trim(),
          ),
      )
      expect(
        values,
        `series ${seriesIndex} point 3 captioned the wrong series`,
      ).toEqual([expected])
    }
  })

  test('hover listeners are actually attached in every tooltip mode', async ({
    page,
    boot,
  }) => {
    // Directly asserts the defect: the markers must carry the listeners, not
    // just exist. Checked by observing that a mousemove reaches the handler.
    for (const tooltip of [
      { shared: true, intersect: false },
      { shared: false, intersect: false },
      { shared: false, intersect: true },
    ]) {
      await boot(tooltip)
      const fired = await page.evaluate(async () => {
        const tt = window.chart.ctx.tooltip
        let count = 0
        const orig = tt.seriesHover.bind(tt)
        tt.seriesHover = function (opt, e) {
          count++
          return orig(opt, e)
        }
        const el = document.querySelector('[index="0"][j="1"]')
        const r = el.getBoundingClientRect()
        el.dispatchEvent(
          new MouseEvent('mousemove', {
            bubbles: true,
            clientX: r.left + r.width / 2,
            clientY: r.top + r.height / 2,
          }),
        )
        await new Promise((s) => setTimeout(s, 120))
        return count
      })
      expect(
        fired,
        `no hover handler fired for tooltip ${JSON.stringify(tooltip)}`,
      ).toBeGreaterThan(0)
    }
  })
})
