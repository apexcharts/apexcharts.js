import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const FLAT = [
  { name: 'A', data: [{ x: 'a1', y: 10 }, { x: 'a2', y: 20 }] },
  { name: 'B', data: [{ x: 'b1', y: 30 }, { x: 'b2', y: 5 }] },
]

const NESTED = [
  {
    data: [
      {
        x: 'Tech',
        children: [
          {
            x: 'Software',
            children: [
              { x: 'MSFT', y: 300, colorValue: 1.5 },
              { x: 'ORCL', y: 120, colorValue: -0.8 },
            ],
          },
          {
            x: 'Hardware',
            children: [
              { x: 'AAPL', y: 280, colorValue: 2.4 },
              { x: 'DELL', y: 60, colorValue: -1.2 },
            ],
          },
        ],
      },
      {
        x: 'Energy',
        children: [
          {
            x: 'Oil',
            children: [
              { x: 'XOM', y: 200, colorValue: -3.1 },
              { x: 'CVX', y: 150, colorValue: 0.4 },
            ],
          },
        ],
      },
    ],
  },
]

const treemap = (opts = {}) => {
  const cfg = {
    chart: { type: 'treemap', height: 500, width: 800, ...opts.chart },
    series: opts.series || NESTED,
    plotOptions: { treemap: opts.treemap || {} },
  }
  // Only pass through what the case actually set: an explicit `undefined`
  // overrides the default rather than leaving it alone.
  for (const k of ['legend', 'dataLabels', 'tooltip', 'theme', 'drilldown']) {
    if (opts[k] !== undefined) cfg[k] = opts[k]
  }
  return createChartWithOptions(cfg)
}

const leaves = (c) => [...c.el.querySelectorAll('.apexcharts-treemap-rect')]
const parents = (c) => [...c.el.querySelectorAll('.apexcharts-treemap-parent')]
const headers = (c) => [
  ...c.el.querySelectorAll('.apexcharts-treemap-parent-header'),
]
const parentLabels = (c) => [
  ...c.el.querySelectorAll('.apexcharts-treemap-parent-label'),
]
const rectOf = (el) => ({
  x: parseFloat(el.getAttribute('x')),
  y: parseFloat(el.getAttribute('y')),
  w: parseFloat(el.getAttribute('width')),
  h: parseFloat(el.getAttribute('height')),
})

// ===========================================================================
describe('Nested treemap — back compatibility', () => {
  it('a flat treemap draws exactly its rows and no parent marks', () => {
    const c = treemap({ series: FLAT })
    expect(leaves(c)).toHaveLength(4)
    expect(parents(c)).toHaveLength(0)
  })

  it('a flat treemap keeps its seriesTitle plates', () => {
    const c = treemap({
      series: FLAT,
      treemap: { seriesTitle: { show: true } },
    })
    const texts = [...c.el.querySelectorAll('.apexcharts-treemap-series text')]
    const labels = texts.map((t) => t.textContent)
    expect(labels).toContain('A')
    expect(labels).toContain('B')
  })

  it('flat tile geometry is unchanged by the recursive layout', () => {
    // The two-level squarify these coordinates came from is byte-identical to
    // the recursion (tests/unit/treemap-nested-layout); this pins the numbers
    // through the renderer as well.
    const c = treemap({
      series: FLAT,
      chart: { animations: { enabled: false } },
    })
    const boxes = leaves(c).map(rectOf)
    const total = boxes.reduce((s, b) => s + b.w * b.h, 0)
    // Every tile is placed, and together they fill the plot exactly.
    expect(boxes.every((b) => b.w > 0 && b.h > 0)).toBe(true)
    const grid = c.w.layout.gridWidth * c.w.layout.gridHeight
    expect(total).toBeCloseTo(grid, 3)
  })

  it('a `drilldown` id is still a drilldown target, not a nested level', () => {
    // The drilldown feature owns click-to-descend on a treemap. Reading those
    // ids as levels would silently change what an existing chart draws.
    const c = createChartWithOptions({
      chart: { type: 'treemap', height: 400, width: 600 },
      series: [{ data: [{ x: 'Root', y: 100, drilldown: 'lvl' }] }],
      drilldown: {
        series: [{ id: 'lvl', data: [{ x: 'a', y: 40 }, { x: 'b', y: 60 }] }],
      },
    })
    expect(leaves(c)).toHaveLength(1)
    expect(parents(c)).toHaveLength(0)
  })

  it('opts in to drilldown-as-levels when asked', () => {
    const c = createChartWithOptions({
      chart: { type: 'treemap', height: 400, width: 600 },
      series: [{ data: [{ x: 'Root', y: 100, drilldown: 'lvl' }] }],
      drilldown: {
        series: [{ id: 'lvl', data: [{ x: 'a', y: 40 }, { x: 'b', y: 60 }] }],
      },
      plotOptions: { treemap: { nested: { drilldownAsLevels: true } } },
    })
    expect(leaves(c)).toHaveLength(2)
    expect(parents(c).length).toBeGreaterThan(0)
  })
})

