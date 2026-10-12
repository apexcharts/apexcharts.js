// A partial pie/donut is fitted to the arc it sweeps. That fit used to read
// the drawn nodes' boxes, which counted the donut hole's full circle (its far
// half hangs below a semicircle's flat side, a dead band of ~165 px) and
// caught slices mid-entrance, so a semi pie moved with animations on. The
// extent is now worked out from the centre, radius and angles (Pie.draw
// publishes it on circleGeometry), so it is the same either way.
import { describe, it, expect } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

/**
 * @param {string} type
 * @param {Record<string, any>} pie
 * @param {boolean} [animate]
 * @param {Record<string, any>} [extra]
 */
async function mount(type, pie, animate = false, extra = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    chart: { type, width: 400, animations: { enabled: animate } },
    series: [44, 55, 13, 33],
    labels: ['A', 'B', 'C', 'D'],
    legend: { show: false },
    dataLabels: { enabled: false },
    plotOptions: { pie },
    ...extra,
  })
  await chart.render()
  return chart
}

const svgHeight = (chart) =>
  Number(chart.el.querySelector('.apexcharts-svg').getAttribute('height'))

const SEMI = { startAngle: -90, endAngle: 90, donut: { size: '50%' } }

describe('semicircle pie/donut fit-to-content', () => {
  it('a semicircle donut ends at its flat side, not the hole rim', async () => {
    const chart = await mount('donut', SEMI)
    const w = chart.w
    const cg = w.globals.circleGeometry
    // Top of the rim, and the chord as the bottom: the hole's lower half
    // (cy + r/2) is not part of the arc.
    expect(cg.y[0]).toBeCloseTo(cg.cy - cg.r, 5)
    expect(cg.y[1]).toBeCloseTo(cg.cy, 5)
    expect(svgHeight(chart)).toBeLessThan(
      w.layout.translateY + cg.cy + cg.r / 2,
    )

    // Below the arc there is only the breathing room it also has on top.
    const arcTop = w.layout.translateY + cg.y[0]
    const arcBottom = w.layout.translateY + cg.y[1]
    const pad = Math.max(
      15 + w.layout.gridPad.bottom,
      w.globals.radialSize * 0.2,
    )
    expect(svgHeight(chart) - arcBottom).toBeLessThanOrEqual(
      Math.max(pad, arcTop) + 1,
    )
    chart.destroy()
  })

  it('reserves the same layout with animations on and off', async () => {
    for (const type of ['pie', 'donut']) {
      const off = await mount(type, SEMI, false)
      const a = {
        h: svgHeight(off),
        ty: off.w.layout.translateY,
        y0: off.w.globals.circleGeometry.y[0],
        y1: off.w.globals.circleGeometry.y[1],
      }
      off.destroy()
      const on = await mount(type, SEMI, true)
      expect({
        h: svgHeight(on),
        ty: on.w.layout.translateY,
        y0: on.w.globals.circleGeometry.y[0],
        y1: on.w.globals.circleGeometry.y[1],
      }).toEqual(a)
      on.destroy()
    }
  })

  it('a sweep past the bottom (-90..180) reaches the bottom of the rim', async () => {
    const chart = await mount('donut', { ...SEMI, endAngle: 180 })
    const cg = chart.w.globals.circleGeometry
    expect(cg.y[0]).toBeCloseTo(cg.cy - cg.r, 5)
    expect(cg.y[1]).toBeCloseTo(cg.cy + cg.r, 5)
    chart.destroy()
  })

  it('keeps the lower half of the hole when centre labels are shown', async () => {
    const chart = await mount('donut', {
      ...SEMI,
      donut: { size: '50%', labels: { show: true, total: { show: true } } },
    })
    const cg = chart.w.globals.circleGeometry
    // The value row sits below the flat side, inside the hole.
    expect(cg.y[1]).toBeCloseTo(cg.cy + cg.r / 2, 5)
    chart.destroy()
  })

  it('outer name labels stay inside a semicircle pie', async () => {
    const chart = await mount(
      'pie',
      { ...SEMI, dataLabels: { external: { show: true } } },
      false,
    )
    const ty = chart.w.layout.translateY
    const h = svgHeight(chart)
    chart.el
      .querySelectorAll('.apexcharts-pie-name-label-group text')
      .forEach((t) => {
        const y = ty + Number(t.getAttribute('y'))
        expect(y).toBeGreaterThan(0)
        expect(y).toBeLessThan(h)
      })
    expect(ty + chart.w.globals.circleGeometry.y[1]).toBeLessThan(h)
    chart.destroy()
  })

  it('leaves a full-circle donut on the full-circle height', async () => {
    const chart = await mount('donut', { donut: { size: '50%' } })
    const w = chart.w
    expect(svgHeight(chart)).toBe(
      Math.ceil(
        w.globals.radialSize * 2.05 +
          w.layout.translateY +
          15 +
          w.layout.gridPad.bottom,
      ),
    )
    chart.destroy()
  })
})
