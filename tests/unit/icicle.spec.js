import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
// The icicle is opt-in, so the full bundle the shared helper mounts through
// does NOT register it. Importing the entry registers the type globally.
import ApexCharts from '../../src/entries/icicle.js'
import { createChartWithOptions } from './utils/utils.js'
import {
  bandScale,
  farEdge,
  focusChain,
  parseSize,
  placeSubtree,
  placeTree,
  resolveFocus,
  sortTree,
  validateStrict,
} from '../../src/charts/common/partition/Partition.js'
import { colorPass, lighten } from '../../src/charts/common/partition/Tint.js'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TREE = [
  {
    data: [
      {
        x: 'Tech',
        children: [
          { x: 'Software', y: 300 },
          { x: 'Hardware', y: 100 },
        ],
      },
      {
        x: 'Energy',
        children: [
          { x: 'Oil', y: 60 },
          { x: 'Solar', y: 40 },
        ],
      },
    ],
  },
]

/** A tree straight from the resolver's output shape, for the pure tests. */
function node(name, value, children) {
  return { name, value, _key: `/${name}`, children }
}

function tree() {
  return [
    node('A', null, [node('A1', 30), node('A2', 10)]),
    node('B', null, [node('B1', 60)]),
  ]
}

/** Fill values the way the charts do before laying out. */
function filled() {
  const roots = tree()
  roots.forEach((r) => {
    if (r.children) {
      r.value = r.children.reduce((s, c) => s + c.value, 0)
    }
  })
  return roots
}

function flatten(roots) {
  const out = []
  const walk = (n) => {
    out.push(n)
    if (n.children) n.children.forEach(walk)
  }
  roots.forEach(walk)
  return out
}

/**
 * Names of the cells marked as having children below the cut. Scanned rather
 * than selected: jsdom's selector engine silently fails on an attribute name
 * containing a colon, so `[data\\:clipped="true"]` matches nothing there.
 */
function clippedNames() {
  return [...document.querySelectorAll('.apexcharts-icicle-cell')]
    .filter((el) => el.getAttribute('data:clipped') === 'true')
    .map((el) => el.getAttribute('data:name'))
}

/** Every rendered cell's box, keyed by the node name it carries. */
function cellsByName() {
  /** @type {Record<string, {x:number,y:number,w:number,h:number}>} */
  const out = {}
  document.querySelectorAll('.apexcharts-icicle-cell').forEach((el) => {
    out[el.getAttribute('data:name')] = {
      x: parseFloat(el.getAttribute('x')),
      y: parseFloat(el.getAttribute('y')),
      w: parseFloat(el.getAttribute('width')),
      h: parseFloat(el.getAttribute('height')),
    }
  })
  return out
}

function icicleOptions(extra = {}) {
  return {
    chart: { type: 'icicle', width: 600, height: 400, ...(extra.chart || {}) },
    series: TREE,
    plotOptions: { icicle: extra.icicle || {} },
    ...(extra.rest || {}),
  }
}

// ---------------------------------------------------------------------------
// The partition layout, with no DOM in sight
// ---------------------------------------------------------------------------

