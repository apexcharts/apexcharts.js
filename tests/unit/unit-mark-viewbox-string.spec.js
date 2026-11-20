/**
 * A pictogram mark's viewBox in the string form an SVG attribute uses.
 *
 * Production report: `{ path, viewBox: '0 0 24 24' }` drew the glyph at about a
 * quarter of its size in the corner of its slot, with no warning. Only the
 * array form was read; anything else silently took the 0..100 default box.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils'
import '../../src/entries/unit.js'
import ApexCharts from '../../src/entries/standard.js'
import {
  normalizeUnitMark,
  parseUnitMarkViewBox,
  unregisterUnitMark,
} from '../../src/modules/UnitMarkRegistry.js'
import { definePictogram } from '../../src/pictograms/index.js'

// A 24-unit square that fills its own box.
const PATH = 'M0 0H24V24H0Z'

const scaleOf = (el) =>
  Number(/scale\(([\d.e-]+)\)/.exec(el.getAttribute('transform'))[1])

const chartWith = (mark) =>
  createChartWithOptions({
    chart: {
      type: 'unit',
      width: 520,
      height: 400,
      animations: { enabled: false },
    },
    series: [
      {
        name: 'A',
        data: [
          { id: 'a', mark },
          { id: 'b', mark },
        ],
      },
    ],
    plotOptions: {
      unit: { shape: 'pictogram', pictogram: { mark: 'circle' } },
    },
  })

afterEach(() => {
  unregisterUnitMark('vb-string')
  vi.restoreAllMocks()
})

describe('unit mark viewBox: the SVG string form', () => {
  it('reads space and comma separated strings as 4 numbers', () => {
    expect(parseUnitMarkViewBox('0 0 24 24')).toEqual([0, 0, 24, 24])
    expect(parseUnitMarkViewBox(' 0,0, 24 ,24 ')).toEqual([0, 0, 24, 24])
    expect(parseUnitMarkViewBox('-2 -2 28 28')).toEqual([-2, -2, 28, 28])
    expect(parseUnitMarkViewBox([0, 0, 24, 24])).toEqual([0, 0, 24, 24])
    expect(parseUnitMarkViewBox(undefined)).toEqual([0, 0, 100, 100])
    expect(
      normalizeUnitMark({ path: PATH, viewBox: '0 0 24 24' }).viewBox,
    ).toEqual([0, 0, 24, 24])
  })

  it('rejects anything that is not 4 numbers with a positive size', () => {
    expect(parseUnitMarkViewBox('0 0 24')).toBe(null)
    expect(parseUnitMarkViewBox('0 0 24 wide')).toBe(null)
    expect(parseUnitMarkViewBox('0 0 0 24')).toBe(null)
    expect(parseUnitMarkViewBox([0, 0, 24])).toBe(null)
    expect(parseUnitMarkViewBox({ w: 24 })).toBe(null)
    expect(normalizeUnitMark({ path: PATH, viewBox: '0 0 24' })).toBe(null)
  })

  it('a per-datum mark with a string viewBox draws at the same size as the array form', () => {
    const asArray = chartWith({ path: PATH, viewBox: [0, 0, 24, 24] })
    const asString = chartWith({ path: PATH, viewBox: '0 0 24 24' })
    const a = asArray.w.dom.baseEl.querySelector('path.apexcharts-unit-area')
    const s = asString.w.dom.baseEl.querySelector('path.apexcharts-unit-area')
    expect(s).not.toBe(null)
    // The bug: the string was ignored and the 0..100 box used, so the glyph
    // drew at 24/100 of the array form's scale.
    expect(scaleOf(s)).toBeCloseTo(scaleOf(a), 6)
    expect(s.getAttribute('transform')).toBe(a.getAttribute('transform'))
    asArray.destroy()
    asString.destroy()
  })

  it('registerUnitMark and definePictogram take the string form too', () => {
    ApexCharts.registerUnitMark('vb-string', {
      path: PATH,
      viewBox: '0 0 24 24',
    })
    const byName = createChartWithOptions({
      chart: {
        type: 'unit',
        width: 520,
        height: 400,
        animations: { enabled: false },
      },
      series: [2],
      labels: ['A'],
      plotOptions: {
        unit: { shape: 'pictogram', pictogram: { mark: 'vb-string' } },
      },
    })
    const ref = chartWith({ path: PATH, viewBox: [0, 0, 24, 24] })
    const g = byName.w.dom.baseEl.querySelector('path.apexcharts-unit-area')
    const r = ref.w.dom.baseEl.querySelector('path.apexcharts-unit-area')
    expect(scaleOf(g)).toBeCloseTo(scaleOf(r), 6)
    byName.destroy()
    ref.destroy()

    expect(
      definePictogram({ name: 'x', path: PATH, viewBox: '0 0 24 24' }).viewBox,
    ).toEqual([0, 0, 24, 24])
  })

  it('an unreadable inline viewBox warns once and draws the fallback, not a misplaced glyph', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const c = chartWith({ path: PATH, viewBox: '0 0 24' })
    expect(
      c.w.dom.baseEl.querySelectorAll('path.apexcharts-unit-area'),
    ).toHaveLength(0)
    expect(
      c.w.dom.baseEl.querySelectorAll('circle.apexcharts-unit-area'),
    ).toHaveLength(2)
    const msgs = warn.mock.calls
      .map((a) => String(a[0]))
      .filter((m) => m.includes('viewBox'))
    // Two datums share the bad mark: one warning, not one per unit.
    expect(msgs).toHaveLength(1)
    expect(msgs[0]).toContain('"0 0 24"')
    c.destroy()
  })

  it('warns once per chart, not again on each update of a live chart', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const bad = { path: PATH, viewBox: '0 0 24' }
    const c = chartWith(bad)
    // A Unit is made anew for every render, so a set held on it forgot what
    // it had said and every update warned again.
    for (let k = 0; k < 4; k++) {
      await c.updateSeries([
        { name: 'A', data: [{ id: 'a', mark: bad }, { id: 'u' + k, mark: bad }] },
      ])
    }
    const viewBoxWarnings = () =>
      warn.mock.calls.map((a) => String(a[0])).filter((m) => m.includes('"0 0 24"'))
    expect(
      c.w.dom.baseEl.querySelectorAll('circle.apexcharts-unit-area'),
    ).toHaveLength(2)
    expect(viewBoxWarnings()).toHaveLength(1)

    // Per chart: a second chart with the same bad mark says it once too.
    const other = chartWith(bad)
    expect(viewBoxWarnings()).toHaveLength(2)
    c.destroy()
    other.destroy()
  })

  it('an unknown mark name warns once per chart across updates', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const c = chartWith('no-such-mark')
    for (let k = 0; k < 3; k++) {
      await c.updateSeries([{ name: 'A', data: [{ id: 'a', mark: 'no-such-mark' }] }])
    }
    expect(
      warn.mock.calls.filter((a) => String(a[0]).includes('no mark named "no-such-mark"')),
    ).toHaveLength(1)
    c.destroy()
  })
})
