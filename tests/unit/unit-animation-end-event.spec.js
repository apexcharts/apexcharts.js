/**
 * `chart.events.animationEnd` on a unit chart.
 *
 * Production report: the gather finished and raised the internal
 * `w.globals.animationEnded`, but the user's `animationEnd` never fired, on the
 * first render or after an update. Other chart types fire it once, when their
 * animation lands (Animations#animationCompleted), and not at all when
 * animations are off.
 */
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import '../../src/entries/unit.js'
import ApexCharts from '../../src/entries/standard.js'

let chart
let T
let q
const realRaf = window.requestAnimationFrame
const realCaf = window.cancelAnimationFrame

beforeEach(() => {
  T = 1000
  q = new Map()
  let id = 0
  window.requestAnimationFrame = (cb) => (q.set(++id, cb), id)
  window.cancelAnimationFrame = (h) => q.delete(h)
  vi.spyOn(performance, 'now').mockImplementation(() => T)
})

afterEach(() => {
  chart?.destroy()
  chart = null
  window.requestAnimationFrame = realRaf
  window.cancelAnimationFrame = realCaf
  vi.restoreAllMocks()
})

const frames = (n) => {
  for (let f = 0; f < n; f++) {
    T += 16
    const cbs = [...q.values()]
    q.clear()
    cbs.forEach((cb) => cb(T))
  }
}

async function mount(unit, { enabled = true } = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  const animationEnd = vi.fn()
  chart = new ApexCharts(document.querySelector('#chart'), {
    chart: {
      type: 'unit',
      width: 600,
      height: 400,
      animations: { enabled, speed: 400, dynamicAnimation: { speed: 400 } },
      events: { animationEnd },
    },
    series: [
      {
        name: 'A',
        data: Array.from({ length: 30 }, (_, k) => ({ id: 'a' + k })),
      },
    ],
    plotOptions: { unit: { clusterLabels: { show: false }, ...unit } },
  })
  await chart.render()
  return animationEnd
}

const spring = {
  layout: 'packed',
  transition: 'identity',
  shape: 'pictogram',
  pictogram: { mark: 'M0 0H100V100H0Z' },
  gather: { motion: 'spring' },
}

it.each([
  ['spring gather', spring],
  ['tweened gather', { gather: { motion: 'tween' } }],
])('fires once when the %s settles, with the chart', async (_, unit) => {
  const animationEnd = await mount(unit)
  expect(animationEnd).not.toHaveBeenCalled()
  frames(3)
  expect(animationEnd).not.toHaveBeenCalled()
  frames(400)
  expect(chart.w.globals.animationEnded).toBe(true)
  expect(animationEnd).toHaveBeenCalledTimes(1)
  expect(animationEnd.mock.calls[0][0]).toBe(chart)
  expect(animationEnd.mock.calls[0][1].w).toBe(chart.w)
  // Settled: more frames do not fire it again.
  frames(60)
  expect(animationEnd).toHaveBeenCalledTimes(1)
})

it('fires again, once, after updateSeries and after updateOptions', async () => {
  const animationEnd = await mount({ ...spring, layout: 'columns' })
  frames(400)
  expect(animationEnd).toHaveBeenCalledTimes(1)

  await chart.updateSeries([
    {
      name: 'A',
      data: Array.from({ length: 20 }, (_, k) => ({ id: 'a' + k })),
    },
  ])
  expect(animationEnd).toHaveBeenCalledTimes(1)
  frames(400)
  expect(animationEnd).toHaveBeenCalledTimes(2)

  await chart.updateOptions({ plotOptions: { unit: { layout: 'packed' } } })
  frames(400)
  expect(animationEnd).toHaveBeenCalledTimes(3)
})

it('an update that interrupts a gather fires once, for the gather that lands', async () => {
  const animationEnd = await mount(spring)
  frames(3)
  await chart.updateOptions({ plotOptions: { unit: { layout: 'columns' } } })
  frames(400)
  expect(animationEnd).toHaveBeenCalledTimes(1)
})

it('does not fire with animations off, as other chart types do not', async () => {
  const animationEnd = await mount(spring, { enabled: false })
  frames(60)
  expect(chart.w.globals.animationEnded).toBe(true)
  expect(animationEnd).not.toHaveBeenCalled()
})
