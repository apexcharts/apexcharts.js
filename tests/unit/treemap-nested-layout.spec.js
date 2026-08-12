import { describe, it, expect } from 'vitest'
import TreemapSquared from '../../src/libs/Treemap-squared'

const { generate, generateNested } = TreemapSquared

/** Wrap a flat series-of-values matrix as the tree it implicitly describes. */
function asTree(matrix) {
  return matrix.map((row, i) => ({
    value: null,
    name: `s${i}`,
    children: row.map((v, j) => ({ value: v, name: `s${i}n${j}` })),
  }))
}

/** Pull the leaf rects back out in the shape `generate` returns. */
function leafRects(roots) {
  return roots.map((r) => r.children.map((c) => c.rect))
}

const MATRICES = {
  'single series': [[10, 20, 30, 40]],
  'multi series, uneven lengths': [
    [50, 30, 20],
    [8, 8, 8, 8, 8, 8],
    [100],
  ],
  'wildly skewed values': [
    [1000, 1, 1, 1, 1],
    [3, 3, 3],
  ],
  'floats': [
    [1.7, 2.3, 9.001, 0.4],
    [5.5, 5.5],
  ],
  'many rows': [
    Array.from({ length: 60 }, (_, i) => ((i * 37) % 91) + 1),
    Array.from({ length: 25 }, (_, i) => ((i * 13) % 47) + 1),
  ],
  'one tile': [[1]],
}

const SIZES = [
  [600, 400],
  [400, 600],
  [1000, 120],
  [333, 333],
]

// ---------------------------------------------------------------------------
// The whole point of the recursion: it must not move a single existing pixel.
// ---------------------------------------------------------------------------
describe('generateNested — two-level output is identical to generate()', () => {
  for (const [label, matrix] of Object.entries(MATRICES)) {
    for (const [w, h] of SIZES) {
      it(`${label} @ ${w}x${h}`, () => {
        const legacy = generate(matrix, w, h)
        const nested = leafRects(generateNested(asTree(matrix), w, h))

        // Exact float equality, not toBeCloseTo — the operations are supposed
        // to be the same operations in the same order.
        expect(nested).toStrictEqual(legacy)
      })
    }
  }

  it('is identical for already-positive data with no padding or header', () => {
    const matrix = [[7, 3, 5], [2, 8]]
    const nested = generateNested(asTree(matrix), 500, 300, {
      padding: () => 0,
      header: () => 0,
    })
    expect(leafRects(nested)).toStrictEqual(generate(matrix, 500, 300))
  })
})

describe('generateNested — arbitrary depth', () => {
  const tree = () => [
    {
      name: 'Tech',
      value: null,
      children: [
        {
          name: 'Software',
          value: null,
          children: [
            { name: 'A', value: 40 },
            { name: 'B', value: 60 },
          ],
        },
        {
          name: 'Hardware',
          value: null,
          children: [
            { name: 'C', value: 50 },
            { name: 'D', value: 50 },
          ],
        },
      ],
    },
    {
      name: 'Energy',
      value: null,
      children: [{ name: 'E', value: 200 }],
    },
  ]

  it('sizes a parent by the sum of its leaves', () => {
    const roots = generateNested(tree(), 400, 400)
    expect(roots[0]._area).toBe(200)
    expect(roots[0].children[0]._area).toBe(100)
    expect(roots[1]._area).toBe(200)
    // Equal areas, so the two roots split the canvas in half.
    const a0 = area(roots[0].rect)
    const a1 = area(roots[1].rect)
    expect(a0).toBeCloseTo(a1, 6)
    expect(a0 + a1).toBeCloseTo(400 * 400, 4)
  })

  it('nests every child strictly inside its parent', () => {
    const roots = generateNested(tree(), 600, 400, {
      padding: () => 3,
      header: () => 16,
    })
    walk(roots, (node, parent) => {
      if (!parent || !node.rect || !parent.rect) return
      expect(node.rect[0]).toBeGreaterThanOrEqual(parent.rect[0] - 1e-9)
      expect(node.rect[1]).toBeGreaterThanOrEqual(parent.rect[1] - 1e-9)
      expect(node.rect[2]).toBeLessThanOrEqual(parent.rect[2] + 1e-9)
      expect(node.rect[3]).toBeLessThanOrEqual(parent.rect[3] + 1e-9)
    })
  })

  it('reserves the header strip above the children', () => {
    const roots = generateNested(tree(), 600, 400, { header: () => 18 })
    const parent = roots[0]
    expect(parent.headerHeight).toBe(18)
    parent.children.forEach((c) => {
      expect(c.rect[1]).toBeGreaterThanOrEqual(parent.rect[1] + 18 - 1e-9)
    })
  })

  it('records depth on every node', () => {
    const roots = generateNested(tree(), 600, 400)
    expect(roots[0].depth).toBe(0)
    expect(roots[0].children[0].depth).toBe(1)
    expect(roots[0].children[0].children[0].depth).toBe(2)
  })

  it('children of a parent exactly fill the parent content box', () => {
    const roots = generateNested(tree(), 600, 400, {
      padding: () => 4,
      header: () => 14,
    })
    const p = roots[0]
    const inner =
      (p.rect[2] - p.rect[0] - 8) * (p.rect[3] - p.rect[1] - 14 - 8)
    const sum = p.children.reduce((s, c) => s + area(c.rect), 0)
    expect(sum).toBeCloseTo(inner, 4)
  })
})

