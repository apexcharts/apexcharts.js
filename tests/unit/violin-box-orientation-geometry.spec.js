import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
// Not in the default bundle since 8.0, so imported the way an app would.
import '../../src/entries/violin.js'

// Violin and box plot each draw both orientations through one builder: the
// two orientations differ only in which screen axis the value runs along and
// where the category slot starts. These fixtures pin the drawn geometry of
// both, so a change to the shared builder shows up in each orientation.

const round = (d) =>
  d.replace(/-?\d+(\.\d+)?(e-?\d+)?/g, (n) => `${Math.round(+n * 100) / 100}`)

const nums = (d) => (d.match(/-?\d+(\.\d+)?(e-?\d+)?/g) || []).map(Number)

// [minX, minY, maxX, maxY] of a path's points, rounded
const bbox = (d) => {
  const n = nums(d)
  const xs = n.filter((_, k) => k % 2 === 0)
  const ys = n.filter((_, k) => k % 2 === 1)
  return [
    Math.min(...xs),
    Math.min(...ys),
    Math.max(...xs),
    Math.max(...ys),
  ].map((v) => Math.round(v * 100) / 100)
}

// Jitter packs circle sub-paths (`M x y a r r ...`): its points are the
// circle centres, which are the M coordinates plus the radius in x.
const centres = (d) =>
  [...d.matchAll(/M (-?[\d.e]+) (-?[\d.e]+) a (-?[\d.e]+)/g)].map(
    ([, x, y, r]) =>
      `${Math.round((+x + +r) * 100) / 100} ${Math.round(+y * 100) / 100}`,
  )

const marks = (root, sel) =>
  [...root.querySelectorAll(sel)].map((p) => ({
    i: p.closest('.apexcharts-series').getAttribute('data:realIndex'),
    j: p.getAttribute('j'),
    d: p.getAttribute('d'),
  }))

const density = [
  [0, 0.02],
  [1, 0.1],
  [2, 0.35],
  [3, 0.5],
  [4, 0.35],
  [5, 0.1],
  [6, 0.02],
]

const violin = (horizontal, plotOptions = {}) =>
  createChartWithOptions({
    chart: { type: 'violin', width: 600, height: 400 },
    series: [
      {
        name: 'A',
        data: [
          {
            x: 'G1',
            y: {
              density,
              points: [1, 2, 2.5, 3, 3.2, 4, 4.5],
              summary: [1, 2, 3, 4, 4.5],
            },
          },
          {
            x: 'G2',
            y: {
              density,
              points: [0.5, 1.5, 3, 3.5, 5],
              summary: [0.5, 1.5, 3, 3.5, 5],
            },
          },
        ],
      },
      {
        name: 'B',
        data: [
          {
            x: 'G1',
            y: {
              density,
              points: [1.5, 2, 3, 4],
              summary: [1.5, 2, 2.5, 3, 4],
            },
          },
          {
            x: 'G2',
            y: {
              density,
              points: [2, 2.5, 3, 5.5],
              summary: [2, 2.5, 3, 4, 5.5],
            },
          },
        ],
      },
    ],
    plotOptions: { ...plotOptions, bar: { horizontal } },
    dataLabels: { enabled: false },
  })

const box = (horizontal) =>
  createChartWithOptions({
    chart: { type: 'boxPlot', width: 600, height: 400 },
    series: [
      {
        name: 'A',
        data: [
          { x: 'a', y: [10, 20, 30, 40, 50], points: [12, 25, 33, 48] },
          { x: 'b', y: [15, 22, 35, 41, 58], points: [16, 30, 57] },
        ],
      },
      {
        name: 'B',
        data: [
          { x: 'a', y: [12, 18, 26, 44, 52] },
          { x: 'b', y: [20, 28, 31, 39, 47] },
        ],
      },
    ],
    plotOptions: {
      bar: { horizontal },
      boxPlot: { points: { show: true } },
    },
    stroke: { width: 2 },
    dataLabels: { enabled: false },
  })