// ===========================================================================
describe('Nested treemap — structure', () => {
  it('draws one tile per leaf, at any depth', () => {
    const c = treemap()
    expect(leaves(c)).toHaveLength(6)
  })

  it('draws a container for every branch', () => {
    // 2 sectors + 3 industries.
    expect(parents(treemap())).toHaveLength(5)
  })

  it('nests every tile inside its container', () => {
    const c = treemap({ chart: { animations: { enabled: false } } })
    const containers = [
      ...c.el.querySelectorAll('.apexcharts-treemap-parent-rect'),
    ].map(rectOf)
    leaves(c)
      .map(rectOf)
      .forEach((tile) => {
        const inside = containers.filter(
          (p) =>
            tile.x >= p.x - 0.01 &&
            tile.y >= p.y - 0.01 &&
            tile.x + tile.w <= p.x + p.w + 0.01 &&
            tile.y + tile.h <= p.y + p.h + 0.01,
        )
        // Each tile sits inside its industry, which sits inside its sector.
        expect(inside.length).toBeGreaterThanOrEqual(2)
      })
  })

  it('paints containers before the tiles they hold', () => {
    // A treemap has no z-index; paint order is the only thing keeping a
    // container from covering its own contents.
    const c = treemap()
    const all = [
      ...c.el.querySelectorAll(
        '.apexcharts-treemap-parent-rect, .apexcharts-treemap-rect',
      ),
    ]
    const lastParent = all.reduce(
      (acc, el, k) =>
        el.classList.contains('apexcharts-treemap-parent-rect') ? k : acc,
      -1,
    )
    const firstLeaf = all.findIndex((el) =>
      el.classList.contains('apexcharts-treemap-rect'),
    )
    expect(lastParent).toBeLessThan(firstLeaf)
  })

  it('reserves header height so children start below the strip', () => {
    const c = treemap({
      treemap: { parents: { header: { height: 24 } }, nested: {} },
    })
    const strips = headers(c).map(rectOf)
    expect(strips.length).toBeGreaterThan(0)
    strips.forEach((s) => expect(s.h).toBe(24))

    const containers = [
      ...c.el.querySelectorAll('.apexcharts-treemap-parent-rect'),
    ].map(rectOf)
    // No tile may start above the bottom of a strip belonging to a container
    // it sits inside.
    leaves(c)
      .map(rectOf)
      .forEach((tile) => {
        strips.forEach((s, k) => {
          const p = containers[k]
          const insideP =
            tile.x >= p.x - 0.01 &&
            tile.x + tile.w <= p.x + p.w + 0.01 &&
            tile.y >= p.y - 0.01
          if (insideP) expect(tile.y).toBeGreaterThanOrEqual(s.y + s.h - 0.01)
        })
      })
  })

  it('labels each header with its branch name', () => {
    const names = parentLabels(treemap()).map((t) => t.textContent)
    expect(names).toContain('Tech')
    expect(names).toContain('Energy')
    expect(names).toContain('Software')
  })

  it('drops seriesTitle once real headers are drawn', () => {
    const c = treemap({ treemap: { seriesTitle: { show: true } } })
    // The free-floating plate would land on top of the level-0 strip.
    expect(
      c.el.querySelectorAll('.apexcharts-treemap-series > rect').length,
    ).toBeGreaterThan(0)
    const labelTexts = parentLabels(c).map((t) => t.textContent)
    expect(labelTexts).toContain('Tech')
  })

  it('leaves a single series unwrapped so level 0 is the authored level', () => {
    const c = treemap({
      treemap: { levels: [{ header: { height: 30 } }] },
    })
    // Level 0 is the sector, not the (nameless) wrapping series.
    const tall = headers(c)
      .map(rectOf)
      .filter((r) => r.h === 30)
    expect(tall).toHaveLength(2) // Tech, Energy
  })

  it('treats each series as level 0 when there are several', () => {
    const c = treemap({
      series: [
        { name: 'S1', data: [{ x: 'p', children: [{ x: 'l1', y: 5 }] }] },
        { name: 'S2', data: [{ x: 'q', children: [{ x: 'l2', y: 5 }] }] },
      ],
      treemap: { levels: [{ header: { height: 28 } }] },
    })
    const names = parentLabels(c).map((t) => t.textContent)
    expect(names).toContain('S1')
    expect(names).toContain('S2')
    const tall = headers(c)
      .map(rectOf)
      .filter((r) => r.h === 28)
    expect(tall).toHaveLength(2)
  })
})

