/**
 * User callbacks that are handed the chart instance.
 *
 * Two demos threw "Cannot read properties of undefined (reading 'w')" once the
 * modules stopped holding the chart:
 *
 * 1. `tooltip.custom` lost `opts.ctx`, which the timeline demo reads as
 *    `opts.ctx.w` on every hover.
 * 2. `chart.events.animationEnd(chart, opts)` got `undefined` for the chart on
 *    every renderer that builds its Animations from `w` alone (line, area,
 *    pie, heatmap, ...). The realtime dashboard reads `chartCtx.w` in its line
 *    chart's handler, on load and after every update.
 */

import { test, expect } from '../fixtures/base.js'

const umdPath = 'dist/apexcharts.js'

// The demos pull fonts, CSS and helper libraries off CDNs that the code under
// test never needs; keep the run hermetic.
async function blockNetwork(page) {
  await page.route(/^https?:\/\//, (route) => route.abort())
}

test.describe('tooltip.custom gets the chart as opts.ctx', () => {
  test('timeline demo: every bar shows its custom tooltip', async ({
    page,
    loadChart,
  }) => {
    await blockNetwork(page)
    await loadChart('timelines', 'multi-series-group-rows')

    const bars = page.locator('.apexcharts-rangebar-area')
    const count = await bars.count()
    expect(count).toBe(15)

    const seen = []
    for (let k = 0; k < count; k++) {
      await bars.nth(k).hover({ force: true })
      await page.waitForTimeout(40)
      seen.push(
        await page.evaluate(() => {
          const tt = document.querySelector('.apexcharts-tooltip-rangebar')
          return tt ? tt.textContent.replace(/\s+/g, ' ').trim() : ''
        }),
      )
    }

    // The custom markup rendered for every bar (an empty string means the
    // custom function threw before returning).
    expect(seen.filter((s) => !s)).toEqual([])
    // John Adams' presidency: name from w.config.series, years from y1/y2.
    expect(seen).toContain('John Adams President 1797 - 1801')
    // loadChart's afterEach fails the test on any page error.
  })
})

test.describe('animationEnd gets the chart as its first argument', () => {
  const cases = {
    line: `{ series: [{ data: [3, 5, 2, 6] }, { data: [1, 4, 3, 2] }] }`,
    area: `{ series: [{ data: [3, 5, 2, 6] }] }`,
    rangeArea: `{ series: [{ data: [{ x: 'a', y: [1, 3] }, { x: 'b', y: [2, 5] }] }] }`,
    scatter: `{ series: [{ data: [[1, 2], [2, 4], [3, 3]] }] }`,
    pie: `{ series: [44, 55, 13], labels: ['a', 'b', 'c'] }`,
    donut: `{ series: [44, 55, 13], labels: ['a', 'b', 'c'] }`,
    radialBar: `{ series: [44, 55] }`,
    polarArea: `{ series: [44, 55, 13] }`,
    radar: `{ series: [{ data: [3, 5, 2, 6] }], labels: ['a', 'b', 'c', 'd'] }`,
    heatmap: `{ series: [{ name: 'r', data: [{ x: 'a', y: 1 }, { x: 'b', y: 5 }] }] }`,
    treemap: `{ series: [{ data: [{ x: 'a', y: 3 }, { x: 'b', y: 5 }] }] }`,
    bar: `{ series: [{ data: [3, 5, 2, 6] }] }`,
  }

  for (const [type, src] of Object.entries(cases)) {
    test(type, async ({ page }) => {
      const errors = []
      page.on('pageerror', (err) => errors.push(err.message))
      await page.setContent('<div id="stage" style="width:600px"></div>')
      await page.addScriptTag({ path: umdPath })

      const got = await page.evaluate(
        async ({ type, src }) => {
          const opts = eval(`(${src})`)
          let resolveEnd
          const ended = new Promise((r) => (resolveEnd = r))
          opts.chart = {
            type,
            height: 300,
            animations: { enabled: true, speed: 200 },
            events: {
              animationEnd: (chartCtx, o) =>
                resolveEnd({
                  isChart: chartCtx === window.chart,
                  hasW: !!(chartCtx && chartCtx.w === o.w),
                }),
            },
          }
          window.chart = new window.ApexCharts(
            document.querySelector('#stage'),
            opts,
          )
          await window.chart.render()
          return Promise.race([
            ended,
            new Promise((r) =>
              setTimeout(() => r('animationEnd never fired'), 5000),
            ),
          ])
        },
        { type, src },
      )

      expect(got).toEqual({ isChart: true, hasW: true })
      expect(errors).toEqual([])
    })
  }
})

test.describe('realtime dashboard', () => {
  test('the animationEnd loop runs without page errors', async ({ page }) => {
    const errors = []
    page.on('pageerror', (err) => errors.push(err.message))
    await blockNetwork(page)
    await page.goto(
      new URL(
        '../../../samples/vanilla-js/dashboards/realtime/index.html',
        import.meta.url,
      ).href,
    )

    // The line chart's handler trims the first point 300ms after each
    // animation ends; that only happens when it was handed a usable chart.
    await page.waitForFunction(
      () =>
        window.chartLine &&
        window.chartLine.w.config.series[0].data.length === 11,
      null,
      { timeout: 5_000 },
    )

    // Then through one 3s interval tick: the update appends a point, animates,
    // and the handler runs again.
    await page.waitForFunction(
      () => window.chartLine.w.config.series[0].data.length === 12,
      null,
      { timeout: 5_000 },
    )
    await page.waitForFunction(
      () => window.chartLine.w.config.series[0].data.length === 11,
      null,
      { timeout: 5_000 },
    )

    expect(errors).toEqual([])
  })
})
