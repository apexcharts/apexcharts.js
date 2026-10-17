/**
 * The named pictogram mark table resolves its OWN entries only, like the unit
 * layout table. When it was a plain object, `pictogram.mark: 'constructor'`
 * (or 'valueOf' and the other Object.prototype names) resolved to a built-in
 * function: every unit drew as an empty path with no warning. Such a name must
 * fall back like any unknown name, and a mark registered under it still works.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import '../../src/entries/unit.js'
import ApexCharts from '../../src/entries/standard.js'
import {
  getUnitMark,
  registerUnitMark,
  unregisterUnitMark,
} from '../../src/modules/UnitMarkRegistry.js'

const INHERITED = ['constructor', 'toString', 'valueOf', 'hasOwnProperty']

let chart

afterEach(() => {
  chart?.destroy()
  chart = null
  vi.restoreAllMocks()
})

describe('unit mark registry: own entries only', () => {
  it('an inherited name is not a registered mark', () => {
    for (const n of INHERITED) expect(getUnitMark(n)).toBeNull()
  })

  it('a mark registered under an inherited name resolves', () => {
    registerUnitMark('valueOf', 'M0 0 L100 0 L100 100 Z')
    expect(getUnitMark('valueOf')?.path).toBe('M0 0 L100 0 L100 100 Z')
    unregisterUnitMark('valueOf')
    expect(getUnitMark('valueOf')).toBeNull()
  })

  it("a chart asking for mark 'constructor' falls back and warns", async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    document.body.innerHTML = '<div id="chart"></div>'
    chart = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'unit', width: 600, height: 400, animations: { enabled: false } },
      series: [6, 6],
      labels: ['A', 'B'],
      plotOptions: {
        unit: { shape: 'pictogram', pictogram: { mark: 'constructor', fallback: 'square' } },
      },
    })
    await chart.render()
    const ds = [...chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-area')]
    expect(ds.length).toBe(12)
    expect(ds.every((d) => d.tagName === 'rect')).toBe(true)
    expect(warn.mock.calls.some((c) => /no mark named "constructor"/.test(String(c[0])))).toBe(true)
  })
})