describe('generateNested — degenerate input', () => {
  it('returns an empty array for no nodes', () => {
    expect(generateNested([], 100, 100)).toEqual([])
    expect(generateNested(undefined, 100, 100)).toEqual([])
  })

  it('places nothing when every value is zero, instead of NaN rects', () => {
    const roots = generateNested(
      [{ value: 0 }, { value: 0 }],
      400,
      400,
    )
    roots.forEach((r) => expect(r.rect).toBeUndefined())
  })

  it('skips a zero-total branch but still places its siblings', () => {
    const roots = generateNested(
      [
        { value: null, name: 'dead', children: [{ value: 0 }, { value: 0 }] },
        { value: 10, name: 'alive' },
      ],
      400,
      400,
    )
    expect(roots[1].rect).toBeDefined()
    // The dead branch has zero area, so its own children get no rect.
    roots[0].children.forEach((c) => expect(c.rect).toBeUndefined())
  })

  it('sizes by magnitude, so a negative value still occupies area', () => {
    const roots = generateNested([{ value: -30 }, { value: 10 }], 400, 400)
    expect(roots[0]._area).toBe(30)
    expect(area(roots[0].rect)).toBeCloseTo(400 * 400 * 0.75, 4)
  })

  it('drops padding rather than inverting a tiny rect', () => {
    // One huge tile and one sliver: the sliver is far too narrow for a 40px
    // inset on each side, which would give it a negative-width content box.
    const roots = generateNested(
      [
        { value: 10000, name: 'big', children: [{ value: 10000 }] },
        { value: 1, name: 'sliver', children: [{ value: 1 }] },
      ],
      300,
      300,
      { padding: () => 40, header: () => 40 },
    )
    const sliver = roots[1]
    const c = sliver.children[0].rect
    expect(c[2] - c[0]).toBeGreaterThan(0)
    expect(c[3] - c[1]).toBeGreaterThan(0)
  })

  it('drops the header when the strip would eat the content box', () => {
    // The three small tiles stack into a 100px-tall row each, so a 60px header
    // would leave only 40px of content — less than the header itself. The tall
    // first tile keeps its header.
    const roots = generateNested(
      [
        { value: 300, name: 'tall', children: [{ value: 300 }] },
        { value: 100, name: 'short1', children: [{ value: 100 }] },
        { value: 100, name: 'short2', children: [{ value: 100 }] },
        { value: 100, name: 'short3', children: [{ value: 100 }] },
      ],
      300,
      300,
      { header: () => 60 },
    )
    expect(roots[0].rect[3] - roots[0].rect[1]).toBe(300)
    expect(roots[0].headerHeight).toBe(60)
    roots.slice(1).forEach((r) => {
      expect(r.rect[3] - r.rect[1]).toBeCloseTo(100, 6)
      expect(r.headerHeight).toBe(0)
    })
  })

  it('passes the measured box to the accessors so the caller can decline', () => {
    const seen = []
    generateNested(
      [
        { value: 10000, name: 'big', children: [{ value: 10000 }] },
        { value: 1, name: 'sliver', children: [{ value: 1 }] },
      ],
      300,
      300,
      {
        header: (node, depth, w, h) => {
          seen.push([node.name, Math.round(w), Math.round(h)])
          // A caller policy: no header on a tile under 40px wide.
          return w < 40 ? 0 : 20
        },
      },
    )
    expect(seen.map((s) => s[0])).toEqual(['big', 'sliver'])
    // The sliver's measured width is what let the caller say no.
    expect(seen[1][1]).toBeLessThan(40)
  })

  it('handles a non-numeric value as zero area', () => {
    const roots = generateNested(
      [{ value: 'abc' }, { value: 10 }],
      200,
      200,
    )
    expect(roots[0]._area).toBe(0)
  })
})

function area(r) {
  return (r[2] - r[0]) * (r[3] - r[1])
}

function walk(nodes, fn, parent = null) {
  nodes.forEach((n) => {
    fn(n, parent)
    if (n.children) walk(n.children, fn, n)
  })
}
