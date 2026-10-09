import { describe, test, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/features/highlight-filter.js'

// Treemap: a tile keeps its box, faded, and its part is the tile's bottom
// share, solid, drawn inside the tile's own fill (a per-tile vertical
// gradient with a hard stop), so no element is added. Nested parents are
// frames that add up their leaves' parts in node.highlight.

afterEach(() => vi.restoreAllMocks())

const DATA = [
  { x: 'A', y: 40, highlight: 10 },
  { x: 'B', y: 30, highlight: 15 },
  { x: 'C', y: 20 },
]

function treemap(extra = {}) {
  return createChartWithOptions({
    series: extra.series || [{ name: 'S', data: DATA }],
    ...extra.options,
    chart: {
      type: 'treemap',
      width: 500,
      height: 300,
      ...(extra.chart || {}),
    },
    plotOptions: { treemap: extra.tm || {} },
    highlightFilter: extra.hf || {},
  })
}

const NESTED = [
  {
    name: 'Shop',
    data: [
      {
        x: 'Apparel',
        children: [
          { x: 'Jackets', y: 40, highlight: 10 },
          { x: 'Tees', y: 20, highlight: 5 },
        ],
      },
      {
        x: 'Home',
        children: [
          { x: 'Lamps', y: 30, highlight: null },
          { x: 'Rugs', y: 10, highlight: 8 },
        ],
      },
    ],
  },
]

const q = (chart, sel) => [...chart.w.dom.baseEl.querySelectorAll(sel)]
const tiles = (chart) => q(chart, '.apexcharts-treemap-rect')
const tile = (chart, j, i = 0) =>
  tiles(chart).find(
    (n) =>
      n.getAttribute('j') === String(j) && n.getAttribute('i') === String(i),
  )
/** The gradient a tile is filled with, read as its look. */
function look(chart, n) {
  const m = /^url\(#([^)]+)\)$/.exec(n.getAttribute('fill') || '')
  if (!m) return null
  const g = chart.w.dom.baseEl.querySelector('#' + m[1])
  const stops = [...g.querySelectorAll('stop')].map((s) => ({
    offset: +s.getAttribute('offset'),
    color: s.getAttribute('stop-color'),
    opacity: +s.getAttribute('stop-opacity'),
  }))
  return {
    g,
    stops,
    s: stops[1].offset,
    f: stops[2].opacity,
    color: stops[0].color,
  }
}
const plainFills = (series, tm = {}) =>
  tiles(treemap({ series: series.map(strip), tm })).map((n) =>
    n.getAttribute('fill'),
  )
/** A series as handed in, without its parts. */
const strip = (s) =>
  JSON.parse(
    JSON.stringify(s, (k, v) =>
      k === 'highlight' || k === 'highlightData' ? undefined : v,
    ),
  )

describe('parse', () => {
  test('a treemap is supported; its parts never reach the value extent', () => {
    const chart = treemap()
    expect(chart.highlightFilter.isActive()).toBe(true)
    expect(chart.w.highlightData.parts).toEqual([[10, 15, null]])
    expect(chart.w.highlightData.ext).toBe(null)
    expect(chart.highlightFilter.valueAt(0, 1)).toBe(15)
  })

  test('the shading is the same with and without parts (shades, ranges, a continuous scale)', () => {
    // parts past every whole would widen the extent the shades are read from
    const series = [
      {
        name: 'S',
        data: [
          { x: 'A', y: 40, highlight: 400 },
          { x: 'B', y: -30, highlight: -300 },
          { x: 'C', y: 20, highlight: 200, colorValue: 3 },
        ],
      },
    ]
    for (const tm of [
      {},
      {
        colorScale: {
          ranges: [
            { from: -50, to: 0, color: '#e11d48' },
            { from: 1, to: 50, color: '#0284c7' },
          ],
        },
      },
      {
        colorScale: {
          colorValue: 'colorValue',
          gradient: { colors: ['#0284c7', '#d97706'] },
        },
      },
    ]) {
      const chart = treemap({ series, tm })
      const plain = treemap({ series: series.map(strip), tm })
      expect(chart.w.globals.minY).toBe(plain.w.globals.minY)
      expect(chart.w.globals.maxY).toBe(plain.w.globals.maxY)
      const want = tiles(plain).map((n) => n.getAttribute('fill'))
      expect(tiles(chart).map((n) => look(chart, n).color)).toEqual(want)
    }
  })

  test('enabled false keeps the parts and draws plain', () => {
    const chart = treemap({ hf: { enabled: false } })
    expect(chart.highlightFilter.isActive()).toBe(false)
    expect(tiles(chart).some((n) => /url/.test(n.getAttribute('fill')))).toBe(
      false,
    )
    expect(q(chart, '.apexcharts-highlight-tile').length).toBe(0)
  })

  test('the parallel form works on a flat treemap', () => {
    const chart = treemap({
      series: [{ name: 'S', data: [40, 30, 20], highlightData: [4, null, 20] }],
    })
    expect(chart.w.highlightData.parts).toEqual([[4, null, 20]])
  })

  test('nested: a leaf part follows its leaf index; highlightData and parent parts warn once and are ignored', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = treemap({
      series: [
        {
          ...NESTED[0],
          highlightData: [1, 2],
          data: [{ ...NESTED[0].data[0], highlight: 99 }, NESTED[0].data[1]],
        },
      ],
    })
    expect(chart.w.highlightData.parts).toEqual([[10, 5, null, 8]])
    const said = (re) => warn.mock.calls.filter((c) => re.test(c[0])).length
    expect(said(/highlightData is ignored/)).toBe(1)
    expect(said(/parent's highlight is ignored/)).toBe(1)
    // the tree keeps its levels
    expect(chart.w.globals.treemapRoots[0].children.length).toBe(2)
  })
})

describe('tiles', () => {
  test('a tile is filled bottom-up: solid to its share, faded above, in its own box', () => {
    const chart = treemap()
    const plain = plainFills([{ name: 'S', data: DATA }])
    const a = look(chart, tile(chart, 0))
    expect(a.g.tagName.toLowerCase()).toBe('lineargradient')
    expect(['x1', 'y1', 'x2', 'y2'].map((k) => a.g.getAttribute(k))).toEqual([
      '0',
      '1',
      '0',
      '0',
    ])
    expect(a.g.getAttribute('gradientUnits')).toBe(null)
    expect(a.stops.map((s) => [s.offset, s.opacity])).toEqual([
      [0, 1],
      [0.25, 1],
      [0.25, 0.2],
      [1, 0.2],
    ])
    expect(a.stops.every((s) => s.color === plain[0])).toBe(true)
    expect(look(chart, tile(chart, 1)).s).toBe(0.5)
    // the DOM contract: class and share on the tile, no part element
    const t = tile(chart, 0)
    expect(t.classList.contains('apexcharts-highlight-tile')).toBe(true)
    expect(t.classList.contains('apexcharts-treemap-rect')).toBe(true)
    expect(t.getAttribute('data:hl-share')).toBe('0.25')
    expect(q(chart, '.apexcharts-highlight-part').length).toBe(0)
  })

  test('share rules: 0, 1, past the whole, none, the other sign, a zero whole', () => {
    const chart = treemap({
      series: [
        {
          name: 'S',
          data: [
            { x: 'zero', y: 40, highlight: 0 },
            { x: 'all', y: 30, highlight: 30 },
            { x: 'over', y: 20, highlight: 25 },
            { x: 'none', y: 20, highlight: null },
            { x: 'sign', y: 20, highlight: -5 },
            { x: 'empty', y: 0, highlight: 5 },
          ],
        },
      ],
    })
    const at = (j) => look(chart, tile(chart, j))
    expect(at(0).s).toBe(0)
    expect(tile(chart, 0).getAttribute('data:hl-share')).toBe('0')
    expect(at(1).s).toBe(1)
    // past the whole: drawn at the full tile, marked, the true share kept
    expect(at(2).s).toBe(1)
    expect(
      tile(chart, 2).classList.contains('apexcharts-highlight-overflow'),
    ).toBe(true)
    expect(tile(chart, 2).getAttribute('data:hl-share')).toBe('1.25')
    expect(at(3).s).toBe(0)
    expect(at(3).f).toBe(0.2)
    expect(tile(chart, 3).getAttribute('data:hl-share')).toBe('')
    expect(at(4).s).toBe(0)
    // a zero whole has nothing to share: drawn plain
    expect(tile(chart, 5).getAttribute('fill')).not.toMatch(/url/)
    expect(tile(chart, 5).classList.contains('apexcharts-highlight-tile')).toBe(
      false,
    )
  })

  test('distributed tiles, ranges and a continuous scale keep each tile its own colour', () => {
    for (const tm of [
      { distributed: true },
      {
        enableShades: false,
        colorScale: {
          ranges: [
            { from: 0, to: 25, color: '#e11d48' },
            { from: 26, to: 50, color: '#0284c7' },
          ],
        },
      },
    ]) {
      const chart = treemap({ tm })
      const plain = plainFills([{ name: 'S', data: DATA }], tm)
      expect(tiles(chart).map((n) => look(chart, n).color)).toEqual(plain)
    }
  })

  test('a gradient, pattern or image fill is drawn plain, with one warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = treemap({ options: { fill: { type: 'gradient' } } })
    for (const t of tiles(chart)) {
      expect(t.classList.contains('apexcharts-highlight-tile')).toBe(false)
    }
    expect(
      warn.mock.calls.filter((c) =>
        /gradient, pattern or image fill/.test(c[0]),
      ).length,
    ).toBe(1)
  })

  test('a named, hsl() or CSS-variable colour is a colour: the tiles keep their parts and nothing warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (const c of ['tomato', 'hsl(200, 70%, 45%)', 'var(--tm-c)']) {
      const chart = treemap({
        options: { colors: [c] },
        tm: { enableShades: false },
      })
      const t = tile(chart, 0)
      expect(t.classList.contains('apexcharts-highlight-tile'), c).toBe(true)
      const l = look(chart, t)
      expect(l.color, c).toBe(c)
      expect(l.s).toBe(0.25)
    }
    expect(
      warn.mock.calls.filter((c) =>
        /gradient, pattern or image fill/.test(c[0]),
      ).length,
    ).toBe(0)
  })

  test("the stroke and the box are the renderer's own", () => {
    const chart = treemap()
    const plain = treemap({ series: [strip({ name: 'S', data: DATA })] })
    tiles(chart).forEach((n, k) => {
      const p = tiles(plain)[k]
      for (const a of [
        'x',
        'y',
        'width',
        'height',
        'stroke',
        'stroke-width',
        'rx',
      ]) {
        expect(n.getAttribute(a)).toBe(p.getAttribute(a))
      }
    })
  })
})

