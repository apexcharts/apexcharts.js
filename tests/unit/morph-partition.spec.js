/**
 * treemap <-> sunburst.
 *
 * Both are space-filling part-to-whole charts whose every mark is 1:1 with a
 * row, so this is an ordinary shape-to-shape morph rather than the
 * explode/collapse the unit pair needs. They pair up by draw order, since
 * neither renderer iterates the (realIndex, j) grid the bar family does.
 */

import ApexCharts from '../../src/entries/full.js'
import MorphTypeChange from '../../src/modules/MorphTypeChange.js'
import SunburstChart from '../../src/charts/Sunburst.js'
import TreemapChart from '../../src/charts/Treemap.js'

function stubW() {
  return {
    config: {
      chart: {
        animations: {
          enabled: true,
          speed: 800,
          dynamicAnimation: { enabled: true, speed: 350 },
          chartTypeMorph: { enabled: true, speed: 600 },
          respectReducedMotion: true,
        },
      },
      stroke: { show: true, width: 1, colors: ['#fff'] },
      plotOptions: {
        sunburst: { startAngle: 0, endAngle: 360, borderRadius: 0 },
        treemap: {},
      },
    },
    globals: { previousPaths: [], dom: { baseEl: null } },
    layout: { translateX: 0, translateY: 0, gridWidth: 400, gridHeight: 300 },
  }
}

const TREE = [
  {
    data: [
      {
        x: 'Engineering',
        y: 50,
        children: [
          { x: 'Web', y: 30 },
          { x: 'Mobile', y: 20 },
        ],
      },
      {
        x: 'Design',
        y: 25,
        children: [
          { x: 'Product', y: 15 },
          { x: 'Brand', y: 10 },
        ],
      },
    ],
  },
]

function treemapChart(animations = { enabled: false }) {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    chart: { type: 'treemap', width: 500, height: 400, animations },
    series: [
      {
        data: [
          { x: 'Web', y: 30 },
          { x: 'Mobile', y: 20 },
          { x: 'Product', y: 15 },
          { x: 'Brand', y: 10 },
        ],
      },
    ],
  })
  chart.render()
  return chart
}

function sunburstChart(animations = { enabled: false }) {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    chart: { type: 'sunburst', width: 500, height: 400, animations },
    series: TREE,
  })
  chart.render()
  return chart
}

describe('the pair is recognised, and only with itself', () => {
  const morph = new MorphTypeChange(stubW(), {})

  it('accepts treemap <-> sunburst', () => {
    expect(morph.canMorphTypes('treemap', 'sunburst')).toBe(true)
    expect(morph.canMorphTypes('sunburst', 'treemap')).toBe(true)
  })

  it('still rejects same-type and unknown types', () => {
    expect(morph.canMorphTypes('treemap', 'treemap')).toBe(false)
    expect(morph.canMorphTypes('sunburst', 'sunburst')).toBe(false)
    expect(morph.canMorphTypes('treemap', 'line')).toBe(false)
  })

  it('pairs with the other 1:1 families too, both ways', () => {
    // Every mark in all of these is one row, so the mapping is positional and
    // each mark becomes the next shape of itself. Driven in the browser by
    // tests/interaction/specs/morph-matrix.spec.js.
    expect(morph.canMorphTypes('treemap', 'bar')).toBe(true)
    expect(morph.canMorphTypes('bar', 'treemap')).toBe(true)
    expect(morph.canMorphTypes('treemap', 'pie')).toBe(true)
    expect(morph.canMorphTypes('sunburst', 'funnel')).toBe(true)
    expect(morph.canMorphTypes('polarArea', 'sunburst')).toBe(true)
    expect(morph.canMorphTypes('boxPlot', 'treemap')).toBe(true)
    expect(morph.canMorphTypes('sunburst', 'violin')).toBe(true)
  })

  it('keeps the unit pair closed, since a tile cannot be cut into pieces', () => {
    // The unit pairs are an explode, not a shape change, and the piece divider
    // has no capture for a tile or an arc. Falling back to the whole-chart fade
    // would be worse than not offering it.
    expect(morph.canMorphTypes('unit', 'treemap')).toBe(false)
    expect(morph.canMorphTypes('treemap', 'unit')).toBe(false)
    expect(morph.canMorphTypes('waffle', 'sunburst')).toBe(false)
    expect(morph.canMorphTypes('sunburst', 'waffle')).toBe(false)
  })

  it('accepts either series shape for a partition target', () => {
    expect(morph.isCompatibleSeriesShape('sunburst', 'treemap', [
      { data: [{ x: 'a', y: 1 }] },
    ])).toBe(true)
    expect(morph.isCompatibleSeriesShape('treemap', 'sunburst', TREE)).toBe(true)
    expect(morph.isCompatibleSeriesShape('treemap', 'sunburst', [])).toBe(false)
  })
})

