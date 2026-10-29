/**
 * react-apexcharts#751: the host element's min-height is the user's.
 *
 * Core used to reserve the chart's height on the host as an inline
 * min-height. That overrode any min-height the user gave the host (a style
 * prop, or a class, since inline outranks the stylesheet) while the chart was
 * mounted, and destroy() then wrote `unset` over it, so React StrictMode,
 * Vue's refresh() and any destroy + new ApexCharts(sameEl) built the next
 * chart in a host with no minimum. The reservation now lives on the chart's
 * own wrapper (.apexcharts-canvas) and the host is never written to.
 *
 * What must not change for everyone else: the host is still the chart's
 * height plus parentHeightOffset, a destroyed chart leaves no height behind
 * (#1654), and updates do not move the page. All checked with real layout,
 * which jsdom cannot give.
 */

import { test, expect } from '@playwright/test'
import { BUNDLE } from '../helpers/frames.js'

const PAGE = `<!doctype html><html><head><style>
  body { margin: 0; font-family: sans-serif; }
  .chart { min-height: 360px; }
  .parent { width: 600px; }
  .col { display: flex; flex-direction: column; height: 200px; width: 600px; }
  .col > .shrink { min-height: 0; overflow: hidden; flex: 1; }
</style></head><body>
  <div class="parent"><div id="by-class" class="chart"></div></div>
  <div class="parent"><div id="by-style" style="min-height: 360px"></div></div>
  <div class="parent"><div id="bare"></div></div>
  <div class="parent"><div id="small" style="min-height: 100px"></div></div>
  <div class="col"><div id="flex" class="shrink"></div></div>
</body></html>`

const line = (height, chart = {}) => ({
  chart: { type: 'line', height, animations: { enabled: false }, ...chart },
  series: [{ name: 'a', data: [3, 1, 4, 1, 5, 9, 2, 6] }],
})

async function open(page, css = '') {
  await page.setContent(css ? PAGE.replace('</style>', `${css}</style>`) : PAGE)
  await page.addScriptTag({ path: BUNDLE })
}

/**
 * Runs `steps` in the page: 'render' (a new chart from `opts` on the host),
 * 'update', 'destroy', 'restyle:<value>' (what a framework does when the
 * style prop changes) or 'measure'. Returns one measurement per 'measure'.
 */
function run(page, id, opts, steps) {
  return page.evaluate(
    async ({ id, opts, steps }) => {
      const el = document.getElementById(id)
      const out = []
      let chart = null
      for (const step of steps) {
        if (step === 'render') {
          chart = new window.ApexCharts(el, opts)
          await chart.render()
        } else if (step === 'destroy') {
          chart.destroy()
          chart = null
        } else if (step === 'update') {
          await chart.updateOptions({ chart: { height: 220 } }, false, false)
        } else if (step.startsWith('restyle:')) {
          el.style.minHeight = step.slice('restyle:'.length)
        } else {
          const svg = el.querySelector('svg.apexcharts-svg')
          out.push({
            inline: el.style.minHeight,
            hostH: Math.round(el.getBoundingClientRect().height),
            svgH: svg ? Math.round(svg.getBoundingClientRect().height) : null,
            gl: chart ? chart.w.globals.svgHeight : null,
          })
        }
      }
      return out
    },
    { id, opts, steps },
  )
}

