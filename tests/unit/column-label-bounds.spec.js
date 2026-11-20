import { vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

describe('column data label bounds', () => {
  const charts = []

  beforeEach(() => {
    vi.spyOn(SVGElement.prototype, 'getBBox').mockImplementation(function () {
      return {
        x: 0,
        y: 0,
        width:
          this.tagName.toLowerCase() === 'text'
            ? this.textContent.length * 7
            : 10,
        height: 12,
      }
    })
  })

  afterEach(() => {
    charts.splice(0).forEach((chart) => chart.destroy())
    vi.restoreAllMocks()
  })

  function draw({
    textAnchor = 'middle',
    text = 'column label',
    orientation = 'horizontal',
    stacked = false,
    offsetX = 0,
    series,
  } = {}) {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 400, height: 300, stacked },
      series: series || [
        { name: 'x', data: [859, 813, 795] },
        { name: 'y', data: [5749, 5100, 4453] },
        { name: 'z', data: [7059, 6739, 6629] },
        { name: 'a', data: [15166, 14481, 13523] },
      ],
      xaxis: { categories: ['v21', 'v22', 'v23'] },
      plotOptions: { bar: { dataLabels: { orientation } } },
      stroke: { width: 2 },
      dataLabels: {
        enabled: true,
        textAnchor,
        offsetX,
        formatter: () => text,
        background: { enabled: false },
      },
    })
    charts.push(chart)
    const labels = Array.from(
      chart.el.querySelectorAll('.apexcharts-datalabels text'),
    )
    const positions = labels.map((label) => Number(label.getAttribute('x')))
    return { chart, labels, positions }
  }

  it.each(['middle', 'start', 'end'])(
    'keeps %s-anchored labels inside the plot',
    (textAnchor) => {
      const { chart, labels, positions } = draw({ textAnchor })
      expect(labels).toHaveLength(12)
      labels.forEach((label, i) => {
        const width = label.textContent.length * 7
        const anchor =
          textAnchor === 'start' ? 0 : textAnchor === 'end' ? width : width / 2
        const left = positions[i] - anchor
        expect(left).toBeGreaterThanOrEqual(0)
        expect(left + width).toBeLessThanOrEqual(chart.w.layout.gridWidth)
      })
    },
  )

  it.each([3, -3])('preserves offsetX=%s at clamped edges', (offsetX) => {
    const { chart, positions } = draw({ offsetX })
    const halfWidth = ('column label'.length * 7) / 2
    expect(Math.min(...positions)).toBe(halfWidth + 2 + offsetX)
    expect(Math.max(...positions)).toBe(
      chart.w.layout.gridWidth - halfWidth - 2 + offsetX,
    )
  })

  it('does not move rotated labels based on their unrotated width', () => {
    const short = draw({ text: 'x', orientation: 'vertical' }).positions
    const long = draw({ orientation: 'vertical' }).positions
    expect(long).toEqual(short)
  })

  it('keeps stacked labels centered on their segments', () => {
    const short = draw({ text: 'x', stacked: true }).positions
    const long = draw({ stacked: true }).positions
    expect(long).toEqual(short)
  })

  it('does not invert labels wider than the plot', () => {
    const short = draw({ text: 'x' }).positions
    const wide = draw({ text: 'x'.repeat(100) }).positions
    expect(wide).toEqual(short)
  })

  it('leaves room for empty labels', () => {
    const { labels } = draw({ text: '' })
    expect(labels.every((label) => label.textContent === '')).toBe(true)
  })

  it('does not produce labels for empty series', () => {
    expect(draw({ series: [{ data: [] }] }).labels).toHaveLength(0)
  })
})
