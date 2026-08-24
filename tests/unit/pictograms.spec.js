/**
 * Mark lint for `apexcharts/pictograms`, plus the chart-side pictogram path.
 *
 * The same argument as the shape lint next door: a curated collection only
 * stays curated if quality is MECHANICAL. Judging twelve glyphs by eye is
 * feasible once; keeping them consistent as the set grows is not, and a
 * collection rots quietly - one glyph drawn at half the optical weight of the
 * rest, another with a stroke that a uniform `scale()` will thicken, a third
 * carrying an attribution that should never have entered the repo.
 *
 * The chart-side half asserts the two things the feature is FOR: that a glyph
 * costs one node and no filter, and that a glyph can vary per series and per
 * datum while circles and squares keep behaving exactly as they did.
 *
 * The path parser from `unit-shapes` is imported here for measurement only.
 * That is a test-time dependency, not a bundle one: the pictogram module ships
 * geometry, and nothing in it needs to parse a path at runtime.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  catalog,
  person,
  house,
  heart,
  definePictogram,
  registerMarks,
  unregisterMarks,
} from '../../src/pictograms/index.js'
import { flattenPath, boundsOf, signedArea } from '../../src/unit-shapes/engine/path.js'
import { getUnitMark, unregisterUnitMark } from '../../src/modules/UnitMarkRegistry.js'
import { createChartWithOptions } from './utils/utils'
import ApexCharts from '../../src/entries/full.js'

const MARKS_DIR = join(process.cwd(), 'src/pictograms/marks')
const CATEGORIES = ['people', 'nature', 'objects', 'transport', 'symbols']

const unitChart = (unit, series) =>
  createChartWithOptions({
    chart: { type: 'unit', width: 520, height: 400, animations: { enabled: false } },
    series: series || [30, 20],
    labels: ['A', 'B'],
    plotOptions: { unit },
  })

const areas = (c, sel = '.apexcharts-unit-area') =>
  [...c.w.dom.baseEl.querySelectorAll(sel)]

describe('pictograms : catalog hygiene', () => {
  it('every mark carries the metadata the lint depends on', () => {
    catalog.forEach((m) => {
      expect(m.name).toMatch(/^[a-z][a-z0-9-]*$/)
      expect(CATEGORIES).toContain(m.category)
      // Only 'original' and 'generated' are permitted. A third value means
      // someone brought an outline in from outside, and THAT is the decision to
      // revisit - not this assertion.
      expect(['original', 'generated']).toContain(m.source)
      expect(typeof m.path).toBe('string')
      expect(m.path.length).toBeGreaterThan(20)
      expect(m.viewBox).toHaveLength(4)
    })
  })

  it('names are unique, and the mark object is frozen', () => {
    const names = catalog.map((m) => m.name)
    expect(new Set(names).size).toBe(names.length)
    expect(Object.isFrozen(catalog[0])).toBe(true)
  })

  it('no mark carries an attribution, because none may need one', () => {
    // Every outline in this catalog is drawn here. A licence header, a
    // copyright line or a credit would mean one is not, which is a provenance
    // problem rather than a documentation one.
    readdirSync(MARKS_DIR).forEach((f) => {
      const src = readFileSync(join(MARKS_DIR, f), 'utf8')
      expect(src).not.toMatch(/\b(licen[cs]e|attribution|copyright|\(c\)\s*\d{4})\b/i)
    })
  })

  it('every mark is annotated pure, so importing one does not ship all', () => {
    readdirSync(MARKS_DIR).forEach((f) => {
      const src = readFileSync(join(MARKS_DIR, f), 'utf8')
      expect(src).toMatch(/\/\* @__PURE__ \*\/ definePictogram\(/)
    })
  })

  it('the catalog, the public exports and the .d.ts all agree', () => {
    const files = readdirSync(MARKS_DIR)
      .filter((f) => f.endsWith('.js'))
      .map((f) => f.replace(/\.js$/, ''))
      .sort()
    const inCatalog = catalog.map((m) => m.name).sort()
    const index = readFileSync(join(process.cwd(), 'src/pictograms/index.js'), 'utf8')
    const exported = [...index.matchAll(/export \{ (\w+) \} from '\.\/marks\//g)]
      .map((m) => m[1])
      .sort()
    const dts = readFileSync(join(process.cwd(), 'types/pictograms.d.ts'), 'utf8')
    const declared = [...dts.matchAll(/export declare const (\w+): ApexPictogram\b/g)]
      .map((m) => m[1])
      .filter((n) => n !== 'catalog')
      .sort()

    expect(inCatalog).toEqual(files)
    expect(exported).toEqual(files)
    expect(declared).toEqual(files)
  })
})

describe('pictograms : geometry lint', () => {
  it('every outline closes, and stays inside its declared viewBox', () => {
    catalog.forEach((m) => {
      const polys = flattenPath(m.path, 0.4)
      expect(polys.length, m.name).toBeGreaterThan(0)
      const b = boundsOf(polys)
      const [vx, vy, vw, vh] = m.viewBox
      // A small tolerance: flattening a curve can overshoot its control hull by
      // a fraction of the tolerance.
      expect(b.x0, m.name).toBeGreaterThanOrEqual(vx - 1)
      expect(b.y0, m.name).toBeGreaterThanOrEqual(vy - 1)
      expect(b.x1, m.name).toBeLessThanOrEqual(vx + vw + 1)
      expect(b.y1, m.name).toBeLessThanOrEqual(vy + vh + 1)
    })
  })

  it('every glyph fills its box in at least one dimension', () => {
    // Optical consistency across the set. A glyph drawn at 60% of the box while
    // its neighbours fill it reads as a different, smaller thing in the same
    // chart - and the chart has no way to know.
    catalog.forEach((m) => {
      const b = boundsOf(flattenPath(m.path, 0.4))
      const [, , vw, vh] = m.viewBox
      const fill = Math.max((b.x1 - b.x0) / vw, (b.y1 - b.y0) / vh)
      expect(fill, m.name).toBeGreaterThan(0.8)
    })
  })

  it('every subpath is wound with its outline, so none is an accidental hole', () => {
    // A subpath wound the wrong way still renders under a nonzero fill when it
    // does not overlap - it just becomes a hole the moment it does. The winding
    // script (`scripts/unit-shape-winding.mjs`) exists for this, and this is it
    // as a gate.
    catalog.forEach((m) => {
      const polys = flattenPath(m.path, 0.4)
      if (polys.length < 2) return
      const sign = Math.sign(signedArea(polys[0]))
      polys.slice(1).forEach((p, k) => {
        expect(Math.sign(signedArea(p)), `${m.name} subpath ${k + 1}`).toBe(sign)
      })
    })
  })

  it('no glyph carries a stroke, which a uniform scale would thicken', () => {
    readdirSync(MARKS_DIR).forEach((f) => {
      const src = readFileSync(join(MARKS_DIR, f), 'utf8')
      expect(src).not.toMatch(/stroke(-width|Width)?\s*:/)
    })
  })
})

describe('pictograms : the object model', () => {
  it('.with() returns a variant and leaves the original alone', () => {
    const v = person.with({ name: 'worker' })
    expect(v.name).toBe('worker')
    expect(v.path).toBe(person.path)
    expect(person.name).toBe('person')
  })

  it('definePictogram defaults the viewBox to the catalog convention', () => {
    const m = definePictogram({ name: 'x', path: 'M 0 0 L 10 0 L 10 10 Z' })
    expect(m.viewBox).toEqual([0, 0, 100, 100])
  })

  it('registerMarks writes the slot the chart reads', () => {
    // The module registers by writing `globalThis` directly rather than
    // importing the chart. This asserts the two ends agree, so that coupling
    // cannot rot silently.
    registerMarks([person])
    expect(getUnitMark('person')).toBe(person)
    unregisterMarks(['person'])
    expect(getUnitMark('person')).toBe(null)
  })
})

describe('unit chart : pictogram marks', () => {
  afterEach(() => {
    unregisterUnitMark('person')
    unregisterUnitMark('house')
  })

  it('draws one <path> per unit, and no recolour filter at all', () => {
    const c = unitChart({ shape: 'pictogram', pictogram: { mark: person } })
    expect(areas(c, 'path.apexcharts-unit-area')).toHaveLength(50)
    expect(areas(c, 'circle.apexcharts-unit-area')).toHaveLength(0)
    expect(areas(c, 'image.apexcharts-unit-area')).toHaveLength(0)
    // The perf contract, asserted structurally: a filter forces an offscreen
    // surface per element on every paint, and avoiding it is the whole reason
    // a pictogram is drawn rather than fetched.
    expect(
      c.w.dom.baseEl.querySelectorAll('filter[id^="apexcharts-unit-tint-"]'),
    ).toHaveLength(0)
    c.destroy()
  })

  it('keeps the tooltip contract every mark shares', () => {
    const c = unitChart({ shape: 'pictogram', pictogram: { mark: person } })
    areas(c).forEach((el) => {
      expect(el.classList.contains('apexcharts-unit-area')).toBe(true)
      expect(el.getAttribute('i')).not.toBe(null)
      expect(el.getAttribute('j')).not.toBe(null)
    })
    c.destroy()
  })

  it('positions by transform, one attribute instead of two', () => {
    const c = unitChart({ shape: 'pictogram', pictogram: { mark: person } })
    const el = areas(c)[0]
    expect(el.getAttribute('transform')).toMatch(
      /^translate\(-?[\d.]+,-?[\d.]+\) scale\([\d.]+\)$/,
    )
    expect(el.getAttribute('cx')).toBe(null)
    expect(el.getAttribute('cy')).toBe(null)
    c.destroy()
  })

  it('sizes the glyph from the lattice, so a swap never re-flows the chart', () => {
    const scaleOf = (el) => Number(/scale\(([\d.]+)\)/.exec(el.getAttribute('transform'))[1])
    const mk = (w) =>
      createChartWithOptions({
        chart: { type: 'unit', width: w, height: 400, animations: { enabled: false } },
        series: [30, 20],
        labels: ['A', 'B'],
        plotOptions: { unit: { shape: 'pictogram', pictogram: { mark: person } } },
      })
    const small = mk(360)
    const large = mk(720)
    const sSmall = scaleOf(areas(small)[0])
    const sLarge = scaleOf(areas(large)[0])
    expect(sLarge).toBeGreaterThan(sSmall)
    // Uniform render: every glyph shares one scale.
    expect(new Set(areas(large).map(scaleOf)).size).toBe(1)
    small.destroy()
    large.destroy()
  })

  it('takes a mark per series from an array', () => {
    const c = unitChart({ shape: 'pictogram', pictogram: { mark: [person, house] } })
    const s0 = areas(c, '.apexcharts-series[rel="1"] path.apexcharts-unit-area')
    const s1 = areas(c, '.apexcharts-series[rel="2"] path.apexcharts-unit-area')
    expect(s0[0].getAttribute('d')).toBe(person.path)
    expect(s1[0].getAttribute('d')).toBe(house.path)
    c.destroy()
  })

  it("a datum's own mark overrides the series one, as fillColor does", () => {
    const c = unitChart(
      { shape: 'pictogram', pictogram: { mark: person } },
      [{ name: 'A', data: [{ id: 'a' }, { id: 'b', mark: house, fillColor: '#ff0000' }] }],
    )
    const els = areas(c)
    expect(els[0].getAttribute('d')).toBe(person.path)
    expect(els[1].getAttribute('d')).toBe(house.path)
    expect(els[1].getAttribute('fill')).toBe('#ff0000')
    c.destroy()
  })

  it('resolves a mark by registered name', () => {
    ApexCharts.registerUnitMark('person', person.path)
    const c = unitChart({ shape: 'pictogram', pictogram: { mark: 'person' } })
    expect(areas(c, 'path.apexcharts-unit-area')).toHaveLength(50)
    c.destroy()
  })

  it('an unknown mark warns ONCE and falls back rather than dropping data', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const c = unitChart({ shape: 'pictogram', pictogram: { mark: 'nope' } })
    expect(areas(c, 'circle.apexcharts-unit-area')).toHaveLength(50)
    expect(
      warn.mock.calls.filter((a) => String(a[0]).includes('no mark named "nope"')),
    ).toHaveLength(1)
    warn.mockRestore()
    c.destroy()
  })

  it('mixes glyphs and circles in one population, each on its own slot', () => {
    // The regression test for the whole placement refactor: before the spec
    // seam, positioning was one chart-wide decision, and a render where dot 3
    // is a <circle> and dot 4 a <path> had no such thing.
    // A per-series array with a gap: series 0 draws glyphs, series 1 has no
    // mark and falls back to circles.
    const c = unitChart({
      shape: 'pictogram',
      pictogram: { mark: [person, null], fallback: 'circle' },
    })
    const paths = areas(c, 'path.apexcharts-unit-area')
    const circles = areas(c, 'circle.apexcharts-unit-area')
    expect(paths).toHaveLength(30)
    expect(circles).toHaveLength(20)
    const tx = /translate\((-?[\d.]+),(-?[\d.]+)\)/.exec(paths[0].getAttribute('transform'))
    const s = Number(/scale\(([\d.]+)\)/.exec(paths[0].getAttribute('transform'))[1])
    // Recover the glyph's centre and check it is a real, distinct slot.
    const gx = Number(tx[1]) + 50 * s
    const gy = Number(tx[2]) + 50 * s
    expect(Number.isFinite(gx)).toBe(true)
    expect(Math.abs(gx - Number(circles[0].getAttribute('cx')))).toBeGreaterThan(1)
    c.destroy()
  })

  it('stamps data:r, which the morph capture reads off a transformed glyph', () => {
    const c = unitChart({ shape: 'pictogram', pictogram: { mark: person } })
    expect(Number(areas(c)[0].getAttribute('data:r'))).toBeGreaterThan(0)
    c.destroy()
  })

  it('honours padding and scale without moving the slots', () => {
    const centre = (el) => {
      const m = /translate\((-?[\d.]+),(-?[\d.]+)\) scale\(([\d.]+)\)/.exec(
        el.getAttribute('transform'),
      )
      return { x: +m[1] + 50 * +m[3], y: +m[2] + 50 * +m[3], s: +m[3] }
    }
    const plain = unitChart({ shape: 'pictogram', pictogram: { mark: person } })
    const padded = unitChart({
      shape: 'pictogram',
      pictogram: { mark: person, padding: 0.4 },
    })
    const a = centre(areas(plain)[0])
    const b = centre(areas(padded)[0])
    expect(b.s).toBeLessThan(a.s)
    // Padding shrinks the glyph, it does not move the lattice.
    expect(Math.abs(b.x - a.x)).toBeLessThan(0.01)
    plain.destroy()
    padded.destroy()
  })
})