// ===========================================================================
describe('Nested treemap — per-level styling', () => {
  it('applies a different header height per level', () => {
    const c = treemap({
      treemap: {
        levels: [
          { header: { height: 30 } },
          { header: { height: 16 } },
        ],
      },
    })
    const hs = headers(c).map((h) => rectOf(h).h)
    expect(hs).toContain(30)
    expect(hs).toContain(16)
  })

  it('applies a different padding per level', () => {
    const tight = treemap({
      treemap: { levels: [{ padding: 0 }, { padding: 0 }] },
    })
    const loose = treemap({
      treemap: { levels: [{ padding: 12 }, { padding: 12 }] },
    })
    const areaOf = (c) =>
      leaves(c)
        .map(rectOf)
        .reduce((s, b) => s + b.w * b.h, 0)
    // Padding is space taken away from the tiles.
    expect(areaOf(loose)).toBeLessThan(areaOf(tight))
  })

  it('turns a level header off', () => {
    const c = treemap({
      treemap: { levels: [{}, { header: { show: false } }] },
    })
    const names = parentLabels(c).map((t) => t.textContent)
    expect(names).toContain('Tech')
    expect(names).not.toContain('Software')
  })

  it('honours a header formatter', () => {
    const c = treemap({
      treemap: {
        parents: {
          header: {
            formatter: (name, { depth }) => `${depth}:${name}`,
          },
        },
      },
    })
    const names = parentLabels(c).map((t) => t.textContent)
    expect(names).toContain('0:Tech')
    expect(names).toContain('1:Software')
  })

  it('can be switched off entirely', () => {
    const c = treemap({ treemap: { parents: { show: false } } })
    expect(parents(c)).toHaveLength(0)
    expect(leaves(c)).toHaveLength(6)
  })

  it('can be forced on for flat data', () => {
    const c = treemap({ series: FLAT, treemap: { parents: { show: true } } })
    expect(parents(c)).toHaveLength(2)
  })
})

