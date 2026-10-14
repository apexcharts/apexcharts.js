// Keyboard zoom and pan. What the viewer saw: after one +, - or 0 the
// re-render dropped focus on the page, so the next key scrolled the page
// instead of driving the chart; Shift+Arrow on an unzoomed chart quietly
// zoomed it, could pan past the data, and reported a pan as `zoomed`.
// Handing focus over must not bring back a tooltip dismissed with Escape,
// nor take focus back from wherever the viewer moved it.
import { describe, it, expect, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

const svgOf = (c) => c.el.querySelector('.apexcharts-svg')
const press = (c, key, extra = {}) =>
  svgOf(c).dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...extra,
    }),
  )
const tick = () => new Promise((r) => setTimeout(r, 20))

async function mount(events = {}) {
  document.body.innerHTML = '<div id="c"></div>'
  const chart = new ApexCharts(document.querySelector('#c'), {
    chart: {
      type: 'line',
      height: 300,
      animations: { enabled: false },
      zoom: { enabled: true },
      events,
      accessibility: {
        enabled: true,
        keyboard: { enabled: true, navigation: { enabled: true } },
      },
    },
    series: [
      {
        name: 'A',
        data: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((x) => [x, x * 10]),
      },
    ],
    xaxis: { type: 'numeric' },
  })
  await chart.render()
  return chart
}

describe('keyboard zoom keeps focus on the chart', () => {
  it('+ hands focus and the cursor to the re-rendered SVG', async () => {
    const chart = await mount()
    svgOf(chart).focus()
    expect(chart.keyboardNavigation.active).toBe(true)
    for (let k = 0; k < 4; k++) press(chart, 'ArrowRight')
    const before = svgOf(chart)

    press(chart, '+')
    await tick()

    expect(chart.w.interact.zoomed).toBe(true)
    expect(svgOf(chart)).not.toBe(before)
    expect(document.activeElement).toBe(svgOf(chart))
    expect(chart.keyboardNavigation.active).toBe(true)
    // the middle point is still in view, so the cursor stays on it
    expect(chart.keyboardNavigation.dataPointIndex).toBe(4)
    chart.destroy()
  })

  it('an update keeps a focused chart focused without starting nav', async () => {
    const chart = await mount()
    // focus from a click: nav stays off
    chart.keyboardNavigation.notePointerFocus()
    svgOf(chart).focus()
    expect(chart.keyboardNavigation.active).toBe(false)

    await chart.updateOptions({ stroke: { width: 4 } })

    expect(document.activeElement).toBe(svgOf(chart))
    expect(chart.keyboardNavigation.active).toBe(false)
    expect(chart.el.querySelector('.apexcharts-keyboard-focused')).toBeNull()
    chart.destroy()
  })
})

