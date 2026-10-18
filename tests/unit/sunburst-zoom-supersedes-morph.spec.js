// A click-to-zoom that lands while a treemap -> sunburst cross-type morph is
// still running must supersede it, like a zoom supersedes an earlier zoom.
// It did not: the zoom pass saw the morph snapshot still active, re-paired
// every arc with its captured tile and restarted the morph from there (the
// arcs jumped back towards the treemap and took the morph's clock, not the
// zoom's), while the first morph's runner, which has no generation check,
// kept writing the same paths until its own final write.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/entries/sunburst.js'

// jsdom has no path measurement, so the polygon morph would resample every
// shape to one point. A polyline through the path's endpoints is enough to
// give the frames real, comparable shapes.
const corners = (d) =>
  [...(d || '').matchAll(/([MLA])([^MLAZ]*)/g)].map(([, c, a]) => {
    const n = a.trim().split(/[\s,]+/).map(Number)
    return c === 'A' ? n.slice(5, 7) : n.slice(0, 2)
  })
const SVGP = window.SVGElement.prototype
SVGP.getTotalLength = function () {
  return Math.max(1, corners(this.getAttribute('d')).length - 1)
}
SVGP.getPointAtLength = function (s) {
  const p = corners(this.getAttribute('d'))
  if (!p.length) return { x: 0, y: 0 }
  const i = Math.min(Math.floor(s), p.length - 1)
  const j = Math.min(i + 1, p.length - 1)
  const t = s - i
  return { x: p[i][0] + (p[j][0] - p[i][0]) * t, y: p[i][1] + (p[j][1] - p[i][1]) * t }
}

const TREE = [
  {
    data: [
      { x: 'Engineering', children: [{ x: 'Web', y: 30 }, { x: 'Mobile', y: 20 }] },
      { x: 'Design', children: [{ x: 'Product', y: 15 }, { x: 'Brand', y: 10 }] },
    ],
  },
]

const ZOOM = 300
const anims = {
  enabled: true,
  speed: 300,
  dynamicAnimation: { enabled: true, speed: ZOOM },
  chartTypeMorph: { enabled: true, speed: 1200 },
}

const arcEls = () => [...document.querySelectorAll('.apexcharts-sunburst-arc')]
const click = (name) =>
  arcEls()
    .find((el) => el.getAttribute('data:name') === name)
    .dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
/** name -> d of every visible arc */
const shot = () =>
  Object.fromEntries(
    arcEls()
      .filter((el) => el.style.display !== 'none')
      .map((el) => [el.getAttribute('data:name'), el.getAttribute('d')]),
  )
const nums = (d) => (d.match(/-?\d+(\.\d+)?/g) || []).map(Number)
/** the path's bounding box */
const bbox = (d) => {
  const n = nums(d)
  const xs = n.filter((_, i) => i % 2 === 0)
  const ys = n.filter((_, i) => i % 2 === 1)
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
}
const near = (a, b, tol) =>
  a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= tol)

const FLAT = [
  { data: ['Web', 'Mobile', 'Product', 'Brand'].map((x, i) => ({ x, y: 30 - i * 5 })) },
]

async function switched(from = TREE) {
  document.body.innerHTML = '<div id="chart"></div>'
  const c = new ApexCharts(document.querySelector('#chart'), {
    chart: { type: 'treemap', width: 500, height: 400, animations: anims },
    series: from,
  })
  const p = c.render()
  await vi.advanceTimersByTimeAsync(3000)
  await p
  const u = c.updateOptions({ chart: { type: 'sunburst' }, series: TREE })
  await vi.advanceTimersByTimeAsync(500)
  await u
  return c
}

describe('a zoom supersedes an in-flight cross-type morph', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'Date',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'performance',
        'queueMicrotask',
      ],
    })
  })
  afterEach(() => vi.useRealTimers())

  it('continues from the screen and lands on the zoom clock', async () => {
    // The reference: the same zoom once the morph has finished.
    const ref = await switched()
    await vi.advanceTimersByTimeAsync(3000)
    click('Engineering')
    await vi.advanceTimersByTimeAsync(3000)
    const want = shot()
    ref.destroy()
    expect(Object.keys(want).sort()).toEqual(['Engineering', 'Mobile', 'Web'])

    // 500 ms into a 1200 ms morph.
    const c = await switched()
    expect(c.ctx.morphTypeChange.isActive()).toBe(true)
    const before = shot()
    click('Engineering')
    await vi.advanceTimersByTimeAsync(16)
    // No jump back towards the outgoing treemap tile.
    const first = shot()
    for (const k of Object.keys(want)) {
      expect(near(bbox(first[k]), bbox(before[k]), 12)).toBe(true)
    }

    // Landed when the zoom's own clock says so, and stays there while the
    // superseded morph's clock runs out.
    await vi.advanceTimersByTimeAsync(ZOOM + 50)
    for (const t of [0, 1000]) {
      await vi.advanceTimersByTimeAsync(t)
      const got = shot()
      expect(Object.keys(got).sort()).toEqual(Object.keys(want).sort())
      for (const k of Object.keys(want)) {
        expect(near(nums(got[k]), nums(want[k]), 1e-6)).toBe(true)
      }
    }
    c.destroy()
  })

  it('a flat treemap (leaves morph, rings sweep) lands on the zoom clock too', async () => {
    const ref = await switched(FLAT)
    await vi.advanceTimersByTimeAsync(3000)
    click('Design')
    await vi.advanceTimersByTimeAsync(3000)
    const want = shot()
    ref.destroy()

    const c = await switched(FLAT)
    click('Design')
    await vi.advanceTimersByTimeAsync(ZOOM + 50)
    const got = shot()
    expect(Object.keys(got).sort()).toEqual(['Brand', 'Design', 'Product'])
    for (const k of Object.keys(want)) {
      expect(near(nums(got[k]), nums(want[k]), 1e-6)).toBe(true)
    }
    c.destroy()
  })

  it('an update during the takeover starts every arc from the screen', async () => {
    const c = await switched()
    click('Engineering')
    await vi.advanceTimersByTimeAsync(96)
    // Every arc, including the three the zoom is fading out.
    const before = Object.fromEntries(
      arcEls().map((el) => [el.getAttribute('data:name'), el.getAttribute('d')]),
    )
    const TREE2 = JSON.parse(JSON.stringify(TREE))
    TREE2[0].data[0].children[0].y = 10
    TREE2[0].data[1].children[1].y = 5
    c.updateSeries(TREE2)
    await vi.advanceTimersByTimeAsync(16)
    const after = {}
    arcEls()
      .filter((el) => el.style.display !== 'none' && el.getAttribute('d'))
      .forEach((el) => (after[el.getAttribute('data:name')] = el.getAttribute('d')))
    expect(Object.keys(after).sort()).toEqual(Object.keys(before).sort())
    for (const k of Object.keys(after)) {
      expect(near(bbox(after[k]), bbox(before[k]), 6)).toBe(true)
    }
    c.destroy()
  })

  it('a zoom back out mid-morph restores the whole tree', async () => {
    const c = await switched()
    click('Engineering')
    await vi.advanceTimersByTimeAsync(100)
    click('Engineering') // the focus: zooms back out
    await vi.advanceTimersByTimeAsync(3000)
    expect(Object.keys(shot()).sort()).toEqual(
      ['Brand', 'Design', 'Engineering', 'Mobile', 'Product', 'Web'],
    )
    expect(c.w.globals.sunburstFocusKey).toBeFalsy()
    c.destroy()
  })
})
