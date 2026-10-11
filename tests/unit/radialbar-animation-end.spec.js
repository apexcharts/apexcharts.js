// radialBar fires animationEnd once its last ring has landed: after a
// cross-type morph into radialBar, and with inverseOrder, where the ring
// stagger used to be read out of order.
import { describe, it, expect } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const settle = async (done) => {
  for (let t = 0; t < 3000 && !done(); t += 50) await wait(50)
  await wait(150)
}

describe('radialBar animationEnd', () => {
  it('fires after a cross-type morph into radialBar', async () => {
    let ended = 0
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: {
        type: 'bar',
        width: 400,
        height: 400,
        animations: {
          enabled: true,
          speed: 60,
          dynamicAnimation: { enabled: true, speed: 60 },
          chartTypeMorph: { enabled: true, speed: 120 },
        },
        events: { animationEnd: () => ended++ },
      },
      series: [{ data: [30, 60, 80] }],
      labels: ['A', 'B', 'C'],
    })
    await chart.render()
    await settle(() => ended > 0)
    ended = 0
    await chart.updateOptions({
      chart: { type: 'radialBar' },
      series: [30, 60, 80],
    })
    await settle(() => ended > 0)
    expect(chart.w.globals.animationEnded).toBe(true)
    expect(ended).toBeGreaterThan(0)
    chart.destroy()
  })

  it('with inverseOrder, fires only once every ring has landed', async () => {
    /** @type {string[] | null} */
    let atEnd = null
    document.body.innerHTML = '<div id="chart"></div>'
    const ringPaths = () =>
      [...document.querySelectorAll('.apexcharts-radialbar-area[j]')].map((p) =>
        p.getAttribute('d'),
      )
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: {
        type: 'radialBar',
        width: 400,
        height: 400,
        animations: { enabled: true, speed: 300 },
        events: {
          animationEnd: () => {
            atEnd = atEnd || ringPaths()
          },
        },
      },
      series: [44, 55, 67],
      plotOptions: { radialBar: { inverseOrder: true } },
    })
    await chart.render()
    await settle(() => atEnd !== null)
    await wait(300)
    expect(atEnd).not.toBeNull()
    expect(atEnd).toEqual(ringPaths())
    chart.destroy()
  })
})
