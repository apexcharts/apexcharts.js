import { describe, it, expect } from 'vitest'
import {
  buildHierarchy,
  buildSeriesRoots,
  fillValues,
  hasNesting,
  eachNode,
} from '../../src/charts/common/Hierarchy'

// ---------------------------------------------------------------------------
// Frozen copy of the resolver as it existed inside Sunburst.js before the
// extraction (charts/Sunburst.js:166-253 at ab48f7518). The extraction is only
// safe if the shared module still produces exactly this, so the reference lives
// here verbatim rather than being imported.
// ---------------------------------------------------------------------------
function legacyResolver(w) {
  const drilldownById = (id) => {
    const dd = w.config.drilldown
    const list = dd && Array.isArray(dd.series) ? dd.series : []
    return list.find((s) => s && s.id === id)
  }

  const toNode = (d, i, paletteFromParent, parentKey, seenIds = null) => {
    const isObj = d && typeof d === 'object'
    const name = isObj ? (d.x ?? d.name ?? '') : ''
    const value = isObj ? Number(d.y ?? d.value) : Number(d)
    const node = {
      name: String(name),
      value: isNaN(value) ? null : value,
      color: isObj && d.color ? d.color : undefined,
      _key: `${parentKey}/${i}:${name}`,
    }
    if (paletteFromParent && !node.color) {
      node.color = paletteFromParent[i % paletteFromParent.length]
    }

    if (isObj && Array.isArray(d.children) && d.children.length) {
      node.children = d.children.map((c, j) =>
        toNode(c, j, null, node._key, seenIds),
      )
    } else if (isObj && d.drilldown != null) {
      const visited = seenIds || new Set()
      if (!visited.has(d.drilldown)) {
        const dd = drilldownById(d.drilldown)
        if (dd && Array.isArray(dd.data) && dd.data.length) {
          const nextSeen = new Set(visited)
          nextSeen.add(d.drilldown)
          const palette = Array.isArray(dd.colors) ? dd.colors : null
          node.children = dd.data.map((c, j) =>
            toNode(c, j, palette, node._key, nextSeen),
          )
        }
      }
    }
    return node
  }

  const buildHierarchyLegacy = () => {
    const cfgSeries = w.config.series
    const first = cfgSeries && cfgSeries[0]
    const data = first && Array.isArray(first.data) ? first.data : cfgSeries
    if (!Array.isArray(data)) return []
    return data.map((d, i) => toNode(d, i, null, ''))
  }

  const fillValuesLegacy = (node) => {
    if (node.children && node.children.length) {
      node.children.forEach((c) => fillValuesLegacy(c))
      if (node.value == null || isNaN(node.value)) {
        node.value = node.children.reduce(
          (s, c) => s + Math.max(0, c.value || 0),
          0,
        )
      }
    }
    if (node.value == null || isNaN(node.value)) node.value = 0
  }

  const roots = buildHierarchyLegacy()
  roots.forEach(fillValuesLegacy)
  return roots
}

const mkW = (config) => ({ config })

// A battery covering every branch of the resolver.
const CASES = {
  'native children, three levels': mkW({
    series: [
      {
        data: [
          {
            x: 'Tech',
            children: [
              { x: 'Software', children: [{ x: 'A', y: 10 }, { x: 'B', y: 5 }] },
              { x: 'Hardware', y: 30 },
            ],
          },
          { x: 'Energy', y: 40, color: '#f00' },
        ],
      },
    ],
  }),
  'bare array of numbers (no series wrapper)': mkW({
    series: [3, 1, 4, 1, 5],
  }),
  'name/value aliases instead of x/y': mkW({
    series: [{ data: [{ name: 'One', value: 7 }, { name: 'Two', value: 9 }] }],
  }),
  'missing parent values roll up': mkW({
    series: [
      {
        data: [
          { x: 'P', children: [{ x: 'c1', y: 4 }, { x: 'c2', y: 6 }] },
          { x: 'Q', y: null, children: [{ x: 'c3', y: 2 }] },
        ],
      },
    ],
  }),
  'drilldown adapter with a per-level palette': mkW({
    series: [{ data: [{ x: 'Root', y: 100, drilldown: 'lvl1' }] }],
    drilldown: {
      series: [
        {
          id: 'lvl1',
          colors: ['#111', '#222'],
          data: [
            { x: 'a', y: 40, drilldown: 'lvl2' },
            { x: 'b', y: 60 },
          ],
        },
        { id: 'lvl2', data: [{ x: 'a1', y: 20 }, { x: 'a2', y: 20 }] },
      ],
    },
  }),
  'self-referential drilldown id (cycle guard)': mkW({
    series: [{ data: [{ x: 'Loop', y: 1, drilldown: 'self' }] }],
    drilldown: {
      series: [{ id: 'self', data: [{ x: 'again', y: 1, drilldown: 'self' }] }],
    },
  }),
  'mutually-referential drilldown ids (cycle guard)': mkW({
    series: [{ data: [{ x: 'A', y: 1, drilldown: 'ping' }] }],
    drilldown: {
      series: [
        { id: 'ping', data: [{ x: 'B', y: 1, drilldown: 'pong' }] },
        { id: 'pong', data: [{ x: 'C', y: 1, drilldown: 'ping' }] },
      ],
    },
  }),
  'drilldown id that resolves to nothing': mkW({
    series: [{ data: [{ x: 'Orphan', y: 5, drilldown: 'nope' }] }],
    drilldown: { series: [] },
  }),
  'same-named siblings stay distinct': mkW({
    series: [{ data: [{ x: 'dup', y: 1 }, { x: 'dup', y: 2 }] }],
  }),
  'empty children array falls through to leaf': mkW({
    series: [{ data: [{ x: 'E', y: 3, children: [] }] }],
  }),
  'non-numeric values': mkW({
    series: [{ data: [{ x: 'NaN', y: 'abc' }, { x: 'undef' }] }],
  }),
  'no series at all': mkW({ series: undefined }),
}