// The whole drawn layout of one chart, compact enough to read in a diff:
// body/box bboxes, full box-lane and box-plot paths, jitter bboxes and the
// value-axis positions the tooltip reads.
const violinGeometry = (chart) => ({
  bodies: marks(
    chart.el,
    '.apexcharts-violin-area:not(.apexcharts-raincloud-box)',
  ).map((m) => `${m.i}/${m.j} ${bbox(m.d).join(',')}`),
  boxes: marks(chart.el, '.apexcharts-raincloud-box').map(
    (m) => `${m.i}/${m.j} ${round(m.d)}`,
  ),
  points: marks(chart.el, '.apexcharts-violin-points').map(
    (m) => `${m.i}/${m.j} ${centres(m.d).join(', ')}`,
  ),
  x: chart.w.globals.seriesXvalues.map((r) =>
    r.map((v) => Math.round(v * 100) / 100),
  ),
  y: chart.w.globals.seriesYvalues.map((r) =>
    r.map((v) => Math.round(v * 100) / 100),
  ),
})

const boxGeometry = (chart) => ({
  boxes: marks(chart.el, '.apexcharts-boxPlot-area').map(
    (m) => `${m.i}/${m.j} ${round(m.d)}`,
  ),
  points: marks(chart.el, '.apexcharts-boxPlot-points').map(
    (m) => `${m.i}/${m.j} ${centres(m.d).join(', ')}`,
  ),
  x: chart.w.globals.seriesXvalues.map((r) =>
    r.map((v) => Math.round(v * 100) / 100),
  ),
  y: chart.w.globals.seriesYvalues.map((r) =>
    r.map((v) => Math.round(v * 100) / 100),
  ),
})