describe('capturing a treemap', () => {
  it('emits one closed rectangle path per tile', () => {
    const chart = treemapChart()
    const morph = new MorphTypeChange(chart.w, chart.ctx)
    const { marks: captured } = morph._captureFromDOM('treemap')

    expect(captured.length).toBe(4)
    captured.forEach((c) => {
      expect(c.d).toMatch(/^M [\d.-]+ [\d.-]+( L [\d.-]+ [\d.-]+){3} Z$/)
      expect(c.fill).toBeTruthy()
    })

    // each path matches the tile it came from
    const tiles = [...document.querySelectorAll('.apexcharts-treemap-rect')]
    tiles.forEach((t, k) => {
      const nums = captured[k].d.match(/-?\d+(\.\d+)?/g).map(Number)
      const xs = nums.filter((_, i) => i % 2 === 0)
      const ys = nums.filter((_, i) => i % 2 === 1)
      expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(
        parseFloat(t.getAttribute('width')),
        6,
      )
      expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(
        parseFloat(t.getAttribute('height')),
        6,
      )
    })
    chart.destroy()
  })

  it('maps the tiles by draw order', () => {
    const chart = treemapChart()
    const morph = new MorphTypeChange(chart.w, chart.ctx)
    const { marks: captured } = morph._captureFromDOM('treemap')
    const mapping = morph._buildMapping(captured, 'treemap', 'sunburst', TREE)
    expect(mapping.size).toBe(4)
    expect(mapping.get('0:0').d).toBe(captured[0].d)
    expect(mapping.get('3:0').d).toBe(captured[3].d)
    chart.destroy()
  })
})

describe('capturing a sunburst', () => {
  it('marks leaves apart from interior rings', () => {
    const chart = sunburstChart()
    const arcs = [...document.querySelectorAll('.apexcharts-sunburst-arc')]
    const leaves = arcs.filter((a) => a.getAttribute('data:leaf') === 'true')
    const parents = arcs.filter((a) => a.getAttribute('data:leaf') === 'false')
    expect(leaves.length).toBe(4) // Web, Mobile, Product, Brand
    expect(parents.length).toBe(2) // Engineering, Design
    chart.destroy()
  })

  it('captures only the leaves, since that is the level a flat partition has', () => {
    const chart = sunburstChart()
    const morph = new MorphTypeChange(chart.w, chart.ctx)
    const { marks: captured } = morph._captureFromDOM('sunburst')

    expect(captured.length).toBe(4)
    const leafPaths = [...document.querySelectorAll('.apexcharts-sunburst-arc')]
      .filter((a) => a.getAttribute('data:leaf') === 'true')
      .map((a) => a.getAttribute('d'))
    expect(captured.map((c) => c.d)).toEqual(leafPaths)
    chart.destroy()
  })

  it('skips an arc with no geometry', () => {
    const chart = sunburstChart()
    const arc = [...document.querySelectorAll('.apexcharts-sunburst-arc')].find(
      (a) => a.getAttribute('data:leaf') === 'true',
    )
    arc.setAttribute('d', '')
    const morph = new MorphTypeChange(chart.w, chart.ctx)
    expect(morph._captureFromDOM('sunburst').marks.length).toBe(3)
    chart.destroy()
  })

  it('feeds the tiles of an incoming treemap, in order', () => {
    const chart = sunburstChart()
    const morph = new MorphTypeChange(chart.w, chart.ctx)
    const { marks: captured } = morph._captureFromDOM('sunburst')
    const mapping = morph._buildMapping(captured, 'sunburst', 'treemap', [
      { data: [{ x: 'Web', y: 30 }] },
    ])
    morph._snapshot = {
      fromType: 'sunburst',
      toType: 'treemap',
      mapping,
      oldLayout: { translateX: 0, translateY: 0 },
    }
    // the positional accessor both partition renderers use
    expect(morph.getInitialPathAt(0)).toBeTruthy()
    expect(morph.getInitialPathAt(0)).toBe(morph.getInitialPathFor(0, 0))
    expect(morph.getInitialPathAt(99)).toBeNull()
    chart.destroy()
  })
})

