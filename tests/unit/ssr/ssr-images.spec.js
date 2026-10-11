import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SSRRenderer } from '../../../src/ssr/SSRRenderer.js'
import { BrowserAPIs } from '../../../src/ssr/BrowserAPIs.js'
import { SSRRenderElement } from '../../../src/ssr/RenderShim.js'
import '../../../src/entries/standard.js'
import '../../../src/features/annotations.js'

// Every <image> is linked with setAttributeNS(xlink, 'href', url), which the
// DOM shim did not have: an image fill, a radialBar hollow image or an image
// annotation rejected the whole renderToString.
describe('SSR images', () => {
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

  it('serializes a namespaced href as xlink:href and declares the prefix', () => {
    const el = new SSRRenderElement('image')
    el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', 'a.png')
    expect(el.getAttribute('xlink:href')).toBe('a.png')
    expect(el.toString()).toBe(
      '<image xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="a.png"/>',
    )
    // A clone stays a render element.
    expect(el.cloneNode().setAttributeNS).toBeTypeOf('function')

    const tp = new SSRRenderElement('textPath')
    tp.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#arc')
    expect(tp.getAttribute('xlink:href')).toBe('#arc')

    const plain = new SSRRenderElement('svg')
    plain.setAttributeNS(null, 'width', 10)
    expect(plain.toString()).toBe('<svg width="10"/>')
  })

  it('renders a bar chart with an image fill', async () => {
    const svg = await SSRRenderer.renderToString({
      chart: { type: 'bar' },
      series: [{ data: [3, 5, 2] }],
      fill: { type: 'image', image: { src: ['fill.png'] } },
    })
    expect(svg).toContain('xlink:href="fill.png"')
  })

  it('renders a radialBar hollow image', async () => {
    const svg = await SSRRenderer.renderToString({
      chart: { type: 'radialBar' },
      series: [50],
      plotOptions: {
        radialBar: {
          hollow: { image: 'hollow.png' },
          dataLabels: { show: false },
        },
      },
    })
    expect(svg).toContain('xlink:href="hollow.png"')
  })

  it('renders an image annotation', async () => {
    const svg = await SSRRenderer.renderToString({
      chart: { type: 'line' },
      series: [{ data: [1, 3, 2] }],
      annotations: {
        images: [{ path: 'note.png', x: 10, y: 10, width: 20, height: 20 }],
      },
    })
    expect(svg).toContain('xlink:href="note.png"')
  })
})
