import Utils from '../../src/utils/Utils.js'
import { createChartWithOptions } from './utils/utils.js'

// shadeColor must keep the hue of any valid CSS colour the user passes. Short
// hex (#f00), 8-digit hex and named colours are all accepted by colors[], but
// shadeColor used to decode #f00 as 0x000f00 and 'red' as rgb(NaN), and
// hexToRgba turned 8-digit hex into the invalid 'rgba(0.6)'.

function rgbOf(c) {
  const m = String(c).match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  if (m) return [+m[1], +m[2], +m[3]]
  const h = Utils.parseHex(c)
  return h || null
}

// A shade of pure red: red channel dominates, green == blue.
function isRedShade(c) {
  const rgb = rgbOf(c)
  if (!rgb) return false
  const [r, g, b] = rgb
  return r > g && Math.abs(g - b) <= 1
}

function heatmap(color) {
  return createChartWithOptions({
    chart: { type: 'heatmap', height: 300, width: 500 },
    colors: [color],
    series: [
      { name: 'A', data: [10, 20, 30, 40].map((y, i) => ({ x: 'c' + i, y })) },
    ],
    dataLabels: { enabled: false },
  })
}

describe('shadeColor keeps the hue of the user colour', () => {
  it('shadeColor on #f00 matches #ff0000', () => {
    const u = new Utils()
    expect(u.shadeColor(-0.5, '#f00')).toBe(u.shadeColor(-0.5, '#ff0000'))
  })

  it('keeps the exact output for 6-digit hex and rgb()', () => {
    const u = new Utils()
    expect(u.shadeColor(-0.5, '#ff0000')).toBe('#800000')
    expect(u.shadeColor(0.5, '#000000')).toBe('#808080')
    expect(u.shadeColor(0, '#ff0000')).toBe('#ff0000')
    expect(u.shadeColor(-0.5, 'rgb(200,200,200)')).toBe('rgb(100,100,100)')
    expect(u.shadeColor(0.5, 'rgb(100, 100, 100)')).toBe('rgb(178,178,178)')
  })

  it('carries the alpha of 8-digit hex and rgba() through', () => {
    const u = new Utils()
    expect(u.shadeColor(-0.5, '#ff000080')).toBe('#80000080')
    expect(u.shadeColor(-0.5, '#f008')).toBe('#80000088')
    expect(u.shadeColor(-0.5, 'rgba(200,0,0,0.5)')).toBe('rgba(100,0,0,0.5)')
  })

  it('shadeColor on a named colour does not produce NaN', () => {
    const u = new Utils()
    expect(u.shadeColor(-0.5, 'red')).toBe('rgb(128,0,0)')
    expect(u.shadeColor(-0.5, 'hsl(0, 100%, 50%)')).toBe('rgb(128,0,0)')
  })

  it('returns a colour it cannot read unchanged', () => {
    const u = new Utils()
    expect(u.shadeColor(-0.5, 'notacolour')).toBe('notacolour')
  })

  it.each(['#ff0000', '#f00', 'red'])(
    'heatmap cells with colors [%s] are shades of red',
    (color) => {
      const chart = heatmap(color)
      const fills = Array.from(
        chart.el.querySelectorAll('.apexcharts-heatmap-rect'),
      ).map((el) => el.getAttribute('fill'))
      expect(fills.length).toBe(4)
      expect(fills.filter((f) => !isRedShade(f))).toEqual([])
    },
  )
})

describe('hexToRgba reads every hex length', () => {
  it('splits 8- and 4-digit hex and multiplies their alpha into the opacity', () => {
    expect(Utils.hexToRgba('#ff000080', 1)).toBe(
      'rgba(255,0,0,0.5019607843137255)',
    )
    expect(Utils.hexToRgba('#ff0000ff', 0.4)).toBe('rgba(255,0,0,0.4)')
    expect(Utils.hexToRgba('#f008', 0.5)).toBe(
      'rgba(255,0,0,0.26666666666666666)',
    )
  })

  it('keeps 3- and 6-digit output and the #999999 fallback', () => {
    expect(Utils.hexToRgba('#F00', 0.5)).toBe('rgba(255,0,0,0.5)')
    expect(Utils.hexToRgba('#008FFB', 0.85)).toBe('rgba(0,143,251,0.85)')
    expect(Utils.hexToRgba('invalid', 0.5)).toBe('rgba(153,153,153,0.5)')
  })

  it('returns a hex of unknown length unchanged, not an invalid rgba', () => {
    expect(Utils.hexToRgba('#12345', 0.5)).toBe('#12345')
  })
})

describe('getThemeColor resolves a variable where the chart is', () => {
  // jsdom does not resolve var(), so assert where the probe is measured: a
  // browser resolves the variable from the probe's ancestors.
  it('probes inside the given element, so a scoped variable resolves', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const parents = []
    const spy = vi
      .spyOn(window, 'getComputedStyle')
      .mockImplementation((el) => {
        parents.push(el.parentNode)
        return /** @type {any} */ ({ color: 'rgb(1, 2, 3)' })
      })
    try {
      expect(Utils.getThemeColor('var(--chart-accent)', host)).toBe(
        'rgb(1, 2, 3)',
      )
      Utils.getThemeColor('var(--chart-accent)')
      expect(parents).toEqual([host, document.body])
      expect(host.childNodes.length).toBe(0)
    } finally {
      spy.mockRestore()
      host.remove()
    }
  })
})
