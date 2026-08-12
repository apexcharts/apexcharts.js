/**
 * bar / pie <-> unit: the aggregate mark and the objects it stands for.
 *
 * An aggregate mark IS a quantity, and its extent is that quantity, so the
 * k-th object of a cluster leaves from the part of the shape that stood for it
 * rather than from one shared point. The same geometry runs both ways, so
 * explode and collapse are inverses.
 */

import ApexCharts from '../../src/entries/full.js'
import MorphTypeChange from '../../src/modules/MorphTypeChange.js'

function stubW() {
  return {
    config: {
      chart: {
        animations: {
          enabled: true,
          speed: 800,
          chartTypeMorph: { enabled: true, speed: 600 },
          respectReducedMotion: true,
        },
      },
    },
    globals: { previousPaths: [], dom: { baseEl: null } },
    layout: { translateX: 0, translateY: 0, gridWidth: 400, gridHeight: 300 },
  }
}

/** A morph instance holding one captured mark: a tall bar from y=100 to 300. */
function morphWithBar() {
  const w = stubW()
  const morph = new MorphTypeChange(w, {})
  morph._snapshot = {
    fromType: 'bar',
    toType: 'unit',
    mapping: new Map([
      ['0:0', { d: 'M 20 300 L 20 100 L 60 100 L 60 300 Z', fill: '#008FFB' }],
    ]),
    oldLayout: { translateX: 0, translateY: 0 },
  }
  return morph
}

/** The same, for a squat mark (wide and short) such as a pie wedge's box. */
function morphWithWedge() {
  const w = stubW()
  const morph = new MorphTypeChange(w, {})
  morph._snapshot = {
    fromType: 'pie',
    toType: 'unit',
    mapping: new Map([
      ['0:0', { d: 'M 100 200 L 300 200 L 300 260 L 100 260 Z', fill: '#f00' }],
    ]),
    oldLayout: { translateX: 0, translateY: 0 },
  }
  return morph
}

function unitChart(counts, extra = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    chart: { type: 'unit', width: 500, height: 400, animations: { enabled: false } },
    series: counts.map((n, i) => ({
      name: `S${i + 1}`,
      data: Array.from({ length: n }, (_, k) => ({ id: `s${i}-${k}` })),
    })),
    ...extra,
  })
  chart.render()
  return chart
}

describe('the objects come out of the part of the mark that stood for them', () => {
  it('a tall bar releases its objects along its own height, bottom-up', () => {
    const morph = morphWithBar()
    const n = 4
    const slots = Array.from({ length: n }, (_, j) =>
      morph.getInitialSlotFor(0, j, n),
    )

    // distinct heights, not one shared point
    const ys = slots.map((s) => s.y)
    expect(new Set(ys).size).toBe(n)
    // first object leaves from the base, last from the top
    expect(ys[0]).toBeGreaterThan(ys[n - 1])
    // evenly spread, inside the bar
    ys.forEach((y) => {
      expect(y).toBeGreaterThanOrEqual(100)
      expect(y).toBeLessThanOrEqual(300)
    })
    const gaps = ys.slice(1).map((y, i) => ys[i] - y)
    gaps.forEach((g) => expect(g).toBeCloseTo(gaps[0], 8))
    // all on the bar's centre line
    slots.forEach((s) => expect(s.x).toBeCloseTo(40, 8))
  })

  it('a squat mark releases them across its width instead', () => {
    const morph = morphWithWedge()
    const n = 5
    const slots = Array.from({ length: n }, (_, j) =>
      morph.getInitialSlotFor(0, j, n),
    )
    const xs = slots.map((s) => s.x)
    expect(new Set(xs).size).toBe(n)
    expect(xs[0]).toBeLessThan(xs[n - 1])
    slots.forEach((s) => expect(s.y).toBeCloseTo(230, 8))
  })

  it('a single object leaves from the centre', () => {
    const slot = morphWithBar().getInitialSlotFor(0, 0, 1)
    expect(slot).toEqual({ x: 40, y: 200 })
  })

  it('the slot is a pure function of (cluster, rank, count)', () => {
    const morph = morphWithBar()
    expect(morph.getInitialSlotFor(0, 2, 6)).toEqual(
      morph.getInitialSlotFor(0, 2, 6),
    )
  })

  it('an out-of-range rank is clamped rather than escaping the mark', () => {
    const morph = morphWithBar()
    const slot = morph.getInitialSlotFor(0, 99, 4)
    expect(slot.y).toBeGreaterThanOrEqual(100)
    expect(slot.y).toBeLessThanOrEqual(300)
  })

  it('returns null for a cluster the snapshot never captured', () => {
    expect(morphWithBar().getInitialSlotFor(7, 0, 3)).toBeNull()
  })
})

