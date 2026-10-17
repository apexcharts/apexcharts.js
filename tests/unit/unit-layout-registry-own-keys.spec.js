/**
 * The named unit layout table resolves its OWN entries only.
 *
 * `plotOptions.unit.positions: '<name>'` is looked up in a globalThis table.
 * When that table was a plain object, a name that happens to live on
 * Object.prototype ('constructor', 'toString', 'valueOf', '__proto__') resolved
 * to a built-in function instead of "not registered": `Object(objects, rect)`
 * hands the objects back as positions, so every mark lost its x/y and vanished,
 * and the others drew a warning about the provider rather than the name. Such a
 * name must fall back to the grouped layout with
 * the usual unknown-layout warning, while real registrations keep working.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/entries/unit.js'
import ApexCharts from '../../src/entries/standard.js'
import {
  getUnitLayout,
  registerUnitLayout,
  unregisterUnitLayout,
} from '../../src/modules/UnitLayoutRegistry.js'
import {
  catalog,
  registerShapes,
  unregisterShapes,
  registeredShapeNames,
} from '../../src/unit-shapes/index.js'

const LAYOUT_KEY = '__apexcharts_unit_layouts__'
const INHERITED = [
  'constructor',
  'toString',
  'valueOf',
  'hasOwnProperty',
  'isPrototypeOf',
  '__proto__',
]

const ring = (objects, rect) => {
  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2
  const rad = Math.min(rect.width, rect.height) / 2 - 10
  return objects.map((o, i) => {
    const t = (i / objects.length) * Math.PI * 2
    return { id: o.id, x: cx + rad * Math.cos(t), y: cy + rad * Math.sin(t) }
  })
}

describe('unit layout registry: own entries only', () => {
  it('names inherited from Object.prototype resolve to nothing', () => {
    INHERITED.forEach((name) => {
      expect(getUnitLayout(name), name).toBe(null)
    })
  })

  it('a slot created as a plain object by another copy is still own-only', () => {
    const g = /** @type {any} */ (globalThis)
    const own = g[LAYOUT_KEY]
    // An older copy of the library may have created the shared slot as `{}`.
    // It is kept (the other copy holds no reference of its own to swap), so
    // the lookup itself has to ignore inherited names.
    g[LAYOUT_KEY] = { ring }
    try {
      expect(getUnitLayout('ring')).toBe(ring)
      INHERITED.forEach((name) => {
        expect(getUnitLayout(name), name).toBe(null)
      })
    } finally {
      g[LAYOUT_KEY] = own
    }
  })

  it('a user layout may take an inherited name and is gone once removed', () => {
    registerUnitLayout('toString', ring)
    expect(getUnitLayout('toString')).toBe(ring)
    unregisterUnitLayout('toString')
    expect(getUnitLayout('toString')).toBe(null)
  })

  it('registerUnitLayout and unregisterUnitLayout still round-trip', () => {
    ApexCharts.registerUnitLayout('ring', ring)
    expect(getUnitLayout('ring')).toBe(ring)
    ApexCharts.unregisterUnitLayout('ring')
    expect(getUnitLayout('ring')).toBe(null)
  })

  it('every catalog shape registers and resolves by its own name', () => {
    const names = registerShapes(catalog)
    expect(names).toHaveLength(catalog.length)
    catalog.forEach((shape) => {
      expect(getUnitLayout(shape.shape.name)).toBe(shape)
    })
    expect(registeredShapeNames()).toEqual(expect.arrayContaining(names))
    unregisterShapes(names)
    names.forEach((n) => expect(getUnitLayout(n)).toBe(null))
  })
})

describe('unit chart: an inherited name as positions', () => {
  let warnSpy
  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    warnSpy.mockRestore()
    ApexCharts.unregisterUnitLayout('ring')
  })

  const chartWith = (positions) =>
    createChartWithOptions({
      chart: { type: 'unit', width: 600, height: 400 },
      series: [6, 6],
      labels: ['A', 'B'],
      plotOptions: {
        unit: { layout: 'custom', positions, clusterLabels: { show: false } },
      },
    })

  const dots = (chart) =>
    [...chart.w.dom.baseEl.querySelectorAll('circle.apexcharts-unit-area')].map(
      (c) => [
        parseFloat(c.getAttribute('cx')),
        parseFloat(c.getAttribute('cy')),
      ],
    )

  it.each(['constructor', 'toString', 'valueOf', '__proto__'])(
    'positions: %s falls back to grouped with a warning',
    (name) => {
      const chart = chartWith(name)
      const placed = dots(chart)
      expect(placed).toHaveLength(12)
      placed.forEach(([x, y]) => {
        expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true)
      })
      expect(warnSpy.mock.calls.flat().join(' ')).toContain(
        `no layout named "${name}"`,
      )
      chart.destroy()
    },
  )

  it('a registered name still lays the marks out', () => {
    ApexCharts.registerUnitLayout('ring', ring)
    const chart = chartWith('ring')
    expect(dots(chart)).toHaveLength(12)
    expect(warnSpy.mock.calls.flat().join(' ')).not.toContain('no layout named')
    chart.destroy()
  })
})
