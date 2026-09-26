import { describe, it, expect } from 'vitest'
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

  it('returns the class when the type is registered', () => {
    expect(typeof getChartClass).toBe('function')
    expect(RESERVED_TYPES.length).toBeGreaterThan(0)
  })
})