test.describe('the host min-height is the user\'s (#751)', () => {
  test('a bare host is still the chart height plus parentHeightOffset', async ({ page }) => {
    await open(page)
    const [m] = await run(page, 'bare', line(300), ['render', 'measure', 'destroy'])
    expect(m.inline).toBe('')
    expect(m.hostH).toBe(m.svgH + 15)

    const [flush] = await run(page, 'bare', line(300, { parentHeightOffset: 0 }), [
      'render', 'measure', 'destroy',
    ])
    expect(flush.hostH).toBe(flush.svgH)
  })

  test('a global box-sizing: border-box does not eat the gap', async ({ page }) => {
    // What utility-first CSS resets put on every element.
    await open(page, '*, ::before, ::after { box-sizing: border-box; }')
    const [m] = await run(page, 'bare', line(300), ['render', 'measure', 'destroy'])
    expect(m.hostH).toBe(m.svgH + 15)
  })

  for (const id of ['by-class', 'by-style']) {
    test(`a fixed-height chart respects a ${id} 360px minimum while mounted`, async ({ page }) => {
      await open(page)
      const [mounted, destroyed] = await run(page, id, line(200), [
        'render', 'measure', 'destroy', 'measure',
      ])
      expect(mounted.hostH).toBe(360)
      expect(mounted.svgH).toBe(200)
      expect(destroyed.hostH).toBe(360)
      expect(destroyed.inline).toBe(id === 'by-style' ? '360px' : '')
    })

    test(`'100%' chart keeps a ${id} 360px minimum across destroy + re-create`, async ({ page }) => {
      await open(page)
      const [first, destroyed, second] = await run(page, id, line('100%'), [
        'render', 'measure', 'destroy', 'measure', 'render', 'measure',
      ])
      expect(first.svgH).toBe(360)
      expect(destroyed.hostH).toBe(360)
      expect(second.svgH).toBe(360)
    })
  }

  test('a minimum smaller than the chart leaves the chart its reserved height', async ({ page }) => {
    await open(page)
    const [m] = await run(page, 'small', line(300), ['render', 'measure', 'destroy'])
    expect(m.hostH).toBe(m.svgH + 15)
    expect(m.inline).toBe('100px')
  })

  test('a flex layout may shrink the host below the chart (vue3-apexcharts#52)', async ({ page }) => {
    await open(page)
    const [m] = await run(page, 'flex', line(300), ['render', 'measure', 'destroy'])
    // `min-height: 0; overflow: hidden` in a 200px column: the user's CSS wins.
    expect(m.hostH).toBe(200)
    expect(m.inline).toBe('')
  })

  test('a minimum the app changes while mounted is applied at once and kept', async ({ page }) => {
    await open(page)
    const [changed, updated, destroyed] = await run(page, 'by-style', line(200), [
      'render', 'restyle:420px', 'measure', 'update', 'measure', 'destroy', 'measure',
    ])
    expect(changed.hostH).toBe(420)
    expect(updated.hostH).toBe(420)
    expect(destroyed.inline).toBe('420px')
  })

  test('a refresh loop (destroy + new, five times) never loses the minimum', async ({ page }) => {
    await open(page)
    const steps = ['render', 'measure']
    for (let i = 0; i < 5; i++) steps.push('destroy', 'render', 'measure')
    const all = await run(page, 'by-class', line('100%'), steps)
    expect(all.map((m) => m.svgH)).toEqual([360, 360, 360, 360, 360, 360])
  })

  test('#1654: a destroyed chart leaves no height behind', async ({ page }) => {
    await open(page)
    const pie = {
      chart: { type: 'pie', animations: { enabled: false } },
      series: [44, 55, 13],
      labels: ['A', 'B', 'C'],
    }
    const gauge = {
      chart: { type: 'radialBar', height: 300, animations: { enabled: false } },
      plotOptions: { radialBar: { startAngle: -90, endAngle: 90 } },
      series: [67],
    }
    for (const opts of [line(300), pie, gauge]) {
      const [mounted, destroyed] = await run(page, 'bare', opts, [
        'render', 'measure', 'destroy', 'measure',
      ])
      expect(mounted.hostH).toBeGreaterThan(0)
      expect(destroyed.hostH).toBe(0)
      expect(destroyed.inline).toBe('')
    }
  })

  test('updates and resizes never move a page scrolled to the chart', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 600 })
    await page.setContent(
      '<body style="margin:0"><div style="height:1500px"></div><div id="c"></div><div style="height:40px"></div></body>',
    )
    await page.addScriptTag({ path: BUNDLE })
    const r = await page.evaluate(async () => {
      const el = document.getElementById('c')
      const chart = new window.ApexCharts(el, {
        chart: { type: 'line', height: 350 },
        series: [{ name: 'a', data: [3, 1, 4, 1, 5, 9, 2, 6] }],
      })
      await chart.render()
      window.scrollTo(0, document.documentElement.scrollHeight)
      const start = window.scrollY
      const frames = () =>
        new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)))
      const ys = []
      await chart.updateOptions({ colors: ['#08f'] }, true)
      await frames()
      ys.push(window.scrollY)
      await chart.updateOptions({ colors: ['#0a5'] })
      await frames()
      ys.push(window.scrollY)
      await chart.updateSeries([{ name: 'a', data: [5, 2, 7, 3, 8, 1, 4, 6] }])
      await frames()
      ys.push(window.scrollY)
      el.style.width = '700px'
      await new Promise((res) => setTimeout(res, 400))
      ys.push(window.scrollY)
      return { start, ys }
    })
    expect(r.start).toBeGreaterThan(1000)
    expect(r.ys).toEqual([r.start, r.start, r.start, r.start])
  })
})
