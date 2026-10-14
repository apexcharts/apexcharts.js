import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import '../../src/entries/unit.js'
import ApexCharts from '../../src/entries/standard.js'

// What users saw in unit chart transitions:
// - after a non-animated update or a switch to another type mid-gather, the
//   old loop kept animating the detached dots (and could raise
//   animationEnded while the new chart was still moving);
// - unit -> line -> unit faded out phantom dots that were never on screen
//   and skipped the entrance;
// - when a small-multiple waffle re-tiled, its grey track jumped to the new
//   tiling while the coloured cells were still sliding, so cells floated
//   off their tiles;
// - square and pictogram units snapped to their new size on the first frame
//   while circles grew smoothly.

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

async function mount(o) {
  document.body.innerHTML = '<div id="chart"></div>'
  o.chart = { type: 'unit', width: 600, height: 400, animations: { enabled: true, speed: 400 } }
  chart = new ApexCharts(document.querySelector('#chart'), o)
  await chart.render()
  return chart
}

const units = () => [
  ...chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-area'),
]
const at = (d) => d.getAttribute('cx') + ',' + d.getAttribute('cy')
const two = { series: [40, 40], labels: ['A', 'B'], plotOptions: { unit: { clusterLabels: { show: false } } } }

it('a non-animated update stops the previous gather loop', async () => {
  await mount(two)
  frames(3)
  const old = units()[5]
  const was = at(old)
  await chart.updateSeries([30, 30], false)
  expect(chart.w.globals.unitGatherRAF).toBe(null)
  frames(10)
  expect(at(old)).toBe(was)
})

it('a switch to another type mid-gather stops the unit loop', async () => {
  await mount(two)
  frames(3)
  const old = units()[5]
  await chart.updateOptions({ chart: { type: 'pie' } })
  const was = at(old)
  frames(10)
  expect(at(old)).toBe(was)
  expect(chart.w.globals.unitGatherRAF).toBe(null)
})

it('a gather interrupted by a detached container still settles', async () => {
  await mount({ ...two, series: [10, 5] })
  frames(200)
  await chart.updateSeries([20, 10])
  frames(1)
  const host = document.querySelector('#chart')
  host.remove()
  frames(200)
  document.body.appendChild(host)
  frames(200)
  expect(units().every((d) => d.style.opacity === '')).toBe(true)
  expect(chart.w.globals.animationEnded).toBe(true)
})

it('exit ghosts interrupted by a detached container are still removed', async () => {
  await mount({ ...two, series: [20, 10] })
  frames(200)
  await chart.updateSeries([5, 2])
  frames(1)
  const host = document.querySelector('#chart')
  host.remove()
  frames(6)
  document.body.appendChild(host)
  frames(200)
  expect(chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-exit').length).toBe(0)
})

it('unit -> line -> unit enters fresh instead of tweening from the first unit render', async () => {
  await mount(two)
  frames(200)
  await chart.updateOptions({ chart: { type: 'line' }, series: [{ name: 'A', data: [1, 2, 3] }], labels: [] })
  frames(200)
  await chart.updateOptions({ chart: { type: 'unit' }, series: [20, 5], labels: ['A', 'B'] })
  expect(chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-exit').length).toBe(0)
  expect(units().every((d) => d.style.opacity === '0')).toBe(true)
})

it('a re-tiled small-multiple waffle moves its track with its cells', async () => {
  await mount({
    series: [50, 30, 50, 50, 50],
    labels: ['A', 'B', 'C', 'D', 'E'],
    plotOptions: { unit: { layout: 'grid', grid: { split: true } } },
  })
  frames(200)
  const trackAt = () =>
    new Set(
      [...chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-track-cell')].map((t) =>
        (+t.getAttribute('cx')).toFixed(1) + ',' + (+t.getAttribute('cy')).toFixed(1),
      ),
    )
  const offTrack = () => {
    const track = trackAt()
    return units().filter(
      (d) => !track.has((+d.getAttribute('cx')).toFixed(1) + ',' + (+d.getAttribute('cy')).toFixed(1)),
    ).length
  }
  const labelAt = () =>
    Object.fromEntries(
      [...chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-label')].map((t) => [
        t.textContent[0],
        [+t.getAttribute('x'), +t.getAttribute('y')],
      ]),
    )
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])
  const before = trackAt()
  const labels0 = labelAt()
  // 5 tiles -> 4: three tile columns become two, every tile moves and resizes.
  await chart.updateSeries([50, 0, 80, 50, 50])
  frames(1)
  expect(offTrack()).toBe(0)
  const labels1 = labelAt()
  frames(12)
  // Mid-flight: the track is on its way and the cells are still on it.
  expect([...trackAt()].filter((p) => !before.has(p)).length).toBeGreaterThan(100)
  expect(offTrack()).toBe(0)
  frames(200)
  expect(offTrack()).toBe(0)
  // The tile labels start where they were and ride with their tiles.
  const labels2 = labelAt()
  const moved = ['A', 'C', 'D', 'E'].filter((k) => dist(labels2[k], labels0[k]) > 20)
  expect(moved.length).toBeGreaterThan(0)
  moved.forEach((k) =>
    expect(dist(labels1[k], labels0[k])).toBeLessThan(dist(labels2[k], labels0[k]) / 4),
  )
  // The hidden tile's track faded out with it.
  expect(chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-track-cell').length).toBe(400)
  // A tile coming back fades its label in with its cells.
  await chart.updateSeries([50, 30, 80, 50, 50])
  frames(1)
  const labelB = () =>
    [...chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-label')].find(
      (t) => t.textContent[0] === 'B',
    )
  expect(+labelB().style.opacity).toBeLessThan(0.5)
  frames(200)
  expect(labelB().style.opacity).toBe('')
})

it('a value change that keeps the tiling leaves the track cells alone', async () => {
  await mount({
    series: [50, 30, 50, 50],
    labels: ['A', 'B', 'C', 'D'],
    plotOptions: { unit: { layout: 'grid', grid: { split: true } } },
  })
  frames(200)
  await chart.updateSeries([55, 30, 50, 50])
  const spy = vi.spyOn(Element.prototype, 'setAttribute')
  frames(100)
  const writes = spy.mock.contexts.filter((el) =>
    el.classList?.contains('apexcharts-unit-track-cell'),
  )
  expect(writes.length).toBe(0)
})

it.each([
  ['square', {}],
  ['pictogram', { pictogram: { mark: 'M50 10 L90 90 L10 90 Z' } }],
])('tweens the size of %s units on an update', async (shape, extra) => {
  const size = (d) =>
    shape === 'square'
      ? +d.getAttribute('width')
      : +/scale\(([^)]+)\)/.exec(d.getAttribute('transform'))[1]
  await mount({
    series: [10, 10],
    labels: ['A', 'B'],
    plotOptions: { unit: { shape, ...extra, clusterLabels: { show: false } } },
  })
  frames(200)
  const s0 = size(units()[0])
  await chart.updateSeries([60, 60])
  frames(1)
  const s1 = size(units()[0])
  frames(200)
  const s2 = size(units()[0])
  expect(Math.abs(s2 - s0)).toBeGreaterThan(Math.abs(s0) * 0.2)
  // Near the old size on the first frame, exactly the new size at rest.
  expect(Math.abs(s1 - s0)).toBeLessThan(Math.abs(s2 - s0) / 2)
  if (shape === 'square') {
    const d = units()[0]
    expect(+d.getAttribute('height')).toBe(s2)
  }
})