describe('a dot cloud collapses back into the mark that aggregates it', () => {
  it('captures one rect per cluster, covering that cluster only', () => {
    const chart = unitChart([6, 6])
    const morph = new MorphTypeChange(chart.w, chart.ctx)
    const { marks: captured } = morph._captureFromDOM('unit')

    expect(captured.length).toBe(2)
    expect(captured.map((c) => c.realIndex)).toEqual([0, 1])
    captured.forEach((c) => {
      expect(c.j).toBe(0)
      expect(c.d).toMatch(/^M [\d.-]+ [\d.-]+ L .* Z$/)
    })

    // each rect encloses its own cluster's dots and nothing else
    const dots = [...document.querySelectorAll('.apexcharts-unit-area')]
    const boxOf = (d) => {
      const n = d.match(/-?\d+(\.\d+)?/g).map(Number)
      const xs = n.filter((_, i) => i % 2 === 0)
      const ys = n.filter((_, i) => i % 2 === 1)
      return { x1: Math.min(...xs), x2: Math.max(...xs), y1: Math.min(...ys), y2: Math.max(...ys) }
    }
    captured.forEach((c) => {
      const box = boxOf(c.d)
      dots
        .filter((dot) => dot.getAttribute('i') === String(c.realIndex))
        .forEach((dot) => {
          const x = parseFloat(dot.getAttribute('cx'))
          const y = parseFloat(dot.getAttribute('cy'))
          expect(x).toBeGreaterThanOrEqual(box.x1)
          expect(x).toBeLessThanOrEqual(box.x2)
          expect(y).toBeGreaterThanOrEqual(box.y1)
          expect(y).toBeLessThanOrEqual(box.y2)
        })
    })
    chart.destroy()
  })

  it('a one-dot cluster still yields a drawable rect', () => {
    const chart = unitChart([1])
    const morph = new MorphTypeChange(chart.w, chart.ctx)
    const [c] = morph._captureFromDOM('unit').marks
    const n = c.d.match(/-?\d+(\.\d+)?/g).map(Number)
    const xs = n.filter((_, i) => i % 2 === 0)
    const ys = n.filter((_, i) => i % 2 === 1)
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(0)
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(0)
    chart.destroy()
  })

  it('maps the clusters onto an incoming bar\'s data points, in order', () => {
    const chart = unitChart([4, 7, 2])
    const morph = new MorphTypeChange(chart.w, chart.ctx)
    const { marks: captured } = morph._captureFromDOM('unit')
    const mapping = morph._buildMapping(captured, 'unit', 'bar', [
      { data: [4, 7, 2] },
    ])
    expect(mapping.size).toBe(3)
    expect(mapping.has('0:0')).toBe(true)
    expect(mapping.has('0:1')).toBe(true)
    expect(mapping.has('0:2')).toBe(true)
    chart.destroy()
  })

  it('maps them onto pie wedges too', () => {
    const chart = unitChart([4, 7])
    const morph = new MorphTypeChange(chart.w, chart.ctx)
    const { marks: captured } = morph._captureFromDOM('unit')
    const mapping = morph._buildMapping(captured, 'unit', 'pie', [4, 7])
    expect(mapping.size).toBe(2)
    expect(mapping.get('0:0').d).toBe(captured[0].d)
    chart.destroy()
  })

  it('accepts a multi-cluster unit chart as the target', () => {
    // A unit chart is one series per cluster. The shape check used to demand a
    // SINGLE series for every non-bar target, which rejected every real
    // multi-cluster unit chart: bar -> unit silently fell back to a plain
    // re-render, and no amount of per-row slotting could run. Every unit test
    // passed because they exercised the pieces directly; the browser found it.
    const morph = new MorphTypeChange(stubW(), {})
    const threeClusters = [
      { name: 'A', data: [{ id: 'a1' }, { id: 'a2' }] },
      { name: 'B', data: [{ id: 'b1' }] },
      { name: 'C', data: [{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }] },
    ]
    expect(morph.isCompatibleSeriesShape('bar', 'unit', threeClusters)).toBe(true)
    expect(morph.isCompatibleSeriesShape('pie', 'unit', threeClusters)).toBe(true)
    // the single-series and flat-number forms still work
    expect(
      morph.isCompatibleSeriesShape('bar', 'unit', [{ data: [1, 2] }]),
    ).toBe(true)
    expect(morph.isCompatibleSeriesShape('bar', 'unit', [4, 7, 2])).toBe(true)
    // and a radial target still requires the single-series form
    expect(morph.isCompatibleSeriesShape('bar', 'pie', threeClusters)).toBe(false)
    expect(morph.isCompatibleSeriesShape('bar', 'pie', [{ data: [1, 2] }])).toBe(
      true,
    )
  })

  it('accepts the pair in both directions', () => {
    const morph = new MorphTypeChange(stubW(), {})
    expect(morph.canMorphTypes('bar', 'unit')).toBe(true)
    expect(morph.canMorphTypes('unit', 'bar')).toBe(true)
    expect(morph.canMorphTypes('pie', 'unit')).toBe(true)
    expect(morph.canMorphTypes('unit', 'pie')).toBe(true)
    expect(morph.canMorphTypes('unit', 'unit')).toBe(false)
    // a unit chart's series is the object form, which the bar target accepts
    expect(
      morph.isCompatibleSeriesShape('unit', 'bar', [{ data: [1, 2, 3] }]),
    ).toBe(true)
    expect(morph.isCompatibleSeriesShape('unit', 'pie', [4, 7])).toBe(true)
  })
})

