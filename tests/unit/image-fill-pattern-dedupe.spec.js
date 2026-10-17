import { describe, it, expect } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import './__mocks__/ResizeObserver.js'

// An image fill paints through one <pattern> per series. The dedupe lived on
// the Fill instance, but bars build a Fill per bar, so every bar appended its
// own copy of the pattern (all with the same id) and every updateSeries
// appended another set into the kept <defs>. The dedupe is now per <defs>.

const data = (n, k) => Array.from({ length: n }, (_, i) => i + k)

async function chart(el, extra = {}) {
  const c = new ApexCharts(el, {
    chart: {
      type: 'bar',
      width: 600,
      height: 300,
      animations: { enabled: false },
    },
    series: [{ data: data(20, 1) }, { data: data(20, 3) }],
    fill: { type: 'image', image: { src: ['a.png', 'b.png'] } },
    ...extra,
  })
  await c.render()
  return c
}

const patterns = (c) => c.w.dom.baseEl.querySelectorAll('defs pattern')

// every url(#id) a bar paints with names a pattern in this chart's defs
function danglingFills(c) {
  const ids = new Set(Array.from(patterns(c)).map((p) => p.id))
  return Array.from(c.w.dom.baseEl.querySelectorAll('.apexcharts-bar-area'))
    .map((p) => p.getAttribute('fill').slice(5, -1))
    .filter((id) => !ids.has(id))
}

describe('image fill patterns', () => {
  it('one pattern per series, not per bar, and none added by an update', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const c = await chart(document.querySelector('#chart'))
    expect(patterns(c).length).toBe(2)
    expect(danglingFills(c)).toEqual([])

    await c.updateSeries([{ data: data(20, 2) }, { data: data(20, 4) }])
    expect(patterns(c).length).toBe(2)
    expect(danglingFills(c)).toEqual([])

    // a full re-render draws into fresh defs, and still finds its patterns
    await c.updateOptions({ fill: { opacity: 0.8 } })
    expect(patterns(c).length).toBe(2)
    expect(danglingFills(c)).toEqual([])
    c.destroy()
  })

  it('two charts on one page keep their own pattern ids', async () => {
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>'
    const a = await chart(document.querySelector('#a'))
    const b = await chart(document.querySelector('#b'))
    expect(patterns(a).length).toBe(2)
    expect(patterns(b).length).toBe(2)
    expect(danglingFills(a)).toEqual([])
    expect(danglingFills(b)).toEqual([])
    const all = Array.from(document.querySelectorAll('defs pattern')).map(
      (p) => p.id,
    )
    expect(new Set(all).size).toBe(4)
    a.destroy()
    b.destroy()
  })
})
