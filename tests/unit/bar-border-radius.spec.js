import Helpers from '../../src/charts/common/bar/Helpers.js'
import Utils from '../../src/utils/Utils.js'

// ---------------------------------------------------------------------------
// Helper: create a minimal barCtx + w for Helpers instantiation
// ---------------------------------------------------------------------------
function createHelpers(overrides = {}) {
  const stacked = overrides.stacked ?? false
  const series = overrides.series || [[10, 20, 30]]

  const w = {
    config: {
      chart: { type: 'bar', stacked },
      plotOptions: {
        bar: {
          borderRadius: 5,
          borderRadiusApplication: 'end',
          borderRadiusWhenStacked: 'last',
        },
      },
    },
    globals: {
      dataPoints: series[0].length,
      minX: 0,
      maxX: series[0].length + 1,
      comboCharts: false,
      maxValsInArrayIndex: 0,
    },
    axisFlags: { isXNumeric: false },
    seriesData: {
      series,
      seriesX: series.map((s) => s.map((_, i) => i + 1)),
    },
  }

  const barCtx = {
    w,
    series: [],
    totalItems: 0,
    seriesLen: 0,
    visibleI: -1,
    visibleItems: 1,
    zeroSerieses: [],
  }

  const helpers = new Helpers(barCtx)
  return { helpers, w, barCtx }
}

// ===========================================================================
// TESTS
// ===========================================================================

describe('Bar borderRadius Safari workaround', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('non-stacked chart retains borderRadius when Safari is detected', () => {
    vi.spyOn(Utils, 'isSafari').mockReturnValue(true)

    const { helpers } = createHelpers({ stacked: false })
    helpers.initVariables([[10, 20, 30]])

    helpers.arrBorderRadius[0].forEach((val) => {
      expect(val).toBe('top')
    })
  })

  it('stacked chart disables borderRadius when Safari is detected', () => {
    vi.spyOn(Utils, 'isSafari').mockReturnValue(true)

    const series = [
      [10, 20, 30],
      [5, 15, 25],
    ]
    const { helpers } = createHelpers({ stacked: true, series })
    helpers.initVariables(series)

    helpers.arrBorderRadius.forEach((brArr) => {
      brArr.forEach((val) => {
        expect(val).toBe('none')
      })
    })
  })

  it('non-stacked chart retains borderRadius when not Safari', () => {
    vi.spyOn(Utils, 'isSafari').mockReturnValue(false)

    const { helpers } = createHelpers({ stacked: false })
    helpers.initVariables([[10, 20, 30]])

    helpers.arrBorderRadius[0].forEach((val) => {
      expect(val).toBe('top')
    })
  })

  it('stacked chart retains computed borderRadius when not Safari', () => {
    vi.spyOn(Utils, 'isSafari').mockReturnValue(false)

    const series = [
      [10, 20, 30],
      [5, 15, 25],
    ]
    const { helpers } = createHelpers({ stacked: true, series })
    helpers.initVariables(series)

    const allValues = helpers.arrBorderRadius.flat()
    const hasNonNone = allValues.some((val) => val !== 'none')
    expect(hasNonNone).toBe(true)
  })
})
