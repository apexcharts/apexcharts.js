/**
 * Tests for the feature registry (Phase F of the feature tree-shaking plan).
 *
 * Verifies that:
 *  - Charts render without crashing when optional features are not registered
 *  - ctx.<feature> is null (not undefined) for unregistered optional features
 *  - ctx.tooltip is always a Tooltip instance (tooltip is core, not optional)
 *  - registerFeatures() is idempotent
 *  - Export public API throws a descriptive error when Exports is not registered
 */

// Import the full entry so all chart types are registered.
// We selectively manipulate the feature registry (InitCtxVariables._featureRegistry)
// to test null-safety of optional features — chart types are unaffected.
import ApexCharts from '../../src/entries/standard.js'
import InitCtxVariables from '../../src/modules/helpers/InitCtxVariables.js'

// Individual feature constructors for selective registration.
import Tooltip from '../../src/modules/tooltip/Tooltip.js'
import Exports from '../../src/modules/Exports.js'
import Legend from '../../src/modules/legend/Legend.js'
import Toolbar from '../../src/modules/Toolbar.js'
import ZoomPanSelection from '../../src/modules/ZoomPanSelection.js'
import KeyboardNavigation from '../../src/modules/accessibility/KeyboardNavigation.js'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Snapshot the current registry so we can restore it after each test. */
function snapshotRegistry() {
  return new Map(InitCtxVariables._featureRegistry)
}

function restoreRegistry(snapshot) {
  InitCtxVariables._featureRegistry.clear()
  for (const [k, v] of snapshot) {
    InitCtxVariables._featureRegistry.set(k, v)
  }
}

function makeChart(overrides = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    chart: { type: 'line', animations: { enabled: false } },
    series: [{ data: [10, 20, 30] }],
    ...overrides,
  })
  chart.render()
  return chart
}

// ── Isolation ─────────────────────────────────────────────────────────────────

let registrySnapshot

beforeEach(() => {
  // Save the registry state before each test so we can restore it after.
  registrySnapshot = snapshotRegistry()
})

afterEach(() => {
  restoreRegistry(registrySnapshot)
})

// ── Feature-absent render tests ───────────────────────────────────────────────

describe('chart renders without optional features', () => {
  beforeEach(() => {
    // Clear everything — bare core, no features at all.
    InitCtxVariables._featureRegistry.clear()
  })

  it('renders with NO features registered', () => {
    expect(() => makeChart()).not.toThrow()
  })

  it('renders without Tooltip registered', () => {
    expect(() => makeChart()).not.toThrow()
  })

  it('renders without Exports registered', () => {
    expect(() => makeChart()).not.toThrow()
  })

  it('renders without Annotations registered', () => {
    expect(() => makeChart()).not.toThrow()
  })

  it('renders without Toolbar registered', () => {
    expect(() => makeChart()).not.toThrow()
  })

  it('renders without Legend registered', () => {
    expect(() =>
      makeChart({
        legend: { show: true },
        series: [
          { name: 'A', data: [1, 2, 3] },
          { name: 'B', data: [4, 5, 6] },
        ],
      }),
    ).not.toThrow()
  })

  it('renders without KeyboardNavigation registered', () => {
    expect(() => makeChart()).not.toThrow()
  })
})

// ── ctx null-safety ───────────────────────────────────────────────────────────

describe('ctx.<feature> is null when not registered', () => {
  beforeEach(() => {
    InitCtxVariables._featureRegistry.clear()
  })

  it('ctx.exports is null', () => {
    const chart = makeChart()
    expect(chart.ctx.exports).toBeNull()
  })

  it('ctx.legend is null', () => {
    const chart = makeChart()
    expect(chart.ctx.legend).toBeNull()
  })

  it('ctx.tooltip is always a Tooltip instance (tooltip is core, not optional)', () => {
    const chart = makeChart()
    expect(chart.ctx.tooltip).toBeInstanceOf(Tooltip)
  })

  it('ctx.toolbar is null', () => {
    const chart = makeChart()
    expect(chart.ctx.toolbar).toBeNull()
  })

  it('ctx.zoomPanSelection is null', () => {
    const chart = makeChart()
    expect(chart.ctx.zoomPanSelection).toBeNull()
  })

  it('ctx.keyboardNavigation is null', () => {
    const chart = makeChart()
    expect(chart.ctx.keyboardNavigation).toBeNull()
  })
})

// ── ctx non-null when registered ──────────────────────────────────────────────