describe('explode and collapse are inverses', () => {
  it('the slots a bar releases sit inside the box the cloud collapses to', () => {
    const morph = morphWithBar()
    const n = 5
    const slots = Array.from({ length: n }, (_, j) =>
      morph.getInitialSlotFor(0, j, n),
    )
    const box = morph.getInitialBBoxFor(0)
    slots.forEach((s) => {
      expect(s.x).toBeGreaterThanOrEqual(box.x)
      expect(s.x).toBeLessThanOrEqual(box.x + box.width)
      expect(s.y).toBeGreaterThanOrEqual(box.y)
      expect(s.y).toBeLessThanOrEqual(box.y + box.height)
    })
  })

  it('rank order is preserved, so the same object leaves and returns alike', () => {
    const morph = morphWithBar()
    const before = [0, 1, 2, 3].map((j) => morph.getInitialSlotFor(0, j, 4).y)
    const after = [0, 1, 2, 3].map((j) => morph.getInitialSlotFor(0, j, 4).y)
    expect(after).toEqual(before)
    // monotonic in rank: object k is always below object k+1
    for (let k = 1; k < before.length; k++) {
      expect(before[k]).toBeLessThan(before[k - 1])
    }
  })
})

describe('nothing else changes', () => {
  it('bar -> pie still captures paths, not rects', () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'bar', width: 400, height: 300, animations: { enabled: false } },
      series: [{ name: 'A', data: [10, 20, 30] }],
    })
    chart.render()
    const morph = new MorphTypeChange(chart.w, chart.ctx)
    const { marks: captured } = morph._captureFromDOM('bar')
    expect(captured.length).toBe(3)
    captured.forEach((c) => expect(typeof c.d).toBe('string'))
    chart.destroy()
  })

  it('capturing a unit chart that has no dots yields nothing', () => {
    const chart = unitChart([0])
    const morph = new MorphTypeChange(chart.w, chart.ctx)
    expect(morph._captureFromDOM('unit').marks).toEqual([])
    chart.destroy()
  })
})