describe('partition layout', () => {
  it('gives every child its share of the parent, exactly filling it', () => {
    const roots = filled()
    const nodesAll = flatten(roots)
    placeTree({ roots, nodesAll, focus: null, t0: 0, t1: 100 })

    // A = 40, B = 60 of 100.
    expect(roots[0]._t0).toBe(0)
    expect(roots[0]._t1).toBeCloseTo(40)
    expect(roots[1]._t0).toBeCloseTo(40)
    expect(roots[1]._t1).toBeCloseTo(100)

    // Children fill their parent edge to edge, at every level.
    nodesAll.forEach((n) => {
      if (!n.children) return
      const first = n.children[0]
      const last = n.children[n.children.length - 1]
      expect(first._t0).toBeCloseTo(n._t0)
      expect(last._t1).toBeCloseTo(n._t1)
      n.children.forEach((c, i) => {
        if (i === 0) return
        expect(c._t0).toBeCloseTo(n.children[i - 1]._t1)
      })
    })
  })

  it('reports the deepest visible depth', () => {
    const roots = filled()
    const nodesAll = flatten(roots)
    expect(placeTree({ roots, nodesAll, focus: null, t0: 0, t1: 100 })).toBe(1)
  })

  it('a focused branch fills the whole extent and hides its siblings', () => {
    const roots = filled()
    const nodesAll = flatten(roots)
    placeTree({ roots, nodesAll, focus: null, t0: 0, t1: 100 })
    const focus = roots[0]

    const maxDepth = placeTree({ roots, nodesAll, focus, t0: 0, t1: 100 })
    expect(focus._t0).toBe(0)
    expect(focus._t1).toBe(100)
    expect(focus._vDepth).toBe(0)
    expect(maxDepth).toBe(1)
    expect(roots[1]._show).toBe(false)
    // The hidden branch keeps its last geometry, which is what lets a zoom
    // animate it away rather than snapping it out of existence.
    expect(roots[1]._t1).toBeGreaterThan(0)
  })

  it('survives a parent whose children all sum to zero', () => {
    const roots = [node('Z', 0, [node('Z1', 0), node('Z2', 0)])]
    const nodesAll = flatten(roots)
    expect(() =>
      placeTree({ roots, nodesAll, focus: null, t0: 0, t1: 100 }),
    ).not.toThrow()
    roots[0].children.forEach((c) => {
      expect(Number.isFinite(c._t0)).toBe(true)
      expect(Number.isFinite(c._t1)).toBe(true)
    })
  })

  it('ignores negative values rather than drawing backwards', () => {
    const roots = [node('P', 100, [node('good', 100), node('bad', -50)])]
    const nodesAll = flatten(roots)
    placeTree({ roots, nodesAll, focus: null, t0: 0, t1: 100 })
    expect(roots[0].children[0]._t1).toBeCloseTo(100)
    expect(roots[0].children[1]._t1 - roots[0].children[1]._t0).toBe(0)
  })

  it('marks leaves, and only leaves', () => {
    const roots = filled()
    placeTree({ roots, nodesAll: flatten(roots), focus: null, t0: 0, t1: 10 })
    expect(roots[0]._leaf).toBe(false)
    expect(roots[0].children[0]._leaf).toBe(true)
  })
})

describe('bandScale + ragged depth', () => {
  it('divides the depth axis by the number of visible levels', () => {
    const scale = bandScale({ maxDepth: 3, near: 0, far: 400 })
    expect(scale.near(0)).toBe(0)
    expect(scale.far(0)).toBe(100)
    expect(scale.near(3)).toBe(300)
    expect(scale.far(3)).toBe(400)
  })

  it('drops the gap when there is only one level to draw', () => {
    const one = bandScale({ maxDepth: 0, near: 0, far: 100, gap: 10 })
    expect(one.near(0)).toBe(0)
    expect(one.far(0)).toBe(100)

    const two = bandScale({ maxDepth: 1, near: 0, far: 100, gap: 10 })
    expect(two.far(0)).toBe(45)
    expect(two.near(1)).toBe(55)
  })

  it("leaf 'extend' runs a shallow leaf to the far edge, 'stop' does not", () => {
    const scale = bandScale({ maxDepth: 2, near: 0, far: 300 })
    const shallow = { _leaf: true, _vDepth: 0 }
    expect(farEdge(shallow, scale, 2, 'extend', 300)).toBe(300)
    expect(farEdge(shallow, scale, 2, 'stop', 300)).toBe(100)
  })

  it('leaves a deepest-level leaf alone under either mode', () => {
    const scale = bandScale({ maxDepth: 2, near: 0, far: 300 })
    const deep = { _leaf: true, _vDepth: 2 }
    expect(farEdge(deep, scale, 2, 'extend', 300)).toBe(300)
    expect(farEdge(deep, scale, 2, 'stop', 300)).toBe(300)
  })
})

