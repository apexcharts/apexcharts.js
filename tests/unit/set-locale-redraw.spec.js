/**
 * setLocale() switches the labels on screen straight away, not on the next
 * redraw that something else happens to trigger.
 */
import { describe, it, expect, afterEach } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import './__mocks__/ResizeObserver.js'
import en from '../../src/locales/en.json'
import de from '../../src/locales/de.json'

afterEach(() => {
  document.body.innerHTML = ''
})

function host() {
  const d = document.createElement('div')
  document.body.appendChild(d)
  return d
}

const xLabels = (chart) =>
  [...chart.el.querySelectorAll('.apexcharts-xaxis-label')]
    .map((t) => t.textContent)
    .join(', ')

const zoomTitle = (chart) =>
  chart.el.querySelector('.apexcharts-zoomin-icon').getAttribute('title')

describe('setLocale', () => {
  it('redraws the axis labels and toolbar titles in the new locale', async () => {
    const chart = new ApexCharts(host(), {
      chart: {
        type: 'line',
        width: 700,
        height: 300,
        locales: [en, de],
        defaultLocale: 'en',
        animations: { enabled: false },
      },
      series: [
        {
          name: 'A',
          data: [0, 1, 2, 3, 4, 5].map((m) => [Date.UTC(2026, m, 1), m + 1]),
        },
      ],
      xaxis: { type: 'datetime' },
    })
    await chart.render()
    expect(xLabels(chart)).toMatch(/Mar/)
    expect(zoomTitle(chart)).toBe('Zoom In')

    await chart.setLocale('de')
    expect(xLabels(chart)).toMatch(/Mär/)
    expect(xLabels(chart)).not.toMatch(/Mar\b/)
    expect(zoomTitle(chart)).toBe('Vergrößern')

    await chart.setLocale('en')
    expect(xLabels(chart)).toMatch(/Mar/)
    expect(zoomTitle(chart)).toBe('Zoom In')
    chart.destroy()
  })
})
