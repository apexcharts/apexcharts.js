// determineColor rescanned the whole row for every cell, so a distributed
// heatmap or a treemap cost O(n^2) per render (20 rows of 20,000 points froze
// the tab). The row extent is now computed once per row per render; the fills
// must be exactly what they were.
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Helpers from '../../src/charts/common/treemap/Helpers.js'

/** A row whose numeric index reads are counted. */
function countedRow(values, counter) {
  return new Proxy(values, {
    get(t, k) {
      if (typeof k === 'string' && /^\d+$/.test(k)) counter.n++
      return t[k]
    },
  })
}

function fakeW(type, rows) {
  return {
    seriesData: { series: rows },
    globals: { colors: ['#008ffb', '#00e396'], minY: 0, maxY: 100 },
    config: {
      chart: { type },
      plotOptions: {
        [type]: {
          distributed: true,
          colorScale: { ranges: [], inverse: false },
        },
      },
    },
  }
}

describe('row extent is computed once per row per render', () => {
  for (const type of ['heatmap', 'treemap']) {
    it(`${type}: reads stay linear in the row length`, () => {
      const N = 1000
      const counter = { n: 0 }
      const values = Array.from({ length: N }, (_, k) => (k * 37) % 101)
      const w = fakeW(type, [countedRow(values, counter)])
      const h = new Helpers(w, {})
      h.checkColorRange()
      for (let j = 0; j < N; j++) h.determineColor(type, 0, j)
      // One scan (two reads a value) plus one read per cell; the old rescan
      // read 2N per cell.
      expect(counter.n).toBeLessThan(4 * N)
    })
  }

  it('a new render rescans, so changed data is not read from a stale cache', () => {
    const w = fakeW('heatmap', [[0, 10]])
    const h = new Helpers(w, {})
    h.checkColorRange()
    const before = h.determineColor('heatmap', 0, 1).percent
    w.seriesData.series = [[0, 20, 10]]
    h.checkColorRange()
    expect(h.determineColor('heatmap', 0, 2).percent).toBe(before / 2)
  })
})

const fills = (c, sel) =>
  [...c.el.querySelectorAll(sel)].map((el) => el.getAttribute('fill'))

// Captured at 9674b8ddc, before the change.
const BASE = {
  heat: [
    'rgba(162,223,202,1)',
    'rgba(128,212,183,1)',
    'rgba(64,190,147,1)',
    'rgba(111,206,173,1)',
    'rgba(34,180,130,1)',
    'rgba(121,196,253,1)',
    'rgba(74,175,252,1)',
    'rgba(111,192,253,1)',
    'rgba(7,146,251,1)',
    'rgba(83,180,252,1)',
  ],
  tree: [
    'rgba(3,144,251,1)',
    'rgba(66,172,252,1)',
    'rgba(122,197,253,1)',
    'rgba(138,203,253,1)',
    'rgba(156,212,253,1)',
    'rgba(49,185,139,1)',
    'rgba(110,206,173,1)',
  ],
}

describe('colours are unchanged', () => {
  it('distributed heatmap and treemap fills match the base', () => {
    const heat = createChartWithOptions({
      chart: { type: 'heatmap', width: 400, height: 300 },
      plotOptions: { heatmap: { distributed: true } },
      series: [
        {
          name: 'r1',
          data: [5, 40, 12, 90, 33].map((y, k) => ({ x: `c${k}`, y })),
        },
        {
          name: 'r2',
          data: [-8, 0, 15, 4, 22].map((y, k) => ({ x: `c${k}`, y })),
        },
      ],
    })
    const tree = createChartWithOptions({
      chart: { type: 'treemap', width: 400, height: 300 },
      series: [
        {
          data: [
            ['a', 50],
            ['b', 30],
            ['c', 12],
            ['d', 7],
            ['e', 1],
          ].map(([x, y]) => ({ x, y })),
        },
        {
          data: [
            ['f', 20],
            ['g', 9],
          ].map(([x, y]) => ({ x, y })),
        },
      ],
    })
    const got = {
      heat: fills(heat, '.apexcharts-heatmap-rect'),
      tree: fills(tree, '.apexcharts-treemap-rect'),
    }
    expect(got).toEqual(BASE)
    heat.destroy()
    tree.destroy()
  })
})