describe('Shift+Arrow pans a zoomed chart as a drag pan does', () => {
  it('leaves an unzoomed chart unzoomed', async () => {
    const zoomed = vi.fn()
    const scrolled = vi.fn()
    const chart = await mount({ zoomed, scrolled })
    svgOf(chart).focus()
    press(chart, 'ArrowRight', { shiftKey: true })
    await tick()
    expect(chart.w.interact.zoomed).toBe(false)
    expect(chart.w.config.xaxis.min).toBeUndefined()
    expect(chart.w.config.xaxis.max).toBeUndefined()
    expect(zoomed).not.toHaveBeenCalled()
    expect(scrolled).not.toHaveBeenCalled()
    chart.destroy()
  })

  it('moves a tenth of the window, stops at the data, fires scrolled', async () => {
    const zoomed = vi.fn()
    const scrolled = vi.fn()
    const chart = await mount({ zoomed, scrolled })
    await chart.zoomX(3, 7)
    zoomed.mockClear()
    svgOf(chart).focus()

    press(chart, 'ArrowRight', { shiftKey: true })
    await tick()
    expect(chart.w.config.xaxis.min).toBeCloseTo(3.4, 6)
    expect(chart.w.config.xaxis.max).toBeCloseTo(7.4, 6)
    expect(scrolled).toHaveBeenCalledTimes(1)
    expect(scrolled.mock.calls[0][1].xaxis.min).toBeCloseTo(3.4, 6)
    // the pan re-rendered; focus came along so the next key still works
    expect(document.activeElement).toBe(svgOf(chart))

    for (let k = 0; k < 10; k++) press(chart, 'ArrowRight', { shiftKey: true })
    await tick()
    expect(chart.w.config.xaxis.max).toBe(9)
    expect(chart.w.config.xaxis.min).toBeCloseTo(5, 6)
    expect(zoomed).not.toHaveBeenCalled()
    chart.destroy()
  })

  it('stops at the ends of the bars on a rangeBar timeline', async () => {
    const day = 864e5
    document.body.innerHTML = '<div id="c"></div>'
    const chart = new ApexCharts(document.querySelector('#c'), {
      chart: {
        type: 'rangeBar',
        height: 300,
        animations: { enabled: false },
        zoom: { enabled: true },
        accessibility: {
          enabled: true,
          keyboard: { enabled: true, navigation: { enabled: true } },
        },
      },
      plotOptions: { bar: { horizontal: true } },
      series: [
        {
          name: 'T',
          data: [
            { x: 'a', y: [0, 4 * day] },
            { x: 'b', y: [3 * day, 10 * day] },
          ],
        },
      ],
      xaxis: { type: 'datetime' },
    })
    await chart.render()
    await chart.zoomX(2 * day, 6 * day)
    svgOf(chart).focus()
    const pan = async (key) => {
      for (let k = 0; k < 40; k++) {
        press(chart, key, { shiftKey: true })
        await tick()
      }
    }

    await pan('ArrowRight')
    expect(chart.w.config.xaxis.max).toBeCloseTo(10 * day, -3)
    expect(chart.w.config.xaxis.min).toBeCloseTo(6 * day, -3)
    await pan('ArrowLeft')
    expect(chart.w.config.xaxis.min).toBeCloseTo(0, -3)
    expect(chart.w.config.xaxis.max).toBeCloseTo(4 * day, -3)
    chart.destroy()
  })
})

describe('the focus hand-over across an update', () => {
  const tipShown = (c) =>
    !!c.el.querySelector('.apexcharts-tooltip.apexcharts-active')

  it('keeps a tooltip dismissed with Escape dismissed', async () => {
    const chart = await mount()
    svgOf(chart).focus()
    press(chart, 'ArrowRight')
    expect(tipShown(chart)).toBe(true)
    press(chart, 'Escape')
    expect(tipShown(chart)).toBe(false)

    await chart.updateOptions({ stroke: { width: 3 } })

    expect(document.activeElement).toBe(svgOf(chart))
    expect(chart.keyboardNavigation.active).toBe(true)
    expect(tipShown(chart)).toBe(false)
    // the next arrow shows the point again, and Escape dismisses it again
    press(chart, 'ArrowRight')
    expect(tipShown(chart)).toBe(true)
    press(chart, 'Escape')
    expect(chart.keyboardNavigation.active).toBe(true)
    chart.destroy()
  })

  it('does not take focus back after a destroy', async () => {
    const chart = await mount()
    svgOf(chart).focus()
    chart.destroy()
    expect(chart.w.interact.keyNav).toBeFalsy()
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    await chart.render()

    expect(document.activeElement).toBe(input)
    chart.destroy()
  })

  it('does not take focus from where it went while nav was off', async () => {
    const chart = await mount()
    const nav = (enabled) => ({
      chart: { accessibility: { keyboard: { navigation: { enabled } } } },
    })
    svgOf(chart).focus()
    await chart.updateOptions(nav(false))
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    await chart.updateOptions(nav(true))

    expect(document.activeElement).toBe(input)
    chart.destroy()
  })
})