describe('depth cap', () => {
  it('stops the walk at the cap and reports the capped depth', () => {
    const roots = [
      node('a', null, [node('b', null, [node('c', null, [node('d', 10)])])]),
    ]
    roots[0].value = 10
    roots[0].children[0].value = 10
    roots[0].children[0].children[0].value = 10
    const nodesAll = flatten(roots)

    expect(placeTree({ roots, nodesAll, focus: null, t0: 0, t1: 100 })).toBe(3)
    expect(
      placeTree({ roots, nodesAll, focus: null, t0: 0, t1: 100, cap: 1 }),
    ).toBe(1)
    // Everything below the cap is left out of the layout entirely.
    expect(nodesAll.map((n) => n._show)).toEqual([true, true, false, false])
  })

  it('marks a branch whose children were cut, and never a real leaf', () => {
    const roots = [node('a', 10, [node('b', 10, [node('c', 10)])])]
    const nodesAll = flatten(roots)
    placeTree({ roots, nodesAll, focus: null, t0: 0, t1: 100, cap: 1 })

    expect(roots[0]._clipped).toBe(false) // has children, but they are drawn
    expect(roots[0].children[0]._clipped).toBe(true) // its child was cut
    expect(roots[0].children[0]._leaf).toBe(false) // so it is NOT a leaf
  })

  it('clears the mark when the cap is lifted', () => {
    const roots = [node('a', 10, [node('b', 10, [node('c', 10)])])]
    const nodesAll = flatten(roots)
    placeTree({ roots, nodesAll, focus: null, t0: 0, t1: 100, cap: 1 })
    placeTree({ roots, nodesAll, focus: null, t0: 0, t1: 100 })
    expect(nodesAll.every((n) => !n._clipped)).toBe(true)
  })
})

describe('sibling sort', () => {
  it("'none' keeps authored order", () => {
    const roots = filled()
    sortTree(roots, 'none')
    expect(roots.map((r) => r.name)).toEqual(['A', 'B'])
    expect(roots[0].children.map((c) => c.name)).toEqual(['A1', 'A2'])
  })

  it("'value' orders siblings by size, descending, at every level", () => {
    const roots = filled()
    sortTree(roots, 'value')
    expect(roots.map((r) => r.name)).toEqual(['B', 'A'])
    expect(roots[1].children.map((c) => c.name)).toEqual(['A1', 'A2'])
  })

  it("'name' orders alphabetically — the flame-graph convention", () => {
    const roots = [
      node('zeta', 10, [node('m', 5), node('b', 5)]),
      node('alpha', 20),
    ]
    sortTree(roots, 'name')
    expect(roots.map((r) => r.name)).toEqual(['alpha', 'zeta'])
    expect(roots[1].children.map((c) => c.name)).toEqual(['b', 'm'])
  })

  it('never changes a node key, so an update still morphs the right cell', () => {
    const roots = filled()
    const before = new Map(flatten(roots).map((n) => [n.name, n._key]))
    sortTree(roots, 'value')
    flatten(roots).forEach((n) => {
      expect(n._key).toBe(before.get(n.name))
    })
  })
})

describe('focus helpers', () => {
  it('clicking a branch focuses it; clicking the focus zooms out', () => {
    const roots = filled()
    placeTree({ roots, nodesAll: flatten(roots), focus: null, t0: 0, t1: 10 })
    const a = roots[0]

    const inward = resolveFocus(a, null)
    expect(inward.changed).toBe(true)
    expect(inward.focus).toBe(a)

    const outward = resolveFocus(a, a)
    expect(outward.changed).toBe(true)
    expect(outward.focus).toBe(null)
  })

  it('clicking a leaf focuses its parent branch, not the leaf', () => {
    const roots = filled()
    placeTree({ roots, nodesAll: flatten(roots), focus: null, t0: 0, t1: 10 })
    const leaf = roots[0].children[0]
    expect(resolveFocus(leaf, null).focus).toBe(roots[0])
  })

  it('builds the root -> focus chain for the breadcrumb', () => {
    const roots = filled()
    placeTree({ roots, nodesAll: flatten(roots), focus: null, t0: 0, t1: 10 })
    const leaf = roots[0].children[1]
    expect(focusChain(leaf).map((n) => n.name)).toEqual(['A', 'A2'])
    expect(focusChain(null)).toEqual([])
  })
})