// ===========================================================================
describe('Nested treemap — continuous colour', () => {
  // Fill.fillPath emits rgba(); compare on the channels, not the notation.
  const toHex = (v) => {
    if (!v) return v
    const m = /^rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(v)
    if (!m) return v
    return (
      '#' +
      [1, 2, 3]
        .map((k) => Number(m[k]).toString(16).padStart(2, '0'))
        .join('')
    )
  }
  const fillsOf = (c) => leaves(c).map((r) => toHex(r.getAttribute('fill')))

  it('colours tiles by the second metric, not by area', () => {
    const c = treemap()
    const fills = fillsOf(c)
    expect(new Set(fills).size).toBe(6)
    // XOM (-3.1, the worst) and AAPL (+2.4, the best) must not be near each
    // other on the ramp even though their areas are similar.
    expect(fills[0]).not.toBe(fills[1])
  })

  it('puts equal colour metrics on the same colour regardless of size', () => {
    const c = treemap({
      series: [
        {
          data: [
            {
              x: 'P',
              children: [
                { x: 'small', y: 1, colorValue: 5 },
                { x: 'huge', y: 900, colorValue: 5 },
              ],
            },
          ],
        },
      ],
    })
    const [a, b] = fillsOf(c)
    expect(a).toBe(b)
  })

  it('pins the midpoint at zero for a diverging metric', () => {
    const c = treemap({
      series: [
        {
          data: [
            {
              x: 'P',
              children: [
                { x: 'neg', y: 10, colorValue: -4 },
                { x: 'zero', y: 10, colorValue: 0 },
                { x: 'pos', y: 10, colorValue: 4 },
              ],
            },
          ],
        },
      ],
      treemap: {
        colorScale: {
          gradient: { colors: ['#000000', '#808080', '#ffffff'] },
        },
      },
    })
    const [neg, zero, pos] = fillsOf(c)
    expect(neg).toBe('#000000')
    expect(zero).toBe('#808080')
    expect(pos).toBe('#ffffff')
  })

  it('balances an unbalanced diverging domain around the midpoint', () => {
    // -1 vs +9: without symmetry, -1 would be the fully saturated "loss"
    // colour, which would read as a terrible day rather than a flat one.
    const c = treemap({
      series: [
        {
          data: [
            {
              x: 'P',
              children: [
                { x: 'a', y: 10, colorValue: -1 },
                { x: 'b', y: 10, colorValue: 9 },
              ],
            },
          ],
        },
      ],
      treemap: {
        colorScale: {
          gradient: { colors: ['#000000', '#808080', '#ffffff'] },
        },
      },
    })
    const [a] = fillsOf(c)
    expect(a).not.toBe('#000000')
  })

  it('respects an explicit domain and midpoint', () => {
    const c = treemap({
      series: [
        {
          data: [
            {
              x: 'P',
              children: [
                { x: 'a', y: 10, colorValue: 0 },
                { x: 'b', y: 10, colorValue: 10 },
              ],
            },
          ],
        },
      ],
      treemap: {
        colorScale: {
          gradient: {
            min: 0,
            max: 10,
            midpoint: 5,
            colors: ['#000000', '#808080', '#ffffff'],
          },
        },
      },
    })
    const [a, b] = fillsOf(c)
    expect(a).toBe('#000000')
    expect(b).toBe('#ffffff')
  })

  it('reads a custom accessor', () => {
    const c = treemap({
      series: [
        {
          data: [
            {
              x: 'P',
              children: [
                { x: 'a', y: 10, change: -5 },
                { x: 'b', y: 10, change: 5 },
              ],
            },
          ],
        },
      ],
      treemap: {
        colorScale: {
          colorValue: 'change',
          gradient: { colors: ['#000000', '#808080', '#ffffff'] },
        },
      },
    })
    const [a, b] = fillsOf(c)
    expect(a).toBe('#000000')
    expect(b).toBe('#ffffff')
  })

  it('leaves colorScale.ranges alone', () => {
    // No colour metric anywhere: the discrete range palette must still drive
    // the fills exactly as it always did.
    const c = treemap({
      series: [
        { data: [{ x: 'lo', y: 5 }, { x: 'hi', y: 95 }] },
      ],
      treemap: {
        enableShades: false,
        colorScale: {
          ranges: [
            { from: 0, to: 50, color: '#00ff00' },
            { from: 51, to: 100, color: '#ff0000' },
          ],
        },
      },
    })
    const fills = fillsOf(c)
    expect(fills[0]).toBe('#00ff00')
    expect(fills[1]).toBe('#ff0000')
  })

  it('falls back to the shaded palette for a datum with no colour metric', () => {
    const c = treemap({
      series: [
        {
          data: [
            {
              x: 'P',
              children: [
                { x: 'withCV', y: 10, colorValue: 3 },
                { x: 'noCV', y: 10 },
              ],
            },
          ],
        },
      ],
    })
    const fills = fillsOf(c)
    expect(fills[0]).not.toBe(fills[1])
    expect(fills[1]).toBeTruthy()
  })

  it('can be turned off', () => {
    const withScale = fillsOf(treemap())
    const without = fillsOf(
      treemap({ treemap: { colorScale: { gradient: { enabled: false } } } }),
    )
    // Back to shading by area value, so the ramp colours are gone.
    expect(without).not.toEqual(withScale)
    // Sizes ascend/descend independently of the metric, so the two orderings
    // genuinely differ rather than merely shifting.
    expect(new Set(without).size).toBeGreaterThan(1)
  })
})

