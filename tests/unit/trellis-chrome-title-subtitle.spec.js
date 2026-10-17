/**
 * The trellis draws one shared title above the grid from the host's own
 * `title` config (the panels have theirs suppressed). It used to read only
 * `text`, `fontSize` and `color`: the host `subtitle` vanished and the
 * title ignored `align`, `fontWeight` and `fontFamily`. The composed exports
 * draw the chrome from `_chromeTexts`, so the subtitle and the alignment
 * must reach them too.
 */
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/trellis.js'

beforeAll(() => {
  Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
    writable: true,
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  })
})

let chart = null
afterEach(() => {
  if (chart) chart.destroy()
  chart = null
})

async function mount(extra = {}) {
  document.body.innerHTML = ''
  const el = document.createElement('div')
  document.body.appendChild(el)
  chart = new ApexCharts(el, {
    chart: { type: 'line', height: 300, animations: { enabled: false } },
    trellis: { by: 'region', virtualize: false },
    series: [
      { name: 'Revenue', region: 'North', data: [1, 2, 3] },
      { name: 'Revenue', region: 'South', data: [3, 2, 1] },
    ],
    xaxis: { categories: ['a', 'b', 'c'] },
    ...extra,
  })
  await chart.render()
  return chart
}

const titleEl = (c) => c.el.querySelector('.apexcharts-trellis-title')
const subtitleEl = (c) => c.el.querySelector('.apexcharts-trellis-subtitle')

// Give the chrome real boxes (jsdom lays nothing out): the wrap at the page
// origin, each element at the given rect.
const place = (el, left, top, width, height) => {
  el.getBoundingClientRect = () => ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  })
}

describe('trellis shared title and subtitle', () => {
  it('default title options and no subtitle render exactly as before', async () => {
    const c = await mount({ title: { text: 'Sales' } })
    expect(titleEl(c).outerHTML).toBe(
      '<div class="apexcharts-trellis-title" style="font-size: 14px;">Sales</div>',
    )
    expect(subtitleEl(c)).toBeNull()
    expect(c.trellis.exports._chromeTexts()[0]).toMatchObject({
      text: 'Sales',
      align: 'left',
    })
  })

  it('applies title align, fontWeight and fontFamily', async () => {
    const c = await mount({
      title: {
        text: 'Sales',
        align: 'center',
        style: { fontWeight: 500, fontFamily: 'Georgia' },
      },
    })
    const el = titleEl(c)
    expect(el.style.textAlign).toBe('center')
    expect(el.style.fontWeight).toBe('500')
    expect(el.style.fontFamily).toBe('Georgia')
  })

  it('an explicit title weight applies, even the core default 900', async () => {
    for (const fontWeight of [900, '900']) {
      const c = await mount({ title: { text: 'Sales', style: { fontWeight } } })
      expect(titleEl(c).style.fontWeight).toBe('900')
      c.destroy()
      chart = null
    }
  })

  it('with no title weight set, the stylesheet weight stands', async () => {
    const c = await mount({ title: { text: 'Sales', style: { color: 'red' } } })
    expect(titleEl(c).style.fontWeight).toBe('')
  })

  it('draws the host subtitle under the title, with its own style', async () => {
    const c = await mount({
      title: { text: 'Sales' },
      subtitle: {
        text: 'By region',
        align: 'right',
        style: {
          fontSize: '13px',
          color: 'rgb(1, 2, 3)',
          fontFamily: 'Georgia',
        },
      },
    })
    const sub = subtitleEl(c)
    expect(sub).toBeTruthy()
    expect(sub.textContent).toBe('By region')
    expect(sub.previousElementSibling).toBe(titleEl(c))
    expect(sub.style.textAlign).toBe('right')
    expect(sub.style.fontSize).toBe('13px')
    expect(sub.style.fontWeight).toBe('400')
    expect(sub.style.color).toBe('rgb(1, 2, 3)')
    expect(sub.style.fontFamily).toBe('Georgia')
  })

  it('a subtitle without a title still renders', async () => {
    const c = await mount({ subtitle: { text: 'Only me' } })
    expect(titleEl(c)).toBeNull()
    const sub = subtitleEl(c)
    expect(sub.textContent).toBe('Only me')
    // core subtitle defaults; an unset colour follows the chrome's theme
    // token, like the title's (inline: the add-on adds no core CSS)
    expect(sub.style.fontSize).toBe('12px')
    expect(sub.style.fontWeight).toBe('400')
    expect(sub.style.color).toContain('--apx-trellis-fore')
    expect(sub.style.padding).toBe('0px 0px 6px')
  })

  it('a rebuild without the subtitle drops it from the exports', async () => {
    const c = await mount({ title: { text: 'T' }, subtitle: { text: 'S' } })
    await c.updateOptions({ subtitle: { text: undefined } })
    const texts = c.trellis.exports._chromeTexts().map((p) => p.text)
    expect(texts).toContain('T')
    expect(texts).not.toContain('S')
  })

  it('teardown forgets the subtitle element with the rest of the chrome', async () => {
    const c = await mount({ title: { text: 'T' }, subtitle: { text: 'S' } })
    c.trellis.teardown()
    expect(c.trellis.chrome.elSubtitle).toBeNull()
    expect(() => c.trellis.exports._chromeTexts()).not.toThrow()
  })

  it('exports carry the subtitle at its aligned anchor', async () => {
    const c = await mount({
      title: { text: 'Sales', align: 'center' },
      subtitle: { text: 'By region', align: 'right' },
    })
    place(c.trellis.elWrap, 0, 0, 400, 300)
    place(titleEl(c), 0, 0, 400, 20)
    place(subtitleEl(c), 0, 20, 400, 16)

    const pieces = c.trellis.exports._chromeTexts()
    const title = pieces.find((p) => p.text === 'Sales')
    const sub = pieces.find((p) => p.text === 'By region')
    expect(title).toMatchObject({ x: 200, y: 10, align: 'center' })
    expect(sub).toMatchObject({ x: 400, y: 28, align: 'right' })

    c.trellis.panels.forEach((p) => {
      p.chart.getSvgString = async () => '<svg/>'
    })
    const svg = await c.trellis.exports.svgString()
    expect(svg).toMatch(
      /<text x="200" y="10" text-anchor="middle"[^>]*>Sales<\/text>/,
    )
    expect(svg).toMatch(
      /<text x="400" y="28" text-anchor="end"[^>]*>By region<\/text>/,
    )
  })
})
