import { describe, it, expect, afterEach, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Every bubble data label built a whole Scatter renderer (its Markers, Fill,
// Filters, Graphics and Animations) only to add a quarter of the font size to
// its y. Counts the constructions; the label positions themselves are pinned
// in datalabel-lazy-point-groups.spec.js.

const built = vi.hoisted(() => ({ n: 0 }))
vi.mock('../../src/charts/Scatter.js', async (orig) => {
  const m = /** @type {any} */ (await orig())
  class Counted extends m.default {
    constructor(...a) {
      super(...a)
      built.n++
    }
  }
  return { ...m, default: Counted }
})

let chart = null
afterEach(() => {
  chart?.destroy()
  chart = null
})

const bubble = (enabled) => ({
  chart: { type: 'bubble', width: 400, height: 300 },
  dataLabels: { enabled },
  xaxis: { type: 'numeric' },
  series: [0, 1].map((k) => ({
    name: 'b' + k,
    data: Array.from({ length: 8 }, (_, i) => [i * 10 + k * 4, i + 2, i + 5]),
  })),
})

describe('bubble label centring', () => {
  it('builds no renderer per label', () => {
    built.n = 0
    chart = createChartWithOptions(bubble(false))
    const without = built.n
    chart.destroy()
    built.n = 0
    chart = createChartWithOptions(bubble(true))
    expect(chart.el.querySelectorAll('.apexcharts-datalabel').length).toBe(16)
    // base: 17 with 16 labels against 1 without
    expect(built.n).toBe(without)
  })

  it('keeps the old arithmetic: y plus a quarter of the integer font size', async () => {
    const { default: Scatter } = await import('../../src/charts/Scatter.js')
    const w = (fontSize) =>
      /** @type {any} */ ({ config: { dataLabels: { style: { fontSize } } } })
    const before = built.n
    expect(Scatter.centerTextInBubble(w('13px'), 100)).toBe(103.25)
    // parseInt drops the fraction, as the instance method did
    expect(Scatter.centerTextInBubble(w('11.5px'), 40)).toBe(42.75)
    expect(Scatter.centerTextInBubble(w('12'), -6)).toBe(-3)
    expect(built.n).toBe(before)
  })
})