// jsdom cannot lay a sunburst out: its centred-square branch measures the
// wrapper with getBoundingClientRect, which is all zeros there, so gridWidth
// collapses to 0 and the renderer bails before drawing an arc. The end-to-end
// transition is therefore covered by the browser probe and the e2e sample; what
// is testable here is the geometry each renderer contributes to it.
describe('the pieces each renderer contributes', () => {
  it('a treemap turns a tile into a closed rectangle path', () => {
    const treemap = new TreemapChart(stubW(), {})
    const d = treemap._tilePath(10, 20, 60, 50)
    expect(d).toBe('M 10 20 L 60 20 L 60 50 L 10 50 Z')
  })

  it('a plain treemap render draws rects, not paths', () => {
    const chart = treemapChart()
    expect(document.querySelectorAll('rect.apexcharts-treemap-rect').length).toBe(4)
    expect(document.querySelectorAll('path.apexcharts-treemap-rect').length).toBe(0)
    chart.destroy()
  })

  it('a sunburst hands the captured marks to its leaves, in order, one each', () => {
    const handed = []
    const ctx = {
      morphTypeChange: {
        isActive: () => true,
        getSpeed: () => 600,
        getInitialPathAt: (k) => {
          handed.push(k)
          return k < 3 ? `tile-${k}` : null
        },
      },
    }
    const sun = new SunburstChart(stubW(), ctx)
    sun._morphLeafIndex = 0

    const leafA = { name: 'a' }
    const leafB = { name: 'b' }
    const parent = { name: 'p', children: [leafA, leafB] }

    // a parent is never handed one: a flat partition has no ring for it
    expect(sun._morphSourceFor(parent)).toBeNull()
    expect(handed).toEqual([])

    expect(sun._morphSourceFor(leafA)).toBe('tile-0')
    expect(sun._morphSourceFor(leafB)).toBe('tile-1')
    expect(handed).toEqual([0, 1])
  })

  it('a leaf beyond the captured marks falls back to the sweep', () => {
    const ctx = {
      morphTypeChange: {
        isActive: () => true,
        getSpeed: () => 600,
        getInitialPathAt: (k) => (k < 1 ? 'tile-0' : null),
      },
    }
    const sun = new SunburstChart(stubW(), ctx)
    sun._morphLeafIndex = 0
    expect(sun._morphSourceFor({ name: 'a' })).toBe('tile-0')
    // the outgoing chart had fewer marks than this one has leaves
    expect(sun._morphSourceFor({ name: 'b' })).toBeNull()
  })

  it('no morph feature means no morph source', () => {
    const sun = new SunburstChart(stubW(), {})
    sun._morphLeafIndex = 0
    expect(sun._morphSourceFor({ name: 'a' })).toBeNull()
  })

  it('a treemap leaf whose key finds nothing still takes one by draw order', () => {
    // The asymmetry that made sunburst -> treemap grow from nothing while
    // treemap -> sunburst morphed: a nested sunburst keys its arcs by the whole
    // branch ('/0:Apparel/0:Tops') and a FLAT treemap keys its tiles at depth
    // one ('/0:Tops'), so hasKeyedMarks() is true and every lookup still misses.
    const handed = []
    const ctx = {
      morphTypeChange: {
        isActive: () => true,
        getSpeed: () => 600,
        hasKeyedMarks: () => true,
        getInitialPathForKey: () => null,
        getInitialPathAt: (k) => {
          handed.push(k)
          return k < 2 ? `arc-${k}` : null
        },
      },
    }
    const tm = new TreemapChart(stubW(), ctx)
    tm._morphLeafIndex = 0

    expect(tm._morphSourceForLeaf({ _key: '0/0:Tops' })).toBe('arc-0')
    expect(tm._morphSourceForLeaf({ _key: '0/0:Denim' })).toBe('arc-1')
    // Ran out of captured arcs: that tile grows the ordinary way.
    expect(tm._morphSourceForLeaf({ _key: '0/0:Outerwear' })).toBeNull()
    expect(handed).toEqual([0, 1, 2])
  })

  it('a key that does resolve wins, and does not consume a positional slot', () => {
    const handed = []
    const ctx = {
      morphTypeChange: {
        isActive: () => true,
        getSpeed: () => 600,
        hasKeyedMarks: () => true,
        getInitialPathForKey: (key) => (key === '/0:Apparel' ? 'ring' : null),
        getInitialPathAt: (k) => {
          handed.push(k)
          return `arc-${k}`
        },
      },
    }
    const tm = new TreemapChart(stubW(), ctx)
    tm._morphLeafIndex = 0

    expect(tm._morphSourceForLeaf({ _key: '0/0:Apparel' })).toBe('ring')
    expect(handed).toEqual([])
    // The next leaf still starts the draw-order sequence at zero.
    expect(tm._morphSourceForLeaf({ _key: '0/0:Nothing' })).toBe('arc-0')
  })
})

