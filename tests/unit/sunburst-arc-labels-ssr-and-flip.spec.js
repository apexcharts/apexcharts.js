// Users server-rendering a sunburst got the arcs but no arc labels (the label
// renderer bailed outside a browser, and the SSR shim had no setAttributeNS),
// and a negative startAngle left the bottom-half labels upside down.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import { SSRRenderer } from '../../src/ssr/SSRRenderer.js'
import { BrowserAPIs } from '../../src/ssr/BrowserAPIs.js'
import ApexCharts from '../../src/entries/sunburst.js'

const tree = [
  {
    data: [
      { x: 'Engineering', children: [{ x: 'Frontend', y: 300 }, { x: 'Backend', y: 200 }] },
      { x: 'Operations', y: 400 },
    ],
  },
]

describe('sunburst arc labels under SSR', () => {
  let saved
  beforeEach(() => {
    saved = [global.window, global.document, global.navigator]
    global.window = undefined
    global.document = undefined
    global.navigator = undefined
    BrowserAPIs._resetShim()
  })
  afterEach(() => {
    ;[global.window, global.document, global.navigator] = saved
    BrowserAPIs._resetShim()
  })

  it('renders a curved label per arc', async () => {
    const svg = await SSRRenderer.renderToString({
      chart: { type: 'sunburst', width: 500, height: 500 },
      series: tree,
    })
    expect(svg).toContain('apexcharts-sunburst-arc')
    expect(svg).toMatch(/>Operations<\/textPath>/)
    expect(svg).toMatch(/>Frontend<\/textPath>/)
    expect(svg).toMatch(/<textPath[^>]* xlink:href="#apx-sb-lbl-/)
  })
})

describe('sunburst arc label flip', () => {
  // Four equal quarters: two sit on the bottom half and their guide arc runs
  // counter-clockwise (sweep flag 0) so the text stays upright.
  const flipped = () =>
    [...document.querySelectorAll('.apexcharts-sunburst-labels path')].filter(
      (p) => p.getAttribute('d').trim().split(/[\s,]+/)[8] === '0',
    ).length

  const render = async (startAngle, endAngle) => {
    document.body.innerHTML = '<div id="chart"></div>'
    const c = new ApexCharts(document.querySelector('#chart'), {
      series: [{ data: ['A', 'B', 'C', 'D'].map((x) => ({ x, y: 10 })) }],
      chart: { type: 'sunburst', width: 500, height: 500, animations: { enabled: false } },
      plotOptions: { sunburst: { startAngle, endAngle } },
    })
    await c.render()
    const n = flipped()
    c.destroy()
    return n
  }

  it('flips the same half whatever turn the start angle is written in', async () => {
    expect(await render(90, 450)).toBe(2)
    expect(await render(-270, 90)).toBe(2)
    expect(await render(450, 810)).toBe(2)
  })
})
