import Utils from '../../src/utils/Utils.js'
import { darkenColor } from '../../src/charts/common/Jitter.js'
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

  it('a gradient fill probes inside the chart element', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'area' },
      series: [{ data: [1, 2, 3] }],
      colors: ['var(--chart-accent)'],
      fill: { type: 'gradient' },
    })
    await chart.render()
    const parents = []
    const real = window.getComputedStyle
    const spy = vi
      .spyOn(window, 'getComputedStyle')
      .mockImplementation((el, p) => {
        if (el.style && el.style.color === 'var(--chart-accent)') {
          parents.push(el.parentNode)
          return /** @type {any} */ ({ color: 'rgb(1, 2, 3)' })
        }
        return real(el, p)
      })
    try {
      await chart.updateOptions({ fill: { type: 'gradient' } })
      expect(parents.length).toBeGreaterThan(0)
      const host = document.querySelector('#chart')
      expect(parents.every((p) => host.contains(p))).toBe(true)
    } finally {
      spy.mockRestore()
      chart.destroy()
    }
  })
})

describe('parseColor and rgb2hex read every rgb() syntax', () => {
  it('reads the space, percentage and decimal forms', () => {
    expect(Utils.parseColor('rgb(228 87 46)')).toEqual([228, 87, 46, 1])
    expect(Utils.parseColor('rgb(100%, 0%, 50%)')).toEqual([255, 0, 127.5, 1])
    expect(Utils.parseColor('rgb(100% 0% 0% / 50%)')).toEqual([255, 0, 0, 0.5])
    expect(Utils.parseColor('rgba(228 87 46 / 0.5)')).toEqual([
      228, 87, 46, 0.5,
    ])
    expect(Utils.parseColor('rgb(228.5, 87, 46)')).toEqual([228.5, 87, 46, 1])
    expect(Utils.parseColor('RGBA(1, 2, 3, .25)')).toEqual([1, 2, 3, 0.25])
  })

  it('keeps the comma form exactly', () => {
    expect(Utils.parseColor('rgb(228, 87, 46)')).toEqual([228, 87, 46, 1])
    expect(Utils.parseColor('rgba(228,87,46,0.3)')).toEqual([228, 87, 46, 0.3])
    expect(Utils.rgb2hex('rgb(228, 87, 46)')).toBe('#e4572e')
    expect(Utils.rgb2hex('rgba(228,87,46,0.3)')).toBe('#e4572e')
  })

  it('does not read a relative or var() rgb() as numbers', () => {
    expect(Utils.parseColor('rgb(from #e4572e r g b)')).toBe(null)
    expect(Utils.parseColor('rgba(var(--rgb), 0.5)')).toBe(null)
    expect(Utils.rgb2hex('rgb(from #e4572e r g b)')).toBe('')
    expect(Utils.rgb2hex('color(srgb 1 0 0)')).toBe('')
    expect(Utils.rgb2hex('#ff0000')).toBe('')
  })

  it('rgb2hex reads the CSS Color 4 forms and rounds', () => {
    expect(Utils.rgb2hex('rgb(228 87 46)')).toBe('#e4572e')
    expect(Utils.rgb2hex('rgb(100%, 0%, 0%)')).toBe('#ff0000')
    expect(Utils.rgb2hex('rgb(228.5, 87, 46)')).toBe('#e5572e')
    expect(Utils.rgb2hex('rgba(228 87 46 / 0.5)')).toBe('#e4572e')
  })

  it('parseSrgbColor reads the computed color(srgb ...) form', () => {
    expect(
      Utils.parseSrgbColor('color(srgb 0.894118 0.341176 0.180392)'),
    ).toEqual([228, 87, 46, 1])
    expect(Utils.parseSrgbColor('color(srgb 1 0 0 / 0.85)')).toEqual([
      255, 0, 0, 0.85,
    ])
    expect(Utils.parseSrgbColor('color(display-p3 1 0 0)')).toBe(null)
    expect(Utils.parseSrgbColor('rgb(1, 2, 3)')).toBe(null)
  })
})

describe('getOpacityFromRGBA', () => {
  it('reads the comma alpha as before', () => {
    expect(Utils.getOpacityFromRGBA('rgba(228,87,46,0.3)')).toBe(0.3)
    expect(Utils.getOpacityFromRGBA('rgba(228, 87, 46, .5)')).toBe(0.5)
  })

  it('reads the slash alpha, a number or a percentage', () => {
    expect(Utils.getOpacityFromRGBA('rgba(228 87 46 / 0.5)')).toBe(0.5)
    expect(Utils.getOpacityFromRGBA('rgba(228 87 46 / 40%)')).toBe(0.4)
    expect(Utils.getOpacityFromRGBA('rgba(228 87 46)')).toBe(1)
  })

  it('is NaN when there is nothing to read, so callers keep their own', () => {
    expect(Utils.getOpacityFromRGBA('rgba(from red r g b / alpha)')).toBeNaN()
  })
})