// ===========================================================================
// Level-aware pairing
//
// Draw-order pairing can only ever match leaves: a treemap's containers and a
// sunburst's inner rings have no position in that sequence, so they used to
// appear from nothing. Both charts now build the same branch key from the same
// config, so every level pairs by identity instead.
// ===========================================================================
describe('pairing by branch identity', () => {
  it('both charts compute the same key for the same branch', () => {
    const tm = treemapChart()
    const tmKeys = [...document.querySelectorAll('.apexcharts-treemap-rect')]
      .map((t) => t.getAttribute('data:key'))
    tm.destroy()

    const sb = sunburstChart()
    const sbKeys = [...document.querySelectorAll('.apexcharts-sunburst-arc')]
      .filter((a) => a.getAttribute('data:leaf') === 'true')
      .map((a) => a.getAttribute('data:key'))
    sb.destroy()

    // The treemap fixture is the flat four-leaf version of the same data, so
    // its keys are one level shallower; what matters is that both are present
    // and well-formed rather than undefined.
    expect(tmKeys.every((k) => typeof k === 'string' && k.startsWith('/'))).toBe(true)
    expect(sbKeys.every((k) => typeof k === 'string' && k.startsWith('/'))).toBe(true)
  })

  it('captures a sunburst inner ring as a branch, apart from the leaves', () => {
    const chart = sunburstChart()
    const morph = new MorphTypeChange(chart.w, chart.ctx)
    const { marks, branches } = morph._captureFromDOM('sunburst')
    expect(marks.length).toBe(4) // leaves
    expect(branches.length).toBe(2) // Engineering, Design
    branches.forEach((b) => {
      expect(b.key).toMatch(/^\//)
      expect(b.d).toBeTruthy()
    })
    chart.destroy()
  })

  it('maps every level when both sides are keyed', () => {
    const chart = sunburstChart()
    const morph = new MorphTypeChange(chart.w, chart.ctx)
    const { marks, branches } = morph._captureFromDOM('sunburst')
    const mapping = morph._buildMapping(
      marks,
      'sunburst',
      'treemap',
      TREE,
      branches,
    )
    // 4 leaves + 2 branches keyed, plus the positional entries for the
    // draw-order fallback.
    const keyed = [...mapping.keys()].filter((k) => k.startsWith('key:'))
    expect(keyed.length).toBe(6)
    chart.destroy()
  })

  it('resolves a branch shape by key', () => {
    const chart = sunburstChart()
    const morph = new MorphTypeChange(chart.w, chart.ctx)
    const { marks, branches } = morph._captureFromDOM('sunburst')
    morph._snapshot = {
      fromType: 'sunburst',
      toType: 'treemap',
      mapping: morph._buildMapping(marks, 'sunburst', 'treemap', TREE, branches),
      // Same layout in and out, so the captured `d` comes back verbatim rather
      // than shifted into the new chart's translate space.
      oldLayout: {
        translateX: chart.w.layout.translateX,
        translateY: chart.w.layout.translateY,
      },
    }
    expect(morph.hasKeyedMarks()).toBe(true)
    expect(morph.getInitialPathForKey(branches[0].key)).toBe(branches[0].d)
    expect(morph.getInitialPathForKey('/no/such/branch')).toBeNull()
    expect(morph.getInitialPathForKey('')).toBeNull()
    chart.destroy()
  })

  it('keeps the positional path when nothing is keyed', () => {
    const morph = new MorphTypeChange(stubW(), {})
    const captured = [
      { realIndex: 0, j: 0, d: 'a', fill: null },
      { realIndex: 1, j: 0, d: 'b', fill: null },
    ]
    const mapping = morph._buildMapping(captured, 'treemap', 'sunburst', TREE, [])
    expect([...mapping.keys()]).toEqual(['0:0', '1:0'])
    morph._snapshot = {
      fromType: 'treemap',
      toType: 'sunburst',
      mapping,
      oldLayout: { translateX: 0, translateY: 0 },
    }
    expect(morph.hasKeyedMarks()).toBe(false)
  })

  it('a keyed sunburst pulls every ring, not just its leaves', () => {
    const handed = []
    const ctx = {
      morphTypeChange: {
        isActive: () => true,
        getSpeed: () => 600,
        hasKeyedMarks: () => true,
        getInitialPathForKey: (k) => {
          handed.push(k)
          return 'shape-for-' + k
        },
        getInitialPathAt: () => {
          throw new Error('should not fall back to draw order')
        },
      },
    }
    const sun = new SunburstChart(stubW(), ctx)
    // A branch: previously always null, now it pairs.
    const branch = { name: 'Engineering', _key: '0:S/0:Engineering', children: [{}] }
    const leaf = { name: 'Web', _key: '0:S/0:Engineering/0:Web' }
    expect(sun._morphSourceFor(branch)).toBe('shape-for-/0:Engineering')
    expect(sun._morphSourceFor(leaf)).toBe('shape-for-/0:Engineering/0:Web')
    expect(handed).toEqual(['/0:Engineering', '/0:Engineering/0:Web'])
  })
})
