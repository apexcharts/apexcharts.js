import { describe, it, expect, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import AxesUtils from '../../src/modules/axes/AxesUtils.js'

// #5371: a horizontal bar chart drew every category name down the side, so
// dense rows wrote their names over each other. The names are now thinned
// the way heatmap rows are, through one shared step (AxesUtils).

const NAMES = Array.from({ length: 40 }, (_, i) => 'Sales rep number ' + (i + 1))
const FONT = 11 // default yaxis.labels.style.fontSize

function barChart({ names = NAMES, height = 400, ...over } = {}) {
  return createChartWithOptions({
    chart: { type: 'bar', height, animations: { enabled: false } },
    plotOptions: { bar: { horizontal: true } },
    dataLabels: { enabled: false },
    series: [{ name: 'Sales', data: names.map((_, i) => 100 + ((i * 37) % 90)) }],
    xaxis: { categories: names, ...(over.xaxis || {}) },
    yaxis: over.yaxis || {},
  })
}

// Every category label element, in DOM (category) order.
function sideLabels(chart) {
  return Array.from(
    chart.w.dom.baseEl.querySelectorAll(
      '.apexcharts-xaxis-inversed-texts-g .apexcharts-yaxis-label',
    ),
  ).map((el, i) => ({
    i,
    y: Number(el.getAttribute('y')),
    text: Array.from(el.querySelectorAll('tspan'))
      .map((t) => t.textContent)
      .join(' '),
  }))
}

const drawn = (chart) => sideLabels(chart).filter((l) => l.text !== '')

let chart = null
afterEach(() => {
  chart?.destroy()
  chart = null
})

describe('AxesUtils.categoryLabelStep', () => {
  it('is 1 when every name fits', () => {
    expect(AxesUtils.categoryLabelStep(400, 10, '11px')).toBe(1)
    expect(AxesUtils.categoryLabelStep(400, 25, 11)).toBe(1) // 25 * 15.4 = 385
  })

  it('thins to the count that fits, and reserves a row per text line', () => {
    // floor(400 / 15.4) = 25 rows fit
    expect(AxesUtils.categoryLabelStep(400, 26, '11px')).toBe(2)
    expect(AxesUtils.categoryLabelStep(400, 40, '11px')).toBe(2)
    expect(AxesUtils.categoryLabelStep(400, 80, '11px')).toBe(4)
    // two-line names need twice the room: floor(400 / 30.8) = 12
    expect(AxesUtils.categoryLabelStep(400, 20, '11px', 2)).toBe(2)
  })

  it('falls back to 11px and never divides by zero', () => {
    expect(AxesUtils.categoryLabelStep(400, 40, undefined)).toBe(2)
    expect(AxesUtils.categoryLabelStep(0, 40, '11px')).toBe(40)
  })
})

describe('#5371 horizontal bar category names', () => {
  it('thins overlapping names so the drawn ones clear each other', () => {
    chart = barChart()
    const all = sideLabels(chart)
    const kept = drawn(chart)
    expect(all).toHaveLength(40) // every element stays, in category order
    expect(kept.length).toBeLessThan(40)
    expect(kept.length).toBeGreaterThan(1)

    // the top name (the leader of a ranked list) always stays
    expect(kept[0].i).toBe(0)
    expect(kept[0].text).toBe('Sales rep number 1')

    // evenly spaced, and far enough apart not to overlap
    const step = kept[1].i - kept[0].i
    expect(step).toBeGreaterThan(1)
    kept.forEach((l, k) => expect(l.i).toBe(k * step))
    for (let k = 1; k < kept.length; k++) {
      expect(kept[k].y - kept[k - 1].y).toBeGreaterThanOrEqual(FONT * 1.4)
    }

    // the step is the shared one, and the last row is reached
    expect(step).toBe(
      AxesUtils.categoryLabelStep(chart.w.layout.gridHeight, 40, '11px'),
    )
    expect(39 - kept[kept.length - 1].i).toBeLessThan(step)
  })

  it('leaves names that fit untouched', () => {
    chart = barChart({ names: NAMES.slice(0, 8) })
    const kept = drawn(chart)
    expect(kept).toHaveLength(8)
    expect(kept.map((l) => l.text)).toEqual(NAMES.slice(0, 8))
  })

  it('keeps the full categories for the tooltip and keyboard navigation', () => {
    chart = barChart()
    expect(drawn(chart).length).toBeLessThan(40)
    expect(chart.w.labelData.labels).toEqual(NAMES)
  })

  it('thins on a reversed axis (names on the right) the same way', () => {
    chart = barChart({ yaxis: { reversed: true } })
    const kept = drawn(chart)
    expect(kept.length).toBeLessThan(40)
    expect(kept[0].i).toBe(0)
  })

  it('reserves room per line for multi-line names', () => {
    const twoLine = Array.from({ length: 20 }, (_, i) => ['Rep', 'No. ' + i])
    chart = barChart({ names: twoLine })
    const kept = drawn(chart)
    const step = AxesUtils.categoryLabelStep(
      chart.w.layout.gridHeight,
      20,
      '11px',
      2,
    )
    expect(step).toBeGreaterThan(1)
    expect(kept[1].i - kept[0].i).toBe(step)
  })

  it('is switched off by xaxis.labels.hideOverlappingLabels: false', () => {
    chart = barChart({ xaxis: { labels: { hideOverlappingLabels: false } } })
    expect(drawn(chart)).toHaveLength(40)
  })

  it('is switched off by a yaxis.labels.formatter', () => {
    chart = barChart({ yaxis: { labels: { formatter: (v) => v } } })
    expect(drawn(chart)).toHaveLength(40)
  })
})

describe('heatmap row thinning is unchanged by the shared step', () => {
  it('keeps the step heatmap always used', () => {
    chart = createChartWithOptions({
      chart: { type: 'heatmap', height: 400, animations: { enabled: false } },
      dataLabels: { enabled: false },
      series: NAMES.map((n, i) => ({
        name: n,
        data: [
          { x: 'Q1', y: i },
          { x: 'Q2', y: 40 - i },
        ],
      })),
    })
    const labels = Array.from(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-yaxis-label'),
    ).map((el) => el.querySelector('tspan')?.textContent ?? '')
    // one label per scale tick (tickAmount + 1), drawn from the last down
    const count = chart.w.globals.yAxisScale[0].result.length
    expect(labels).toHaveLength(count)

    // the formula heatmap used before the step moved to AxesUtils
    const maxLabels = Math.max(
      1,
      Math.floor(chart.w.layout.gridHeight / (FONT * 1.4)),
    )
    const step = count > maxLabels ? Math.ceil(count / maxLabels) : 1
    expect(step).toBeGreaterThan(1)
    // scale index i is drawn at DOM position count - 1 - i; the top tick
    // (i = 40) has no row name of its own
    labels.forEach((text, k) => {
      const i = count - 1 - k
      expect(text !== '').toBe(i % step === 0 && i < NAMES.length)
    })
  })
})
