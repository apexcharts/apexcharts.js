import { describe, it, expect, afterEach } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'

// The host element is the user's (react-apexcharts#751). Core used to reserve
// the chart's height on it as an inline min-height, which overrode the user's
// own min-height (style prop or stylesheet) while mounted, and destroy() then
// wrote `unset` over it (apexcharts.js#1654). The reservation now lives on the
// chart's own wrapper, so Core never writes the host's min-height at all.

function host(minHeight) {
  const el = document.createElement('div')
  if (minHeight) el.style.minHeight = minHeight
  document.body.appendChild(el)
  return el
}

const line = (height, chart = {}) => ({
  chart: { type: 'line', height, animations: { enabled: false }, ...chart },
  series: [{ data: [3, 1, 4, 1, 5] }],
})

// jsdom has no layout: an explicit width gives the pie a radius to fit to.
const pie = () => ({
  chart: { type: 'pie', width: 400, animations: { enabled: false } },
  series: [44, 55, 13],
  labels: ['A', 'B', 'C'],
})

describe('the host min-height is the user\'s (#751)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('a fixed height reserves its height plus parentHeightOffset on the wrapper', async () => {
    const el = host()
    const chart = new ApexCharts(el, line(300))
    await chart.render()
    const wrap = chart.w.dom.elWrap
    expect(el.style.minHeight).toBe('')
    expect(wrap.style.minHeight).toBe(`${chart.w.globals.svgHeight + 15}px`)

    const flush = new ApexCharts(host(), line(300, { parentHeightOffset: 0 }))
    await flush.render()
    expect(flush.w.dom.elWrap.style.minHeight).toBe(
      `${flush.w.globals.svgHeight}px`,
    )
  })

  it("keeps a user's inline min-height through render, updates and destroy", async () => {
    for (const height of [300, '100%']) {
      const el = host('360px')
      const chart = new ApexCharts(el, line(height))
      await chart.render()
      expect(el.style.minHeight).toBe('360px')
      await chart.updateOptions({ chart: { height: 280 } }, false, false)
      expect(el.style.minHeight).toBe('360px')
      chart.destroy()
      expect(el.style.minHeight).toBe('360px')
    }
  })

  it('a min-height the app changes while mounted is never touched', async () => {
    const el = host('360px')
    const chart = new ApexCharts(el, line(300))
    await chart.render()
    el.style.minHeight = '400px'
    await chart.updateOptions({ chart: { height: 280 } }, false, false)
    expect(el.style.minHeight).toBe('400px')
    chart.destroy()
    expect(el.style.minHeight).toBe('400px')
  })

  it('destroy and a new chart on the same element keep the original', async () => {
    const el = host('360px')
    for (const height of [300, 300, '100%']) {
      const chart = new ApexCharts(el, line(height))
      await chart.render()
      chart.destroy()
    }
    expect(el.style.minHeight).toBe('360px')
  })

  it('a destroyed chart leaves nothing on a bare host (#1654)', async () => {
    const el = host()
    const chart = new ApexCharts(el, line(300))
    await chart.render()
    chart.destroy()
    expect(el.style.minHeight).toBe('')
    expect(el.childElementCount).toBe(0)
  })

  it('a px to % switch drops the reservation with the old wrapper', async () => {
    const el = host()
    const chart = new ApexCharts(el, line(300))
    await chart.render()
    await chart.updateOptions({ chart: { height: '100%' } }, false, false)
    expect(chart.w.dom.elWrap.style.minHeight).toBe('')
    expect(el.style.minHeight).toBe('')
    chart.destroy()
  })

  it('pie fit-to-content reserves the fitted height on the wrapper', async () => {
    const el = host('360px')
    const chart = new ApexCharts(el, pie())
    await chart.render()
    const wrap = chart.w.dom.elWrap
    // The fit-to-content height, not setSVGDimensions' width / 1.2 default.
    expect(wrap.style.minHeight).toBe(wrap.style.height)
    expect(wrap.style.minHeight).not.toBe(`${400 / 1.2}px`)
    expect(el.style.minHeight).toBe('360px')
    chart.destroy()
    expect(el.style.minHeight).toBe('360px')
  })

  it('printing never touches the host, and a mid-print destroy can print again', async () => {
    const el = host('360px')
    const chart = new ApexCharts(el, line(300))
    await chart.render()

    chart._beforePrint()
    expect(chart.w.dom.elWrap.classList.contains('apexcharts-printing')).toBe(
      true,
    )
    expect(el.style.minHeight).toBe('360px')
    chart._afterPrint()
    expect(el.style.minHeight).toBe('360px')

    // destroy() drops the afterprint hook, so _afterPrint never runs.
    chart._beforePrint()
    chart.destroy()
    expect(el.style.minHeight).toBe('360px')
    expect(chart._printRestore).toBe(null)
  })
})
