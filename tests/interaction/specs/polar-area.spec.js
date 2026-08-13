/**
 * polarArea: slots and update motion.
 *
 * polarArea is the one pie-family type whose angles are COUNT-based (value is
 * the radius), which broke it in two places the value-proportional pie logic
 * handles for free:
 *
 *  - a legend-collapsed series kept its 1/N slot and drew nothing in it, so
 *    the chart rendered with a dead gap (pie collapses to a 0-value slice,
 *    whose proportional angle is 0, and re-spans by construction);
 *  - a data-change animation reconstructed "previous angles" proportionally
 *    from the previous VALUES, fabricating positions that never existed, and
 *    the radius snapped to its final size instead of animating: slices
 *    appeared to start their update from the wrong place.
 *
 * These pin the fixed behaviour: hidden slices give their slot back (animated,
 * not teleported), and an update sweeps each slice's radius in place.
 */

import { test } from '../fixtures/base.js'
import { expect } from '@playwright/test'

const MAKE = `async (series) => {
  document.body.innerHTML = '<div id="probe" style="width:640px"></div>'
  const chart = new window.ApexCharts(document.querySelector('#probe'), {
    chart: { id: 'probe', type: 'polarArea', height: 420 },
    series,
    labels: series.map((_, k) => 'S' + (k + 1)),
    legend: { show: true },
    stroke: { width: 1 },
  })
  await chart.render()
  await new Promise((res) => setTimeout(res, 900))
  return chart
}`

/**
 * Page-space centre (from a grid ring) + each slice's start-edge angle and
 * radius, measured off the live 'd' via getScreenCTM, so transforms cannot
 * lie. Angle is degrees clockwise from 12 o'clock, like the chart's own.
 */
const MEASURE = `() => {
  const ring = document.querySelector('#probe circle[fill="none"]')
  const rb = ring.getBoundingClientRect()
  const cx = rb.x + rb.width / 2
  const cy = rb.y + rb.height / 2
  return [...document.querySelectorAll('#probe .apexcharts-pie-area')].map((p) => {
    const m = (p.getAttribute('d') || '').match(/M\\s*([\\d.eE+-]+)[\\s,]+([\\d.eE+-]+)/)
    if (!m) return null
    const pt = new DOMPoint(+m[1], +m[2]).matrixTransform(p.getScreenCTM())
    const dx = pt.x - cx
    const dy = pt.y - cy
    return {
      angle: ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360,
      r: Math.hypot(dx, dy),
      declaredAngle: +p.getAttribute('data:angle'),
    }
  })
}`

test.describe('polarArea slots', () => {
  test('a hidden series gives its slot back, animated, and reclaims it', async ({
    page,
    loadChart,
  }) => {
    await loadChart('polarArea', 'basic-polar-area')

    const r = await page.evaluate(
      async ([mk]) => {
        const make = eval(mk)
        await make([42, 47, 15, 30, 20])

        const anglesOf = () =>
          [...document.querySelectorAll('#probe .apexcharts-pie-area')].map(
            (p) => +p.getAttribute('data:angle'),
          )
        const before = anglesOf()

        // The user's path: the legend item, not the API.
        document
          .querySelector('#probe .apexcharts-legend-series[rel="2"]')
          .click()

        // Mid-flight: the survivors must be SWEEPING from 72 toward 90,
        // not teleporting.
        await new Promise((res) => setTimeout(res, 120))
        const midD = [
          ...document.querySelectorAll('#probe .apexcharts-pie-area'),
        ].map((p) => p.getAttribute('d'))

        await new Promise((res) => setTimeout(res, 1000))
        const hidden = anglesOf()
        const gapSum = hidden.reduce((a, b) => a + b, 0)
        const settledD = [
          ...document.querySelectorAll('#probe .apexcharts-pie-area'),
        ].map((p) => p.getAttribute('d'))
        const sweeping = midD.filter((d, k) => d !== settledD[k]).length

        document
          .querySelector('#probe .apexcharts-legend-series[rel="2"]')
          .click()
        await new Promise((res) => setTimeout(res, 1100))
        const restored = anglesOf()

        return { before, hidden, gapSum, restored, sweeping }
      },
      [MAKE],
    )

    // The re-span is animated: mid-flight geometry differs from the settled
    // geometry (a teleport would land on the final paths immediately).
    expect(r.sweeping).toBeGreaterThan(2)

    // Five equal slots before.
    r.before.forEach((a) => expect(a).toBeCloseTo(72, 1))
    // Hidden slice owns nothing; the four survivors re-span the full circle.
    expect(r.hidden[1]).toBe(0)
    ;[0, 2, 3, 4].forEach((i) => expect(r.hidden[i]).toBeCloseTo(90, 1))
    expect(r.gapSum).toBeCloseTo(360, 1)
    // And back.
    r.restored.forEach((a) => expect(a).toBeCloseTo(72, 1))
  })

  test('an update animates every slice in place: radius sweeps, angles hold', async ({
    page,
    loadChart,
  }) => {
    await loadChart('polarArea', 'basic-polar-area')

    const r = await page.evaluate(
      async ([mk, measure]) => {
        const make = eval(mk)
        const measureNow = eval(measure)
        const chart = await make([10, 25, 16, 8, 20])
        const before = measureNow()

        chart.updateSeries([25, 5, 16, 24, 10])
        // Mid-flight (dynamicAnimation.speed default 350ms).
        await new Promise((res) => setTimeout(res, 120))
        const mid = measureNow()

        await new Promise((res) => setTimeout(res, 900))
        const after = measureNow()

        return { before, mid, after }
      },
      [MAKE, MEASURE],
    )

    expect(r.before.length).toBe(5)
    for (let i = 0; i < 5; i++) {
      const b = r.before[i]
      const m = r.mid[i]
      const a = r.after[i]
      // The slice never leaves its slot: the start edge holds through the
      // whole update. Before the fix, previous angles were fabricated
      // proportionally from the values and slices swept in from positions
      // that never existed.
      const angDelta = Math.min(
        Math.abs(m.angle - b.angle),
        360 - Math.abs(m.angle - b.angle),
      )
      expect(angDelta).toBeLessThan(2)

      // The radius is the value channel and must animate: mid-flight it sits
      // strictly between the old and the new size wherever the value moved.
      // Before the fix it snapped to the final size on the first frame.
      if (Math.abs(a.r - b.r) > 8) {
        expect(Math.abs(m.r - a.r)).toBeGreaterThan(2)
        const lo = Math.min(b.r, a.r) - 1
        const hi = Math.max(b.r, a.r) + 1
        expect(m.r).toBeGreaterThan(lo)
        expect(m.r).toBeLessThan(hi)
      }
    }
  })
})
