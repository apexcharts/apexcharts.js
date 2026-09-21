/**
 * Reduced motion: the CSS half of the policy.
 *
 * `chart.animations.respectReducedMotion` used to govern only the JS tweens.
 * The stylesheet carried its own unconditional
 * `@media (prefers-reduced-motion: reduce)` block flattening every duration
 * inside `.apexcharts-canvas` to 0.01ms with `!important`, and no JS flag can
 * reach a stylesheet. So `respectReducedMotion: false` half worked: the mount
 * and update tweens came back while everything CSS-driven (the pie
 * slice-offset slide, the drilldown spinner, the tooltip and crosshair fades)
 * stayed frozen, and the only way out was to out-specify an `!important` rule
 * from the page.
 *
 * The block is now scoped `:not(.apexcharts-ignore-reduced-motion)`, and
 * Core.setupElements puts that class on the canvas when the option is false.
 *
 * These assertions are all on COMPUTED style rather than the inline value the
 * library writes. That distinction is the whole bug: the library was already
 * setting `transition: transform 320ms` on the slice and the browser was
 * throwing it away, so a test that read `node.style` passed throughout.
 */

import { test } from '../fixtures/base.js'
import { expect } from '@playwright/test'

/**
 * Build a pie in the page and pull a slice out, returning the computed
 * transition duration of every element that moves with it.
 *
 * @param {import('@playwright/test').Page} page
 * @param {boolean|undefined} respectReducedMotion undefined leaves it at default
 */
async function offsetSliceDurations(page, respectReducedMotion) {
  return page.evaluate(async (respect) => {
    const el = document.createElement('div')
    el.style.cssText = 'width:420px;height:320px'
    document.body.appendChild(el)

    const animations = { speed: 800 }
    if (respect !== undefined) animations.respectReducedMotion = respect

    const chart = new ApexCharts(el, {
      chart: { type: 'pie', height: 320, animations },
      series: [30, 40, 20, 10],
      labels: ['w', 'x', 'y', 'z'],
    })
    await chart.render()
    chart.ctx.pie.offsetSlice(1, 10, true)

    const movers = chart.ctx.pie.getSliceMovers(1)
    return {
      optedOut: el
        .querySelector('.apexcharts-canvas')
        .classList.contains('apexcharts-ignore-reduced-motion'),
      moverCount: movers.length,
      allTagged: movers.every((m) =>
        m.classList.contains('apexcharts-slice-mover'),
      ),
      // Computed, not inline: the inline value was always correct.
      durations: movers.map((m) => getComputedStyle(m).transitionDuration),
    }
  }, respectReducedMotion)
}

/** A duration the browser has flattened, in the units it reports them. */
const FLAT = '1e-05s'

test.describe('Reduced motion', () => {
  test('default: the slice-offset slide is flattened under the preference', async ({
    page,
    loadChart,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await loadChart('pie', 'simple-pie')

    const r = await offsetSliceDurations(page, undefined)

    expect(r.optedOut).toBe(false)
    expect(r.durations.length).toBeGreaterThan(1)
    for (const d of r.durations) expect(d).toBe(FLAT)
  })

  test('respectReducedMotion:false restores the slide, CSS included', async ({
    page,
    loadChart,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await loadChart('pie', 'simple-pie')

    const r = await offsetSliceDurations(page, false)

    expect(r.optedOut).toBe(true)
    // Every mover, not just the arc: the labels used to be left behind.
    expect(r.durations.length).toBeGreaterThan(1)
    for (const d of r.durations) expect(d).not.toBe(FLAT)
  })

  test('every element that moves with a slice carries the shared class', async ({
    page,
    loadChart,
  }) => {
    await loadChart('pie', 'simple-pie')

    const r = await offsetSliceDurations(page, undefined)

    expect(r.moverCount).toBeGreaterThan(1)
    expect(r.allTagged).toBe(true)
  })

  test('the shared hover band drops the class when it retargets', async ({
    page,
    loadChart,
  }) => {
    await loadChart('pie', 'simple-pie')

    const r = await page.evaluate(async () => {
      const el = document.createElement('div')
      el.style.cssText = 'width:420px;height:320px'
      document.body.appendChild(el)

      // A page rule on the hook, which is the whole reason the hook exists.
      const style = document.createElement('style')
      style.textContent =
        '.apexcharts-slice-mover { transition: transform 300ms ease; }'
      document.head.appendChild(style)

      const chart = new ApexCharts(el, {
        chart: { type: 'pie', height: 320 },
        series: [30, 40, 20, 10],
        labels: ['w', 'x', 'y', 'z'],
        plotOptions: { pie: { hoverOutline: { show: true } } },
      })
      await chart.render()
      const pie = chart.ctx.pie

      // Hover slice 1 and click it out. The band is travelling with slice 1,
      // so it is a mover and takes the class.
      pie.showHoverOutline(1)
      pie.offsetSlice(1, 10, true)
      const band = pie.elHoverOutlinePath.node
      const taggedWhileMoving = band.classList.contains('apexcharts-slice-mover')

      // Sweep the hover to slice 3. Unlike the labels, this is ONE node
      // re-plotted per slice, so the class has to come off when it retargets.
      pie.showHoverOutline(3)
      return {
        taggedWhileMoving,
        taggedAfterRetarget: band.classList.contains('apexcharts-slice-mover'),
        durationAfterRetarget: getComputedStyle(band).transitionDuration,
      }
    })

    expect(r.taggedWhileMoving).toBe(true)
    expect(r.taggedAfterRetarget).toBe(false)
    // Clearing the inline transition cannot cancel a stylesheet, so a stale
    // class here would slide the band across the pie behind the cursor
    // instead of letting it jump to the newly hovered slice.
    expect(r.durationAfterRetarget).toBe('0s')
  })

  test('the drilldown spinner pulses instead of being flattened to nothing', async ({
    page,
    loadChart,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await loadChart('pie', 'simple-pie')

    const spinner = await page.evaluate(async () => {
      const el = document.createElement('div')
      el.style.cssText = 'width:420px;height:320px'
      document.body.appendChild(el)
      const chart = new ApexCharts(el, {
        chart: { type: 'pie', height: 320 },
        series: [30, 40, 20, 10],
        labels: ['w', 'x', 'y', 'z'],
        drilldown: {
          enabled: true,
          series: [{ id: 'w', data: [{ x: 'a', y: 1 }] }],
        },
      })
      await chart.render()

      // Mounted through the real overlay, never a hand-built div. Both the
      // blanket rule and the pulse below it are scoped to .apexcharts-canvas,
      // so they only reach the spinner because DrilldownLoading appends into
      // elWrap. Portal the overlay out of there (a fullscreen host, say) and
      // the pulse silently stops matching; this is what notices.
      chart.ctx.drilldown.loading.show()

      const sp = el.querySelector('.apexcharts-drilldown-loading-spinner')
      const cs = getComputedStyle(sp)
      return {
        insideCanvas: !!sp.closest('.apexcharts-canvas'),
        name: cs.animationName,
        duration: cs.animationDuration,
        iterations: cs.animationIterationCount,
      }
    })

    expect(spinner.insideCanvas).toBe(true)
    // The opacity pulse is the reduced-motion fallback for the spin. It was
    // written but never ran: the blanket rule flattened it to one 0.01ms pass.
    expect(spinner.name).toBe('apexcharts-drilldown-pulse')
    expect(spinner.duration).not.toBe(FLAT)
    expect(spinner.iterations).toBe('infinite')
  })
})
