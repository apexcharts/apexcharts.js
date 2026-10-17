/**
 * The trellis crosshair sweep re-asserts the mirrored crosshair every frame
 * while the pointer is over the grid (the group pipeline clears siblings
 * asynchronously, so a one-shot mirror loses). It used to re-query every
 * panel's crosshair and rewrite x/x1/x2 + the active class each frame even
 * with the pointer at rest and nothing changing. Now each cell's crosshair
 * element is cached (re-found after a panel re-render or remount) and a
 * write happens only when the target differs from the source.
 */
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/trellis.js'

const frames = new Map()
let nextId = 1
const flush = (n = 1) => {
  for (let k = 0; k < n; k++) {
    const pending = [...frames.values()]
    frames.clear()
    pending.forEach((cb) => cb(0))
  }
}
const stubRaf = () => {
  vi.stubGlobal('requestAnimationFrame', (cb) => {
    const id = nextId++
    frames.set(id, cb)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id) => frames.delete(id))
}

beforeAll(() => {
  Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
    writable: true,
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  })
})

let chart = null
afterEach(() => {
  if (chart) chart.destroy()
  chart = null
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  frames.clear()
})

const KEYS = ['A', 'B', 'C', 'D']

// Mount a 4-panel grid, then hover panel 0 with its crosshair showing at
// x = 42 and run two frames of the sweep.
async function mountHovered() {
  document.body.innerHTML = ''
  const el = document.createElement('div')
  document.body.appendChild(el)
  chart = new ApexCharts(el, {
    chart: { type: 'line', height: 300, animations: { enabled: false } },
    trellis: { by: 'region', virtualize: false },
    series: KEYS.map((k, i) => ({
      name: 'Revenue',
      region: k,
      data: [1 + i, 2, 3, 4],
    })),
    xaxis: { categories: ['q1', 'q2', 'q3', 'q4'] },
  })
  await chart.render()
  stubRaf()
  const src = xh(chart.trellis.panels[0])
  moveTo(src, 42)
  src.classList.add('apexcharts-active')
  chart.trellis.panels[0].cellEl.firstElementChild.dispatchEvent(
    new MouseEvent('mousemove', { bubbles: true }),
  )
  flush(2)
  return { c: chart, src }
}

const xh = (p) => p.cellEl.querySelector('.apexcharts-xcrosshairs')
const moveTo = (el, x) =>
  ['x', 'x1', 'x2'].forEach((a) => el.setAttribute(a, String(x)))
const mirrors = (c) => c.trellis.panels.slice(1).map(xh)
const isOn = (el) => el.classList.contains('apexcharts-active')

// Count crosshair attribute writes (every setAttribute and every class
// update step queues a mutation record, even when the value is unchanged)
// and crosshair lookups across the next `n` frames.
const measure = (c, n) => {
  const mo = new MutationObserver(() => {})
  mo.observe(c.trellis.elGrid, { attributes: true, subtree: true })
  let lookups = 0
  const qs = Element.prototype.querySelector
  const spy = vi
    .spyOn(Element.prototype, 'querySelector')
    .mockImplementation(function (sel) {
      if (sel === '.apexcharts-xcrosshairs') lookups++
      return qs.call(this, sel)
    })
  flush(n)
  spy.mockRestore()
  const writes = mo
    .takeRecords()
    .filter((r) => r.target.classList.contains('apexcharts-xcrosshairs')).length
  mo.disconnect()
  return { writes, lookups }
}

describe('trellis crosshair sweep: idle cost', () => {
  it('a resting pointer writes nothing and looks nothing up; a move rewrites', async () => {
    const { c, src } = await mountHovered()
    mirrors(c).forEach((t) => {
      expect(['x', 'x1', 'x2'].map((a) => t.getAttribute(a))).toEqual([
        '42',
        '42',
        '42',
      ])
      expect(isOn(t)).toBe(true)
    })

    expect(measure(c, 10)).toEqual({ writes: 0, lookups: 0 })
    expect(frames.size).toBe(1)

    // the probe sees real writes: 3 attributes in each of the 3 mirrors
    moveTo(src, 77)
    expect(measure(c, 1).writes).toBe(9)
    mirrors(c).forEach((t) => expect(t.getAttribute('x2')).toBe('77'))
  })

  it('re-asserts an external clear, follows the source off, clears on leave', async () => {
    const { c, src } = await mountHovered()
    const t = xh(c.trellis.panels[2])
    t.classList.remove('apexcharts-active')
    t.setAttribute('x', '0')
    flush()
    expect(isOn(t)).toBe(true)
    expect(t.getAttribute('x')).toBe('42')

    src.classList.remove('apexcharts-active')
    flush()
    mirrors(c).forEach((m) => expect(isOn(m)).toBe(false))

    src.classList.add('apexcharts-active')
    flush()
    mirrors(c).forEach((m) => expect(isOn(m)).toBe(true))
    c.trellis.elGrid.dispatchEvent(new MouseEvent('mouseleave'))
    expect(frames.size).toBe(0)
    c.trellis.panels.forEach((p) => expect(isOn(xh(p))).toBe(false))
  })

  it('a re-rendered or remounted panel gets its new crosshair mirrored', async () => {
    const { c } = await mountHovered()
    const p = c.trellis.panels[2]
    const old = xh(p)
    await p.chart.updateOptions({ stroke: { width: 3 } }, true, false, false)
    let fresh = xh(p)
    expect(fresh).toBeTruthy()
    expect(fresh).not.toBe(old)
    flush()
    expect(fresh.getAttribute('x')).toBe('42')
    expect(isOn(fresh)).toBe(true)

    // virtual unmount / remount of another panel
    const q = c.trellis.panels[3]
    c.trellis.virtual._unmount(q)
    expect(xh(q)).toBeNull()
    flush()
    await c.trellis.virtual._mount(q)
    fresh = xh(q)
    expect(fresh).toBeTruthy()
    flush()
    expect(fresh.getAttribute('x')).toBe('42')
    expect(isOn(fresh)).toBe(true)
  })
})
