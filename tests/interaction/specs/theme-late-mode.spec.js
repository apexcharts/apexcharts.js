/**
 * A mode that arrives late still paints the chart on its first render, in a
 * real browser with a real prefers-color-scheme.
 *
 * Core.setupElements paints the SVG paper from theme.mode before Theme runs,
 * and the tooltip theme used to be darkened only at config time. A registered
 * named theme with mode 'dark' writes the mode in Theme, so its first render
 * was near-white text on a transparent paper (illegible on a white page) with
 * a light tooltip; theme.follow 'os' on a dark OS kept the light tooltip on
 * every render. Also covers an explicit chart.foreColor equal to the other
 * mode's default, which the mode pass used to swap.
 */

import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
// APEX_BUNDLE runs the same tests against another build.
const BUNDLE = process.env.APEX_BUNDLE
  ? resolve(process.env.APEX_BUNDLE)
  : resolve(__dirname, '..', '..', '..', 'dist', 'apexcharts.js')

const DARK_PAPER = 'rgb(52, 58, 63)'
const LIGHT_PAPER = 'rgb(255, 255, 255)'
const CLEAR_PAPER = 'rgba(0, 0, 0, 0)'

/**
 * @param {import('@playwright/test').Page} page
 * @param {'light' | 'dark'} colorScheme
 */
async function setup(page, colorScheme) {
  await page.emulateMedia({ colorScheme })
  await page.goto('about:blank')
  await page.setContent('<div id="mount" style="width:520px"></div>')
  await page.addScriptTag({ path: BUNDLE })
}

/**
 * Mount a chart (after registering any named themes) and render it.
 * @param {import('@playwright/test').Page} page
 * @param {Record<string, any>} options
 * @param {Record<string, any>} [themes]
 */
async function mount(page, options, themes = {}) {
  await page.evaluate(
    async ({ options, themes }) => {
      for (const [name, def] of Object.entries(themes)) {
        window.ApexCharts.registerTheme(name, def)
      }
      const el = document.getElementById('mount')
      el.innerHTML = ''
      const chart = new window.ApexCharts(el, {
        ...options,
        chart: {
          type: 'line',
          height: 240,
          animations: { enabled: false },
          ...options.chart,
        },
        series: [{ name: 'A', data: [3, 5, 4, 6] }],
        xaxis: { categories: ['a', 'b', 'c', 'd'] },
      })
      window.chart = chart
      await chart.render()
    },
    { options, themes },
  )
}