describe('violin geometry, both orientations', () => {
  it('vertical', () => {
    expect(violinGeometry(violin(false))).toMatchInlineSnapshot(`
      {
        "bodies": [
          "0/0 -113.11,0,0,338.82",
          "0/1 210.06,0,323.18,338.82",
          "1/0 0,0,113.11,338.82",
          "1/1 323.18,0,436.29,338.82",
        ],
        "boxes": [],
        "points": [
          "0/0 -45.24 282.35, -81.86 225.88, -47.06 197.65, -42.51 169.41, -41.16 158.12, -30.89 112.94, -37.64 84.71",
          "0/1 259.83 310.58, 256.27 254.12, 289 169.41, 244.44 141.18, 271.41 56.47",
          "1/0 72.03 254.12, 59.86 225.88, 32.97 169.41, 79.72 112.94",
          "1/1 352.08 225.88, 398.82 197.65, 389.84 169.41, 382.22 28.24",
        ],
        "x": [
          [
            -56.56,
            266.62,
          ],
          [
            -56.56,
            379.73,
          ],
        ],
        "y": [
          [
            169.41,
            169.41,
          ],
          [
            169.41,
            169.41,
          ],
        ],
      }
    `)
  })

  it('horizontal', () => {
    expect(violinGeometry(violin(true))).toMatchInlineSnapshot(`
      {
        "bodies": [
          "0/0 0.1,25.41,563.1,84.71",
          "0/1 0.1,194.82,563.1,254.12",
          "1/0 0.1,84.71,563.1,144",
          "1/1 0.1,254.12,563.1,313.41",
        ],
        "boxes": [],
        "points": [
          "0/0 93.93 60.99, 187.77 41.8, 234.68 60.03, 281.6 62.42, 300.37 63.13, 375.43 68.51, 422.35 64.98",
          "0/1 47.02 220.91, 140.85 219.04, 281.6 236.2, 328.52 212.84, 469.27 226.98",
          "1/0 140.85 122.46, 187.77 116.08, 281.6 101.99, 375.43 126.49",
          "1/1 187.77 269.27, 234.68 293.77, 281.6 289.06, 516.18 285.06",
        ],
        "x": [
          [
            NaN,
            224.47,
          ],
          [
            NaN,
            283.76,
          ],
        ],
        "y": [
          [
            281.6,
            281.6,
          ],
          [
            281.6,
            281.6,
          ],
        ],
      }
    `)
  })

  const lanes = {
    violin: {
      side: 'right',
      box: { show: true },
      points: { position: 'left' },
    },
  }

  it('vertical, half violin with box and rain lanes', () => {
    expect(violinGeometry(violin(false, lanes))).toMatchInlineSnapshot(`
      {
        "bodies": [
          "0/0 -50.9,0,0,338.82",
          "0/1 272.28,0,323.18,338.82",
          "1/0 62.21,0,113.11,338.82",
          "1/1 385.39,0,436.29,338.82",
        ],
        "boxes": [
          "0/0 M -59.38 282.35 L -59.38 225.88M -59.38 112.94 L -59.38 84.71M -63.63 282.35 L -55.14 282.35M -63.63 84.71 L -55.14 84.71",
          "0/0 M -67.87 225.88 L -50.9 225.88 L -50.9 112.94 L -67.87 112.94zM -67.87 169.41 L -50.9 169.41",
          "0/1 M 263.79 310.58 L 263.79 254.12M 263.79 141.18 L 263.79 56.47M 259.55 310.58 L 268.03 310.58M 259.55 56.47 L 268.03 56.47",
          "0/1 M 255.31 254.12 L 272.28 254.12 L 272.28 141.18 L 255.31 141.18zM 255.31 169.41 L 272.28 169.41",
          "1/0 M 53.73 254.12 L 53.73 225.88M 53.73 169.41 L 53.73 112.94M 49.49 254.12 L 57.97 254.12M 49.49 112.94 L 57.97 112.94",
          "1/0 M 45.24 225.88 L 62.21 225.88 L 62.21 169.41 L 45.24 169.41zM 45.24 197.65 L 62.21 197.65",
          "1/1 M 376.9 225.88 L 376.9 197.65M 376.9 112.94 L 376.9 28.24M 372.66 225.88 L 381.15 225.88M 372.66 28.24 L 381.15 28.24",
          "1/1 M 368.42 197.65 L 385.39 197.65 L 385.39 112.94 L 368.42 112.94zM 368.42 169.41 L 385.39 169.41",
        ],
        "points": [
          "0/0 -85.43 282.35, -100.61 225.88, -86.69 197.65, -84.87 169.41, -84.33 158.12, -80.22 112.94, -82.92 84.71",
          "0/1 228.02 310.58, 228.55 254.12, 241.64 169.41, 223.81 141.18, 234.6 56.47",
          "1/0 28.81 254.12, 23.94 225.88, 13.19 169.41, 31.89 112.94",
          "1/1 334.74 225.88, 353.43 197.65, 349.84 169.41, 346.79 28.24",
        ],
        "x": [
          [
            -56.56,
            266.62,
          ],
          [
            -56.56,
            379.73,
          ],
        ],
        "y": [
          [
            169.41,
            169.41,
          ],
          [
            169.41,
            169.41,
          ],
        ],
      }
    `)
  })

  it('horizontal, half violin with box and rain lanes', () => {
    expect(violinGeometry(violin(true, lanes))).toMatchInlineSnapshot(`
      {
        "bodies": [
          "0/0 0.1,58.02,563.1,84.71",
          "0/1 0.1,227.43,563.1,254.12",
          "1/0 0.1,117.32,563.1,144",
          "1/1 0.1,286.73,563.1,313.41",
        ],
        "boxes": [
          "0/0 M 93.93 53.58 L 187.77 53.58M 375.43 53.58 L 422.35 53.58M 93.93 51.35 L 93.93 55.8M 422.35 51.35 L 422.35 55.8",
          "0/0 M 187.77 49.13 L 187.77 58.02 L 375.43 58.02 L 375.43 49.13zM 281.6 49.13 L 281.6 58.02",
          "0/1 M 47.02 222.99 L 140.85 222.99M 328.52 222.99 L 469.27 222.99M 47.02 220.76 L 47.02 225.21M 469.27 220.76 L 469.27 225.21",
          "0/1 M 140.85 218.54 L 140.85 227.43 L 328.52 227.43 L 328.52 218.54zM 281.6 218.54 L 281.6 227.43",
          "1/0 M 140.85 112.87 L 187.77 112.87M 281.6 112.87 L 375.43 112.87M 140.85 110.65 L 140.85 115.09M 375.43 110.65 L 375.43 115.09",
          "1/0 M 187.77 108.42 L 187.77 117.32 L 281.6 117.32 L 281.6 108.42zM 234.68 108.42 L 234.68 117.32",
          "1/1 M 187.77 282.28 L 234.68 282.28M 375.43 282.28 L 516.18 282.28M 187.77 280.06 L 187.77 284.5M 516.18 280.06 L 516.18 284.5",
          "1/1 M 234.68 277.83 L 234.68 286.73 L 375.43 286.73 L 375.43 277.83zM 281.6 277.83 L 281.6 286.73",
        ],
        "points": [
          "0/0 93.93 39.92, 187.77 31.97, 234.68 39.26, 281.6 40.22, 300.37 40.5, 375.43 42.65, 422.35 41.24",
          "0/1 47.02 204.23, 140.85 204.51, 281.6 211.37, 328.52 202.03, 469.27 207.68",
          "1/0 140.85 99.81, 187.77 97.26, 281.6 91.62, 375.43 101.42",
          "1/1 187.77 260.18, 234.68 269.98, 281.6 268.09, 516.18 266.49",
        ],
        "x": [
          [
            NaN,
            224.47,
          ],
          [
            NaN,
            283.76,
          ],
        ],
        "y": [
          [
            281.6,
            281.6,
          ],
          [
            281.6,
            281.6,
          ],
        ],
      }
    `)
  })
})

