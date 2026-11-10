/**
 * An open shared tooltip stays open across an update, on the new data from
 * the first frame, and its hover dot rides with the line.
 *
 * The update keeps the box and shows it again for the new data at the same
 * pointer. Doing that the moment the update was made drew the hover dot
 * (markers.size 0, the default line) at the point's NEW value while the line
 * was still easing there from the old one, so for the whole tween the dot
 * floated off the line, up to 140 px on a slow tween. The dot now waits for
 * the tween to land; the box and the crosshair, which do not ride it, do not
 * wait. Every frame is checked: a painted dot must sit on
 * the line's stroke. That also catches the two ways the wait can go wrong:
 * the dot gliding in from the plot corner when it is finally placed (the
 * marker ease left on), and a real marker (markers.size 5) lagging behind
 * its own tween under that ease.
 */

import { test, expect } from '@playwright/test'
import { mountChart } from '../helpers/frames.js'
import { advance, recordFrames } from '../helpers/virtual-time.js'

const options = (markers) => ({
  chart: {
    type: 'line',
    height: 320,
    animations: { speed: 400, dynamicAnimation: { speed: 1500 } },
    toolbar: { show: false },
  },
  series: [{ name: 'Visits', data: [30, 40, 35, 50, 49, 60, 70, 91] }],
  markers: { size: markers },
  tooltip: { shared: true, intersect: false },
})

/** Rest the pointer on data index j of series 0. */
async function hoverPoint(page, j) {
  const { x, y } = await page.evaluate((j) => {
    const w = window.chart.w
    const r = w.dom.Paper.node.getBoundingClientRect()
    const px = w.globals.seriesXvalues[0][j]
    const py = w.globals.seriesYvalues[0][j]
    return {
      x: r.left + w.layout.translateX + px,
      y: r.top + w.layout.translateY + py,
    }
  }, j)
  await page.mouse.move(x, y)
  await advance(page, 100)
}

/** Per frame: the box and crosshair, and is the hover dot painted on the line? */
function frameState() {
  const s = document.querySelector('.apexcharts-line-series .apexcharts-series')
  const line = s.querySelector('path.apexcharts-line')
  // markers.size 0: the series' hover dot (no rel); else the hovered marker
  const wrap = s.querySelector('.apexcharts-series-markers-wrap')
  const dot = wrap.querySelector('.apexcharts-marker:not([rel])') || wrap.querySelector('[rel="3"]')
  const tip = document.querySelector('.apexcharts-tooltip:not(.apexcharts-annotation-tooltip)')
  const xc = document.querySelector('.apexcharts-xcrosshairs').getBoundingClientRect()
  const box = dot.getBBox()
  const painted = box.width > 0
  // the centre in the line's space: a riding marker moves by its transform
  const c = new DOMPoint(box.x + box.width / 2, box.y + box.height / 2)
    .matrixTransform(dot.getScreenCTM())
    .matrixTransform(line.getScreenCTM().inverse())
  return {
    open: tip.classList.contains('apexcharts-active'),
    value: tip.querySelector('.apexcharts-tooltip-text-y-value')?.textContent ?? null,
    crosshair: document.querySelector('.apexcharts-xcrosshairs').classList.contains('apexcharts-active'),
    crosshairX: Math.round(xc.left + xc.width / 2),
    painted,
    onLine: painted ? line.isPointInStroke(c) : null,
    cy: c.y,
    size: box.width,
  }
}

for (const markers of [0, 5]) {
  test(`markers.size ${markers}: the hover dot never leaves the line during an update`, async ({ page }) => {
    const errors = await mountChart(page, options(markers))
    await hoverPoint(page, 3)
    const before = await page.evaluate(frameState)
    expect(before.open).toBe(true)

    await page.evaluate(() => {
      window.chart.updateSeries([{ name: 'Visits', data: [60, 20, 80, 10, 90, 15, 40, 30] }])
    })
    const frames = await recordFrames(page, 2400, frameState)

    // open through the tween, and never painted off the line
    expect(frames.every((f) => f.open)).toBe(true)
    const off = frames.map((f, i) => (f.onLine === false ? i : -1)).filter((i) => i >= 0)
    expect(off).toEqual([])
    // replayed once the tween landed: the dot is back, on the new value
    const last = frames[frames.length - 1]
    expect(last.painted).toBe(true)
    expect(last.onLine).toBe(true)
    expect(last.cy).not.toBe(before.cy)
    expect(last.size).toBeCloseTo(before.size, 0)
    expect(errors).toEqual([])
  })
}

// The box and the crosshair show the new data from the frame the update is
// made on, kept box (a data-only updateSeries) and rebuilt one (appendData)
// alike: only the dot waits for the tween.
const UPDATES = [
  ['a data-only updateSeries', () => { window.chart.updateSeries([{ name: 'Visits', data: [60, 20, 80, 10, 90, 15, 40, 30] }]) }],
  ['appendData', () => { window.chart.appendData([{ data: [77] }]) }],
]

for (const markers of [0, 5]) {
  for (const [name, update] of UPDATES) {
    test(`markers.size ${markers}, ${name}: the box and crosshair show the new data on every frame`, async ({ page }) => {
      const errors = await mountChart(page, options(markers))
      await hoverPoint(page, 3)
      expect(await page.evaluate(frameState)).toMatchObject({ open: true, crosshair: true })

      await page.evaluate(update)
      const frames = await recordFrames(page, 2400, frameState)

      const last = frames[frames.length - 1]
      expect(last).toMatchObject({ open: true, crosshair: true })
      const behind = frames
        .map((f, i) => (f.open && f.crosshair && f.value === last.value && Math.abs(f.crosshairX - last.crosshairX) <= 1 ? -1 : i))
        .filter((i) => i >= 0)
      expect(behind).toEqual([])
      expect(errors).toEqual([])
    })
  }
}

// A slow update cut short by a fast one: the dot waits for what still moves,
// the fast update's tween, not for the time the slow one would have taken.
test('a slow update cut short by a fast one: the dot is back once the fast one lands', async ({ page }) => {
  const opts = options(0)
  opts.chart.animations.dynamicAnimation.speed = 4000
  const errors = await mountChart(page, opts)
  await hoverPoint(page, 3)

  await page.evaluate(() => {
    window.chart.updateSeries([{ name: 'Visits', data: [60, 20, 80, 10, 90, 15, 40, 30] }])
  })
  await advance(page, 100)
  await page.evaluate(() => {
    window.chart.updateOptions({
      chart: { animations: { dynamicAnimation: { speed: 100 } } },
      series: [{ name: 'Visits', data: [30, 40, 35, 50, 49, 60, 70, 91] }],
    })
  })
  // before: nothing until 3.9 s on, when the slow update's axis tweens land
  await advance(page, 300)

  expect(await page.evaluate(frameState)).toMatchObject({ open: true, painted: true, onLine: true })
  expect(
    await page.evaluate(() => {
      const gl = window.chart.w.globals
      return { moving: gl.liveTweens?.size ?? 0, replay: !!gl.tooltip.pendingReplay }
    }),
  ).toEqual({ moving: 0, replay: false })
  expect(errors).toEqual([])
})
