import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// The 3D funnel's connector shadow is its stage colour, shaded. The colour
// reached shadeColor only through rgb2hex, which reads rgb() and rgba(), so a
// stage coloured with a hex alpha or a named colour got fill="" and every
// shadow was drawn black (#4949).

function funnel(color) {
  return createChartWithOptions({
    chart: { type: 'funnel', width: 600, height: 360 },
    colors: [color],
    series: [{ name: 'Visitors', data: [1380, 1100, 990, 880, 740] }],
    xaxis: { categories: ['A', 'B', 'C', 'D', 'E'] },
  })
}

const shadowFills = (c) =>
  Array.from(c.w.dom.baseEl.querySelectorAll('.apexcharts-bar-shadow')).map(
    (n) => n.getAttribute('fill'),
  )

describe('funnel connector shadow colour', () => {
  it('shades an opaque hex as before', () => {
    const c = funnel('#3366cc')
    expect(shadowFills(c)).toEqual(Array(4).fill('#99b3e6'))
    c.destroy()
  })

  it('shades a hex with alpha instead of drawing it black', () => {
    const c = funnel('#3366cc80')
    expect(shadowFills(c)).toEqual(Array(4).fill('#99b3e680'))
    c.destroy()
  })

  it('shades a named colour instead of drawing it black', () => {
    const c = funnel('orange')
    expect(shadowFills(c)).toEqual(Array(4).fill('rgb(255,210,128)'))
    c.destroy()
  })
})
