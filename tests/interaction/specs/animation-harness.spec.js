/**
 * Self-tests for the animation harness (helpers/frames.js, virtual-time.js).
 *
 * Every animation spec trusts these rules to fail when a transition goes
 * wrong. A rule that silently stops firing (a selector that matches nothing,
 * a tolerance loosened in passing, a transform the snapshot cannot see) would
 * turn all of them green at once. So each rule gets a planted defect it must
 * catch, next to a clean run it must pass.
 */

import { test, expect } from '@playwright/test'
import {
  mountChart,
  recordTransition,
  toggleLegend,
  finite,
  noJump,
  noFlash,
  xStable,
  noLayoutShift,
  exitsToBaseline,
  checkAll,
  settles,
} from '../helpers/frames.js'
import { advance } from '../helpers/virtual-time.js'

const T0 = Date.UTC(2026, 8, 4)

function config({ dynamic = true } = {}) {
  return {
    chart: {
      type: 'area',
      height: 300,
      stacked: true,
      toolbar: { show: false },
      animations: { dynamicAnimation: { enabled: dynamic, speed: 350 } },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    series: ['A', 'B', 'C'].map((name, c) => ({
      name,
      data: Array.from({ length: 20 }, (_, d) => [T0 + d * 864e5, 300 + c * 50 + ((d * 37) % 90)]),
    })),
    xaxis: { type: 'datetime' },
  }
}

/**
 * Run `fn` (in the page) once, `atMs` of virtual time after the action, so a
 * defect lands mid-transition. Timers run before the frame's rAF batch.
 */
async function plantAt(page, atMs, fn) {
  await page.evaluate(
    ({ atMs, src }) => {
      setTimeout((0, eval)(`(${src})`), atMs)
    },
    { atMs, src: fn.toString() },
  )
}

/** Hide B through the legend, with `plant` scheduled into the same transition. */
async function hideB(page, plant) {
  return recordTransition(page, async () => {
    await toggleLegend(page, 'B')
    if (plant) await plant()
  })
}

test.describe('Animation harness: clean runs pass', () => {
  test('a legend toggle on a stacked area chart passes every rule', async ({ page }) => {
    const errors = await mountChart(page, config())
    const rec = await hideB(page)
    expect(checkAll(rec, { xStable: true })).toEqual([])
    expect(await settles(page, rec, { hidden: ['B'] })).toEqual([])
    expect(errors).toEqual([])
  })

  test('virtual time is deterministic: two runs record identical frames', async ({ browser }) => {
    const runs = []
    for (let r = 0; r < 2; r++) {
      const page = await browser.newPage()
      await mountChart(page, config())
      runs.push((await hideB(page)).frames)
      await page.close()
    }
    expect(JSON.stringify(runs[1])).toBe(JSON.stringify(runs[0]))
  })

  test('a rejected promise (a failed render()) is reported as a page error', async ({ page }) => {
    const errors = await mountChart(page, config())
    expect(errors).toEqual([])
    await page.evaluate(() => {
      Promise.reject(new Error('planted rejection'))
    })
    await advance(page, 16)
    await expect.poll(() => errors.join('\n')).toContain('planted rejection')
  })

  test('the mount animation does not advance on real time', async ({ page }) => {
    await mountChart(page, config(), { settleMs: 0 })
    const ended = await page.evaluate(() => window.chart.w.globals.animationEnded)
    await new Promise((r) => setTimeout(r, 300)) // real time, Node side
    expect(await page.evaluate(() => window.chart.w.globals.animationEnded)).toBe(ended)
    expect(ended).toBe(false)
    await advance(page, 4000)
    expect(await page.evaluate(() => window.chart.w.globals.animationEnded)).toBe(true)
  })
})

test.describe('Animation harness: each rule catches its defect', () => {
  test('finite: a NaN written into a path mid-transition', async ({ page }) => {
    await mountChart(page, config())
    const rec = await hideB(page, () =>
      plantAt(page, 1000, () =>
        document.querySelector('.apexcharts-series[seriesName="A"] > path').setAttribute('d', 'M NaN 0 L 10 10'),
      ),
    )
    expect(finite(rec).length).toBeGreaterThan(0)
  })

  test('noJump: a transition that snaps to its end state at frame 0', async ({ page }) => {
    await mountChart(page, config({ dynamic: false }))
    const rec = await hideB(page)
    expect(noJump(rec).length).toBeGreaterThan(0)
  })

  test('noFlash: a steady series blanked for one frame', async ({ page }) => {
    await mountChart(page, config())
    const rec = await hideB(page, async () => {
      await plantAt(page, 96, () => {
        document.querySelector('.apexcharts-series[seriesName="C"]').style.opacity = '0'
      })
      await plantAt(page, 112, () => {
        document.querySelector('.apexcharts-series[seriesName="C"]').style.opacity = ''
      })
    })
    const v = noFlash(rec)
    expect(v.length).toBe(1)
    expect(v[0]).toContain('C')
  })

  test('xStable: a series slid sideways with a transform', async ({ page }) => {
    await mountChart(page, config())
    const rec = await hideB(page, () =>
      plantAt(page, 96, () =>
        document.querySelector('.apexcharts-series[seriesName="A"]').setAttribute('transform', 'translate(-40 0)'),
      ),
    )
    const v = xStable(rec)
    expect(v.length).toBeGreaterThan(0)
    expect(v[0]).toContain('A')
  })

  test('noLayoutShift: the plot area moved in one frame', async ({ page }) => {
    await mountChart(page, config())
    const rec = await hideB(page, () =>
      plantAt(page, 96, () => {
        const g = document.querySelector('.apexcharts-graphical')
        const m = g.getCTM()
        g.setAttribute('transform', `translate(${m.e - 8}, ${m.f})`)
      }),
    )
    const v = noLayoutShift(rec)
    expect(v.length).toBe(1)
    // and the marks inside it did not "move": they are measured plot-local
    expect(xStable(rec)).toEqual([])
  })

  test('exitsToBaseline: an exit that ends off the baseline, or leaves its shape behind', async ({ page }) => {
    // Unstacked, so the hidden line flattens onto the baseline and is then
    // cleared (the clean case).
    const o = config()
    o.chart.stacked = false
    o.chart.type = 'line'
    await mountChart(page, o)
    const clean = await hideB(page)
    expect(exitsToBaseline(clean, 'B')).toEqual([])

    // Bent mid-exit and kept: the last drawn frame is off the baseline, and
    // a shape is still lying there after the exit.
    await toggleLegend(page, 'B')
    await advance(page, 4000)
    const bent = await hideB(page, () =>
      plantAt(page, 1600, () => {
        const p = document.querySelector('.apexcharts-series[seriesName="B"] path.apexcharts-line')
        p.setAttribute('d', 'M 0 10 L 300 120 L 600 10')
      }),
    )
    const v = exitsToBaseline(bent, 'B')
    expect(v.some((m) => m.includes('off the baseline'))).toBe(true)
    expect(v.some((m) => m.includes('still lying there'))).toBe(true)
  })

  test('settles: a rest state that does not match the target', async ({ page }) => {
    await mountChart(page, config())
    const rec = await hideB(page)
    // B was hidden, so a target with nothing hidden must not match.
    expect((await settles(page, rec)).length).toBeGreaterThan(0)
  })
})
