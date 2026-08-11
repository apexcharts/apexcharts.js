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

  it('does not silently claim the unverified cross pairs', () => {
    // Mechanically these would work (every mark is 1:1 with a row and the
    // mapping is positional), but no renderer has been driven through them.
    expect(morph.canMorphTypes('treemap', 'bar')).toBe(false)
    expect(morph.canMorphTypes('treemap', 'pie')).toBe(false)
    expect(morph.canMorphTypes('sunburst', 'bar')).toBe(false)
    expect(morph.canMorphTypes('unit', 'treemap')).toBe(false)
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
    const captured = morph._captureFromDOM('treemap')

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
    const captured = morph._captureFromDOM('treemap')
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
    const captured = morph._captureFromDOM('sunburst')

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
    expect(morph._captureFromDOM('sunburst').length).toBe(3)
    chart.destroy()
  })

  it('feeds the tiles of an incoming treemap, in order', () => {
    const chart = sunburstChart()
    const morph = new MorphTypeChange(chart.w, chart.ctx)
    const captured = morph._captureFromDOM('sunburst')
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
})
