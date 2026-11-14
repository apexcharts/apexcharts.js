import { describe, it, expect, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import { morphPaths } from '../../src/svg/PathMorphing.js'

/**
 * #4994: the line entrance morph paired each vertex with the previous
 * point's x, so the line slid up and to the right. pathFrom has to share
 * each destination anchor's x and sit on the baseline y. The final path
 * (pathTo) is the rendered geometry and must stay on the data points.
 */

let chart

afterEach(() => {
  chart?.destroy()
  chart = null
  document.body.innerHTML = ''
})

/** Endpoints of M/L/C (and H/V) commands. Z is not a point. */
function anchors(d) {
  const pts = []
  let x = 0
  let y = 0
  const re = /([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi
  let m
  while ((m = re.exec(d || ''))) {
    const cmd = m[1].toUpperCase()
    const nums =
      m[2].trim() === '' ? [] : m[2].trim().split(/[\s,]+/).map(Number)
    if (cmd === 'M' || cmd === 'L') {
      x = nums[0]
      y = nums[1]
      pts.push([x, y])
    } else if (cmd === 'C') {
      x = nums[nums.length - 2]
      y = nums[nums.length - 1]
      pts.push([x, y])
    } else if (cmd === 'H') {
      x = nums[0]
      pts.push([x, y])
    } else if (cmd === 'V') {
      y = nums[0]
      pts.push([x, y])
    }
  }
  return pts
}

function pathsOf(selector) {
  return [...document.querySelectorAll(selector)].map((p) => ({
    from: anchors(p.getAttribute('pathFrom')),
    to: anchors(p.getAttribute('pathTo')),
  }))
}

/**
 * @param {{from: number[][], to: number[][]}[]} paths
 * @param {number} pointCount
 */
function expectVerticalEntrance(paths, pointCount) {
  expect(paths.length).toBeGreaterThan(0)
  for (const { from, to } of paths) {
    const fromPts = from.slice(0, pointCount)
    const toPts = to.slice(0, pointCount)
    expect(fromPts.length).toBe(pointCount)
    expect(toPts.length).toBe(pointCount)
    const baseline = fromPts[0][1]
    for (let i = 0; i < pointCount; i++) {
      expect(fromPts[i][0]).toBeCloseTo(toPts[i][0], 6)
      expect(fromPts[i][1]).toBeCloseTo(baseline, 6)
      if (i > 0) {
        expect(Math.abs(fromPts[i][0] - toPts[i - 1][0])).toBeGreaterThan(1)
      }
    }
    expect(toPts.some((p) => Math.abs(p[1] - baseline) > 1)).toBe(true)
  }
}

const DATA = [10, 40, 25, 60, 30]
const CATS = ['a', 'b', 'c', 'd', 'e']

function render(opts) {
  chart = createChartWithOptions(opts)
  return chart
}

describe('line entrance animation from-points (#4994)', () => {
  it('straight category line (fast path): from-points share each point x', () => {
    render({
      chart: { type: 'line', width: 500, height: 300 },
      stroke: { curve: 'straight', width: 2 },
      dataLabels: { enabled: false },
      markers: { size: 0 },
      series: [
        { name: 'a', data: DATA },
        { name: 'b', data: [20, 15, 50, 10, 45] },
      ],
      xaxis: { categories: CATS },
    })
    const paths = pathsOf('.apexcharts-line')
    expectVerticalEntrance(paths, DATA.length)
    // line paths have no closing anchors past the data
    paths.forEach(({ from, to }) => {
      expect(from.length).toBe(DATA.length)
      expect(to.length).toBe(DATA.length)
    })
  })

  it('markers-on slow path keeps the same x alignment and the same final points', () => {
    render({
      chart: { type: 'line', width: 500, height: 300 },
      stroke: { curve: 'straight', width: 2 },
      dataLabels: { enabled: false },
      markers: { size: 4 },
      series: [{ name: 'a', data: DATA }],
      xaxis: { categories: CATS },
    })
    const paths = pathsOf('.apexcharts-line')
    expectVerticalEntrance(paths, DATA.length)

    const xs = chart.w.globals.seriesXvalues[0]
    const ys = chart.w.globals.seriesYvalues[0]
    paths[0].to.forEach((p, i) => {
      expect(p[0]).toBeCloseTo(xs[i], 6)
      expect(p[1]).toBeCloseTo(ys[i], 6)
    })

    const cxs = [
      ...document.querySelectorAll(
        '.apexcharts-series-markers .apexcharts-marker',
      ),
    ].map((m) => parseFloat(m.getAttribute('cx')))
    expect(cxs.length).toBe(DATA.length)
    cxs.forEach((cx, i) => expect(cx).toBeCloseTo(xs[i], 6))
  })

  it('numeric x: from-points follow each datum x', () => {
    const data = DATA.map((y, i) => [i * 10 + 5, y])
    render({
      chart: { type: 'line', width: 500, height: 300 },
      stroke: { curve: 'straight', width: 2 },
      dataLabels: { enabled: false },
      markers: { size: 0 },
      series: [{ name: 'a', data }],
      xaxis: { type: 'numeric' },
    })
    expectVerticalEntrance(pathsOf('.apexcharts-line'), DATA.length)
    const xs = chart.w.globals.seriesXvalues[0]
    pathsOf('.apexcharts-line')[0].from.forEach((p, i) => {
      expect(p[0]).toBeCloseTo(xs[i], 6)
    })
  })

  it('smooth curve endpoints rise from the same x', () => {
    render({
      chart: { type: 'line', width: 500, height: 300 },
      stroke: { curve: 'smooth', width: 2 },
      dataLabels: { enabled: false },
      markers: { size: 0 },
      series: [{ name: 'a', data: DATA }],
      xaxis: { categories: CATS },
    })
    expectVerticalEntrance(pathsOf('.apexcharts-line'), DATA.length)
  })

  it('area stroke and fill rise from each point x; the fill close stays put', () => {
    render({
      chart: { type: 'area', width: 500, height: 300 },
      stroke: { curve: 'straight', width: 2 },
      dataLabels: { enabled: false },
      markers: { size: 0 },
      series: [{ name: 'a', data: DATA }],
      xaxis: { categories: CATS },
    })
    const areas = pathsOf('.apexcharts-area')
    expect(areas.length).toBeGreaterThan(0)
    for (const { from, to } of areas) {
      expectVerticalEntrance([{ from, to }], DATA.length)
    }
    const fill = areas.find(({ to }) => to.length > DATA.length)
    expect(fill).toBeTruthy()
    const baseline = fill.from[0][1]
    const close = fill.to.slice(DATA.length)
    expect(close.length).toBe(2)
    close.forEach((p) => expect(p[1]).toBeCloseTo(baseline, 6))
    expect(close[0][0]).toBeCloseTo(fill.to[DATA.length - 1][0], 6)
    expect(close[1][0]).toBeCloseTo(fill.to[0][0], 6)
  })

  /**
   * The fill close is two corners on the baseline. Sampling the morph at
   * t = 0.5 is what shows them sweeping: pathTo's close never changes, so
   * comparing path strings at the ends cannot catch it.
   */
  it('area fill halfway through the morph keeps both baseline corners', () => {
    const ys = [30, 10, 60, 20, 50]
    const xs = [20, 40, 60, 80, 100]
    render({
      chart: { type: 'area', width: 500, height: 300 },
      stroke: { curve: 'straight', width: 2 },
      dataLabels: { enabled: false },
      markers: { size: 0 },
      series: [{ name: 'a', data: ys.map((y, i) => [xs[i], y]) }],
      xaxis: { type: 'numeric', min: 0, max: 100 },
      yaxis: { min: 0 },
    })
    const raw = [...document.querySelectorAll('.apexcharts-area')].map((p) => ({
      from: p.getAttribute('pathFrom'),
      to: p.getAttribute('pathTo'),
    }))
    const fill = raw.find(({ to }) => /z\s*$/i.test(to || ''))
    expect(fill).toBeTruthy()
    const from = anchors(fill.from)
    const to = anchors(fill.to)
    const mid = anchors(morphPaths(fill.from, fill.to)(0.5))
    const baseline = from[0][1]
    expect(from[0][0]).toBeGreaterThan(1)
    expect(to.length).toBe(ys.length + 2)
    expect(from.length).toBe(ys.length + 2)
    for (let i = 0; i < ys.length; i++) {
      expect(mid[i][0]).toBeCloseTo(to[i][0], 4)
      expect(from[i][1]).toBeCloseTo(baseline, 4)
      expect(mid[i][1]).toBeCloseTo((from[i][1] + to[i][1]) / 2, 4)
    }
    // L xLast bottom, then L x0 bottom. Both already sit on the final corner.
    for (let i = ys.length; i < to.length; i++) {
      expect(from[i][0]).toBeCloseTo(to[i][0], 4)
      expect(from[i][1]).toBeCloseTo(baseline, 4)
      expect(mid[i][0]).toBeCloseTo(to[i][0], 4)
      expect(mid[i][1]).toBeCloseTo(baseline, 4)
    }
    expect(to[ys.length][0]).toBeCloseTo(to[ys.length - 1][0], 4)
    expect(to[ys.length + 1][0]).toBeCloseTo(to[0][0], 4)
  })

  it('rangeArea lower edge rises in place; the upper edge has no duplicate anchor', () => {
    const lows = [10, 20, 15, 30, 25]
    const highs = [30, 50, 40, 60, 45]
    render({
      chart: { type: 'rangeArea', width: 500, height: 300 },
      stroke: { curve: 'straight', width: 2 },
      dataLabels: { enabled: false },
      markers: { size: 0 },
      series: [
        {
          name: 'r',
          data: lows.map((lo, i) => ({ x: (i + 1) * 20, y: [lo, highs[i]] })),
        },
      ],
      xaxis: { type: 'numeric', min: 0, max: 100 },
      yaxis: { min: 0 },
    })
    const band = document.querySelector('.apexcharts-rangeArea')
    const fromD = band.getAttribute('pathFrom')
    const toD = band.getAttribute('pathTo')
    const from = commandEnds(fromD)
    const to = commandEnds(toD)
    const mid = commandEnds(morphPaths(fromD, toD)(0.5))
    const fromSplit = from.findIndex((p, i) => i > 0 && p.move)
    const toSplit = to.findIndex((p, i) => i > 0 && p.move)
    expect(fromSplit).toBeGreaterThan(0)
    expect(toSplit).toBe(fromSplit)
    // Upper edge: one anchor per point, no second copy of the opening x.
    expect(Math.abs(from[1].x - from[0].x)).toBeGreaterThan(1)
    // Lower edge opens M x0 yHigh L x0 yLow, so pathFrom repeats x0.
    expect(from[fromSplit].x).toBeCloseTo(to[toSplit].x, 4)
    expect(from[fromSplit].x).toBeGreaterThan(1)
    expect(from[fromSplit + 1].x).toBeCloseTo(from[fromSplit].x, 4)
    expect(to[toSplit + 1].x).toBeCloseTo(to[toSplit].x, 4)
    for (let i = 0; i < to.length; i++) {
      expect(mid[i].x).toBeCloseTo(to[i].x, 4)
    }
  })

  it('stepline and linestep rise from each command x', () => {
    for (const curve of ['stepline', 'linestep']) {
      render({
        chart: { type: 'line', width: 500, height: 300 },
        stroke: { curve, width: 2 },
        dataLabels: { enabled: false },
        markers: { size: 0 },
        series: [{ name: 'a', data: [30, 10, 60, 20, 50] }],
        xaxis: { categories: CATS },
        yaxis: { min: 0 },
      })
      const el = document.querySelector('.apexcharts-line')
      const fromD = el.getAttribute('pathFrom')
      const toD = el.getAttribute('pathTo')
      const from = commandEnds(fromD)
      const to = commandEnds(toD)
      const mid = commandEnds(morphPaths(fromD, toD)(0.5))
      // Two commands per point after the opening move.
      expect(from.length).toBe(1 + (DATA.length - 1) * 2)
      expect(to.length).toBe(from.length)
      expect(mid.length).toBe(to.length)
      for (let i = 0; i < to.length; i++) {
        expect(from[i].x).toBeCloseTo(to[i].x, 4)
        expect(mid[i].x).toBeCloseTo(to[i].x, 4)
        expect(from[i].y).toBeCloseTo(from[0].y, 4)
      }
      chart.destroy()
      chart = null
      document.body.innerHTML = ''
    }
  })
})

/** Endpoints in path order, including a Z drawn back to its subpath start. */
function commandEnds(d) {
  /** @type {{x: number, y: number, move: boolean}[]} */
  const pts = []
  let x = 0
  let y = 0
  let sx = 0
  let sy = 0
  const re = /([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi
  let m
  while ((m = re.exec(d || ''))) {
    const cmd = m[1].toUpperCase()
    const nums =
      m[2].trim() === '' ? [] : m[2].trim().split(/[\s,]+/).map(Number)
    if (cmd === 'M') {
      x = nums[0]
      y = nums[1]
      sx = x
      sy = y
      pts.push({ x, y, move: true })
    } else if (cmd === 'L' || cmd === 'T') {
      x = nums[0]
      y = nums[1]
      pts.push({ x, y, move: false })
    } else if (cmd === 'C') {
      x = nums[nums.length - 2]
      y = nums[nums.length - 1]
      pts.push({ x, y, move: false })
    } else if (cmd === 'H') {
      x = nums[0]
      pts.push({ x, y, move: false })
    } else if (cmd === 'V') {
      y = nums[0]
      pts.push({ x, y, move: false })
    } else if (cmd === 'Z') {
      x = sx
      y = sy
      pts.push({ x, y, move: false })
    }
  }
  return pts
}