describe('labels', () => {
  test('a white label takes the text colour until the solid share reaches its top', () => {
    const chart = treemap({
      options: { dataLabels: { enabled: true, style: { fontSize: '12px' } } },
      series: [
        {
          name: 'S',
          data: [
            { x: 'low', y: 40, highlight: 4 },
            { x: 'high', y: 40, highlight: 36 },
            { x: 'none', y: 40 },
          ],
        },
      ],
    })
    const fill = (j) =>
      tile(chart, j)
        .nextElementSibling.querySelector('text')
        .getAttribute('fill')
    expect(fill(0)).toBe(chart.w.config.chart.foreColor)
    expect(fill(1)).toBe('#fff')
    expect(fill(2)).toBe(chart.w.config.chart.foreColor)
  })

  test('the leaf formatter is told the highlight', () => {
    const seen = []
    treemap({
      options: {
        dataLabels: {
          enabled: true,
          formatter: (t, o) => {
            seen.push(o.highlight)
            return t
          },
        },
      },
    })
    expect(seen[0]).toEqual({
      value: 10,
      total: 40,
      share: 0.25,
      overflow: false,
    })
    expect(seen[2]).toEqual({
      value: null,
      total: 20,
      share: null,
      overflow: false,
    })
  })
})

describe('nested', () => {
  test('parents are frames that add up their leaves; formatters are handed node.highlight', () => {
    const headers = {}
    const chart = treemap({
      series: NESTED,
      tm: {
        parents: {
          header: {
            formatter: (name, o) => {
              headers[name] = o.node.highlight
              return name
            },
          },
        },
      },
    })
    expect(headers.Apparel).toEqual({
      value: 15,
      total: 60,
      share: 0.25,
      overflow: false,
    })
    expect(headers.Home).toEqual({
      value: 8,
      total: 40,
      share: 0.2,
      overflow: false,
    })
    // parents never fade
    for (const p of q(chart, '.apexcharts-treemap-parent-rect')) {
      expect(p.getAttribute('fill')).not.toMatch(/url/)
    }
    // leaves are filled by their own share, by leaf index
    expect(look(chart, tile(chart, 3)).s).toBe(0.8)
    expect(look(chart, tile(chart, 2)).s).toBe(0)
  })

  test('a branch with no leaf part has no value; an opposite-sign leaf adds nothing', () => {
    const chart = treemap({
      series: [
        {
          name: 'Shop',
          data: [
            {
              x: 'A',
              children: [
                { x: 'a1', y: 10 },
                { x: 'a2', y: 10, highlight: null },
              ],
            },
            {
              x: 'B',
              children: [
                { x: 'b1', y: 10, highlight: -4 },
                { x: 'b2', y: 30, highlight: 6 },
              ],
            },
          ],
        },
      ],
    })
    const [a, b] = chart.w.globals.treemapRoots[0].children
    expect(a.highlight.value).toBe(null)
    expect(b.highlight).toEqual({
      value: 6,
      total: 40,
      share: 0.15,
      overflow: false,
    })
    expect(b.children[0].highlight.overflow).toBe('sign')
  })

  test('without a pick the tree carries no roll-up', async () => {
    const chart = treemap({ series: NESTED })
    await chart.highlightFilter.clear({ animate: false })
    const walk = (n) => {
      expect(n.highlight).toBe(undefined)
      ;(n.children || []).forEach(walk)
    }
    chart.w.globals.treemapRoots.forEach(walk)
    expect(q(chart, '.apexcharts-highlight-tile').length).toBe(0)
  })

  test('set() writes each leaf its part by leaf index and keeps the levels; clear() takes them all off', async () => {
    const chart = treemap({ series: NESTED })
    await chart.highlightFilter.set([[1, 2, 3, 4]], { animate: false })
    expect(chart.w.highlightData.parts).toEqual([[1, 2, 3, 4]])
    expect(chart.w.globals.treemapRoots[0].children.length).toBe(2)
    const seen = []
    await chart.highlightFilter.set(
      (o) => {
        seen.push([o.dataPointIndex, o.x, o.value])
        return o.value / 2
      },
      { animate: false },
    )
    expect(seen).toEqual([
      [0, 'Jackets', 40],
      [1, 'Tees', 20],
      [2, 'Lamps', 30],
      [3, 'Rugs', 10],
    ])
    expect(chart.w.highlightData.parts).toEqual([[20, 10, 15, 5]])
    expect(chart.w.globals.treemapRoots[0].children.length).toBe(2)
    await chart.highlightFilter.clear({ animate: false })
    expect(chart.highlightFilter.isActive()).toBe(false)
    const carries = JSON.stringify(chart.w.globals.treemapRawSeries).includes(
      'highlight',
    )
    expect(carries).toBe(false)
    expect(q(chart, '.apexcharts-highlight-tile').length).toBe(0)
  })
  test('set() after a nested treemap becomes another type keeps its categories', async () => {
    const chart = treemap({ series: NESTED })
    await chart.updateOptions(
      {
        chart: { type: 'bar' },
        series: [{ name: 'Sales', data: [10, 20, 30] }],
        xaxis: { categories: ['Jan', 'Feb', 'Mar'] },
      },
      false,
      false,
    )
    await chart.highlightFilter.set([[5, 5, 5]], { animate: false })
    expect(chart.w.config.series[0].data).toEqual([10, 20, 30])
    expect(chart.w.highlightData.parts).toEqual([[5, 5, 5]])
    const xl = q(chart, '.apexcharts-xaxis-label').map((n) => n.textContent)
    expect(xl).toEqual(['Jan', 'Feb', 'Mar'])
  })
})

