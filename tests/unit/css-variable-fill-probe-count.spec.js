import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// A `var(--x)` colour is resolved by appending a probe to the chart and
// reading its computed style: a DOM write and a forced style recalc. Fill
// used to do that on every fillPath call (once per bar), even for a solid
// fill that never reads the result. Now it resolves only for the gradient and
// pattern fills that need a real colour, and once per variable per render.
//
// jsdom does not resolve var(), so the probe reads are mocked and counted.

const VAR = 'var(--brand)'
const RESOLVED = 'rgb(1, 2, 3)'

let probes = 0
let spy = null

function countProbes() {
  probes = 0
  const real = window.getComputedStyle
  spy = vi.spyOn(window, 'getComputedStyle').mockImplementation((el, p) => {
    if (el.style && el.style.color === VAR) {
      probes++
      return /** @type {any} */ ({ color: RESOLVED })
    }
    return real(el, p)
  })
}

afterEach(() => {
  spy?.mockRestore()
  spy = null
})

async function bars(fill) {
  const chart = createChartWithOptions({
    chart: { type: 'bar', width: 600, height: 300 },
    series: [{ data: Array.from({ length: 20 }, (_, i) => i + 1) }],
    colors: [VAR],
    fill,
  })
  await chart._renderPromise
  return chart
}

describe('CSS variable fill colours', () => {
  it('a solid fill never probes the variable', async () => {
    countProbes()
    const chart = await bars({ type: 'solid' })
    await chart.updateSeries([{ data: Array.from({ length: 20 }, () => 5) }])
    expect(probes).toBe(0)
    // the bars still paint with the variable itself
    const path = chart.w.dom.baseEl.querySelector('.apexcharts-bar-area')
    expect(path.getAttribute('fill')).toContain(VAR)
    chart.destroy()
  })

  it('a gradient fill probes once per variable per render, not per bar', async () => {
    countProbes()
    const chart = await bars({ type: 'gradient' })
    expect(probes).toBe(1)
    await chart.updateSeries([{ data: Array.from({ length: 20 }, () => 5) }])
    // the update re-resolves once, so a theme change is still picked up
    expect(probes).toBe(2)
    const stops = chart.w.dom.baseEl.querySelectorAll('defs stop')
    expect(stops.length).toBeGreaterThan(0)
    // the gradient is built from the resolved colour (rgb(1, 2, 3))
    const colors = Array.from(stops).map((s) => s.getAttribute('stop-color'))
    expect(colors).toContain('rgba(1,2,3,1)')
    chart.destroy()
  })
})
