import { describe, it, expect, vi, afterEach } from 'vitest'
// Deliberately NOT importing src/entries/icicle.js. That entry registers the
// type, which would make the branch under test unreachable from this file.
import { getChartClass } from '../../src/modules/ChartFactory.js'
import { RESERVED_TYPES } from '../../src/modules/settings/TypeAliases.js'

describe('getChartClass: the unregistered-type error', () => {
  it('does not offer the full bundle for an opt-in type', () => {
    // The whole point of the fix. "Load the full apexcharts.js instead" is the
    // usual escape hatch and is wrong for exactly these types, because the
    // default bundle carries no class for them. A reader who follows it
    // downloads a megabyte and gets this same error back.
    for (const type of RESERVED_TYPES) {
      let message = ''
      try {
        getChartClass(type)
      } catch (e) {
        message = e.message
      }

      expect(message).toContain(`chart type "${type}" is not registered`)
      expect(message).toContain(`import 'apexcharts/${type}'`)
      expect(message).toMatch(/opt-in/)
      expect(message).toMatch(/NOT in the full apexcharts\.js/)
      // The regression this file exists for.
      expect(message).not.toMatch(/load the full apexcharts\.js instead/)
    }
  })

  it('still offers the full bundle for an ordinary unregistered type', () => {
    // A type that is in the default bundle but missing here because the caller
    // assembled from apexcharts/core. For these the old advice is correct and
    // must survive.
    let message = ''
    try {
      getChartClass('definitely-not-registered')
    } catch (e) {
      message = e.message
    }

    expect(message).toContain('is not registered')
    expect(message).toContain('load the full apexcharts.js instead')
    expect(message).not.toMatch(/opt-in/)
  })

  it('does not tell a script-tag reader the sub-entry only works after core', () => {
    // A sub-entry registers onto whichever shared class is already present, so
    // it works after the full bundle too, which is what the samples in this
    // repo actually do. Naming apexcharts.core.js made that look unsupported.
    let message = ''
    try {
      getChartClass('definitely-not-registered')
    } catch (e) {
      message = e.message
    }

    expect(message).toContain('after the ApexCharts script')
    expect(message).not.toContain('after apexcharts.core.js')
  })

  describe('saying it, not only throwing it', () => {
    // render() keeps its own rejection handled, so on a page that does not
    // await render() the throw reaches nobody. The console line is the only
    // signal, and it must survive the minified bundle's drop_console, which is
    // why it goes through globalThis.console.
    afterEach(() => vi.restoreAllMocks())

    it('logs the same message it throws', () => {
      const error = vi
        .spyOn(globalThis.console, 'error')
        .mockImplementation(() => {})
      let thrown = ''
      try {
        getChartClass('missing-type-logged')
      } catch (e) {
        thrown = e.message
      }
      expect(error).toHaveBeenCalledTimes(1)
      expect(error.mock.calls[0][0]).toBe(thrown)
    })

    it('logs once per type, however many charts ask', () => {
      const error = vi
        .spyOn(globalThis.console, 'error')
        .mockImplementation(() => {})
      for (let i = 0; i < 3; i++) {
        expect(() => getChartClass('missing-type-once')).toThrow()
      }
      expect(() => getChartClass('missing-type-other')).toThrow()
      expect(error.mock.calls.map((c) => c[0].match(/"([^"]+)"/)[1])).toEqual([
        'missing-type-once',
        'missing-type-other',
      ])
    })

    it('reaches the console of a page that never awaits render()', async () => {
      const error = vi
        .spyOn(globalThis.console, 'error')
        .mockImplementation(() => {})
      // The bare core: no entry imported in this file, so even a built-in
      // type is unregistered here, which is a lean-core page that forgot it.
      const { default: ApexCharts } = await import('../../src/apexcharts.js')
      const el = document.createElement('div')
      document.body.appendChild(el)
      const chart = new ApexCharts(el, {
        chart: { type: 'radar' },
        series: [{ data: [1, 2, 3] }],
        labels: ['a', 'b', 'c'],
      })
      // A theme page calls render() and never looks at the promise. The line
      // is logged whether or not anyone does; the test waits for the promise
      // only to know the render has run, rather than guessing a delay that a
      // slow CI runner could outlast.
      await chart.render().catch(() => {})
      expect(error.mock.calls.flat().join(' ')).toContain(
        'chart type "radar" is not registered',
      )
      el.remove()
    })
  })

  it('returns the class when the type is registered', () => {
    expect(typeof getChartClass).toBe('function')
    expect(RESERVED_TYPES.length).toBeGreaterThan(0)
  })
})