describe('updates', () => {
  test('a flat re-pick takes the fast path and leaves no stale gradient behind', async () => {
    const chart = treemap()
    const stats = chart._updateStats
    const full = stats.full
    const grads = () =>
      q(chart, 'linearGradient').filter((g) => /^SvgjsGradient/.test(g.id))
        .length
    expect(grads()).toBe(3)
    for (let k = 0; k < 5; k++) {
      await chart.updateSeries([
        {
          name: 'S',
          data: DATA.map((d, j) => ({ ...d, highlight: (k + j) % 4 })),
        },
      ])
    }
    expect(stats.full).toBe(full)
    expect(stats.fast).toBeGreaterThan(0)
    expect(grads()).toBe(3)
    expect(look(chart, tile(chart, 0)).s).toBe(0)
  })

  test('a clear without animation is the never-highlighted DOM', async () => {
    const chart = treemap()
    await chart.updateSeries([strip({ name: 'S', data: DATA })], false)
    const plain = treemap({ series: [strip({ name: 'S', data: DATA })] })
    const html = (c) => tiles(c).map((n) => n.outerHTML)
    expect(html(chart)).toEqual(html(plain))
    expect(q(chart, 'linearGradient').length).toBe(
      q(plain, 'linearGradient').length,
    )
  })

  test("the tooltip swatch takes the tile's own colour", () => {
    const chart = treemap({ tm: { distributed: true } })
    const hf = chart.highlightFilter
    const marker = document.createElement('span')
    const yValue = document.createElement('span')
    yValue.innerHTML = '30'
    hf.tooltipRow({ marker, yValue }, 0, 1, { yLbFormatter: (v) => String(v) })
    const own = look(chart, tile(chart, 1)).color
    expect(marker.style.boxShadow).toContain(own)
    expect(yValue.textContent).toBe('15 / 30')
  })

  test('a cross-type morph out of a treemap takes each tile once, as its box', () => {
    const chart = treemap()
    const { marks } = chart.ctx.morphTypeChange._captureFromDOM('treemap')
    expect(marks.length).toBe(3)
    marks.forEach((m) => {
      const n = tile(chart, m.j)
      const [x, y] = ['x', 'y'].map((a) => n.getAttribute(a))
      expect(m.d.startsWith(`M ${x} ${y} `)).toBe(true)
    })
  })
})
