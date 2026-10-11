import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SSRRenderer } from '../../../src/ssr/SSRRenderer.js'
import { BrowserAPIs } from '../../../src/ssr/BrowserAPIs.js'
import {
  SSRRenderElement,
  querySelectorAll,
} from '../../../src/ssr/RenderShim.js'
import '../../../src/entries/standard.js'
import '../../../src/features/annotations.js'

// The passes that run after drawing find their nodes again by selector, and
// measure rotated labels with getBoundingClientRect. The shim answered both
// with nothing, so SSR x-axis labels were never rotated or thinned and
// annotation labels lost their box and their vertical orientation.
describe('SSR post-draw passes', () => {
  let savedWindow, savedDocument, savedNavigator
  beforeEach(() => {
    savedWindow = global.window
    savedDocument = global.document
    savedNavigator = global.navigator
    global.window = undefined
    global.document = undefined
    global.navigator = undefined
    BrowserAPIs._resetShim()
  })
  afterEach(() => {
    global.window = savedWindow
    global.document = savedDocument
    global.navigator = savedNavigator
    BrowserAPIs._resetShim()
  })

  const xLabels = (svg) => [
    ...svg.matchAll(/<text[^>]*apexcharts-xaxis-label[^>]*>(.*?)<\/text>/g),
  ]

  it('rotates and thins dense x-axis labels', async () => {
    const svg = await SSRRenderer.renderToString({
      chart: { type: 'line' },
      series: [
        { data: Array.from({ length: 300 }, (_, i) => Math.sin(i / 50)) },
      ],
    })
    const labels = xLabels(svg)
    const shown = labels.filter((m) => /<tspan[^>]*>[^<]+</.test(m[1]))
    expect(shown.length).toBeGreaterThan(5)
    expect(shown.length).toBeLessThan(60)
    expect(labels[0][0]).toMatch(/transform="rotate\(-45 /)
  })

  it('leaves a sparse axis flat (control)', async () => {
    const svg = await SSRRenderer.renderToString({
      chart: { type: 'line' },
      series: [{ data: [1, 2, 3, 4] }],
    })
    const labels = xLabels(svg)
    expect(labels.length).toBe(4)
    expect(labels[0][0]).not.toMatch(/rotate\(/)
  })

  it('draws annotation label boxes and turns x-axis labels vertical', async () => {
    const svg = await SSRRenderer.renderToString({
      chart: { type: 'line' },
      xaxis: { type: 'numeric' },
      series: [
        {
          data: [
            [1, 2],
            [2, 4],
            [3, 1],
          ],
        },
      ],
      annotations: {
        xaxis: [{ x: 2, label: { text: 'XB' } }],
        yaxis: [{ y: 3, label: { text: 'Y3' } }],
      },
    })
    const group = (type) =>
      svg.match(
        new RegExp(`<g class="apexcharts-${type}-annotations">(.*?)</g>`),
      )[1]
    // The default label style: a white box with a grey border.
    const labelBox = /<rect(?=[^>]*fill="#fff")(?=[^>]*stroke="#c2c2c2")/

    const x = group('xaxis')
    expect(x).toMatch(labelBox)
    expect(x).toMatch(/<text[^>]*transform="rotate\(-90 [^>]*>XB</)

    const y = group('yaxis')
    expect(y).toMatch(labelBox)
    // The box sits on its label, not at the plot origin.
    const rect = y.match(/<rect[^>]*\sx="([-\d.e]+)"[^>]*\sy="([-\d.e]+)"/)
    const text = y.match(/<text[^>]*\sx="([-\d.e]+)"[^>]*\sy="([-\d.e]+)"/)
    expect(Math.abs(rect[1] - text[1])).toBeLessThan(40)
    expect(Math.abs(rect[2] - text[2])).toBeLessThan(20)
  })

  describe('querySelectorAll', () => {
    const tree = () => {
      const root = new SSRRenderElement('div')
      const g = new SSRRenderElement('g')
      g.setAttribute('class', 'a b')
      root.appendChild(g)
      for (let i = 0; i < 3; i++) {
        const t = new SSRRenderElement('text')
        t.setAttribute('rel', i)
        if (i === 1) t.classList.add('skip')
        g.appendChild(t)
      }
      return root
    }

    it('matches tags, classes, attributes, :not and :nth-child', () => {
      const root = tree()
      expect(querySelectorAll(root, '.a text')).toHaveLength(3)
      expect(querySelectorAll(root, 'g.b text[rel="2"]')).toHaveLength(1)
      expect(
        querySelectorAll(root, ".a text[rel='0']")[0].getAttribute('rel'),
      ).toBe(0)
      expect(querySelectorAll(root, '.a text:not(.skip)')).toHaveLength(2)
      expect(
        querySelectorAll(root, 'text:nth-child(2)')[0].getAttribute('rel'),
      ).toBe(1)
      expect(querySelectorAll(root, '.c text, g')).toHaveLength(1)
    })

    it('matches nothing for a selector it does not understand', () => {
      expect(querySelectorAll(tree(), 'g > text')).toHaveLength(0)
      expect(querySelectorAll(tree(), '*')).toHaveLength(0)
    })
  })
})
