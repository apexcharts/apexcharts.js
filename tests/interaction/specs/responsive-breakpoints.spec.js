/**
 * #5347: a `responsive` breakpoint's options stayed applied after the viewport
 * left the breakpoint. Since 5.10.4 a resize redraw re-derived the config from
 * the live one, which still held the breakpoint, and an updateOptions() made
 * while narrow copied the breakpoint into the initial config for good.
 *
 * A breakpoint is now a layer: applying it records what each path it writes
 * held, and leaving it writes those values back, nothing more. These run the
 * real window resize (debounced handler, resize signature, redraw) because that
 * is the path that regressed; the unit suite covers the rest of the matrix.
 */

import { test as base, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const distPath = resolve(rootDir, 'dist', 'apexcharts.js')

const test = base.extend({
  /** Renders a chart at `width`, returns helpers to resize and read state. */
  donut: async ({ page }, use) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))

    const open = async (width, responsive) => {
      await page.setViewportSize({ width, height: 700 })
      await page.setContent('<div id="chart"></div>')
      await page.addScriptTag({ path: distPath })
      await page.evaluate((responsive) => {
        window.chart = new window.ApexCharts(document.querySelector('#chart'), {
          chart: { type: 'donut', animations: { enabled: false } },
          series: [23, 42],
          labels: ['A', 'B'],
          legend: { position: 'right' },
          responsive,
        })
        return window.chart.render()
      }, responsive)
    }

    const state = () =>
      page.evaluate(() => {
        const el = document.querySelector('.apexcharts-legend')
        const cls = [...el.classList].find((c) =>
          c.startsWith('apx-legend-position-'),
        )
        const c = window.chart.w.config
        return {
          config: c.legend.position,
          rendered: cls.replace('apx-legend-position-', ''),
          dataLabels: c.dataLabels.enabled,
          title: c.title.text,
        }
      })

    /** Resizes the window and waits for the debounced redraw to land. */
    const resize = async (width) => {
      const before = await page.evaluate(
        () => document.querySelector('.apexcharts-svg').getAttribute('width'),
      )
      await page.setViewportSize({ width, height: 700 })
      await page.waitForFunction(
        (b) =>
          document.querySelector('.apexcharts-svg')?.getAttribute('width') !== b,
        before,
      )
      await page.waitForTimeout(50)
    }

    await use({ open, state, resize, page, errors })
  },
})

const ONE = [{ breakpoint: 1024, options: { legend: { position: 'bottom' } } }]

test('A: resizing out of a breakpoint restores the legend', async ({ donut }) => {
  await donut.open(1200, ONE)
  expect(await donut.state()).toMatchObject({ config: 'right', rendered: 'right' })

  await donut.resize(800)
  expect(await donut.state()).toMatchObject({ config: 'bottom', rendered: 'bottom' })

  await donut.resize(1200)
  expect(await donut.state()).toMatchObject({ config: 'right', rendered: 'right' })
  expect(donut.errors).toEqual([])
})

test('B: an updateOptions() while narrow keeps its change and drops the breakpoint', async ({ donut }) => {
  await donut.open(1200, ONE)
  await donut.resize(800)
  await donut.page.evaluate(() =>
    window.chart.updateOptions({ title: { text: 'Narrow' } }),
  )
  expect(await donut.state()).toMatchObject({ config: 'bottom', title: 'Narrow' })

  await donut.resize(1200)
  expect(await donut.state()).toMatchObject({
    config: 'right',
    rendered: 'right',
    title: 'Narrow',
  })
  expect(donut.errors).toEqual([])
})

test('E: moving into a larger breakpoint drops what only the smaller one set', async ({ donut }) => {
  await donut.open(1200, [
    { breakpoint: 1024, options: { legend: { position: 'bottom' } } },
    { breakpoint: 600, options: { dataLabels: { enabled: false } } },
  ])
  await donut.resize(500)
  expect(await donut.state()).toMatchObject({ config: 'bottom', dataLabels: false })

  await donut.resize(800)
  expect(await donut.state()).toMatchObject({ config: 'bottom', dataLabels: true })

  await donut.resize(1200)
  expect(await donut.state()).toMatchObject({ config: 'right', dataLabels: true })
  expect(donut.errors).toEqual([])
})
