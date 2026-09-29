/**
 * Axis labels: no native browser tooltip on a label you can already read.
 *
 * Every axis label used to carry an SVG `<title>` holding its full text. On a
 * label drawn in full that is an exact copy of what is on screen, so the
 * browser raised a native tooltip repeating the visible text, with no way to
 * turn it off (issue #5318). It also took over the `<text>`'s accessible name,
 * which the text content supplies by itself.
 *
 * The `<title>` earns its place in exactly one case (issue #2281): the label
 * was shortened to fit and hovering is the only way back to the full text.
 * These tests pin both halves.
 */

import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const BUNDLE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../dist/apexcharts.js',
)

const LONG = 'A very long category label indeed'
const LONGER = 'Another extremely long one here'

/** Render a chart on a bare page and wait for its axis labels. */
async function render(page, options) {
  await page.setContent('<div id="chart" style="width:600px"></div>')
  await page.addScriptTag({ path: BUNDLE })
  await page.evaluate((opts) => {
    window.chart = new window.ApexCharts(
      document.querySelector('#chart'),
      opts,
    )
    return window.chart.render()
  }, options)
  await page.waitForSelector('.apexcharts-xaxis-label, .apexcharts-yaxis-label')
}

/** Each axis label as { drawn, title }, with the title excluded from `drawn`. */
async function readLabels(page, selector) {
  return page.evaluate((sel) => {
    return [...document.querySelectorAll(sel)].map((el) => {
      const title = el.querySelector('title')
      const clone = el.cloneNode(true)
      clone.querySelectorAll('title').forEach((n) => n.remove())
      return { drawn: clone.textContent, title: title?.textContent ?? null }
    })
  }, selector)
}

test.describe('Axis label titles', () => {
  test('a label drawn in full carries no <title>', async ({ page }) => {
    await render(page, {
      chart: { type: 'bar', height: 320, animations: { enabled: false } },
      series: [{ name: 's', data: [10, 20, 30, 40] }],
      xaxis: { categories: ['Jan', 'Feb', LONG, 'Apr'] },
    })

    const x = await readLabels(page, '.apexcharts-xaxis-label')
    const y = await readLabels(page, '.apexcharts-yaxis-label')

    expect(x.length).toBeGreaterThan(0)
    expect(y.length).toBeGreaterThan(0)

    for (const label of [...x, ...y]) {
      expect(
        label.title,
        `"${label.drawn}" fits, so it needs no hover text`,
      ).toBeNull()
    }
  })

  test('a shortened x-axis label keeps its full text on hover', async ({
    page,
  }) => {
    await render(page, {
      chart: { type: 'bar', height: 320, animations: { enabled: false } },
      series: [{ name: 's', data: [10, 20, 30] }],
      xaxis: {
        categories: [LONG, LONGER, 'Short'],
        labels: { rotate: 0, maxWidth: 60, trim: true },
      },
    })

    const x = await readLabels(page, '.apexcharts-xaxis-label')

    expect(x[0].drawn).toContain('...')
    expect(x[0].title).toBe(LONG)
    expect(x[1].drawn).toContain('...')
    expect(x[1].title).toBe(LONGER)

    // The one that fits is left alone even though its neighbours were cut.
    expect(x[2].drawn).toBe('Short')
    expect(x[2].title).toBeNull()
  })

  test('a shortened y-axis label keeps its full text on hover', async ({
    page,
  }) => {
    await render(page, {
      chart: { type: 'bar', height: 320, animations: { enabled: false } },
      plotOptions: { bar: { horizontal: true } },
      series: [{ name: 's', data: [10, 20, 30] }],
      xaxis: { categories: [LONG, 'Short', 'Mid length one'] },
      yaxis: { labels: { maxWidth: 70 } },
    })

    const y = await readLabels(page, '.apexcharts-yaxis-label')
    const cut = y.filter((label) => label.drawn.endsWith('...'))
    const whole = y.filter((label) => !label.drawn.endsWith('...'))

    expect(cut.length).toBeGreaterThan(0)
    for (const label of cut) {
      expect(label.title, `"${label.drawn}" was cut short`).not.toBeNull()
      expect(label.title.length).toBeGreaterThan(label.drawn.length)
    }
    for (const label of whole) {
      expect(label.title, `"${label.drawn}" fits`).toBeNull()
    }
  })

  test('a multiline label shows both lines, so it needs no <title>', async ({
    page,
  }) => {
    await render(page, {
      chart: { type: 'bar', height: 320, animations: { enabled: false } },
      series: [{ name: 's', data: [10, 20, 30] }],
      xaxis: { categories: [['Line one', 'Line two'], 'Feb', 'Mar'] },
    })

    const x = await readLabels(page, '.apexcharts-xaxis-label')

    expect(x[0].drawn).toContain('Line one')
    expect(x[0].drawn).toContain('Line two')
    expect(x[0].title).toBeNull()
  })
})
