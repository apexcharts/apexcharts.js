import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// A 3D funnel draws a connector shadow between each pair of stages. Every
// render hid the shadow group and revealed it once the stages had landed, so
// on an update the shadows vanished on frame 0 and faded back in after the
// morph (about 350 ms of a funnel with no shadows). The stages morph from
// where they were, so the shadows joining them morph with them, each from the
// shadow on screen, on its stage's clock. A mount and an update without
// animation keep the reveal.
//
// jsdom never finishes an animation: what an update leaves right after the
// call is frame 0.

const CATS = ['Visited', 'Viewed', 'Started', 'Activated', 'Subscribed']
const A = [12400, 7300, 3900, 2100, 1200]
const B = [12000, 7000, 3600, 2000, 1100]

function funnel(animations = {}) {
  return createChartWithOptions({
    chart: {
      type: 'funnel',
      width: 600,
      height: 360,
      animations: {
        enabled: true,
        dynamicAnimation: { enabled: true, speed: 350 },
        ...animations,
      },
    },
    series: [{ name: 'Visitors', data: A }],
    xaxis: { categories: CATS },
  })
}

const group = (c) => c.w.dom.baseEl.querySelector('.apexcharts-bar-shadows')
const shadows = (c) =>
  Array.from(c.w.dom.baseEl.querySelectorAll('.apexcharts-bar-shadow'))
const hidden = (c) => group(c).classList.contains('apexcharts-element-hidden')

describe('funnel connector shadows across an update', () => {
  it('stay on screen on frame 0 of an update, each where it was', async () => {
    const c = funnel()
    expect(shadows(c).length).toBe(4)
    const was = shadows(c).map((n) => n.getAttribute('d'))
    await c.updateSeries([{ name: 'Visitors', data: B }])
    expect(hidden(c)).toBe(false)
    const now = shadows(c)
    expect(now.length).toBe(4)
    expect(now.map((n) => n.getAttribute('d'))).toEqual(was)
    c.destroy()
  })

  it('an update without animation draws them where the stages land', async () => {
    // without a morph the shadows are drawn where the stages are, at once
    const still = funnel({ dynamicAnimation: { enabled: false } })
    await still.updateSeries([{ name: 'Visitors', data: B }])
    const target = createChartWithOptions({
      chart: {
        type: 'funnel',
        width: 600,
        height: 360,
        animations: { enabled: false },
      },
      series: [{ name: 'Visitors', data: B }],
      xaxis: { categories: CATS },
    })
    expect(shadows(still).map((n) => n.getAttribute('d'))).toEqual(
      shadows(target).map((n) => n.getAttribute('d')),
    )
    still.destroy()
    target.destroy()
  })
})