describe('shadeColor on colours the hex maths cannot read', () => {
  it('reads color(srgb ...) with the channel maths', () => {
    const u = new Utils()
    expect(u.shadeColor(0.5, 'color(srgb 0.894118 0.341176 0.180392)')).toBe(
      'rgb(242,171,151)',
    )
    expect(u.shadeColor(-0.5, 'color(srgb 1 0 0 / 0.85)')).toBe(
      'rgba(128,0,0,0.85)',
    )
  })

  it('shades the percentage form on the right channels', () => {
    const u = new Utils()
    expect(u.shadeColor(-0.5, 'rgb(100%, 0%, 0%)')).toBe('rgb(128,0,0)')
  })

  it('blends a valid colour it cannot read with color-mix()', () => {
    const u = new Utils()
    // color-mix(in srgb, c 50%, white) is the same per-channel blend:
    // #e4572e gives #f2ab97 either way (checked in Chromium).
    expect(u.shadeColor(0.5, 'oklch(0.63 0.19 37)')).toBe(
      'color-mix(in srgb, oklch(0.63 0.19 37) 50%, white)',
    )
    expect(u.shadeColor(-0.65, 'color(display-p3 0.8 0.4 0.2)')).toBe(
      'color-mix(in srgb, color(display-p3 0.8 0.4 0.2) 35%, black)',
    )
    expect(u.shadeColor(0, 'oklch(0.63 0.19 37)')).toBe('oklch(0.63 0.19 37)')
    expect(u.shadeColor(1.5, 'oklch(0.63 0.19 37)')).toBe(
      'color-mix(in srgb, oklch(0.63 0.19 37) 0%, white)',
    )
  })

  it('darkenColor blends the same way', () => {
    expect(darkenColor('oklch(0.63 0.19 37)', 0.45)).toBe(
      'color-mix(in srgb, oklch(0.63 0.19 37) 55%, black)',
    )
    expect(darkenColor('notacolour', 0.45)).toBe('notacolour')
  })
})

describe('shadeColor and darkenColor resolve a variable where the chart is', () => {
  // jsdom does not resolve var(); assert where the probe is measured, as the
  // getThemeColor case above does.
  function probes(run) {
    const parents = []
    const real = window.getComputedStyle
    const spy = vi
      .spyOn(window, 'getComputedStyle')
      .mockImplementation((el, p) => {
        if (el.style && /var\(/.test(el.style.color)) {
          parents.push(el.parentNode)
          return /** @type {any} */ ({ color: 'rgb(228, 87, 46)' })
        }
        return real(el, p)
      })
    try {
      return { result: run(), parents }
    } finally {
      spy.mockRestore()
    }
  }

  it('probes inside the element passed', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    try {
      const u = new Utils()
      const a = probes(() => u.shadeColor(0.5, 'var(--x)', host))
      expect(a.result).toBe('rgb(242,171,151)')
      expect(a.parents).toEqual([host])
      const b = probes(() => darkenColor('var(--x)', 0.5, host))
      expect(b.result).toBe('rgb(114,44,23)')
      expect(b.parents).toEqual([host])
      // Without one, document.body as before.
      expect(probes(() => u.shadeColor(0.5, 'var(--x)')).parents).toEqual([
        document.body,
      ])
      expect(host.childNodes.length).toBe(0)
    } finally {
      host.remove()
    }
  })

  it('a detached element leaves the variable to the browser', () => {
    const real = window.getComputedStyle
    const spy = vi
      .spyOn(window, 'getComputedStyle')
      .mockImplementation((el, p) =>
        el.isConnected ? real(el, p) : /** @type {any} */ ({ color: '' }),
      )
    try {
      const u = new Utils()
      const el = document.createElement('div')
      expect(u.shadeColor(0.5, 'var(--x)', el)).toBe(
        'color-mix(in srgb, var(--x) 50%, white)',
      )
    } finally {
      spy.mockRestore()
    }
  })

  const S3 = [
    { name: 'a', data: [30, 60, 45] },
    { name: 'b', data: [20, 40, 50] },
    { name: 'c', data: [10, 20, 35] },
  ]
  const HM = [
    {
      name: 's1',
      data: [
        { x: 'a', y: 10 },
        { x: 'b', y: 50 },
        { x: 'c', y: 90 },
      ],
    },
  ]
  it.each([
    [
      'theme.monochrome',
      {
        chart: { type: 'bar' },
        series: S3,
        theme: { monochrome: { enabled: true, color: 'var(--x)' } },
      },
    ],
    [
      'heatmap gradient legend',
      {
        chart: { type: 'heatmap' },
        series: HM,
        colors: ['var(--x)'],
        plotOptions: {
          heatmap: { colorScale: { gradientLegend: { enabled: true } } },
        },
      },
    ],
    [
      'funnel 3D shadow',
      {
        chart: { type: 'bar' },
        colors: ['var(--x)'],
        plotOptions: {
          bar: { horizontal: true, isFunnel: true, isFunnel3d: true },
        },
        series: [{ name: 'v', data: [100, 80, 60, 40] }],
        xaxis: { categories: ['a', 'b', 'c', 'd'] },
      },
    ],
    [
      'boxPlot points',
      {
        chart: { type: 'boxPlot' },
        colors: ['var(--x)'],
        plotOptions: { boxPlot: { points: { show: true } } },
        series: [
          { data: [{ x: 'a', y: [20, 30, 40, 50, 60], points: [35, 40] }] },
        ],
      },
    ],
  ])('%s probes inside the chart', (_, options) => {
    const { result: chart, parents } = probes(() =>
      createChartWithOptions({
        ...options,
        chart: { ...options.chart, width: 500, height: 300 },
      }),
    )
    try {
      const host = document.querySelector('#chart')
      expect(parents.length).toBeGreaterThan(0)
      expect(parents.filter((p) => !host.contains(p))).toEqual([])
    } finally {
      chart.destroy()
    }
  })
})

describe('behaviour change: rgb() with leading whitespace parses', () => {
  it('parseColor and rgb2hex read it as the trimmed colour', () => {
    expect(Utils.parseColor(' rgba(23,190,187,0.7)')).toEqual([
      23, 190, 187, 0.7,
    ])
    expect(Utils.rgb2hex(' rgb(228, 87, 46)')).toBe('#e4572e')
    expect(Utils.rgb2hex('rgb(228, 87, 46) ')).toBe('#e4572e')
  })
})