describe('tint + sizes', () => {
  it('lightens a hex colour toward white and passes anything else through', () => {
    expect(lighten('#000000', 0.5)).toBe('#808080')
    expect(lighten('#000', 1)).toBe('#ffffff')
    expect(lighten('rgb(0,0,0)', 0.5)).toBe('rgb(0,0,0)')
  })

  it('tints each level from its parent and collects the nodes in draw order', () => {
    const roots = filled()
    const out = []
    colorPass(roots[0], '#008FFB', 0.5, out)
    expect(out.map((n) => n.name)).toEqual(['A', 'A1', 'A2'])
    expect(out[0]._color).toBe('#008FFB')
    expect(out[1]._color).not.toBe('#008FFB')
    expect(out[1]._color).toBe(out[2]._color)
  })

  it('an explicit node colour wins over the tint', () => {
    const roots = filled()
    roots[0].children[0].color = '#ff0000'
    const out = []
    colorPass(roots[0], '#008FFB', 0.5, out)
    expect(out[1]._color).toBe('#ff0000')
  })

  it('reads px, % and nonsense sizes', () => {
    expect(parseSize(24, 400)).toBe(24)
    expect(parseSize('25%', 400)).toBe(100)
    expect(parseSize('30', 400)).toBe(30)
    expect(parseSize('nope', 400, 0.15)).toBeCloseTo(60)
  })
})

describe("partition: 'strict'", () => {
  it('warns once when a parent does not match the sum of its children', () => {
    const roots = [node('P', 100, [node('c1', 30), node('c2', 30)])]
    const warn = console.warn
    const seen = []
    console.warn = (m) => seen.push(m)
    try {
      validateStrict(roots, { type: 'icicle', remedy: 'Normalized.' })
    } finally {
      console.warn = warn
    }
    expect(seen).toHaveLength(1)
    expect(seen[0]).toContain('"P"')
    expect(seen[0]).toContain('icicle')
  })

  it('stays quiet when the values add up', () => {
    const roots = filled()
    const warn = console.warn
    const seen = []
    console.warn = (m) => seen.push(m)
    try {
      validateStrict(roots, { type: 'icicle', remedy: 'Normalized.' })
    } finally {
      console.warn = warn
    }
    expect(seen).toHaveLength(0)
  })
})

describe('placeSubtree', () => {
  it('places one branch into an arbitrary interval', () => {
    const root = node('R', 100, [node('x', 25), node('y', 75)])
    placeSubtree(root, 0, 200, 400, null, { maxDepth: 0 })
    expect(root.children[0]._t0).toBe(200)
    expect(root.children[0]._t1).toBe(250)
    expect(root.children[1]._t1).toBe(400)
  })
})

// ---------------------------------------------------------------------------
// The rendered chart
// ---------------------------------------------------------------------------

