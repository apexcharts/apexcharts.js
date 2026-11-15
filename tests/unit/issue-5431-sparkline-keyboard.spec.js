import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

/**
 * #5431: a sparkline is usually one of many small inline glyphs (a grid row, a
 * KPI tile). With its tooltip off it has nothing for the keyboard to reach, so
 * by default it is no tab stop and reads as an image. With a tooltip, the
 * keyboard is how its values are reached, so it stays a tab stop. What the
 * user sets for accessibility.keyboard.enabled always wins.
 */

/** @param {Record<string, any>} [extra] */
function sparkline(extra = {}) {
  return createChartWithOptions({
    chart: {
      type: 'line',
      width: 140,
      height: 32,
      sparkline: { enabled: true },
      ...extra.chart,
    },
    series: [{ data: [3, 5, 4, 8, 9] }],
    ...extra.rest,
  })
}

/** @param {any} chart */
function a11y(chart) {
  const svg = chart.el.querySelector('.apexcharts-svg')
  const tabStops = [...chart.el.querySelectorAll('[tabindex]')].filter(
    (n) => n.getAttribute('tabindex') !== '-1',
  ).length
  return {
    role: svg.getAttribute('role'),
    tabStops,
    keyboard: chart.w.config.chart.accessibility.keyboard.enabled,
  }
}

const NO_TOOLTIP = { rest: { tooltip: { enabled: false } } }

describe('sparkline keyboard default (#5431)', () => {
  it('a sparkline with no tooltip is an image, not a tab stop', () => {
    expect(a11y(sparkline(NO_TOOLTIP))).toEqual({
      role: 'img',
      tabStops: 0,
      keyboard: false,
    })
  })

  it('GUARD a sparkline with its tooltip keeps the keyboard', () => {
    const { role, keyboard } = a11y(sparkline())
    expect(role).toBe('application')
    expect(keyboard).toBe(true)
  })

  it('GUARD a chart that is not a sparkline keeps the keyboard with no tooltip', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      tooltip: { enabled: false },
      series: [{ data: [3, 5, 4, 8, 9] }],
    })
    expect(a11y(chart).role).toBe('application')
  })

  it('keyboard.enabled: true set by the user wins', () => {
    const chart = sparkline({
      chart: { accessibility: { keyboard: { enabled: true } } },
      rest: NO_TOOLTIP.rest,
    })
    expect(a11y(chart).role).toBe('application')
  })

  it('a sparkline that gains a tooltip gains its tab stop, and loses it again', async () => {
    const chart = sparkline(NO_TOOLTIP)
    await chart.updateOptions({ tooltip: { enabled: true } })
    expect(a11y(chart).role).toBe('application')
    await chart.updateOptions({ tooltip: { enabled: false } })
    expect(a11y(chart).role).toBe('img')
  })

  it('turning sparkline mode off brings the keyboard back', async () => {
    const chart = sparkline(NO_TOOLTIP)
    await chart.updateOptions({ chart: { sparkline: { enabled: false } } })
    expect(a11y(chart).keyboard).toBe(true)
  })

  it('a keyboard setting from an earlier update is kept', async () => {
    const chart = sparkline(NO_TOOLTIP)
    await chart.updateOptions({
      chart: { accessibility: { keyboard: { enabled: true } } },
    })
    await chart.updateOptions({ series: [{ data: [1, 2, 3] }] })
    expect(a11y(chart).role).toBe('application')
  })
})
