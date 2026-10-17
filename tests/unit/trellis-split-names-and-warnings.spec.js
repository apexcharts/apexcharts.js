/**
 * Trellis split: series naming, duplicate-x warnings and the tidy-row facet
 * key.
 *
 * - An unnamed reference series repeats in every panel, so it must carry ONE
 *   generated name everywhere (one colour, one legend entry, one toggle).
 * - A duplicate x is reported once per series name with a count, not once
 *   per duplicate per panel (a reference series is aligned once per panel).
 * - `trellis.data` with `by: 'name'` facets by the rows' `name` column; the
 *   series names still come from `seriesBy` (or the y column).
 */
import { describe, it, expect } from 'vitest'
import { split } from '../../src/modules/trellis/TrellisSplit'
import { pivotRows } from '../../src/modules/trellis/pivotRows'

describe('unnamed reference series', () => {
  it('gets one stable generated name across 1-D panels', () => {
    const res = split([
      { name: 'Rev', facet: 'North', data: [1, 2, 3] },
      { name: 'Rev', facet: 'South', data: [4, 5, 6] },
      { name: 'Rev', facet: 'East', data: [7, 8, 9] },
      { data: [5, 5, 5] },
    ])
    const refNames = res.panels.map((p) => p.series[1].name)
    expect(new Set(refNames).size).toBe(1)
    // Named after its host index, as the core names an unnamed series.
    expect(refNames[0]).toBe('series-4')
    expect(res.seriesNames).toEqual(['Rev', 'series-4'])
  })

  it('gets one stable generated name across 2-D panels', () => {
    const res = split(
      [
        { name: 'A', r: 'r1', c: 'c1', data: [1, 2] },
        { name: 'A', r: 'r1', c: 'c2', data: [1, 2] },
        { name: 'A', r: 'r2', c: 'c1', data: [1, 2] },
        { name: 'A', r: 'r2', c: 'c2', data: [1, 2] },
        { data: [3, 3] },
      ],
      { row: 'r', column: 'c' },
    )
    const refNames = res.panels.map((p) => p.series[p.series.length - 1].name)
    expect(new Set(refNames).size).toBe(1)
    expect(res.seriesNames).toEqual(['A', 'series-5'])
  })

  it('two different unnamed series stay distinct', () => {
    const res = split([
      { name: 'Rev', facet: 'North', data: [1, 2] },
      { data: [5, 5] },
      { data: [6, 6] },
    ])
    expect(res.panels[0].series.map((s) => s.name)).toEqual([
      'Rev',
      'series-2',
      'series-3',
    ])
  })
})

describe('duplicate-x warnings', () => {
  const dupData = (n) => {
    const d = [[1, 10]]
    for (let i = 0; i < n; i++) d.push([1, 10 + i])
    d.push([2, 20])
    return d
  }

  it('a repeated reference series warns once, with its duplicate count', () => {
    const panels = Array.from({ length: 40 }, (_, i) => ({
      name: 'Rev',
      facet: `P${i}`,
      data: [
        [1, i],
        [2, i],
      ],
    }))
    const res = split([...panels, { name: 'Target', data: dupData(200) }])
    const dupWarnings = res.warnings.filter((w) => /duplicate/.test(w))
    expect(dupWarnings).toHaveLength(1)
    expect(dupWarnings[0]).toContain('"Target"')
    expect(dupWarnings[0]).toContain('200')
    // The data still keeps the first value per x.
    expect(res.panels[7].series[1].data).toEqual([
      [1, 10],
      [2, 20],
    ])
  })

  it('same-named series in different panels fold into one warning', () => {
    const res = split([
      { name: 'Rev', facet: 'North', data: dupData(2) },
      { name: 'Rev', facet: 'South', data: dupData(3) },
      { name: 'Cost', facet: 'South', data: dupData(1) },
    ])
    const dupWarnings = res.warnings.filter((w) => /duplicate/.test(w))
    expect(dupWarnings).toHaveLength(2)
    expect(dupWarnings[0]).toContain('"Rev"')
    expect(dupWarnings[0]).toContain('5')
    expect(dupWarnings[1]).toContain('"Cost"')
    expect(dupWarnings[1]).toContain('1')
  })

  it('2-D grids report a repeated series once too', () => {
    const res = split(
      [
        { name: 'A', r: 'r1', c: 'c1', data: [[1, 1]] },
        { name: 'A', r: 'r2', c: 'c2', data: [[1, 1]] },
        { name: 'Ref', data: dupData(4) },
      ],
      { row: 'r', column: 'c' },
    )
    const dupWarnings = res.warnings.filter((w) => /duplicate/.test(w))
    expect(dupWarnings).toHaveLength(1)
    expect(dupWarnings[0]).toContain('4')
  })
})

describe("tidy rows faceted by a column that shares a series field's name", () => {
  const rows = [
    { name: 'Ana', product: 'Laptops', month: 'Jan', units: 3 },
    { name: 'Ana', product: 'Phones', month: 'Jan', units: 5 },
    { name: 'Ben', product: 'Laptops', month: 'Jan', units: 2 },
    { name: 'Ben', product: 'Phones', month: 'Feb', units: 4 },
  ]

  it("by: 'name' keeps the seriesBy names and still splits by person", () => {
    const spec = { by: 'name', x: 'month', y: 'units', seriesBy: 'product' }
    const { series, warnings } = pivotRows(rows, spec)
    expect(warnings).toEqual([])
    expect(series.map((s) => s.name)).toEqual([
      'Laptops',
      'Phones',
      'Laptops',
      'Phones',
    ])
    const res = split(series, spec)
    expect(res.panels.map((p) => p.key)).toEqual(['Ana', 'Ben'])
    expect(res.seriesNames).toEqual(['Laptops', 'Phones'])
    expect(res.panels[0].seriesNames).toEqual(['Laptops', 'Phones'])
  })

  it("by: 'data' facets without clobbering the data", () => {
    const tidy = rows.map((r) => ({ data: r.name, month: r.month, units: r.units }))
    const spec = { by: 'data', x: 'month', y: 'units' }
    const { series } = pivotRows(tidy, spec)
    expect(series[0].data).toEqual([{ x: 'Jan', y: 5 }])
    const res = split(series, spec)
    expect(res.panels.map((p) => p.key)).toEqual(['Ana', 'Ben'])
  })

  it("by: 'type' does not turn the facet value into a series type", () => {
    const tidy = rows.map((r) => ({ type: r.product, month: r.month, units: r.units }))
    const spec = { by: 'type', x: 'month', y: 'units' }
    const { series } = pivotRows(tidy, spec)
    series.forEach((s) => expect(s.type).toBeUndefined())
    const res = split(series, spec)
    expect(res.panels.map((p) => p.key)).toEqual(['Laptops', 'Phones'])
  })

  it("by: 'hidden' does not hide every series", () => {
    const tidy = rows.map((r) => ({ hidden: r.name, month: r.month, units: r.units }))
    const { series } = pivotRows(tidy, { by: 'hidden', x: 'month', y: 'units' })
    series.forEach((s) => expect(s.hidden).toBeUndefined())
  })

  it('a non-colliding by column still rides on the series under its own key', () => {
    const tidy = rows.map((r) => ({ person: r.name, month: r.month, units: r.units }))
    const { series } = pivotRows(tidy, { by: 'person', x: 'month', y: 'units' })
    expect(series[0]).toEqual({
      name: 'units',
      person: 'Ana',
      data: [{ x: 'Jan', y: 5 }],
    })
  })
})
