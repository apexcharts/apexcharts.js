import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
// Deliberately NOT importing any entry. An entry registers its types, which
// would make the branch under test unreachable from this file.
import { getChartClass } from '../../src/modules/ChartFactory.js'
import { RESERVED_TYPES } from '../../src/modules/settings/TypeAliases.js'

/** The message getChartClass throws for `type`, or '' if it does not throw. */
function messageFor(type, requested) {
  try {
    getChartClass(type, requested)
  } catch (e) {
    return e.message
  }
  return ''
}

// Each type is logged once per page, so a test that reads the console has to
// start from a page that has not logged it yet.
beforeEach(() => globalThis.__apexcharts_missing_types__.clear())

describe('getChartClass: the unregistered-type error', () => {
  it('reserves the types the default bundle does not carry', () => {
    expect(RESERVED_TYPES).toEqual(
      expect.arrayContaining(['icicle', 'unit', 'sunburst', 'violin']),
    )
  })

  it.each(RESERVED_TYPES)(
    'sends a missing %s to its own file or the full bundle, never the default one',
    (type) => {
      // Loading apexcharts.min.js instead is the usual escape hatch and is
      // wrong for exactly these types: the default bundle carries no class for
      // them, so a reader who follows it meets this same error again.
      const message = messageFor(type)
      expect(message).toContain(`chart type "${type}" is not registered`)
      expect(message).toContain(`import 'apexcharts/${type}'`)
      expect(message).toContain("import ApexCharts from 'apexcharts/full'")
      expect(message).toContain(`<script src=".../dist/${type}.js">`)
      expect(message).toContain('or load apexcharts.full.min.js instead')
      expect(message).toContain('not in the default apexcharts.min.js')
      expect(message).not.toMatch(/load the default apexcharts\.min\.js/)
    },
  )

  it('sends an ordinary missing type to the default bundle', () => {
    // A type the default bundle has, missing only because the page assembled
    // from the lean core. The default bundle is the smaller fix.
    const message = messageFor('radar')
    expect(message).toContain('chart type "radar" is not registered')
    expect(message).toContain("import 'apexcharts/radar'")
    expect(message).toContain('or load the default apexcharts.min.js instead')
    expect(message).not.toContain('apexcharts/full')
  })

  it('names a waffle as a waffle, and the unit file it needs', () => {
    const message = messageFor('unit', 'waffle')
    expect(message).toContain(
      'chart type "waffle" is not registered (it draws through "unit")',
    )
    expect(message).toContain("import 'apexcharts/unit'")
    expect(message).toContain('<script src=".../dist/unit.js">')
  })

  it('names a raincloud as a raincloud, with both files it needs, violin first', () => {
    const message = messageFor('violin', 'raincloud')
    expect(message).toContain(
      'chart type "raincloud" is not registered (it draws through "violin")',
    )
    expect(message).toContain("import 'apexcharts/raincloud'")
    expect(message).toContain(
      '<script src=".../dist/violin.js"> and <script src=".../dist/features/raincloud.js">',
    )
  })

  // Core asks for the class of a renderer family member (barStacked, rangeBar)
  // that has no entry or file of its own: dist/bar.js registers them all.
  it.each(['barStacked', 'rangeBar'])(
    'points a missing %s at the bar entry and file, which exist',
    (type) => {
      const message = messageFor(type)
      expect(message).toContain("import 'apexcharts/bar'")
      expect(message).toContain('<script src=".../dist/bar.js">')
      expect(message).not.toContain(`dist/${type}.js`)
      expect(message).not.toContain(`'apexcharts/${type}'`)
    },
  )

  it('names a waterfall as a waterfall, with the bar file then its feature', () => {
    const message = messageFor('rangeBar', 'waterfall')
    expect(message).toContain(
      'chart type "waterfall" is not registered (it draws through "rangeBar")',
    )
    expect(message).toContain("import 'apexcharts/waterfall'")
    expect(message).toContain(
      '<script src=".../dist/bar.js"> and <script src=".../dist/features/waterfall.js">',
    )
  })

  it('names a streamgraph although core asks for its renderer as line', () => {
    const message = messageFor('line', 'streamgraph')
    expect(message).toContain(
      'chart type "streamgraph" is not registered (it draws through "line")',
    )
    expect(message).toContain("import 'apexcharts/streamgraph'")
    expect(message).toContain(
      '<script src=".../dist/line.js"> and <script src=".../dist/features/streamgraph.js">',
    )
  })

  it('ignores a requested type that does not draw through this one', () => {
    // A funnel chart with a violin series: the funnel is not what is missing.
    const message = messageFor('violin', 'funnel')
    expect(message).toContain('chart type "violin" is not registered.')
    expect(message).not.toContain('funnel')
  })

  it('does not tell a script-tag reader the sub-entry only works after core', () => {
    // A sub-entry registers onto whichever shared class is already present, so
    // it works after the default bundle too, which is what the samples in this
    // repo do. Naming apexcharts.core.js made that look unsupported.
    const message = messageFor('definitely-not-registered')
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
      const thrown = messageFor('missing-type-logged')
      expect(error).toHaveBeenCalledTimes(1)
      expect(error.mock.calls[0][0]).toBe(thrown)
    })

    it('logs once per name, however many charts ask', () => {
      const error = vi
        .spyOn(globalThis.console, 'error')
        .mockImplementation(() => {})
      for (let i = 0; i < 3; i++) {
        expect(() => getChartClass('missing-type-once')).toThrow()
      }
      expect(() => getChartClass('missing-type-other')).toThrow()
      // A raincloud and a plain violin are different lines to fix.
      expect(() => getChartClass('violin', 'raincloud')).toThrow()
      expect(() => getChartClass('violin')).toThrow()
      expect(error.mock.calls.map((c) => c[0].match(/"([^"]+)"/)[1])).toEqual([
        'missing-type-once',
        'missing-type-other',
        'raincloud',
        'violin',
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

    it('a violin without the bar renderer it draws on names the bar import', async () => {
      // Violin takes the page's bar renderer as its parent instead of
      // bundling one, so the lean core without apexcharts/bar fails loudly.
      const error = vi
        .spyOn(globalThis.console, 'error')
        .mockImplementation(() => {})
      const { register, unregister } =
        await import('../../src/modules/ChartFactory.js')
      const { default: Violin } = await import('../../src/charts/Violin.js')
      const { default: ApexCharts } = await import('../../src/apexcharts.js')
      register({ violin: Violin })
      const el = document.createElement('div')
      document.body.appendChild(el)
      try {
        const chart = new ApexCharts(el, {
          chart: { type: 'violin' },
          series: [
            {
              name: 'A',
              data: [
                {
                  x: 'G',
                  y: [
                    [1, 0.2],
                    [2, 0.5],
                    [3, 0.2],
                  ],
                  points: [1, 2, 3],
                },
              ],
            },
          ],
        })
        await chart.render().catch(() => {})
        const logged = error.mock.calls.flat().join(' ')
        expect(logged).toContain('chart type "bar" is not registered')
        expect(logged).toContain("import 'apexcharts/bar'")
      } finally {
        unregister('violin')
        el.remove()
      }
    })

    it('names the alias a page asked for when its renderer is missing', async () => {
      const error = vi
        .spyOn(globalThis.console, 'error')
        .mockImplementation(() => {})
      vi.spyOn(globalThis.console, 'warn').mockImplementation(() => {})
      const { default: ApexCharts } = await import('../../src/apexcharts.js')
      const el = document.createElement('div')
      document.body.appendChild(el)
      const chart = new ApexCharts(el, {
        chart: { type: 'waffle' },
        series: [{ name: 'A', data: [40] }],
      })
      await chart.render().catch(() => {})
      expect(error.mock.calls.flat().join(' ')).toContain(
        'chart type "waffle" is not registered (it draws through "unit")',
      )
      el.remove()
    })
  })
})
