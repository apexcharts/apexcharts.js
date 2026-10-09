/**
 * A 3D funnel's connector shadows across an update.
 *
 * Every render hid the shadow group and revealed it once the stages had
 * landed, so on an update the shadows vanished on frame 0 and faded back in
 * about 350 ms later, on top of stages already at rest. They now morph with
 * the stages they join, from the shadows on screen:
 *   - frame 0 is the funnel as it was, shadows included
 *   - each shadow's lower edge rides its own stage's top on every frame
 *   - the update lands on the shadows a fresh render draws
 */

import { test, expect } from '@playwright/test'
import { loadSample, recordTransition } from '../helpers/frames.js'
import { advance } from '../helpers/virtual-time.js'

const NEXT = [1300, 1180, 900, 940, 700, 580, 300, 240]

/** The shadow group's opacity, each shadow's corners and each stage's box. */
function funnelState() {
  const root = document.querySelector('#chart')
  const g = root.querySelector('.apexcharts-bar-shadows')
  const nums = (d) => (d.match(/-?\d+(\.\d+)?/g) || []).map(Number)
  return {
    shown: g ? parseFloat(getComputedStyle(g).opacity) : null,
    shadows: [...root.querySelectorAll('.apexcharts-bar-shadow')].map((n) =>
      nums(n.getAttribute('d') || ''),
    ),
    stages: [...root.querySelectorAll('.apexcharts-bar-area')].map((n) => {
      const b = n.getBBox()
      return [b.x, b.y, b.x + b.width, b.y + b.height]
    }),
  }
}

const near = (a, b, tol = 0.75) =>
  a.length === b.length && a.every((v, k) => Math.abs(v - b[k]) <= tol)

test.describe('Funnel shadows on an update', () => {
  test('stay on screen from frame 0 and ride their stages to the new shape', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'funnel', 'funnel')
    const before = await page.evaluate(funnelState)
    expect(before.shown).toBe(1)
    expect(before.shadows.length).toBe(7)
    const rec = await recordTransition(
      page,
      () =>
        page.evaluate(
          (d) =>
            window.chart.updateSeries([{ name: 'Funnel Series', data: d }]),
          NEXT,
        ),
      { probe: funnelState, ms: 1200 },
    )
    // frame 0: the shadows as they were, shown (they used to vanish here and
    // fade back in once the stages had landed)
    const f0 = rec.probes[0]
    expect(f0.shown).toBe(1)
    f0.shadows.forEach((s, k) =>
      expect(near(s, before.shadows[k], 0.01)).toBe(true),
    )
    rec.probes.forEach((f, n) => {
      expect(f.shown, `frame ${n}`).toBe(1)
      // a shadow's lower edge (its 3rd and 4th corners) is its stage's top:
      // y on the stage's top, x on its ends (shadow j joins stage j + 1)
      f.shadows.forEach((s, k) => {
        const st = f.stages[k + 1]
        if (!st) return
        const [, , , , x2, y2, x1, y1] = s
        expect(Math.abs(y1 - st[1]), `frame ${n} shadow ${k}`).toBeLessThan(1)
        expect(Math.abs(y2 - st[1])).toBeLessThan(1)
        expect(Math.min(x1, x2)).toBeGreaterThan(st[0] - 1)
        expect(Math.max(x1, x2)).toBeLessThan(st[2] + 1)
      })
    })
    // at rest: the shadows of a funnel drawn with the new data
    await advance(page, 2000)
    const landed = await page.evaluate(funnelState)
    const fresh = await page.evaluate(async (d) => {
      const host = document.createElement('div')
      host.style.width = document.querySelector('#chart').offsetWidth + 'px'
      document.body.appendChild(host)
      const o = window.__frameLib.clone(window.__opts0)
      o.series = [{ name: 'Funnel Series', data: d }]
      o.chart = { ...o.chart, animations: { enabled: false } }
      const c = new window.ApexCharts(host, o)
      await c.render()
      await window.__vt.advance(500)
      const out = [...host.querySelectorAll('.apexcharts-bar-shadow')].map(
        (n) => (n.getAttribute('d').match(/-?\d+(\.\d+)?/g) || []).map(Number),
      )
      c.destroy()
      host.remove()
      return out
    }, NEXT)
    expect(landed.shadows.length).toBe(fresh.length)
    landed.shadows.forEach((s, k) => expect(near(s, fresh[k], 0.01)).toBe(true))
    expect(errors).toEqual([])
  })
})
