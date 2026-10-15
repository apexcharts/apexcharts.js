import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/trellis.js'

// Two trellis panel defects users saw:
// - a zoomed panel drew its own reset icon beside the shared toolbar's one,
//   and clicking it reset that panel alone, desyncing the grid (without a
//   shared toolbar that panel reset is the only way back, so it must stay);
// - after the grid rebuilt (or was destroyed) under a resting pointer, the
//   cross-panel crosshair sweep kept running every frame and wiped the new
//   panels' crosshairs.

const frames = new Map()
let nextId = 1
const flush = (n = 3) => {
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
afterEach(() => {
  vi.unstubAllGlobals()
  frames.clear()
})

const rows = (base) =>
  Array.from({ length: 6 }, (_, i) => [
    Date.UTC(2025, 0, 1) + i * 86400000,
    base + i,
  ])
const series = (a, b) => [
  { name: 'Revenue', region: a, data: rows(10) },
  { name: 'Revenue', region: b, data: rows(20) },
]

async function mount(trellis = {}) {
  document.body.innerHTML = ''
  const el = document.createElement('div')
  document.body.appendChild(el)
  const chart = new ApexCharts(el, {
    chart: { type: 'line', height: 400, animations: { enabled: false } },
    trellis: { by: 'region', virtualize: false, ...trellis },
    series: series('North', 'South'),
    xaxis: { type: 'datetime' },
  })
  await chart.render()
  return chart
}

// Start the sweep the way a pointer does and return its queued frame.
const hover = (chart) => {
  const cell = chart.trellis.elGrid.querySelector('.apexcharts-trellis-cell')
  frames.clear()
  cell.firstElementChild.dispatchEvent(
    new MouseEvent('mousemove', { bubbles: true }),
  )
  expect(frames.size).toBe(1)
  return [...frames.values()][0]
}

// Zoom panel 0 the way a drag does; return its reset icon count.
const zoomPanel = async (chart) => {
  const panel = chart.trellis.panels[0].chart
  panel.w.interact.zoomed = true
  await panel.updateOptions(
    { xaxis: { min: Date.UTC(2025, 0, 2), max: Date.UTC(2025, 0, 4) } },
    false,
    false,
    false,
  )
  expect(panel.w.interact.zoomed).toBe(true)
  return panel.el.querySelectorAll('.apexcharts-reset-icon').length
}

describe('trellis: the grid owns reset and the crosshair sweep', () => {
  it('a zoomed panel draws no reset control of its own', async () => {
    const chart = await mount()
    expect(chart.el.querySelector('.apexcharts-trellis-toolbar')).toBeTruthy()
    expect(await zoomPanel(chart)).toBe(0)
    chart.destroy()
  })

  it("with toolbar 'none' a zoomed panel keeps its own way back", async () => {
    const chart = await mount({ toolbar: 'none' })
    expect(chart.el.querySelector('.apexcharts-trellis-toolbar')).toBeNull()
    expect(await zoomPanel(chart)).toBe(1)
    expect(chart.trellis.panels[0].chart.toolbar.resetControlAllowed()).toBe(
      true,
    )
    chart.destroy()
  })

  it('a rebuild under a resting pointer leaves the new crosshairs alone', async () => {
    const chart = await mount()
    stubRaf()
    hover(chart)

    // new keys: teardown and a full rebuild, with no mouseleave in between
    await chart.updateSeries(series('East', 'West'))
    const xh = chart.trellis.panels[1].cellEl.querySelector(
      '.apexcharts-xcrosshairs',
    )
    expect(xh).toBeTruthy()
    xh.classList.add('apexcharts-active')
    flush()
    expect(xh.classList.contains('apexcharts-active')).toBe(true)
    expect(frames.size).toBe(0)
    chart.destroy()
  })

  it('destroy() while hovered stops the sweep from re-queuing', async () => {
    const chart = await mount()
    stubRaf()
    hover(chart)
    chart.destroy()
    flush()
    expect(frames.size).toBe(0)
  })

  it('the sweep keeps running while the pointer stays on a live grid', async () => {
    const chart = await mount()
    stubRaf()
    hover(chart)
    flush()
    expect(frames.size).toBe(1)
    chart.destroy()
  })
})
