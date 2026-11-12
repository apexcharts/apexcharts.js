import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import en from '../../src/locales/en.json'
import de from '../../src/locales/de.json'

// #5430: updateOptions({}) after setLocale() redrew only the first time,
// because the identical-options skip ignored the locale change.

const zoomInTitle = (chart) =>
  chart.w.dom.baseEl.querySelector('.apexcharts-zoomin-icon').title

describe('setLocale + updateOptions (#5430)', () => {
  it('redraws on every locale switch', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', locales: [en, de], defaultLocale: 'en' },
      series: [
        {
          name: 'A',
          data: [0, 1, 2, 3, 4, 5].map((m) => [Date.UTC(2026, m, 1), m + 1]),
        },
      ],
      xaxis: { type: 'datetime' },
    })

    for (const name of ['de', 'en', 'de', 'en']) {
      chart.setLocale(name)
      await chart.updateOptions({}, false, false)
      expect(zoomInTitle(chart)).toBe(name === 'de' ? 'Vergrößern' : 'Zoom In')
    }
  })
})
