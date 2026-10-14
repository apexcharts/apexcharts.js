import { afterEach, expect, it, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import '../../src/entries/unit.js'
import ApexCharts from '../../src/entries/standard.js'

// Units are identified by their datum's id/name. Two units sharing a name
// shared one key, so layout:'custom' drew them on top of each other and
// transition:'identity' collapsed every repeat onto one slot after an update.

let chart
const realRaf = window.requestAnimationFrame
const realCaf = window.cancelAnimationFrame

afterEach(() => {
  chart?.destroy()
  chart = null
  window.requestAnimationFrame = realRaf
  window.cancelAnimationFrame = realCaf
  vi.restoreAllMocks()
})

async function mount(o, animate = false) {
  document.body.innerHTML = '<div id="chart"></div>'
  o.chart = { type: 'unit', width: 600, height: 400, animations: { enabled: animate, speed: 400 } }
  chart = new ApexCharts(document.querySelector('#chart'), o)
  await chart.render()
  return chart
}

const positions = () =>
  [...chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-area')].map(
    (d) => (+d.getAttribute('cx')).toFixed(1) + ',' + (+d.getAttribute('cy')).toFixed(1),
  )

it("layout 'custom' gives each repeated name its own id and position", async () => {
  const seen = []
  const rows = (objects, rect) => {
    seen.push(...objects.map((o) => o.id))
    return objects.map((o, k) => ({ id: o.id, x: rect.x + 40 + k * 60, y: rect.y + 40 }))
  }
  await mount({
    series: [{ name: 'A', data: [{ name: 'Alex' }, { name: 'Alex' }, { name: 'Bo' }] }],
    plotOptions: { unit: { layout: 'custom', positions: rows } },
  })
  expect(seen).toEqual(['Alex', 'Alex#2', 'Bo'])
  expect(new Set(positions()).size).toBe(3)
})

it("transition 'identity' settles every repeated name on its own slot", async () => {
  // Manual frames so the gather can be run to rest.
  let T = 1000
  const q = new Map()
  let id = 0
  window.requestAnimationFrame = (cb) => (q.set(++id, cb), id)
  window.cancelAnimationFrame = (h) => q.delete(h)
  vi.spyOn(performance, 'now').mockImplementation(() => T)
  const settle = () => {
    for (let f = 0; f < 200; f++) {
      T += 16
      const cbs = [...q.values()]
      q.clear()
      cbs.forEach((cb) => cb(T))
    }
  }
  const names = ['Alex', 'Bo', 'Cy', 'Di']
  const mk = (n, off) => Array.from({ length: n }, (_, k) => ({ name: names[(k + off) % 4] }))

  await mount(
    {
      series: [
        { name: 'A', data: mk(9, 0) },
        { name: 'B', data: mk(9, 1) },
      ],
      plotOptions: { unit: { transition: 'identity' } },
    },
    true,
  )
  settle()
  await chart.updateOptions({
    series: [
      { name: 'G1', data: mk(12, 2) },
      { name: 'G2', data: mk(6, 3) },
    ],
  })
  settle()
  const pos = positions()
  expect(pos.length).toBe(18)
  expect(new Set(pos).size).toBe(18)
})