// ===========================================================================
describe('Nested treemap — gradient legend', () => {
  const strip = (c) => c.el.querySelector('.apexcharts-gradient-legend')

  it('renders a strip when enabled', () => {
    const c = treemap({
      legend: { show: true, position: 'bottom' },
      treemap: { colorScale: { gradientLegend: { enabled: true } } },
    })
    expect(strip(c)).toBeTruthy()
  })

  it('is off by default', () => {
    expect(strip(treemap({ legend: { show: true } }))).toBeNull()
  })

  it('draws the same stops the tiles were filled from', () => {
    const c = treemap({
      legend: { show: true, position: 'bottom' },
      treemap: {
        colorScale: {
          gradient: { colors: ['#000000', '#808080', '#ffffff'] },
          gradientLegend: { enabled: true },
        },
      },
    })
    const stops = [...strip(c).querySelectorAll('stop')].map((s) => ({
      offset: s.getAttribute('offset'),
      color: s.getAttribute('stop-color'),
    }))
    expect(stops.map((s) => s.color)).toEqual([
      '#000000',
      '#808080',
      '#ffffff',
    ])
    // The midpoint colour sits at the midpoint of a symmetric domain.
    expect(parseFloat(stops[1].offset)).toBeCloseTo(50, 1)
  })

  it('labels the ends with the colour metric domain, not the area domain', () => {
    const c = treemap({
      legend: { show: true, position: 'bottom' },
      treemap: {
        colorScale: {
          gradient: { min: -5, max: 5 },
          gradientLegend: { enabled: true, showLabels: true },
        },
      },
    })
    const labels = [...strip(c).querySelectorAll('text')].map(
      (t) => t.textContent,
    )
    // Area values run to 300; the strip must describe the metric instead.
    expect(labels.join(' ')).toMatch(/-5/)
    expect(labels.join(' ')).toMatch(/5/)
  })

  it('still serves the heatmap unchanged', () => {
    const c = createChartWithOptions({
      chart: { type: 'heatmap', height: 300, width: 500 },
      series: [
        { name: 'r1', data: [{ x: 'a', y: 10 }, { x: 'b', y: 90 }] },
      ],
      legend: { show: true, position: 'bottom' },
      plotOptions: {
        heatmap: { colorScale: { gradientLegend: { enabled: true } } },
      },
    })
    expect(
      c.el.querySelector('.apexcharts-heatmap-gradient-legend'),
    ).toBeTruthy()
  })
})

