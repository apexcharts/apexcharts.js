import { describe, it, expect, afterEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/full.js'

// Globals.initGlobalVars runs before every re-parse. A flag the parse only
// ever raises, or a value only one chart type writes, has to be reset there or
// it leaks into every later render. Timer handles are the opposite case: they
// must survive a re-render so a later debounce, or destroy(), can cancel them.

const xl = (ch) =>
  [...ch.w.dom.baseEl.querySelectorAll('.apexcharts-xaxis-label')].map(
    (t) => t.textContent,
  )
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

afterEach(() => {
  document.body.innerHTML = ''
})

describe('per-render flags', () => {
  it('an update from {x,y} data to plain values + categories renders the categories', async () => {
    document.body.innerHTML = '<div id="a"></div>'
    const a = new ApexCharts(document.querySelector('#a'), {
      chart: {
        type: 'line',
        width: 500,
        height: 300,
        animations: { enabled: false },
      },
      series: [
        {
          data: [
            { x: 1, y: 3 },
            { x: 2, y: 4 },
          ],
        },
      ],
    })
    await a.render()
    await expect(
      a.updateOptions(
        {
          series: [{ data: [5, 6, 7] }],
          xaxis: { categories: ['Mon', 'Tue', 'Wed'] },
        },
        false,
        false,
      ),
    ).resolves.toBeDefined()
    expect(a.w.axisFlags.dataFormatXNumeric).toBe(false)
    expect(xl(a)).toEqual(['Mon', 'Tue', 'Wed'])
    a.destroy()
  })

  it('a rangeBar -> bar update scales the y axis to the new bar values', async () => {
    document.body.innerHTML = '<div id="c"></div><div id="d"></div>'
    const c = new ApexCharts(document.querySelector('#c'), {
      chart: {
        type: 'rangeBar',
        width: 500,
        height: 300,
        animations: { enabled: false },
      },
      series: [
        {
          data: [
            { x: 'A', y: [10, 20] },
            { x: 'B', y: [30, 50] },
          ],
        },
      ],
    })
    await c.render()
    await c.updateOptions(
      {
        chart: { type: 'bar' },
        series: [
          {
            data: [
              { x: 'A', y: 5 },
              { x: 'B', y: 8 },
            ],
          },
        ],
      },
      false,
      false,
    )
    const d = new ApexCharts(document.querySelector('#d'), {
      chart: {
        type: 'bar',
        width: 500,
        height: 300,
        animations: { enabled: false },
      },
      series: [
        {
          data: [
            { x: 'A', y: 5 },
            { x: 'B', y: 8 },
          ],
        },
      ],
    })
    await d.render()
    expect(c.w.globals.maxY).toBe(d.w.globals.maxY)
    expect(c.w.axisFlags.isRangeData).toBe(false)
    expect(c.w.axisFlags.isRangeBar).toBe(false)
    c.destroy()
    d.destroy()
  })

  it('a pie outer-label band does not pad a later sunburst render', async () => {
    document.body.innerHTML = '<div id="p"></div><div id="s"></div>'
    const sun = {
      chart: { type: 'sunburst', width: 400, animations: { enabled: false } },
      series: [
        {
          data: [
            {
              name: 'A',
              children: [
                { name: 'a1', value: 4 },
                { name: 'a2', value: 2 },
              ],
            },
            { name: 'B', value: 5 },
          ],
        },
      ],
      legend: { show: false },
    }
    const p = new ApexCharts(document.querySelector('#p'), {
      chart: { type: 'pie', width: 400, animations: { enabled: false } },
      series: [30, 20, 50],
      labels: ['Alpha', 'Beta', 'Gamma'],
      legend: { show: false },
      plotOptions: { pie: { dataLabels: { external: { show: true } } } },
    })
    await p.render()
    expect(p.w.globals.pieExternalLabelMarginY).toBeGreaterThan(0)
    await p.updateOptions(
      { chart: { type: 'sunburst' }, series: sun.series, labels: [] },
      false,
      false,
    )
    expect(p.w.globals.pieExternalLabelMarginY).toBe(0)

    const s = new ApexCharts(document.querySelector('#s'), sun)
    await s.render()
    expect(p.w.layout.svgHeight).toBe(s.w.layout.svgHeight)
    p.destroy()
    s.destroy()
  })

  it('toggling plotOptions.line.isSlopeChart reaches the per-render flag', async () => {
    document.body.innerHTML = '<div id="l"></div>'
    const l = new ApexCharts(document.querySelector('#l'), {
      chart: {
        type: 'line',
        width: 500,
        height: 300,
        animations: { enabled: false },
      },
      series: [
        {
          name: 'A',
          data: [
            { x: 'Jan', y: 4 },
            { x: 'Feb', y: 6 },
          ],
        },
      ],
    })
    await l.render()
    expect(l.w.globals.isSlopeChart).toBe(false)
    await l.updateOptions(
      { plotOptions: { line: { isSlopeChart: true } } },
      false,
      false,
    )
    expect(l.w.globals.isSlopeChart).toBe(true)
    await l.updateOptions(
      { plotOptions: { line: { isSlopeChart: false } } },
      false,
      false,
    )
    expect(l.w.globals.isSlopeChart).toBe(false)
    l.destroy()
  })
})

describe('debounce timer handles', () => {
  it('a re-render keeps the pending resize handle, so destroy() cancels it', async () => {
    document.body.innerHTML = '<div id="r"></div>'
    const el = document.querySelector('#r')
    const r = new ApexCharts(el, {
      chart: {
        type: 'line',
        width: 500,
        height: 300,
        animations: { enabled: false },
      },
      series: [{ data: [1, 2, 3] }],
    })
    await r.render()
    r._windowResize()
    await r.updateSeries([{ data: [3, 2, 1] }], false)
    expect(r.w.globals.resizeTimer).not.toBe(null)
    r.destroy()
    await wait(200)
    // The orphaned timer used to run update() on the destroyed chart and draw
    // a fresh SVG into the element.
    expect(el.querySelector('svg')).toBe(null)
  })

  it('a re-render cancels the pending selection emit of the replaced rect', async () => {
    document.body.innerHTML = '<div id="b"></div>'
    const r = new ApexCharts(document.querySelector('#b'), {
      chart: {
        type: 'line',
        width: 500,
        height: 300,
        animations: { enabled: false },
      },
      series: [{ data: [1, 2, 3] }],
    })
    await r.render()
    let fired = false
    r.w.globals.selectionResizeTimer = window.setTimeout(
      () => (fired = true),
      30,
    )
    // A full re-render (the data-only fast path keeps the rect and its emit).
    await r.updateOptions({ title: { text: 'Rebuilt' } }, false, false)
    await wait(60)
    expect(fired).toBe(false)
    r.destroy()
  })
})
