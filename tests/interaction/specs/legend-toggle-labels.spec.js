/**
 * A series toggled from the legend takes its data labels with it, out and in.
 *
 * Its marks leave over the exit (a line flattens, a bar shrinks), but a hidden
 * series draws no labels, so its labels used to vanish on the click while the
 * marks were still on their way out: on every type but a stacked column,
 * which draws its collapsing labels itself. They now ride out with their marks
 * and fade as they go (DataLabelTransition.captureExitLabels / playExitLabels),
 * and nothing is left once the exit is over. Shown again, a line or area's
 * labels used to sit at their final spot from the first frame while the line
 * rose up to them; they now rise with it, fading in.
 *
 * Measured per frame on the virtual clock: the total opacity of every label on
 * screen, and where the exiting labels are.
 */

import { test, expect } from '@playwright/test'
import { mountChart, recordTransition, toggleLegend } from '../helpers/frames.js'
import { advance } from '../helpers/virtual-time.js'

const NAMES = ['Alpha', 'Beta', 'Gamma']
const CATS = ['a', 'b', 'c', 'd', 'e']
const SPEED = 350

const options = (chart, extra = {}) => ({
  chart: { height: 320, toolbar: { show: false }, animations: { dynamicAnimation: { speed: SPEED } }, ...chart },
  dataLabels: { enabled: true },
  legend: { show: true, position: 'top' },
  series: NAMES.map((name, k) => ({ name, data: CATS.map((_, i) => 20 + k * 12 + ((i * 7 + k * 5) % 15)) })),
  xaxis: { categories: CATS },
  ...extra,
})

const CASES = {
  line: { o: options({ type: 'line' }), toward: 'down' },
  area: { o: options({ type: 'area' }), toward: 'down' },
  'area, stacked': { o: options({ type: 'area', stacked: true }), toward: 'down' },
  column: { o: options({ type: 'bar' }), toward: 'down' },
  'bar, horizontal': { o: options({ type: 'bar' }, { plotOptions: { bar: { horizontal: true } } }), toward: 'left' },
  // Draws its own collapsing labels; the ghosts must not double them.
  'column, stacked': { o: options({ type: 'bar', stacked: true }) },
}

/** Total label opacity on screen, the centres of the exiting labels, and Beta's. */
function labelProbe() {
  const shown = (el) => {
    let op = 1
    for (let p = el; p && p.tagName.toLowerCase() !== 'svg'; p = p.parentElement) {
      const cs = getComputedStyle(p)
      if (cs.display === 'none' || cs.visibility === 'hidden') return 0
      op *= parseFloat(cs.opacity) * parseFloat(p.getAttribute('opacity') ?? '1')
    }
    return op
  }
  const texts = [...document.querySelectorAll('.apexcharts-datalabel')]
  const exiting = [...document.querySelectorAll('.apexcharts-label-exit .apexcharts-datalabel')].map((t) => {
    const r = t.getBoundingClientRect()
    return [r.x + r.width / 2, r.y + r.height / 2]
  })
  const beta = [...document.querySelectorAll('.apexcharts-datalabels[data\\:realIndex="1"] .apexcharts-datalabel')]
  return {
    total: texts.reduce((sum, t) => sum + shown(t), 0),
    exiting,
    beta: beta.map((t) => shown(t)),
    betaY: beta.map((t) => {
      const r = t.getBoundingClientRect()
      return r.y + r.height / 2
    }),
  }
}

for (const [id, c] of Object.entries(CASES)) {
  test(`${id}: hiding a series takes its labels out with it`, async ({ page }) => {
    const errors = await mountChart(page, c.o)
    const rec = await recordTransition(page, () => toggleLegend(page, 'Beta'), { ms: 800, probe: labelProbe })
    const before = rec.probeBefore.total
    const totals = rec.probes.map((p) => p.total)
    const after = totals[totals.length - 1]

    // Five labels per series: Beta's five leave, the others stay.
    expect(before - after).toBeCloseTo(CATS.length, 0)
    // Nothing vanishes on the click...
    expect(totals[0], `frame 0 shows ${totals[0].toFixed(1)} of ${before} labels`).toBeGreaterThan(before - 0.5)
    // ...and they are gone by the end of the exit, a frame or two of slack.
    const end = Math.ceil(SPEED / 16) + 2
    expect(totals[end], `frame ${end} still shows ${totals[end].toFixed(1)} labels`).toBeLessThan(after + 0.05)
    // On the way, never more than a fraction of their opacity in one frame.
    for (let f = 1; f < totals.length; f++) {
      expect(totals[f - 1] - totals[f], `frame ${f}: labels dropped at once`).toBeLessThan(CATS.length * 0.5)
    }

    if (c.toward) {
      // They ride: the exiting labels move toward where the marks go.
      const first = rec.probes.find((p) => p.exiting.length)?.exiting
      const last = [...rec.probes].reverse().find((p) => p.exiting.length)?.exiting
      expect(first?.length, 'no exiting labels were drawn').toBe(CATS.length)
      const axis = c.toward === 'down' ? 1 : 0
      const moved = last.map((p, k) => p[axis] - first[k][axis])
      for (const m of moved) {
        if (c.toward === 'down') expect(m).toBeGreaterThan(2)
        else expect(m).toBeLessThan(-2)
      }
    }

    // Nothing is left behind.
    await advance(page, 1000)
    expect(await page.locator('.apexcharts-label-exit').count()).toBe(0)
    expect(errors).toEqual([])
  })
}

for (const id of ['line', 'area', 'area, stacked']) {
  test(`${id}: showing a series brings its labels up with the line`, async ({ page }) => {
    const errors = await mountChart(page, CASES[id].o)
    await toggleLegend(page, 'Beta')
    await advance(page, 2000)
    const rec = await recordTransition(page, () => toggleLegend(page, 'Beta'), { ms: 800, probe: labelProbe })
    const first = rec.probes[0]
    const last = rec.probes[rec.probes.length - 1]

    expect(last.beta.length).toBe(CATS.length)
    // Fully shown at rest...
    for (const op of last.beta) expect(op).toBeGreaterThan(0.95)
    // ...but not on the first frame, where the line has not risen yet...
    for (const op of first.beta) expect(op).toBeLessThan(0.05)
    // ...and each comes up from below, with its point.
    first.betaY.forEach((y, k) => expect(y - last.betaY[k]).toBeGreaterThan(2))
    // Never more than a fraction of the way in one frame.
    const sums = rec.probes.map((p) => p.beta.reduce((a, b) => a + b, 0))
    for (let f = 1; f < sums.length; f++) {
      expect(sums[f] - sums[f - 1], `frame ${f}: labels appeared at once`).toBeLessThan(CATS.length * 0.5)
    }
    expect(errors).toEqual([])
  })
}
