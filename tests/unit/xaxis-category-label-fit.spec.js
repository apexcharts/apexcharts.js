import { describe, it, expect, afterEach, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Graphics from '../../src/modules/Graphics.js'
import AxesUtils from '../../src/modules/axes/AxesUtils.js'

// #5370: category x-axis labels.
// 1. rotation was decided against the plot before the upright-label right pad
//    narrowed it, so labels stayed upright and half of them were hidden;
// 2. the upright overlap test compared the centre distance with the previous
//    label's full width, keeping touching and overlapping pairs;
// 3. `trim: true` switched thinning off for rotated labels too.

const CHAR_W = 7
const LINE_H = 14

// jsdom has no text layout: give every string a width proportional to its
// length, and a rotated string the box of the rotated rectangle.
function mockTextRects() {
  vi.spyOn(Graphics.prototype, 'getTextRects').mockImplementation(
    (text, _fs, _ff, transform) => {
      const s = Array.isArray(text)
        ? text.reduce((a, b) => (String(b).length > a.length ? String(b) : a), '')
        : String(text)
      const w = s.length * CHAR_W
      const m = /rotate\((-?[\d.]+)/.exec(transform || '')
      if (m) {
        const a = (Math.abs(Number(m[1])) * Math.PI) / 180
        return {
          width: w * Math.cos(a) + LINE_H * Math.sin(a),
          height: w * Math.sin(a) + LINE_H * Math.cos(a),
        }
      }
      return { width: w, height: LINE_H }
    },
  )
}

const PRODUCTS = [
  'Product A',
  'Product B',
  'product B',
  'Product C',
  'Product D',
  'Product E',
]

function columnChart(width, categories, labels = {}) {
  return createChartWithOptions({
    chart: { type: 'bar', width, height: 300, toolbar: { show: false } },
    series: [
      { name: 'S1', data: categories.map((_, i) => 10 + ((i * 7) % 40)) },
    ],
    xaxis: {
      categories,
      labels: { rotate: -45, hideOverlappingLabels: true, ...labels },
    },
  })
}

function drawnLabels(chart) {
  return Array.from(
    chart.w.dom.baseEl.querySelectorAll('.apexcharts-xaxis-label'),
  )
    .map((el) => ({
      x: Number(el.getAttribute('x')),
      text: el.querySelector('tspan')?.textContent ?? '',
    }))
    .filter((l) => l.text !== '')
}

let chart = null
afterEach(() => {
  vi.restoreAllMocks()
  chart?.destroy()
  chart = null
})

describe('#5370 rotation is decided against the plot as drawn', () => {
  it('keeps labels upright only when all of them fit the padded plot', () => {
    mockTextRects()
    const widest = 'Product A'.length * CHAR_W
    let upright = 0
    let rotated = 0
    for (let width = 300; width <= 560; width += 4) {
      chart = columnChart(width, PRODUCTS)
      const w = chart.w
      if (w.layout.rotateXLabels) {
        rotated++
      } else {
        upright++
        // Upright means the drawn plot holds every label plus the gap, so the
        // overlap pass has nothing to hide.
        expect(
          (widest + AxesUtils.X_LABEL_GAP) * PRODUCTS.length,
        ).toBeLessThanOrEqual(w.layout.gridWidth + 0.5)
        expect(drawnLabels(chart).length).toBe(PRODUCTS.length)
      }
      chart.destroy()
      chart = null
    }
    // Both outcomes occur, so the scan crosses the decision boundary.
    expect(upright).toBeGreaterThan(0)
    expect(rotated).toBeGreaterThan(0)
  })

  it('on a line chart (labels on ticks) rotates only when upright cannot fit', () => {
    mockTextRects()
    const widest = 'Product A'.length * CHAR_W
    const n = PRODUCTS.length
    const seen = new Set()
    for (let width = 260; width <= 520; width += 4) {
      chart = createChartWithOptions({
        chart: { type: 'line', width, height: 300, toolbar: { show: false } },
        series: [{ name: 'S1', data: PRODUCTS.map((_, i) => 10 + i * 5) }],
        xaxis: {
          categories: PRODUCTS,
          labels: { rotate: -45, hideOverlappingLabels: true },
        },
      })
      const w = chart.w
      // n labels on ticks are n - 1 intervals apart
      const need = (widest + AxesUtils.X_LABEL_GAP) * (n - 1)
      if (w.layout.rotateXLabels) {
        seen.add('rotated')
        // upright, the plot would lose the right pad for the last label
        expect(need).toBeGreaterThan(w.layout.gridWidth - (widest / 2 + 1))
      } else {
        seen.add('upright')
        expect(need).toBeLessThanOrEqual(w.layout.gridWidth + 0.5)
        expect(drawnLabels(chart).length).toBe(n)
      }
      chart.destroy()
      chart = null
    }
    expect([...seen].sort()).toEqual(['rotated', 'upright'])
  })

  it('rotates when the labels fit the unpadded plot but not the padded one', () => {
    mockTextRects()
    // Find the narrowest chart that stays upright, then step just below it:
    // that chart's unpadded plot still holds the labels, the padded one not.
    let firstUpright = null
    for (let width = 300; width <= 560 && firstUpright === null; width += 2) {
      chart = columnChart(width, PRODUCTS)
      if (!chart.w.layout.rotateXLabels) firstUpright = width
      chart.destroy()
      chart = null
    }
    expect(firstUpright).not.toBeNull()
    chart = columnChart(firstUpright - 2, PRODUCTS)
    const w = chart.w
    expect(w.layout.rotateXLabels).toBe(true)
    const widest = 'Product A'.length * CHAR_W
    const pad = widest / 2 + 1
    // The plot the rotated chart would have had upright, before the pad,
    // still holds the labels: the old test kept these upright.
    expect((widest + AxesUtils.X_LABEL_GAP) * PRODUCTS.length).toBeLessThan(
      w.layout.gridWidth + 0.5,
    )
    expect(
      (widest + AxesUtils.X_LABEL_GAP) * PRODUCTS.length,
    ).toBeGreaterThan(w.layout.gridWidth - pad)
    expect(drawnLabels(chart).length).toBe(PRODUCTS.length)
  })
})

describe('#5370 hideOverlappingLabels on upright labels', () => {
  function makeW(overrides = {}) {
    return {
      config: {
        xaxis: {
          type: 'category',
          labels: {
            hideOverlappingLabels: true,
            trim: false,
            rotate: -45,
            ...overrides,
          },
        },
      },
      layout: { rotateXLabels: false },
      globals: { skipFirstTimelinelabel: false, skipLastTimelinelabel: false },
    }
  }

  function run(w, labels) {
    const utils = new AxesUtils(w)
    const drawn = []
    const rects = []
    labels.forEach((l, i) => {
      const label = { ...l, textRect: { width: l.width, height: LINE_H } }
      utils.checkForOverflowingLabels(i, label, labels.length, drawn, rects)
      if (label.text !== '') {
        drawn.push(label.text)
        rects.push(label)
      }
    })
    return rects
  }

  it('hides a label that touches or overlaps the previous one', () => {
    const w = makeW()
    // centres 60 apart; 60-wide labels sit edge to edge, which the old test
    // (60 < 60 / 1.01) kept.
    const drawn = run(w, [
      { x: 0, text: 'a', width: 60 },
      { x: 60, text: 'b', width: 60 },
      { x: 120, text: 'c', width: 60 },
    ])
    expect(drawn.map((l) => l.text)).toEqual(['a', 'c'])
  })

  it('accounts for the current label half width', () => {
    const w = makeW()
    // a narrow label followed by a wide one: the old test compared 40 with
    // the 20px previous width and kept the wide label overlapping.
    const drawn = run(w, [
      { x: 0, text: 'a', width: 20 },
      { x: 40, text: 'b', width: 70 },
    ])
    expect(drawn.map((l) => l.text)).toEqual(['a'])
  })

  it('never leaves two drawn labels closer than the gap', () => {
    const w = makeW()
    const labels = Array.from({ length: 40 }, (_, i) => ({
      x: i * 23,
      text: 'L' + i,
      width: 20 + ((i * 13) % 30),
    }))
    const drawn = run(w, labels)
    expect(drawn.length).toBeGreaterThan(1)
    expect(drawn.length).toBeLessThan(labels.length)
    for (let i = 1; i < drawn.length; i++) {
      const gap =
        drawn[i].x -
        drawn[i].textRect.width / 2 -
        (drawn[i - 1].x + drawn[i - 1].textRect.width / 2)
      expect(gap).toBeGreaterThanOrEqual(AxesUtils.X_LABEL_GAP)
    }
  })

  it('keeps every label that clears its neighbours by the gap', () => {
    const w = makeW()
    const drawn = run(w, [
      { x: 0, text: 'a', width: 60 },
      { x: 62, text: 'b', width: 60 },
      { x: 124, text: 'c', width: 60 },
    ])
    expect(drawn.length).toBe(3)
  })

  it('in a rendered chart, no two drawn labels overlap', () => {
    mockTextRects()
    for (let width = 300; width <= 560; width += 10) {
      chart = columnChart(width, PRODUCTS, { rotate: 0 })
      expect(chart.w.layout.rotateXLabels).toBe(false)
      const drawn = drawnLabels(chart)
      expect(drawn.length).toBeGreaterThan(0)
      for (let i = 1; i < drawn.length; i++) {
        const prevW = drawn[i - 1].text.length * CHAR_W
        const curW = drawn[i].text.length * CHAR_W
        expect(drawn[i].x - drawn[i - 1].x).toBeGreaterThanOrEqual(
          (prevW + curW) / 2 + AxesUtils.X_LABEL_GAP - 0.01,
        )
      }
      chart.destroy()
      chart = null
    }
  })
})

describe('#5370 trim and rotated labels', () => {
  const ACCOUNTS = Array.from(
    { length: 60 },
    (_, i) => 'Customer account ' + (i + 1),
  )

  it('thins rotated labels with trim on exactly as with trim off', () => {
    mockTextRects()
    chart = columnChart(600, ACCOUNTS, { trim: false })
    expect(chart.w.layout.rotateXLabels).toBe(true)
    const untrimmed = drawnLabels(chart).length
    chart.destroy()

    chart = columnChart(600, ACCOUNTS, { trim: true })
    expect(chart.w.layout.rotateXLabels).toBe(true)
    const trimmed = drawnLabels(chart).length

    expect(untrimmed).toBeLessThan(ACCOUNTS.length)
    expect(trimmed).toBe(untrimmed)
  })

  it('still keeps every trimmed upright label (#3096)', () => {
    mockTextRects()
    chart = columnChart(600, ACCOUNTS.slice(0, 20), { rotate: 0, trim: true })
    expect(chart.w.layout.rotateXLabels).toBe(false)
    expect(drawnLabels(chart).length).toBe(20)
  })
})