describe('box plot geometry, both orientations', () => {
  it('vertical', () => {
    expect(boxGeometry(box(false))).toMatchInlineSnapshot(`
      {
        "boxes": [
          "0/0 M -113.11 271.06 L -56.56 271.06 L -56.56 338.82 L -84.83 338.82 L -28.28 338.82 L -56.56 338.82 L -56.56 271.06 L 0 271.06 L 0 203.29 L -113.11 203.29 L -113.11 272.06",
          "0/0 M -113.11 203.29 L 0 203.29 L 0 135.53 L -56.56 135.53 L -56.56 67.76 L -28.28 67.76 L -84.83 67.76 L -56.56 67.76 L -56.56 135.53 L -113.11 135.53 L -113.11 203.29z",
          "0/1 M 210.06 257.5 L 266.62 257.5 L 266.62 304.94 L 238.34 304.94 L 294.9 304.94 L 266.62 304.94 L 266.62 257.5 L 323.18 257.5 L 323.18 169.41 L 210.06 169.41 L 210.06 258.5",
          "0/1 M 210.06 169.41 L 323.18 169.41 L 323.18 128.75 L 266.62 128.75 L 266.62 13.55 L 294.9 13.55 L 238.34 13.55 L 266.62 13.55 L 266.62 128.75 L 210.06 128.75 L 210.06 169.41z",
          "1/0 M 0 284.61 L 56.56 284.61 L 56.56 325.27 L 28.28 325.27 L 84.83 325.27 L 56.56 325.27 L 56.56 284.61 L 113.11 284.61 L 113.11 230.4 L 0 230.4 L 0 285.61",
          "1/0 M 0 230.4 L 113.11 230.4 L 113.11 108.42 L 56.56 108.42 L 56.56 54.21 L 84.83 54.21 L 28.28 54.21 L 56.56 54.21 L 56.56 108.42 L 0 108.42 L 0 230.4z",
          "1/1 M 323.18 216.84 L 379.73 216.84 L 379.73 271.06 L 351.45 271.06 L 408.01 271.06 L 379.73 271.06 L 379.73 216.84 L 436.29 216.84 L 436.29 196.52 L 323.18 196.52 L 323.18 217.84",
          "1/1 M 323.18 196.52 L 436.29 196.52 L 436.29 142.3 L 379.73 142.3 L 379.73 88.09 L 408.01 88.09 L 351.45 88.09 L 379.73 88.09 L 379.73 142.3 L 323.18 142.3 L 323.18 196.52z",
        ],
        "points": [
          "0/0 -43.9 325.27, -81.86 237.17, -47.06 182.96, -42.51 81.32",
          "0/1 254.96 298.16, 256.27 203.29, 289 20.33",
        ],
        "x": [
          [
            -56.56,
            266.62,
          ],
          [
            -56.56,
            266.62,
          ],
        ],
        "y": [
          [
            135.53,
            128.75,
          ],
          [
            108.42,
            142.3,
          ],
        ],
      }
    `)
  })

  it('horizontal', () => {
    expect(boxGeometry(box(true))).toMatchInlineSnapshot(`
      {
        "boxes": [
          "0/0 M 112.6 25.41 L 112.6 55.06 L 0 55.06 L 0 40.23 L 0 69.88 L 0 55.06 L 112.6 55.06 L 112.6 84.71 L 225.2 84.71 L 225.2 25.41 L 111.6 25.41",
          "0/0 M 225.2 25.41 L 225.2 84.71 L 337.8 84.71 L 337.8 55.06 L 450.4 55.06 L 450.4 69.88 L 450.4 40.23 L 450.4 55.06 L 337.8 55.06 L 337.8 25.41 L 225.2 25.41z",
          "0/1 M 135.12 194.82 L 135.12 224.47 L 56.3 224.47 L 56.3 209.64 L 56.3 239.29 L 56.3 224.47 L 135.12 224.47 L 135.12 254.12 L 281.5 254.12 L 281.5 194.82 L 134.12 194.82",
          "0/1 M 281.5 194.82 L 281.5 254.12 L 349.06 254.12 L 349.06 224.47 L 540.48 224.47 L 540.48 239.29 L 540.48 209.64 L 540.48 224.47 L 349.06 224.47 L 349.06 194.82 L 281.5 194.82z",
          "1/0 M 90.08 84.71 L 90.08 114.35 L 22.52 114.35 L 22.52 99.53 L 22.52 129.18 L 22.52 114.35 L 90.08 114.35 L 90.08 144 L 180.16 144 L 180.16 84.71 L 89.08 84.71",
          "1/0 M 180.16 84.71 L 180.16 144 L 382.84 144 L 382.84 114.35 L 472.92 114.35 L 472.92 129.18 L 472.92 99.53 L 472.92 114.35 L 382.84 114.35 L 382.84 84.71 L 180.16 84.71z",
          "1/1 M 202.68 254.12 L 202.68 283.76 L 112.6 283.76 L 112.6 268.94 L 112.6 298.59 L 112.6 283.76 L 202.68 283.76 L 202.68 313.41 L 236.46 313.41 L 236.46 254.12 L 201.68 254.12",
          "1/1 M 236.46 254.12 L 236.46 313.41 L 326.54 313.41 L 326.54 283.76 L 416.62 283.76 L 416.62 298.59 L 416.62 268.94 L 416.62 283.76 L 326.54 283.76 L 326.54 254.12 L 236.46 254.12z",
        ],
        "points": [
          "0/0 22.52 61.69, 168.9 41.8, 258.98 60.03, 427.88 62.42",
          "0/1 67.56 218.35, 225.2 219.04, 529.22 236.2",
        ],
        "x": [
          [
            NaN,
            349.06,
          ],
          [
            NaN,
            326.54,
          ],
        ],
        "y": [
          [
            194.82,
            364.23,
          ],
          [
            194.82,
            364.23,
          ],
        ],
      }
    `)
  })

  // The lower half is an open path whose last segment runs half a stroke
  // past the corner it started at, so the corner is filled under a butt
  // cap. It runs toward the lower values, which is down a column and left
  // along a row.
  for (const horizontal of [false, true]) {
    it(`${horizontal ? 'horizontal' : 'vertical'}: the lower half closes past its corner`, () => {
      const chart = box(horizontal)
      const lower = marks(chart.el, '.apexcharts-boxPlot-area')[0].d
      const n = nums(lower)
      const [sx, sy] = n.slice(0, 2)
      const [ex, ey] = n.slice(-2)
      if (horizontal) {
        expect(ey).toBe(sy)
        expect(ex).toBeCloseTo(sx - 1, 6)
      } else {
        expect(ex).toBe(sx)
        expect(ey).toBeCloseTo(sy + 1, 6)
      }
    })
  }
})
