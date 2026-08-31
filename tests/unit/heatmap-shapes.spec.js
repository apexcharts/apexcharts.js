import { createChartWithOptions } from './utils/utils.js'
import { hasCanvasUnsupportedFeature } from '../../src/renderers/Renderer.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ROWS = 3
const COLS = 4

function makeRow(name, values) {
  return {
    name,
    data: values.map((v, i) => ({ x: String(i + 1), y: v })),
  }
}

function heatmapChart(shape, extra = {}) {
  return createChartWithOptions({
    chart: { type: 'heatmap', height: 400, width: 600, ...extra.chart },
    series: extra.series || [
      makeRow('R1', [10, 20, 30, 40]),
      makeRow('R2', [15, 25, 35, 45]),
      makeRow('R3', [12, 22, 32, 42]),
    ],
    xaxis: extra.xaxis || { type: 'category' },
    plotOptions: { heatmap: { shape, ...extra.heatmap } },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
  })
}

function getCells(chart) {
  return Array.from(chart.el.querySelectorAll('.apexcharts-heatmap-rect'))
}

// The cell box every consumer (tooltip, keyboard nav) reads off the element:
// cx/cy = box top-left (offset-adjusted for hexagon rows), width/height.
function cellBox(cell) {
  return {
    x: parseFloat(cell.getAttribute('cx')),
    y: parseFloat(cell.getAttribute('cy')),
    width: parseFloat(cell.getAttribute('width')),
    height: parseFloat(cell.getAttribute('height')),
  }
}

function pathNumbers(d) {
  return (d.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi) || []).map(Number)
}

// Vertices of a polygonal path built from M/L commands only.
function polygonVertices(d) {
  const nums = pathNumbers(d)
  const pts = []
  for (let k = 0; k < nums.length; k += 2) {
    pts.push([nums[k], nums[k + 1]])
  }
  return pts
}

function key(pt) {
  return `${pt[0].toFixed(6)},${pt[1].toFixed(6)}`
}

function sharedVertexCount(vertsA, vertsB) {
  const setA = new Set(vertsA.map(key))
  return vertsB.filter((p) => setA.has(key(p))).length
}

// ===========================================================================
// rect (default)
// ===========================================================================
describe('heatmap shape: rect (default)', () => {
  it('renders one <rect> per cell, exactly as before the shape option', () => {
    const chart = heatmapChart(undefined)
    const cells = getCells(chart)

    expect(cells.length).toBe(ROWS * COLS)
    for (const c of cells) {
      expect(c.tagName.toLowerCase()).toBe('rect')
    }
  })

  it('tiles the grid box exactly: cell = gridWidth/cols x gridHeight/rows', () => {
    const chart = heatmapChart('rect')
    const w = chart.w
    const cells = getCells(chart)

    const expectedW = w.layout.gridWidth / COLS
    const expectedH = w.layout.gridHeight / ROWS
    for (const c of cells) {
      expect(parseFloat(c.getAttribute('width'))).toBeCloseTo(expectedW, 6)
      expect(parseFloat(c.getAttribute('height'))).toBeCloseTo(expectedH, 6)
    }
  })

  it('keeps the corner radius on rect cells', () => {
    const chart = heatmapChart('rect', { heatmap: { radius: 8 } })
    expect(parseFloat(getCells(chart)[0].getAttribute('rx'))).toBe(8)
  })
})

// ===========================================================================
// circle
// ===========================================================================
describe('heatmap shape: circle', () => {
  it('renders one <path> per cell, inscribed in the cell box', () => {
    const chart = heatmapChart('circle')
    const cells = getCells(chart)

    expect(cells.length).toBe(ROWS * COLS)
    for (const c of cells) {
      expect(c.tagName.toLowerCase()).toBe('path')

      const box = cellBox(c)
      const nums = pathNumbers(c.getAttribute('d'))
      // d = M (cx-r) cy  a r r 0 1 0 2r 0  a r r 0 1 0 -2r 0 Z
      const r = nums[2]
      const centerX = nums[0] + r
      const centerY = nums[1]

      expect(r).toBeCloseTo(Math.min(box.width, box.height) / 2, 6)
      expect(centerX).toBeCloseTo(box.x + box.width / 2, 6)
      expect(centerY).toBeCloseTo(box.y + box.height / 2, 6)
    }
  })

  it('keeps the tooltip contract: class + i/j/val + cell box attrs', () => {
    const chart = heatmapChart('circle')
    const c = getCells(chart)[0]

    expect(c.classList.contains('apexcharts-heatmap-rect')).toBe(true)
    for (const attr of ['i', 'j', 'val', 'cx', 'cy', 'width', 'height']) {
      expect(c.getAttribute(attr)).not.toBeNull()
    }
  })
})

