import { describe, it, expect } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import './__mocks__/ResizeObserver.js'

// chart.dropShadow used to build a private <filter> (five primitives) for
// every mark, so a 2 x 20 bar chart wrote 40 identical filters into <defs>.
// The marks of a series now share one filter per <defs>, and taking a
// filter off one mark (a hover, a selection) leaves the shared one in place
// for the others.

const data = (n, k) => Array.from({ length: n }, (_, i) => i + k)

async function chart(el, dropShadow = {}) {
  const c = new ApexCharts(el, {
    chart: {
      type: 'bar',
      width: 600,
      height: 300,
      animations: { enabled: false },
      dropShadow: { enabled: true, ...dropShadow },
    },
    series: [{ data: data(20, 1) }, { data: data(20, 3) }],
  })
  await c.render()
  return c
}

const filters = (c) => c.w.dom.baseEl.querySelectorAll('defs filter')
const bars = (c) =>
  Array.from(c.w.dom.baseEl.querySelectorAll('.apexcharts-bar-area'))

// every filter url(#id) a mark carries names a filter in this chart's defs
function dangling(c) {
  const ids = new Set(Array.from(filters(c)).map((f) => f.id))
  return Array.from(c.w.dom.baseEl.querySelectorAll('[filter^=url]'))
    .map((n) => n.getAttribute('filter').slice(5, -1))
    .filter((id) => !ids.has(id))
}

const seriesFilter = (c, i) =>
  new Set(
    bars(c)
      .filter((b) => b.getAttribute('index') === String(i))
      .map((b) => b.getAttribute('filter')),
  )

describe('drop shadow filters', () => {
  it('one filter per series shadow, not per bar', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const c = await chart(document.querySelector('#chart'), {
      color: ['#111111', '#222222'],
    })
    expect(filters(c).length).toBe(2)
    expect(seriesFilter(c, 0).size).toBe(1)
    expect(seriesFilter(c, 1).size).toBe(1)
    expect([...seriesFilter(c, 0)][0]).not.toBe([...seriesFilter(c, 1)][0])
    expect(dangling(c)).toEqual([])
    // the shared filter keeps the full shadow
    const f = filters(c)[0]
    expect(f.querySelectorAll('feOffset, feGaussianBlur, feFlood').length).toBe(
      3,
    )
    expect(f.getAttribute('filterUnits')).toBe('userSpaceOnUse')

    await c.updateSeries([{ data: data(20, 2) }, { data: data(20, 4) }])
    expect(filters(c).length).toBe(2)
    expect(dangling(c)).toEqual([])
    c.destroy()
  })

  it('a hover on one bar leaves the shared shadow on the rest', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const c = await chart(document.querySelector('#chart'))
    const b = bars(c)
    expect(filters(c).length).toBe(2)
    const shared = b[1].getAttribute('filter')
    c.w.interact.isTouchDevice = false // jsdom reports a touch device

    const g = c.ctx.graphics
    g.pathMouseEnter(b[0].instance, null)
    expect(b[0].getAttribute('filter')).not.toBe(shared)
    expect(b[1].getAttribute('filter')).toBe(shared)
    expect(dangling(c)).toEqual([])

    g.pathMouseLeave(b[0].instance, null)
    expect(b[0].getAttribute('filter')).toBe(shared)
    expect(filters(c).length).toBe(2)
    expect(dangling(c)).toEqual([])
    c.destroy()
  })

  it('a shared filter swept from the defs is rebuilt, not reused', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const c = await chart(document.querySelector('#chart'))
    const b = bars(c)
    // what fastUpdate's sweep does to a filter no mark references any more
    c.w.dom.baseEl
      .querySelector(b[0].getAttribute('filter').slice(4, -1))
      .remove()
    c.w.interact.isTouchDevice = false
    c.ctx.graphics.pathMouseLeave(b[0].instance, null)
    const id = b[0].getAttribute('filter').slice(5, -1)
    expect(c.w.dom.baseEl.querySelector(`defs filter[id="${id}"]`)).not.toBe(
      null,
    )
    c.destroy()
  })

  it('enabledOnSeries still leaves the other series unshadowed', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const c = await chart(document.querySelector('#chart'), {
      enabledOnSeries: [1],
    })
    expect(filters(c).length).toBe(1)
    expect(seriesFilter(c, 0)).toEqual(new Set([null]))
    expect(seriesFilter(c, 1).size).toBe(1)
    c.destroy()
  })

  it('two charts on one page keep their own filters', async () => {
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>'
    const a = await chart(document.querySelector('#a'))
    const b = await chart(document.querySelector('#b'))
    expect(filters(a).length).toBe(2)
    expect(filters(b).length).toBe(2)
    expect(filters(a)[0].id).not.toBe(filters(b)[0].id)
    expect(dangling(a)).toEqual([])
    expect(dangling(b)).toEqual([])
    a.destroy()
    b.destroy()
  })

  it('the exported copy carries every filter its marks name', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const c = await chart(document.querySelector('#chart'))
    // the node the exporter serializes (getSvgString is a parsererror in jsdom)
    const clone = c.w.dom.elWrap.cloneNode(true)
    c.ctx.exports.applyExportStyles(clone)
    const svg = new XMLSerializer().serializeToString(clone)
    const ids = new Set([...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]))
    const refs = [...svg.matchAll(/filter="url\(#([^)]+)\)"/g)].map((m) => m[1])
    expect(refs.length).toBe(40)
    expect(refs.filter((r) => !ids.has(r))).toEqual([])
    expect((svg.match(/<filter /g) || []).length).toBe(2)
    c.destroy()
  })
})
