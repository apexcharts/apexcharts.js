/**
 * Script-tag add-ons, loaded in either order.
 *
 * Every add-on reads `ApexCharts.__internals` as it runs, so one whose tag
 * came first used to die on "Cannot read properties of undefined (reading
 * '__internals')", a message that names neither the file nor the fix. It now
 * waits for the ApexCharts script and registers when that loads
 * (build/shared-modules.mjs `wrapAddon`, src/utils/PendingAddons.js). These
 * drive the built files, since the wrapper exists only there.
 */
import { test, expect } from '@playwright/test'
import { writeFileSync } from 'fs'
import { fileURLToPath, pathToFileURL } from 'url'
import { dirname, resolve } from 'path'
import { BUNDLE } from '../helpers/frames.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
// The add-ons and the lean core next to the bundle under test, so APEX_BUNDLE
// (helpers/frames.js) pointed at another build tests that build's files too.
const DIST = process.env.APEX_BUNDLE
  ? dirname(BUNDLE)
  : resolve(__dirname, '..', '..', '..', 'dist')

const VIOLIN = {
  chart: { type: 'violin', height: 260, animations: { enabled: false } },
  series: [{ name: 'A', data: [{ x: 'G', y: [1, 2, 2, 3, 3, 3, 4, 4, 5] }] }],
}

/** Errors a page reports, so a test can say there were none. */
function collectErrors(page) {
  const errors = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  return errors
}

/** Draw the violin and return the length of its density path. */
async function violinPathLength(page) {
  return page.evaluate(async (opts) => {
    const el = document.getElementById('chart')
    const chart = new window.ApexCharts(el, opts)
    await chart.render()
    const area = el.querySelector('.apexcharts-violin-area')
    return area ? (area.getAttribute('d') || '').length : 0
  }, VIOLIN)
}

test.describe('Add-ons loaded before the ApexCharts script', () => {
  test('wait for the default bundle, then register and draw', async ({
    page,
  }) => {
    const errors = collectErrors(page)
    await page.setContent('<div id="chart" style="width:500px"></div>')
    await page.addScriptTag({ path: resolve(DIST, 'violin.js') })
    await page.addScriptTag({ path: resolve(DIST, 'features/drilldown.js') })
    await page.addScriptTag({ path: BUNDLE })

    expect(await violinPathLength(page)).toBeGreaterThan(200)
    expect(
      await page.evaluate(() =>
        window.ApexCharts.__internals ? 'ready' : 'missing',
      ),
    ).toBe('ready')
    expect(
      await page.evaluate(() => window.__apexcharts_pending_addons__.length),
    ).toBe(0)
    expect(errors).toEqual([])
  })

  test('wait for the lean core too', async ({ page }) => {
    const errors = collectErrors(page)
    await page.setContent('<div id="chart" style="width:500px"></div>')
    await page.addScriptTag({ path: resolve(DIST, 'violin.js') })
    await page.addScriptTag({ path: resolve(DIST, 'apexcharts.core.js') })
    await page.addScriptTag({ path: resolve(DIST, 'bar.js') })
    await page.addScriptTag({ path: resolve(DIST, 'features/stats.js') })

    expect(await violinPathLength(page)).toBeGreaterThan(200)
    expect(errors).toEqual([])
  })

  test('say they are waiting when the page has not loaded ApexCharts', async ({
    page,
  }, testInfo) => {
    const messages = []
    page.on('pageerror', (e) => messages.push(`pageerror: ${e.message}`))
    page.on('console', (m) => messages.push(`${m.type()}: ${m.text()}`))
    // A real page load, so the add-on's check at window `load` runs.
    const file = testInfo.outputPath('addon-only.html')
    writeFileSync(
      file,
      `<html><body><script src="${pathToFileURL(resolve(DIST, 'violin.js')).href}"></script></body></html>`,
    )
    await page.goto(pathToFileURL(file).href)
    await expect
      .poll(() => messages.join('\n'))
      .toContain(
        'warning: ApexCharts: dist/violin.js is waiting for the ApexCharts script',
      )
    expect(messages.join('\n')).not.toContain('__internals')
  })

  // A lazy loader or a consent gate injects the ApexCharts script after the
  // page loaded: the add-on waited, so it registers then, and the warning it
  // gave at load was true when given.
  test('register when ApexCharts is injected after the page loaded', async ({
    page,
  }, testInfo) => {
    const errors = collectErrors(page)
    const file = testInfo.outputPath('late-core.html')
    const src = (f) => pathToFileURL(resolve(DIST, f)).href
    writeFileSync(
      file,
      `<html><body><div id="chart" style="width:500px"></div>
<script src="${src('violin.js')}"></script>
<script>
window.addEventListener('load', () => {
  const s = document.createElement('script')
  s.src = ${JSON.stringify(pathToFileURL(BUNDLE).href)}
  document.body.appendChild(s)
})
</script></body></html>`,
    )
    await page.goto(pathToFileURL(file).href)
    await page.waitForFunction(
      () => window.ApexCharts && window.ApexCharts.__internals,
    )
    expect(await violinPathLength(page)).toBeGreaterThan(200)
    expect(errors).toEqual([])
  })
})