describe('icicle chart', () => {
  it('registers as an opt-in type and renders one cell per node', () => {
    const chart = createChartWithOptions(icicleOptions())
    const cells = document.querySelectorAll('.apexcharts-icicle-cell')
    // 2 roots + 4 leaves.
    expect(cells.length).toBe(6)
    chart.destroy()
  })

  it('is NOT registered by the default bundle', () => {
    // The type registry is global, so once this file imports the entry the name
    // resolves everywhere. What has to stay true is the BUNDLE composition: the
    // full entry must not pull the class in, or the opt-in is opt-in in name
    // only and every user pays for it. Asserted against the source, because
    // that is the thing a one-line import would quietly change.
    const full = readFileSync(
      resolve(rootDir, 'src/entries/full.js'),
      'utf8',
    )
    expect(full).not.toMatch(/icicle/i)
  })

  it('tiles every parent exactly with its children, in all four directions', () => {
    // The guard the family kept needing: extents that do not add up show as a
    // seam or an overlap, and only at one depth, which is easy to miss by eye.
    ;['down', 'up', 'right', 'left'].forEach((direction) => {
      const chart = createChartWithOptions(
        icicleOptions({ icicle: { direction, spacing: 0 } }),
      )
      const cells = cellsByName()
      const vertical = direction === 'down' || direction === 'up'

      // Tech's two children span Tech, and Energy's span Energy.
      ;[
        ['Tech', ['Software', 'Hardware']],
        ['Energy', ['Oil', 'Solar']],
      ].forEach(([parent, children]) => {
        const p = cells[parent]
        const kids = children.map((c) => cells[c])
        const lo = vertical ? 'x' : 'y'
        const size = vertical ? 'w' : 'h'
        expect(kids[0][lo]).toBeCloseTo(p[lo], 3)
        expect(kids[1][lo] + kids[1][size]).toBeCloseTo(p[lo] + p[size], 3)
        expect(kids[0][lo] + kids[0][size]).toBeCloseTo(kids[1][lo], 3)
        // And they are proportional: Software is 3x Hardware, Oil 1.5x Solar.
        const ratio = kids[0][size] / kids[1][size]
        expect(ratio).toBeCloseTo(parent === 'Tech' ? 3 : 1.5, 2)
      })

      Object.values(cells).forEach((c) => {
        expect(c.x).toBeGreaterThanOrEqual(-0.5)
        expect(c.y).toBeGreaterThanOrEqual(-0.5)
        expect(c.x + c.w).toBeLessThanOrEqual(chart.w.layout.gridWidth + 0.5)
        expect(c.y + c.h).toBeLessThanOrEqual(chart.w.layout.gridHeight + 0.5)
      })
      chart.destroy()
    })
  })

  it('grows the tree the way `direction` says', () => {
    const at = (direction) => {
      const chart = createChartWithOptions(
        icicleOptions({ icicle: { direction, spacing: 0 } }),
      )
      const cells = cellsByName()
      const box = chart.w.layout
      const out = { root: cells['Tech'], leaf: cells['Software'], box }
      chart.destroy()
      return out
    }

    // 'down': the root band is at the top, its children below it.
    const down = at('down')
    expect(down.root.y).toBeCloseTo(0, 1)
    expect(down.leaf.y).toBeGreaterThan(down.root.y)

    // 'up' is the flame-graph orientation: root at the bottom, stacks upward.
    const up = at('up')
    expect(up.root.y + up.root.h).toBeCloseTo(up.box.gridHeight, 1)
    expect(up.leaf.y).toBeLessThan(up.root.y)

    // 'right': the root column is on the left, depth grows rightward.
    const right = at('right')
    expect(right.root.x).toBeCloseTo(0, 1)
    expect(right.leaf.x).toBeGreaterThan(right.root.x)

    // 'left' mirrors it.
    const left = at('left')
    expect(left.root.x + left.root.w).toBeCloseTo(left.box.gridWidth, 1)
    expect(left.leaf.x).toBeLessThan(left.root.x)
  })

  it("leaf: 'stop' leaves the deeper band empty; 'extend' fills it", () => {
    const depthOf = (leaf) => {
      const chart = createChartWithOptions(
        icicleOptions({
          icicle: { leaf, spacing: 0 },
          rest: {
            series: [
              {
                data: [
                  { x: 'deep', children: [{ x: 'mid', children: [{ x: 'low', y: 10 }] }] },
                  { x: 'shallow', y: 10 },
                ],
              },
            ],
          },
        }),
      )
      const h = cellsByName()['shallow'].h
      const grid = chart.w.layout.gridHeight
      chart.destroy()
      return { h, grid }
    }

    const extend = depthOf('extend')
    expect(extend.h).toBeCloseTo(extend.grid, 0)

    const stop = depthOf('stop')
    expect(stop.h).toBeLessThan(stop.grid / 2)
  })

  it('sorts siblings when asked, and leaves them alone otherwise', () => {
    const order = (sort) => {
      const chart = createChartWithOptions(icicleOptions({ icicle: { sort } }))
      const cells = cellsByName()
      // Read left-to-right along the value axis.
      const names = ['Software', 'Hardware'].sort(
        (a, b) => cells[a].x - cells[b].x,
      )
      chart.destroy()
      return names
    }
    expect(order('none')).toEqual(['Software', 'Hardware'])
    expect(order('name')).toEqual(['Hardware', 'Software'])
    expect(order('value')).toEqual(['Software', 'Hardware'])
  })

  it('takes the plot rect, not the centred square a sunburst needs', () => {
    const chart = createChartWithOptions(
      icicleOptions({ chart: { width: 900, height: 300 } }),
    )
    // A square layout would cap the width at the height and strand the bands.
    expect(chart.w.layout.gridWidth).toBeGreaterThan(600)
    chart.destroy()
  })

  it('maxDepth draws that many levels and marks what it cut', () => {
    // The fixture is two levels: roots, then leaves. One level draws the roots.
    const chart = createChartWithOptions(icicleOptions({ icicle: { maxDepth: 1 } }))
    const cells = cellsByName()
    expect(Object.keys(cells).sort()).toEqual(['Energy', 'Tech'])

    // Scanned, not selected: jsdom's selector engine silently fails to match
    // an attribute name containing a colon.
    expect(clippedNames().sort()).toEqual(['Energy', 'Tech'])
    // And the reader is told, rather than the branch passing for a leaf.
    expect(document.querySelectorAll('.apexcharts-icicle-more').length).toBe(2)
    chart.destroy()
  })

  it("'auto' maxDepth draws the whole tree and marks nothing", () => {
    const chart = createChartWithOptions(icicleOptions())
    expect(document.querySelectorAll('.apexcharts-icicle-more').length).toBe(0)
    expect(clippedNames()).toEqual([])
    chart.destroy()
  })

  it('drops a label that would truncate to a stub', () => {
    // A cell with room for two characters gets nothing rather than 'E…'.
    const chart = createChartWithOptions(
      icicleOptions({
        icicle: { dataLabels: { minSizeToShow: 1, rotate: 'never' } },
        rest: {
          series: [
            {
              data: [
                { x: 'Enormous department name', y: 1000 },
                { x: 'Tiny', y: 2 },
              ],
            },
          ],
        },
      }),
    )
    const texts = [
      ...document.querySelectorAll('.apexcharts-icicle-labels text'),
    ].map((t) => t.textContent)
    expect(texts.some((t) => t.startsWith('Enormous'))).toBe(true)
    expect(texts.every((t) => t.replace('…', '').length >= 3)).toBe(true)
    chart.destroy()
  })

  it('drops the value before truncating the name', () => {
    const chart = createChartWithOptions(
      icicleOptions({
        icicle: {
          dataLabels: { showValue: true, minSizeToShow: 1, rotate: 'never' },
        },
        rest: {
          series: [
            {
              data: [
                { x: 'Engineering', y: 1000 },
                { x: 'Ops', y: 60 },
              ],
            },
          ],
        },
      }),
    )
    const texts = [
      ...document.querySelectorAll('.apexcharts-icicle-labels text'),
    ].map((t) => t.textContent)
    // The wide cell keeps both; the narrow one keeps the name, not 'Op…: 60'.
    expect(texts).toContain('Engineering: 1000')
    expect(texts).toContain('Ops')
    chart.destroy()
  })

  it('carries the branch key and leaf flag every morph pairs on', () => {
    const chart = createChartWithOptions(icicleOptions())
    const cells = [...document.querySelectorAll('.apexcharts-icicle-cell')]
    expect(cells.every((c) => c.getAttribute('data:key'))).toBe(true)
    const leaves = cells.filter((c) => c.getAttribute('data:leaf') === 'true')
    expect(leaves).toHaveLength(4)
    chart.destroy()
  })

  it('refuses to let a custom series type take the reserved name', () => {
    const warn = console.warn
    const seen = []
    console.warn = (m) => seen.push(String(m))
    try {
      ApexCharts.registerSeriesType('icicle', { renderItem: () => null })
    } finally {
      console.warn = warn
    }
    expect(seen.join(' ')).toContain('override the built-in')
  })
})