describe('ctx.<feature> is an instance when registered', () => {
  it('ctx.tooltip is a Tooltip instance (always — tooltip is core)', () => {
    InitCtxVariables._featureRegistry.clear()
    const chart = makeChart()
    expect(chart.ctx.tooltip).toBeInstanceOf(Tooltip)
  })

  it('ctx.exports is an Exports instance', () => {
    InitCtxVariables._featureRegistry.clear()
    ApexCharts.registerFeatures({ exports: Exports })
    const chart = makeChart()
    expect(chart.ctx.exports).toBeInstanceOf(Exports)
  })

  it('ctx.legend is a Legend instance', () => {
    InitCtxVariables._featureRegistry.clear()
    ApexCharts.registerFeatures({ legend: Legend })
    const chart = makeChart()
    expect(chart.ctx.legend).toBeInstanceOf(Legend)
  })

  it('ctx.toolbar is a Toolbar instance (lazy getter)', () => {
    InitCtxVariables._featureRegistry.clear()
    ApexCharts.registerFeatures({
      toolbar: Toolbar,
      zoomPanSelection: ZoomPanSelection,
    })
    const chart = makeChart()
    // Accessing the getter triggers lazy instantiation.
    expect(chart.ctx.toolbar).toBeInstanceOf(Toolbar)
  })

  it('ctx.keyboardNavigation is a KeyboardNavigation instance (lazy getter)', () => {
    InitCtxVariables._featureRegistry.clear()
    ApexCharts.registerFeatures({ keyboardNavigation: KeyboardNavigation })
    const chart = makeChart()
    expect(chart.ctx.keyboardNavigation).toBeInstanceOf(KeyboardNavigation)
  })
})

// ── Export public API errors ──────────────────────────────────────────────────

describe('export API methods throw when Exports not registered', () => {
  beforeEach(() => {
    InitCtxVariables._featureRegistry.clear()
  })

  it('chart.dataURI() throws a descriptive error', () => {
    const chart = makeChart()
    expect(() => chart.dataURI()).toThrow(/Exports feature is not registered/)
  })

  it('chart.getSvgString() throws a descriptive error', () => {
    const chart = makeChart()
    expect(() => chart.getSvgString()).toThrow(
      /Exports feature is not registered/,
    )
  })

  it('chart.exportToCSV() throws a descriptive error', () => {
    const chart = makeChart()
    expect(() => chart.exportToCSV()).toThrow(
      /Exports feature is not registered/,
    )
  })
})

// ── registerFeatures idempotency ──────────────────────────────────────────────

describe('registerFeatures() idempotency', () => {
  it('registering the same feature twice does not throw', () => {
    expect(() => {
      ApexCharts.registerFeatures({ exports: Exports })
      ApexCharts.registerFeatures({ exports: Exports })
    }).not.toThrow()
  })

  it('re-registering overwrites with the same constructor (registry size unchanged)', () => {
    InitCtxVariables._featureRegistry.clear()
    ApexCharts.registerFeatures({ exports: Exports })
    const sizeAfterFirst = InitCtxVariables._featureRegistry.size
    ApexCharts.registerFeatures({ exports: Exports })
    expect(InitCtxVariables._featureRegistry.size).toBe(sizeAfterFirst)
  })

  it('registering multiple features in one call works', () => {
    InitCtxVariables._featureRegistry.clear()
    ApexCharts.registerFeatures({
      exports: Exports,
      legend: Legend,
    })
    expect(InitCtxVariables._featureRegistry.size).toBe(2)
  })
})

// ── Annotations null-safety in public API ────────────────────────────────────

describe('annotations public API is null-safe without Annotations registered', () => {
  beforeEach(() => {
    InitCtxVariables._featureRegistry.clear()
  })

  it('chart.addXaxisAnnotation() does not throw', () => {
    const chart = makeChart()
    expect(() =>
      chart.addXaxisAnnotation({ x: 1, label: { text: 'hi' } }),
    ).not.toThrow()
  })

  it('chart.addYaxisAnnotation() does not throw', () => {
    const chart = makeChart()
    expect(() => chart.addYaxisAnnotation({ y: 10 })).not.toThrow()
  })

  it('chart.addPointAnnotation() does not throw', () => {
    const chart = makeChart()
    expect(() => chart.addPointAnnotation({ x: 1, y: 10 })).not.toThrow()
  })

  it('chart.clearAnnotations() does not throw', () => {
    const chart = makeChart()
    expect(() => chart.clearAnnotations()).not.toThrow()
  })
})