describe('Hierarchy resolver — extraction is behaviour-preserving', () => {
  for (const [label, w] of Object.entries(CASES)) {
    it(`matches the pre-extraction Sunburst resolver: ${label}`, () => {
      const expected = legacyResolver(w)

      const actual = buildHierarchy(w)
      actual.forEach(fillValues)

      // Deep equality on the node objects, and a stringified compare so an
      // added/renamed key or a changed key order is caught too.
      expect(actual).toEqual(expected)
      expect(JSON.stringify(actual)).toBe(JSON.stringify(expected))
    })
  }

  it('leaves the sunburst node shape free of treemap-only fields', () => {
    // `keepDatum` is what the treemap needs; the sunburst must never see it,
    // otherwise "byte-identical" above would be quietly weakened.
    const roots = buildHierarchy(CASES['native children, three levels'])
    expect(Object.keys(roots[0]).sort()).toEqual([
      '_key',
      'children',
      'color',
      'name',
      'value',
    ])
  })

  it('attaches the source datum only when asked', () => {
    const w = CASES['native children, three levels']
    const plain = buildHierarchy(w)
    const withDatum = buildHierarchy(w, { keepDatum: true })
    expect(plain[0]._datum).toBeUndefined()
    expect(withDatum[0]._datum).toBe(w.config.series[0].data[0])
    expect(withDatum[0].children[0]._datum).toBe(
      w.config.series[0].data[0].children[0],
    )
  })
})

describe('Hierarchy — treemap helpers', () => {
  it('buildSeriesRoots makes every series a level-0 group', () => {
    const w = mkW({
      series: [
        { name: 'S1', data: [{ x: 'a', y: 1 }, { x: 'b', y: 2 }] },
        { name: 'S2', data: [{ x: 'c', y: 3 }] },
      ],
    })
    const roots = buildSeriesRoots(w, w.config.series)
    expect(roots).toHaveLength(2)
    expect(roots.map((r) => r.name)).toEqual(['S1', 'S2'])
    expect(roots[0]._seriesIndex).toBe(0)
    expect(roots[1]._seriesIndex).toBe(1)
    expect(roots[0].children.map((c) => c.name)).toEqual(['a', 'b'])

    roots.forEach(fillValues)
    expect(roots[0].value).toBe(3)
    expect(roots[1].value).toBe(3)
  })

  it('buildSeriesRoots keeps sibling series keys distinct when names collide', () => {
    const w = mkW({
      series: [
        { name: 'dup', data: [{ x: 'a', y: 1 }] },
        { name: 'dup', data: [{ x: 'a', y: 1 }] },
      ],
    })
    const roots = buildSeriesRoots(w, w.config.series)
    expect(roots[0]._key).not.toBe(roots[1]._key)
    expect(roots[0].children[0]._key).not.toBe(roots[1].children[0]._key)
  })

  it('buildSeriesRoots tolerates a series with no data array', () => {
    const w = mkW({ series: [{ name: 'empty' }] })
    const roots = buildSeriesRoots(w, w.config.series)
    expect(roots[0].children).toEqual([])
    roots.forEach(fillValues)
    expect(roots[0].value).toBe(0)
  })

  it('hasNesting detects children and the drilldown adapter', () => {
    expect(hasNesting([{ data: [{ x: 'a', y: 1 }] }])).toBe(false)
    expect(
      hasNesting([{ data: [{ x: 'a', y: 1, children: [{ x: 'b', y: 1 }] }] }]),
    ).toBe(true)
    expect(hasNesting([{ data: [{ x: 'a', y: 1, drilldown: 'x' }] }])).toBe(true)
    // An empty children array is not nesting.
    expect(hasNesting([{ data: [{ x: 'a', y: 1, children: [] }] }])).toBe(false)
    expect(hasNesting(undefined)).toBe(false)
    expect(hasNesting([{ data: [1, 2, 3] }])).toBe(false)
  })

  it('eachNode walks depth-first with depth and parent', () => {
    const w = mkW({
      series: [
        {
          data: [
            { x: 'P', children: [{ x: 'c1', y: 1 }, { x: 'c2', y: 2 }] },
            { x: 'Q', y: 3 },
          ],
        },
      ],
    })
    const seen = []
    eachNode(buildHierarchy(w), (n, depth, parent) =>
      seen.push([n.name, depth, parent ? parent.name : null]),
    )
    expect(seen).toEqual([
      ['P', 0, null],
      ['c1', 1, 'P'],
      ['c2', 1, 'P'],
      ['Q', 0, null],
    ])
  })
})