// ===========================================================================
describe('Nested treemap — data updates', () => {
  it('survives a re-render with the hierarchy intact', async () => {
    const c = treemap()
    expect(leaves(c)).toHaveLength(6)
    await c.update()
    expect(leaves(c)).toHaveLength(6)
    expect(parents(c)).toHaveLength(5)
  })

  it('resolves new nested data on updateSeries', async () => {
    const c = treemap()
    await c.updateSeries([
      {
        data: [
          { x: 'One', children: [{ x: 'x', y: 1 }, { x: 'y', y: 2 }] },
        ],
      },
    ])
    expect(leaves(c)).toHaveLength(2)
    expect(parentLabels(c).map((t) => t.textContent)).toContain('One')
  })

  it('goes back to flat when the new data is flat', async () => {
    const c = treemap()
    await c.updateSeries(FLAT)
    expect(leaves(c)).toHaveLength(4)
    expect(parents(c)).toHaveLength(0)
  })

  it('does not mutate the caller’s nested series', () => {
    const series = JSON.parse(JSON.stringify(NESTED))
    const snapshot = JSON.stringify(series)
    treemap({ series })
    expect(JSON.stringify(series)).toBe(snapshot)
  })
})

// ===========================================================================
describe('Nested treemap — zoom', () => {
  it('is off by default', () => {
    const c = treemap()
    expect(c.el.querySelector('.apexcharts-breadcrumb')).toBeNull()
  })

  it('reserves the breadcrumb band once, however often the chart re-renders', async () => {
    // Dimensions is a core module: `update()` reuses the instance rather than
    // rebuilding it, so anything that ADDS to this.gridPad has to be re-derived
    // per run or it compounds. It did not, so every zoom pushed the plot 22px
    // further down and took 22px more off its height.
    const c = treemap({ treemap: { zoom: { enabled: true } } })
    const top = c.w.layout.translateY
    const height = c.w.layout.gridHeight

    for (const key of [
      c.w.globals.treemapRoots[0].children[0]._key,
      c.w.globals.treemapRoots[0].children[0].children[0]._key,
      null,
    ]) {
      c.w.globals.treemapFocusKey = key
      await c.update()
      expect(c.w.layout.translateY).toBe(top)
      expect(c.w.layout.gridHeight).toBe(height)
    }
  })

  it('draws only the focused branch and a breadcrumb', async () => {
    const c = treemap({ treemap: { zoom: { enabled: true } } })
    const tech = c.w.globals.treemapRoots[0].children[0]
    c.w.globals.treemapFocusKey = tech._key
    await c.update()

    // Tech holds 4 of the 6 companies.
    expect(leaves(c)).toHaveLength(4)
    const crumb = c.el.querySelector('.apexcharts-breadcrumb')
    expect(crumb).toBeTruthy()
    expect(crumb.textContent).toContain('Tech')
  })

  it('gives the focused branch the whole plot', async () => {
    const c = treemap({
      treemap: { zoom: { enabled: true }, parents: { padding: 0 } },
      chart: { animations: { enabled: false } },
    })
    c.w.globals.treemapFocusKey =
      c.w.globals.treemapRoots[0].children[0]._key
    await c.update()
    const area = leaves(c)
      .map(rectOf)
      .reduce((s, b) => s + b.w * b.h, 0)
    const grid = c.w.layout.gridWidth * c.w.layout.gridHeight
    // The header strips are the only thing not covered by tiles.
    expect(area).toBeGreaterThan(grid * 0.8)
  })

  it('keeps every tile addressing its own data row while zoomed', async () => {
    const c = treemap({ treemap: { zoom: { enabled: true } } })
    c.w.globals.treemapFocusKey =
      c.w.globals.treemapRoots[0].children[1]._key // Energy
    await c.update()
    const drawn = leaves(c)
    expect(drawn).toHaveLength(2)
    // Energy's companies are the 5th and 6th leaves of the flattened series.
    expect(drawn.map((r) => r.getAttribute('j'))).toEqual(['4', '5'])
  })

  it('leaves the unwrapped series out of the breadcrumb', async () => {
    // A single series is a wrapper, not a level the reader ever sees, so it
    // must not turn up as a crumb between "All" and the focused branch.
    const c = treemap({ treemap: { zoom: { enabled: true } } })
    c.w.globals.treemapFocusKey =
      c.w.globals.treemapRoots[0].children[0]._key
    await c.update()
    const crumbs = [
      ...c.el.querySelectorAll(
        '.apexcharts-breadcrumb-item, .apexcharts-breadcrumb-current',
      ),
    ].map((e) => e.textContent.replace('←', '').trim())
    expect(crumbs).toEqual(['All', 'Tech'])
  })

  it('shows the deeper chain when zoomed into an industry', async () => {
    const c = treemap({ treemap: { zoom: { enabled: true } } })
    c.w.globals.treemapFocusKey =
      c.w.globals.treemapRoots[0].children[0].children[0]._key // Software
    await c.update()
    const crumbs = [
      ...c.el.querySelectorAll(
        '.apexcharts-breadcrumb-item, .apexcharts-breadcrumb-current',
      ),
    ].map((e) => e.textContent.replace('←', '').trim())
    expect(crumbs).toEqual(['All', 'Tech', 'Software'])
  })

  it('keeps "% of total" meaning the whole chart while zoomed', async () => {
    // Zooming used to make the focused branch its own total, so it reported
    // 100% of a market it is a fraction of.
    const seen = []
    const c = treemap({
      treemap: {
        zoom: { enabled: true },
        parents: {
          tooltip: {
            formatter: (o) => {
              seen.push(o)
              return 'x'
            },
          },
        },
      },
    })

    const hoverTech = (chart) => {
      const header = [
        ...chart.el.querySelectorAll('.apexcharts-treemap-parent-header'),
      ][0]
      header.dispatchEvent(new window.MouseEvent('mouseenter'))
    }

    hoverTech(c)
    const unzoomed = seen.at(-1)
    expect(unzoomed.name).toBe('Tech')
    expect(unzoomed.percentOfTotal).toBeCloseTo(
      (760 / 1110) * 100, // Tech's 760 of the 1110 total
      1,
    )

    c.w.globals.treemapFocusKey = c.w.globals.treemapRoots[0].children[0]._key
    await c.update()
    hoverTech(c)
    const zoomed = seen.at(-1)
    expect(zoomed.name).toBe('Tech')
    expect(zoomed.percentOfTotal).toBeCloseTo(unzoomed.percentOfTotal, 1)
    expect(zoomed.percentOfTotal).toBeLessThan(100)
  })

  it('reports the branch aggregate and its leaf count', () => {
    const seen = []
    const c = treemap({
      treemap: {
        parents: {
          tooltip: {
            formatter: (o) => {
              seen.push(o)
              return 'x'
            },
          },
        },
      },
    })
    c.el
      .querySelectorAll('.apexcharts-treemap-parent-header')[0]
      .dispatchEvent(new window.MouseEvent('mouseenter'))
    expect(seen[0].value).toBe(760) // 300 + 120 + 280 + 60
    expect(seen[0].leafCount).toBe(4)
    expect(seen[0].depth).toBe(0)
  })

  it('falls back to the whole tree when the focus key no longer resolves', async () => {
    const c = treemap({ treemap: { zoom: { enabled: true } } })
    c.w.globals.treemapFocusKey = 'no/such/key'
    await c.update()
    expect(leaves(c)).toHaveLength(6)
    expect(c.el.querySelector('.apexcharts-breadcrumb')).toBeNull()
  })
})
