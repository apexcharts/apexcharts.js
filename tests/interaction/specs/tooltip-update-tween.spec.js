/**
 * An open shared tooltip stays open across a data-only update, and its hover
 * dot rides with the line.
 *
 * The update keeps the box and shows it again for the new data at the same
 * pointer. Doing that the moment the update was made drew the hover dot
 * (markers.size 0, the default line) at the point's NEW value while the line
 * was still easing there from the old one, so for the whole tween the dot
 * floated off the line, up to 140 px on a slow tween. The replay now waits
 * for the tween to land. Every frame is checked: a painted dot must sit on
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

/** Per frame: is the hover dot painted, and does it sit on the line? */
function dotOnLine() {
  const s = document.querySelector('.apexcharts-line-series .apexcharts-series')
  const line = s.querySelector('path.apexcharts-line')
  // markers.size 0: the series' hover dot (no rel); else the hovered marker
  const wrap = s.querySelector('.apexcharts-series-markers-wrap')
  const dot = wrap.querySelector('.apexcharts-marker:not([rel])') || wrap.querySelector('[rel="3"]')
  const tip = document.querySelector('.apexcharts-tooltip:not(.apexcharts-annotation-tooltip)')
  const box = dot.getBBox()
  const painted = box.width > 0
  // the centre in the line's space: a riding marker moves by its transform
  const c = new DOMPoint(box.x + box.width / 2, box.y + box.height / 2)
    .matrixTransform(dot.getScreenCTM())
    .matrixTransform(line.getScreenCTM().inverse())
  return {
    open: tip.classList.contains('apexcharts-active'),
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
    const before = await page.evaluate(dotOnLine)
    expect(before.open).toBe(true)

    await page.evaluate(() => {
      window.chart.updateSeries([{ name: 'Visits', data: [60, 20, 80, 10, 90, 15, 40, 30] }])
    })
    const frames = await recordFrames(page, 2400, dotOnLine)

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