// ===========================================================================
// diamond
// ===========================================================================
describe('heatmap shape: diamond', () => {
  it('renders one <path> per cell whose vertices are the cell box edge midpoints', () => {
    const chart = heatmapChart('diamond')
    const cells = getCells(chart)

    expect(cells.length).toBe(ROWS * COLS)
    for (const c of cells) {
      expect(c.tagName.toLowerCase()).toBe('path')

      const { x, y, width: bw, height: bh } = cellBox(c)
      const verts = polygonVertices(c.getAttribute('d'))
      expect(verts.length).toBe(4)

      const expected = [
        [x + bw / 2, y],
        [x + bw, y + bh / 2],
        [x + bw / 2, y + bh],
        [x, y + bh / 2],
      ]
      expected.forEach((pt, k) => {
        expect(verts[k][0]).toBeCloseTo(pt[0], 6)
        expect(verts[k][1]).toBeCloseTo(pt[1], 6)
      })
    }
  })

  it('does not offset any rows (no honeycomb layout)', () => {
    const chart = heatmapChart('diamond')
    const xs = new Set(
      getCells(chart).map((c) => cellBox(c).x.toFixed(6)),
    )
    // every row places its cells on the same column lefts
    expect(xs.size).toBe(COLS)
  })
})

// ===========================================================================
// hexagon
// ===========================================================================
describe('heatmap shape: hexagon', () => {
  it('renders one <path> per cell, 4/3 of the row pitch tall, full cell wide', () => {
    const chart = heatmapChart('hexagon')
    const cells = getCells(chart)

    expect(cells.length).toBe(ROWS * COLS)
    for (const c of cells) {
      expect(c.tagName.toLowerCase()).toBe('path')

      const { x, y, width: bw, height: bh } = cellBox(c)
      const verts = polygonVertices(c.getAttribute('d'))
      expect(verts.length).toBe(6)

      // pointy-top hexagon stretched over the cell box, overlapping the
      // neighbour rows by a sixth of the pitch on each side
      const expected = [
        [x + bw / 2, y - bh / 6],
        [x + bw, y + bh / 6],
        [x + bw, y + (bh * 5) / 6],
        [x + bw / 2, y + (bh * 7) / 6],
        [x, y + (bh * 5) / 6],
        [x, y + bh / 6],
      ]
      expected.forEach((pt, k) => {
        expect(verts[k][0]).toBeCloseTo(pt[0], 6)
        expect(verts[k][1]).toBeCloseTo(pt[1], 6)
      })

      // hexagon's own height is 4/3 of the row pitch
      const ys = verts.map((p) => p[1])
      expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo((bh * 4) / 3, 6)
    }
  })

  it('offsets alternate rows by exactly half a cell (quarter cell each way)', () => {
    const chart = heatmapChart('hexagon')
    const cells = getCells(chart)
    const cellW = chart.w.layout.gridWidth / COLS

    // group column-0 cells by row (cy)
    const colZero = cells
      .filter((c) => c.getAttribute('j') === '0')
      .sort((a, b) => cellBox(a).y - cellBox(b).y)
    expect(colZero.length).toBe(ROWS)

    for (let r = 0; r < ROWS; r++) {
      const box = cellBox(colZero[r])
      const expectedOffset = ((r % 2 === 0 ? -1 : 1) * cellW) / 4
      expect(box.x).toBeCloseTo(expectedOffset, 6)
      if (r > 0) {
        const prev = cellBox(colZero[r - 1])
        expect(Math.abs(box.x - prev.x)).toBeCloseTo(cellW / 2, 6)
      }
    }
  })

  it('tessellates: every neighbouring pair of hexagons shares a full edge', () => {
    const chart = heatmapChart('hexagon')
    const cells = getCells(chart)

    // index cells by visual (row, col): row from sorted distinct cy values
    const rowYs = [...new Set(cells.map((c) => cellBox(c).y.toFixed(6)))]
      .map(Number)
      .sort((a, b) => a - b)
    const grid = new Map()
    for (const c of cells) {
      const r = rowYs.findIndex((y) => Math.abs(y - cellBox(c).y) < 1e-6)
      grid.set(`${r},${c.getAttribute('j')}`, polygonVertices(c.getAttribute('d')))
    }

    for (let r = 0; r < ROWS; r++) {
      for (let j = 0; j < COLS; j++) {
        const verts = grid.get(`${r},${j}`)

        // in-row neighbour: shares the full vertical edge (2 vertices)
        if (j + 1 < COLS) {
          expect(sharedVertexCount(verts, grid.get(`${r},${j + 1}`))).toBe(2)
        }

        // row below: a hexagon shares a slanted edge (2 vertices) with each
        // of its two diagonal neighbours. Which columns those are depends on
        // the row's offset direction: a left-shifted row sits over columns
        // (j-1, j) of the right-shifted row below, and vice versa.
        if (r + 1 < ROWS) {
          const sameCol = grid.get(`${r + 1},${j}`)
          expect(sharedVertexCount(verts, sameCol)).toBe(2)
          const sideCol =
            r % 2 === 0 ? grid.get(`${r + 1},${j - 1}`) : grid.get(`${r + 1},${j + 1}`)
          if (sideCol) {
            expect(sharedVertexCount(verts, sideCol)).toBe(2)
          }
        }
      }
    }
  })

  it('is not clipped: the lattice gets its own clip rect covering the overhang', () => {
    const chart = heatmapChart('hexagon')
    const w = chart.w
    const cells = getCells(chart)

    const group = chart.el.querySelector('.apexcharts-heatmap')
    expect(group.getAttribute('clip-path')).toContain('heatmapHexMask')

    const clipRect = chart.el.querySelector(
      'clipPath[id^="heatmapHexMask"] rect',
    )
    expect(clipRect).not.toBeNull()

    const clip = {
      x: parseFloat(clipRect.getAttribute('x')),
      y: parseFloat(clipRect.getAttribute('y')),
      width: parseFloat(clipRect.getAttribute('width')),
      height: parseFloat(clipRect.getAttribute('height')),
    }

    // every vertex of every hexagon lies inside the clip rect
    for (const c of cells) {
      for (const [vx, vy] of polygonVertices(c.getAttribute('d'))) {
        expect(vx).toBeGreaterThanOrEqual(clip.x)
        expect(vx).toBeLessThanOrEqual(clip.x + clip.width)
        expect(vy).toBeGreaterThanOrEqual(clip.y)
        expect(vy).toBeLessThanOrEqual(clip.y + clip.height)
      }
    }

    // and the lattice really does overhang the grid box (the reason the
    // shared gridRectMask cannot be used): quarter cell horizontally,
    // a sixth of the pitch vertically
    const allVerts = cells.flatMap((c) => polygonVertices(c.getAttribute('d')))
    const xs = allVerts.map((p) => p[0])
    const ys = allVerts.map((p) => p[1])
    const cellW = w.layout.gridWidth / COLS
    const pitch = w.layout.gridHeight / ROWS
    expect(Math.min(...xs)).toBeCloseTo(-cellW / 4, 6)
    expect(Math.max(...xs)).toBeCloseTo(w.layout.gridWidth + cellW / 4, 6)
    expect(Math.min(...ys)).toBeCloseTo(-pitch / 6, 6)
    expect(Math.max(...ys)).toBeCloseTo(w.layout.gridHeight + pitch / 6, 6)
  })

  it('ignores the rect corner radius instead of erroring', () => {
    const chart = heatmapChart('hexagon', { heatmap: { radius: 30 } })
    const cells = getCells(chart)
    expect(cells.length).toBe(ROWS * COLS)
    // still a straight-edged polygon: no arc commands in the path
    expect(cells[0].getAttribute('d')).not.toMatch(/[aA]/)
  })

  it('falls back to rect cells on a continuous (numeric) x axis', () => {
    const chart = heatmapChart('hexagon', {
      series: [
        { name: 'R1', data: [[1, 10], [2, 20], [3, 30]] },
        { name: 'R2', data: [[1, 15], [2, 25], [3, 35]] },
      ],
      xaxis: { type: 'numeric' },
    })
    const cells = getCells(chart)
    expect(cells.length).toBe(6)
    for (const c of cells) {
      expect(c.tagName.toLowerCase()).toBe('rect')
    }
  })
})

// ===========================================================================
// canvas renderer declines shaped cells
// ===========================================================================
describe('heatmap shapes and the canvas renderer', () => {
  const fakeW = (shape) => ({
    config: {
      chart: { type: 'heatmap' },
      plotOptions: { heatmap: { shape } },
      fill: { type: 'solid' },
      states: {},
    },
  })

  it('declines canvas for non-rect shapes, like image fills', () => {
    expect(hasCanvasUnsupportedFeature(fakeW('hexagon'))).toBe(true)
    expect(hasCanvasUnsupportedFeature(fakeW('circle'))).toBe(true)
    expect(hasCanvasUnsupportedFeature(fakeW('diamond'))).toBe(true)
  })

  it('keeps canvas available for the default rect shape', () => {
    expect(hasCanvasUnsupportedFeature(fakeW('rect'))).toBe(false)
    expect(hasCanvasUnsupportedFeature(fakeW(undefined))).toBe(false)
  })
})