/** What the page shows: paper colour, tooltip class and label fill. */
function read(page) {
  return page.evaluate(() => {
    const chart = window.chart
    const paper = chart.w.dom.Paper.node
    const tt = chart.el.querySelector('.apexcharts-tooltip')
    const label = chart.el.querySelector('.apexcharts-xaxis-label')
    return {
      mode: chart.w.config.theme.mode,
      paper: getComputedStyle(paper).backgroundColor,
      tooltipDark: tt.classList.contains('apexcharts-theme-dark'),
      tooltipLight: tt.classList.contains('apexcharts-theme-light'),
      labelFill: label.getAttribute('fill'),
    }
  })
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {Record<string, any>} payload
 */
const update = (page, payload) =>
  page.evaluate((p) => window.chart.updateOptions(p), payload)

/**
 * @param {any} state
 * @param {string} paper
 * @param {'light' | 'dark'} tooltip
 * @param {string} fore
 */
function expectPainted(state, paper, tooltip, fore) {
  expect(state.paper).toBe(paper)
  expect(state.tooltipDark).toBe(tooltip === 'dark')
  expect(state.tooltipLight).toBe(tooltip === 'light')
  expect(state.labelFill).toBe(fore)
}

test.describe('theme.follow "os"', () => {
  test('a dark OS paints a dark paper and a dark tooltip from render 1', async ({
    page,
  }) => {
    await setup(page, 'dark')
    await mount(page, { theme: { follow: 'os' } })
    const first = await read(page)
    expect(first.mode).toBe('dark')
    expectPainted(first, DARK_PAPER, 'dark', '#f6f7f8')
    await update(page, { title: { text: 'x' } })
    expectPainted(await read(page), DARK_PAPER, 'dark', '#f6f7f8')
    await page.evaluate(() => window.chart.refreshTokens())
    expectPainted(await read(page), DARK_PAPER, 'dark', '#f6f7f8')
  })

  test('the OS turning light repaints it light', async ({ page }) => {
    await setup(page, 'dark')
    await mount(page, { theme: { follow: 'os' } })
    await page.emulateMedia({ colorScheme: 'light' })
    await page.waitForFunction(
      () => window.chart.w.config.theme.mode === 'light',
    )
    // the watcher's updateOptions settles before the paint is read
    await page.waitForTimeout(50)
    expectPainted(await read(page), LIGHT_PAPER, 'light', '#373d3f')
  })

  test('a light OS stays as it was', async ({ page }) => {
    await setup(page, 'light')
    await mount(page, { theme: { follow: 'os' } })
    expectPainted(await read(page), LIGHT_PAPER, 'light', '#373d3f')
  })
})

test.describe('a registered dark theme', () => {
  const themes = { nightI: { mode: 'dark' } }

  test('paints a dark paper and a dark tooltip from render 1', async ({
    page,
  }) => {
    await setup(page, 'light')
    await mount(page, { theme: { name: 'nightI' } }, themes)
    const first = await read(page)
    expect(first.mode).toBe('dark')
    expectPainted(first, DARK_PAPER, 'dark', '#f6f7f8')
    await update(page, { title: { text: 'x' } })
    expectPainted(await read(page), DARK_PAPER, 'dark', '#f6f7f8')
  })

  test('cleared, it gives the paper and tooltip back on that render', async ({
    page,
  }) => {
    await setup(page, 'light')
    await mount(page, { theme: { name: 'nightI' } }, themes)
    await update(page, { theme: { name: '' } })
    expectPainted(await read(page), CLEAR_PAPER, 'light', '#373d3f')
  })

  test('a token surface still wins over the dark paper', async ({ page }) => {
    await setup(page, 'light')
    await mount(
      page,
      { theme: { name: 'slateI' } },
      {
        slateI: { mode: 'dark', tokens: { surface: '#0f172a' } },
      },
    )
    expect((await read(page)).paper).toBe('rgb(15, 23, 42)')
  })

  test('an explicit light-default foreColor is kept on it', async ({
    page,
  }) => {
    await setup(page, 'light')
    await mount(
      page,
      { theme: { name: 'nightI' }, chart: { foreColor: '#373d3f' } },
      themes,
    )
    expectPainted(await read(page), DARK_PAPER, 'dark', '#373d3f')
  })
})

test.describe('plain modes and explicit foreColor', () => {
  test('plain dark and no mode paint as before', async ({ page }) => {
    await setup(page, 'light')
    await mount(page, { theme: { mode: 'dark' } })
    expectPainted(await read(page), DARK_PAPER, 'dark', '#f6f7f8')
    await mount(page, {})
    expectPainted(await read(page), CLEAR_PAPER, 'light', '#373d3f')
  })

  test("'#373d3f' on a dark chart and '#f6f7f8' on a light one are kept", async ({
    page,
  }) => {
    await setup(page, 'light')
    await mount(page, {
      theme: { mode: 'dark' },
      chart: { foreColor: '#373d3f', background: '#ffffff' },
    })
    expect((await read(page)).labelFill).toBe('#373d3f')
    await mount(page, {
      theme: { mode: 'light' },
      chart: { foreColor: '#f6f7f8' },
    })
    expect((await read(page)).labelFill).toBe('#f6f7f8')
    // and through updateOptions on a dark chart
    await mount(page, { theme: { mode: 'dark' } })
    await update(page, { chart: { foreColor: '#373d3f' } })
    expect((await read(page)).labelFill).toBe('#373d3f')
  })
})
