/**
 * An xaxis update on a category chart keeps the category names.
 *
 * Line and area charts, and columns with `tickPlacement: 'on'`, draw a
 * category axis as numbers (`convertedCatToNumeric`; a column's default
 * 'between' placement keeps a real category axis and never had this bug).
 * After that conversion the names live only in the label
 * formatter the conversion builds: `xaxis.categories` is emptied. Any
 * `updateOptions({ xaxis })` used to convert the PAYLOAD again, found no names
 * in it, and merged a plain number formatter plus `categories: []` over the
 * chart's: a bound, a label style, even `xaxis: {}` turned Mon, Tue, Wed into
 * 1, 2, 3 and dropped the user's own formatter.
 */
import { describe, it, expect } from 'vitest'
import ApexCharts from '../../src/entries/full.js'
import './__mocks__/ResizeObserver.js'

const CASES = {
  line: { type: 'line' },
  area: { type: 'area' },
  "column, tickPlacement 'on'": { type: 'bar', xaxis: { tickPlacement: 'on' } },
}

async function chart(id, xaxis = {}) {
  const c0 = CASES[id]
  document.body.innerHTML = '<div id="chart" />'
  const c = new ApexCharts(document.querySelector('#chart'), {
    chart: { type: c0.type, height: 200, animations: { enabled: false } },
    series: [{ name: 'A', data: [3, 5, 2] }],
    xaxis: { categories: ['Mon', 'Tue', 'Wed'], ...c0.xaxis, ...xaxis },
  })
  await c.render()
  return c
}

/** The label each category slot (1, 2, 3) is drawn with. */
const names = (c) => [1, 2, 3].map((i) => c.w.config.xaxis.labels.formatter(i))

describe.each(Object.keys(CASES))('%s', (type) => {
  it('draws the axis as numbers, which is what this is about', async () => {
    expect((await chart(type)).w.config.xaxis.convertedCatToNumeric).toBe(true)
  })

  it.each([
    ['a bound reset', { xaxis: { min: undefined } }],
    ['a label style', { xaxis: { labels: { rotate: -30 } } }],
    ['a tick amount', { xaxis: { tickAmount: 2 } }],
    ['an empty xaxis', { xaxis: {} }],
  ])('keeps the names through %s', async (_label, payload) => {
    const c = await chart(type)
    await c.updateOptions(payload)
    expect(names(c)).toEqual(['Mon', 'Tue', 'Wed'])
  })

  it("keeps the user's formatter too", async () => {
    const c = await chart(type, { labels: { formatter: (v) => `d:${v}` } })
    await c.updateOptions({ xaxis: { labels: { rotate: -30 } } })
    expect(names(c)).toEqual(['d:Mon', 'd:Tue', 'd:Wed'])
  })

  it('applies a new formatter to the names the chart already has', async () => {
    const c = await chart(type)
    await c.updateOptions({ xaxis: { labels: { formatter: (v) => `f:${v}` } } })
    expect(names(c)).toEqual(['f:Mon', 'f:Tue', 'f:Wed'])
  })

  it('still takes new names, and an empty list still clears them', async () => {
    const c = await chart(type)
    await c.updateOptions({ xaxis: { categories: ['A1', 'B1', 'C1'] } })
    expect(names(c)).toEqual(['A1', 'B1', 'C1'])
    await c.updateOptions({ xaxis: { categories: [] } })
    expect(names(c)).toEqual([1, 2, 3])
  })
})
