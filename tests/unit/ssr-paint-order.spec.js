import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SSRRenderer } from '../../src/ssr/SSRRenderer.js'
import { SSRRenderShim } from '../../src/ssr/RenderShim.js'
import { BrowserAPIs } from '../../src/ssr/BrowserAPIs.js'
import SVGElement from '../../src/svg/SVGElement.js'
import ApexCharts from '../../src/entries/standard.js'

// With the default grid.position 'back', Axes moves the plot group after each
// y-axis group (Paper.children()), so the plot paints above the axis band.
// The shim must walk children the way the browser does, or the server render
// stacks the y-axis over the plot.
const config = () => ({
  chart: {
    type: 'line',
    width: 500,
    height: 300,
    animations: { enabled: false },
  },
  series: [{ data: [1, 2, 3] }],
})

/** The y-axis and plot groups, in document order. */
const order = (markup) =>
  [
    ...markup.matchAll(
      /<g[^>]*class="(apexcharts-yaxis|apexcharts-inner apexcharts-graphical)"/g,
    ),
  ].map((m) => m[1])

// What the browser draws, pinned by the first test so the server case does
// not depend on running after it.
const BROWSER_ORDER = [
  'apexcharts-yaxis',
  'apexcharts-inner apexcharts-graphical',
]

describe('SSR keeps the browser paint order', () => {
  it('the browser draws the plot group after the y-axis group', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), config())
    await chart.render()
    const browserOrder = order(chart.w.dom.Paper.node.outerHTML)
    chart.destroy()
    expect(browserOrder).toEqual(BROWSER_ORDER)
  })

  describe('server side', () => {
    let sw, sd, sn
    beforeEach(() => {
      sw = global.window
      sd = global.document
      sn = global.navigator
      global.window = undefined
      global.document = undefined
      global.navigator = undefined
      BrowserAPIs._resetShim()
    })
    afterEach(() => {
      global.window = sw
      global.document = sd
      global.navigator = sn
      BrowserAPIs._resetShim()
    })

    it('renderToString stacks the groups as the browser does', async () => {
      const svg = await SSRRenderer.renderToString(config())
      expect(order(svg)).toEqual(BROWSER_ORDER)
    })

    it('shim elements walk like DOM elements', () => {
      const shim = new SSRRenderShim()
      const NS = 'http://www.w3.org/2000/svg'
      const g = shim.createElementNS(NS, 'g')
      g.setAttribute('class', 'outer')
      const a = shim.createElementNS(NS, 'rect')
      const b = shim.createElementNS(NS, 'text')
      g.appendChild(a)
      g.appendChild(b)

      expect(a.nodeType).toBe(1)
      expect(g.firstChild).toBe(a)
      expect(g.lastChild).toBe(b)
      expect(a.nextSibling).toBe(b)
      expect(b.nextSibling).toBe(null)
      expect(b.previousSibling).toBe(a)
      expect(a.getAttribute('missing')).toBe(null)
      expect(b.closest('.outer')).toBe(g)
      expect(b.closest('.nope')).toBe(null)
      expect(new SVGElement(g).children().length).toBe(2)

      // clear() walks firstChild until the element is empty
      new SVGElement(g).clear()
      expect(g.children.length).toBe(0)
    })

    it('querySelector stops at the first match in document order', () => {
      // Gradients and patterns look up `defs` on the root once per shape, so
      // a full walk per lookup makes a large gradient chart quadratic.
      const shim = new SSRRenderShim()
      const NS = 'http://www.w3.org/2000/svg'
      const root = shim.createElementNS(NS, 'svg')
      const g = shim.createElementNS(NS, 'g')
      const nested = shim.createElementNS(NS, 'defs')
      const later = shim.createElementNS(NS, 'defs')
      const tail = shim.createElementNS(NS, 'g')
      g.appendChild(nested)
      root.appendChild(g)
      root.appendChild(later)
      root.appendChild(tail)

      let tailVisits = 0
      const kids = tail.children
      Object.defineProperty(tail, 'children', {
        get: () => {
          tailVisits++
          return kids
        },
      })

      expect(root.querySelector('defs')).toBe(nested)
      expect(tailVisits).toBe(0)
      expect(root.querySelector('.none')).toBe(null)
      expect(tailVisits).toBe(1)
      expect(root.querySelectorAll('defs')).toEqual([nested, later])
    })
  })
})
