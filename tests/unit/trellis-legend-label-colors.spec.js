/**
 * The trellis's shared legend writes its names in `legend.labels.colors`,
 * like a plain chart's legend does, and falls back to the stylesheet colour
 * when the option is unset.
 */
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/trellis.js'

beforeAll(() => {
  Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
    writable: true,
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  })
})

let chart = null
afterEach(() => {
  if (chart) chart.destroy()
  chart = null
})

async function mount(extra = {}) {
  document.body.innerHTML = ''
  const el = document.createElement('div')
  document.body.appendChild(el)
  chart = new ApexCharts(el, {
    chart: { type: 'bar', height: 300, animations: { enabled: false } },
    trellis: { by: 'region', virtualize: false },
    series: [
      { name: 'Revenue', region: 'North', data: [1, 2, 3] },
      { name: 'Cost', region: 'North', data: [2, 1, 3] },
      { name: 'Revenue', region: 'South', data: [3, 2, 1] },
      { name: 'Cost', region: 'South', data: [1, 2, 2] },
    ],
    xaxis: { categories: ['a', 'b', 'c'] },
    ...extra,
  })
  await chart.render()
  return chart
}

const texts = (c) => [
  ...c.el.querySelectorAll(
    '.apexcharts-trellis-legend .apexcharts-legend-text',
  ),
]

describe('trellis shared legend label colors', () => {
  it('uses a single legend.labels.colors string for every name', async () => {
    const c = await mount({ legend: { labels: { colors: '#cc0000' } } })
    const t = texts(c)
    expect(t).toHaveLength(2)
    t.forEach((el) => expect(el.style.color).toBe('rgb(204, 0, 0)'))
  })

  it('uses a legend.labels.colors array by name index', async () => {
    const c = await mount({
      legend: { labels: { colors: ['#cc0000', '#00cc00'] } },
    })
    const t = texts(c)
    expect(t[0].style.color).toBe('rgb(204, 0, 0)')
    expect(t[1].style.color).toBe('rgb(0, 204, 0)')
  })

  it('leaves the colour to the stylesheet when the option is unset', async () => {
    const c = await mount()
    texts(c).forEach((el) => expect(el.style.color).toBe(''))
  })

  // The per-chart legend gives useSeriesColors precedence over labels.colors
  // (Legend.js); the shared legend follows the same rule.
  describe('legend.labels.useSeriesColors', () => {
    const markerOf = (el) =>
      el.parentNode.querySelector('.apexcharts-legend-marker').style.background

    it('paints each name in its series colour', async () => {
      const c = await mount({
        colors: ['#cc0000', '#0000cc'],
        legend: { labels: { useSeriesColors: true } },
      })
      const t = texts(c)
      expect(t).toHaveLength(2)
      expect(t[0].style.color).toBe('rgb(204, 0, 0)')
      expect(t[1].style.color).toBe('rgb(0, 0, 204)')
      t.forEach((el) => expect(el.style.color).toBe(markerOf(el)))
    })

    it('wins over legend.labels.colors', async () => {
      const c = await mount({
        colors: ['#cc0000', '#0000cc'],
        legend: { labels: { useSeriesColors: true, colors: '#00cc00' } },
      })
      const t = texts(c)
      expect(t[0].style.color).toBe('rgb(204, 0, 0)')
      expect(t[1].style.color).toBe('rgb(0, 0, 204)')
    })

    it('survives a legend click', async () => {
      const c = await mount({
        colors: ['#cc0000', '#0000cc'],
        legend: { labels: { useSeriesColors: true } },
      })
      texts(c)[0].parentNode.click()
      const t = texts(c)
      expect(t[0].parentNode.classList).toContain('apexcharts-inactive-legend')
      expect(t[0].style.color).toBe('rgb(204, 0, 0)')
    })

    it('follows a colors update', async () => {
      const c = await mount({
        colors: ['#cc0000', '#0000cc'],
        legend: { labels: { useSeriesColors: true } },
      })
      await c.updateOptions({ colors: ['#00cc00', '#cccc00'] })
      const t = texts(c)
      expect(t[0].style.color).toBe('rgb(0, 204, 0)')
      expect(t[1].style.color).toBe('rgb(204, 204, 0)')
      t.forEach((el) => expect(el.style.color).toBe(markerOf(el)))
    })

    it('turning it off hands the colour back to labels.colors', async () => {
      const c = await mount({
        colors: ['#cc0000', '#0000cc'],
        legend: { labels: { useSeriesColors: true, colors: '#00cc00' } },
      })
      await c.updateOptions({ legend: { labels: { useSeriesColors: false } } })
      texts(c).forEach((el) => expect(el.style.color).toBe('rgb(0, 204, 0)'))
    })
  })
})
