import { createChartWithOptions } from './utils/utils.js'

// A colour in CSS Color 4/5 syntax took the rgb() branch of Fill because its
// text holds "rgb" (srgb, a98-rgb, color-mix(in srgb ...), rgb(from ...)), and
// rgb2hex reads only the integer comma form, so the fill fell to #999999 and
// gradient stops to an empty stop-color (black). jsdom cannot compute these
// colours, so this pins the strings Fill writes; the browser side is
// tests/interaction/specs/modern-css-colours.spec.js.

const S2 = () => [
  { name: 's1', data: [30, 60, 45] },
  { name: 's2', data: [20, 40, 50] },
]

function chart(color, extra = {}) {
  return createChartWithOptions({
    series: S2(),
    xaxis: { categories: ['A', 'B', 'C'] },
    colors: [color, '#17bebb'],
    ...extra,
    chart: { type: 'bar', height: 260, width: 500, ...(extra.chart || {}) },
  })
}

function shaded(type, color) {
  return createChartWithOptions({
    series: [
      {
        name: 's1',
        data: [
          { x: 'a', y: 10 },
          { x: 'b', y: 50 },
          { x: 'c', y: 90 },
        ],
      },
    ],
    colors: [color],
    chart: { type, height: 200, width: 400 },
  })
}

const q = (c, sel) => Array.from(c.el.querySelectorAll(sel))
const first = (c, sel) => q(c, `.apexcharts-series[rel="1"] ${sel}`)[0]

const solidFill = (color, extra) => {
  const c = chart(color, { fill: { opacity: 0.5 }, ...extra })
  const f = first(c, '.apexcharts-bar-area').getAttribute('fill')
  c.destroy()
  return f
}

const lineStroke = (color) => {
  const c = chart(color, { chart: { type: 'line' } })
  const s = first(c, 'path.apexcharts-line').getAttribute('stroke')
  c.destroy()
  return s
}

// "stop-color|stop-opacity" of the series' gradient.
const stops = (color, extra) => {
  const c = chart(color, extra)
  const el = first(c, '.apexcharts-bar-area, path.apexcharts-area')
  const id = /#([^)'"]+)/.exec(el.getAttribute('fill'))[1]
  const out = q(c, `#${id} stop`).map(
    (s) => `${s.getAttribute('stop-color')}|${s.getAttribute('stop-opacity')}`,
  )
  c.destroy()
  return out
}
const barGradient = (color) => stops(color, { fill: { type: 'gradient' } })
const areaGradient = (color) => stops(color, { chart: { type: 'area' } })

const cells = (type, color) => {
  const c = shaded(type, color)
  const f = q(c, `.apexcharts-${type}-rect`).map((e) => e.getAttribute('fill'))
  c.destroy()
  return f
}

const GREY = /rgba\(153,\s*153,\s*153/
const channels = (c) =>
  String(c)
    .match(/[\d.]+/g)
    .slice(0, 4)
    .map(Number)

describe('fill output for colours that already worked is unchanged', () => {
  // Captured from v8.7.0; every one of these must stay byte-identical.
  const HEX = {
    solid: 'rgba(228,87,46,0.5)',
    line: 'rgba(228,87,46,0.85)',
    bar: ['rgba(114,44,23,1)|1', 'rgba(228,87,46,1)|1', 'rgba(228,87,46,1)|1'],
    area: [
      'rgba(228,87,46,0.65)|0.65',
      'rgba(242,171,151,0.5)|0.5',
      'rgba(242,171,151,0.5)|0.5',
    ],
    heatmap: [
      'rgba(252,238,234,1)',
      'rgba(242,171,151,1)',
      'rgba(231,104,67,1)',
    ],
    treemap: [
      'rgba(243,182,164,1)',
      'rgba(236,140,111,1)',
      'rgba(230,97,59,1)',
    ],
  }
  const PINS = {
    '#e4572e': HEX,
    'rgb(228, 87, 46)': HEX,
    'rgba(228,87,46,0.3)': {
      solid: 'rgba(228,87,46,0.3)',
      line: 'rgba(228,87,46,0.3)',
      bar: [
        'rgba(114,44,23,0.3)|0.3',
        'rgba(228,87,46,1)|1',
        'rgba(228,87,46,1)|1',
      ],
      area: [
        'rgba(228,87,46,0.3)|0.3',
        'rgba(242,171,151,0.5)|0.5',
        'rgba(242,171,151,0.5)|0.5',
      ],
      heatmap: HEX.heatmap,
      treemap: HEX.treemap,
    },
    tomato: {
      solid: 'tomato',
      line: 'tomato',
      bar: ['rgba(128,50,36,1)|1', 'tomato|1', 'tomato|1'],
      area: [
        'tomato|0.65',
        'rgba(255,177,163,0.5)|0.5',
        'rgba(255,177,163,0.5)|0.5',
      ],
      heatmap: [
        'rgba(255,239,237,1)',
        'rgba(255,177,163,1)',
        'rgba(255,115,89,1)',
      ],
      treemap: [
        'rgba(255,187,175,1)',
        'rgba(255,148,129,1)',
        'rgba(255,109,82,1)',
      ],
    },
    'hsl(14, 77%, 54%)': {
      solid: 'hsl(14, 77%, 54%)',
      line: 'hsl(14, 77%, 54%)',
      bar: [
        'rgba(114,45,24,1)|1',
        'hsl(14, 77%, 54%)|1',
        'hsl(14, 77%, 54%)|1',
      ],
      area: [
        'hsl(14, 77%, 54%)|0.65',
        'rgba(242,173,151,0.5)|0.5',
        'rgba(242,173,151,0.5)|0.5',
      ],
      heatmap: [
        'rgba(252,239,234,1)',
        'rgba(242,173,151,1)',
        'rgba(231,106,68,1)',
      ],
      treemap: [
        'rgba(243,183,164,1)',
        'rgba(236,142,112,1)',
        'rgba(230,100,60,1)',
      ],
    },
  }

  it.each(Object.keys(PINS))('%s', (color) => {
    const p = PINS[color]
    expect(solidFill(color)).toBe(p.solid)
    expect(lineStroke(color)).toBe(p.line)
    expect(barGradient(color)).toEqual(p.bar)
    expect(areaGradient(color)).toEqual(p.area)
    expect(cells('heatmap', color)).toEqual(p.heatmap)
    expect(cells('treemap', color)).toEqual(p.treemap)
  })

  it('8-digit hex keeps ignoring fill.opacity on a solid fill', () => {
    expect(solidFill('#e4572e80')).toBe('#e4572e80')
  })
})

describe('rgb() in the space, decimal and percentage syntax reads as hex does', () => {
  it.each([
    ['rgb(228 87 46)', '#e4572e'],
    ['rgb(100%, 0%, 0%)', '#ff0000'],
    ['rgb(100% 0% 0%)', '#ff0000'],
    ['rgb(228.4, 87, 46)', '#e4572e'],
  ])('%s paints as %s on every surface', (color, hex) => {
    expect(solidFill(color)).toBe(solidFill(hex))
    expect(lineStroke(color)).toBe(lineStroke(hex))
    expect(barGradient(color)).toEqual(barGradient(hex))
    expect(areaGradient(color)).toEqual(areaGradient(hex))
    // A decimal channel stays decimal through the shade maths, so the
    // shades agree within rounding.
    for (const type of ['heatmap', 'treemap']) {
      const a = cells(type, color).map(channels)
      const b = cells(type, hex).map(channels)
      a.forEach((ch, i) =>
        ch.forEach((v, k) =>
          expect(Math.abs(v - b[i][k])).toBeLessThanOrEqual(1),
        ),
      )
    }
  })

  it('rgba() with a slash alpha matches the comma form', () => {
    const slash = 'rgba(228 87 46 / 0.5)'
    const comma = 'rgba(228,87,46,0.5)'
    expect(barGradient(slash)).toEqual(barGradient(comma))
    expect(areaGradient(slash)).toEqual(areaGradient(comma))
    expect(barGradient(slash).join()).not.toMatch(/NaN/)
    // A solid rgba() is written as given, either syntax.
    expect(solidFill(slash)).toBe(slash)
  })

  it('rgb() with a slash alpha keeps its alpha, as rgba() does', () => {
    const rgbSlash = 'rgb(228 87 46 / 0.3)'
    const rgbaSlash = 'rgba(228 87 46 / 0.3)'
    // Written as given, so it paints at its own 0.3, not fill.opacity.
    expect(solidFill(rgbSlash)).toBe(rgbSlash)
    expect(barGradient(rgbSlash)).toEqual(barGradient(rgbaSlash))
    expect(areaGradient(rgbSlash)).toEqual(areaGradient(rgbaSlash))
    expect(areaGradient(rgbSlash)[0]).toBe('rgba(228,87,46,0.3)|0.3')
  })

  it('legacy comma rgb() with a fourth value still ignores it (v8.7.0)', () => {
    expect(solidFill('rgb(228,87,46,0.3)')).toBe('rgba(228,87,46,0.5)')
  })

  it('an uppercase RGBA() gradient keeps the configured stop opacity (v8.7.0)', () => {
    const grad = {
      type: 'gradient',
      gradient: { opacityFrom: 0.9, opacityTo: 0.2 },
    }
    expect(stops('RGBA(228,87,46,0.5)', { fill: grad })[0]).toBe(
      'rgba(114,44,23,0.9)|0.9',
    )
    const to = stops('#e4572e', {
      chart: { type: 'area' },
      fill: {
        ...grad,
        gradient: { ...grad.gradient, gradientToColors: ['RGBA(0,0,255,0.3)'] },
      },
    })
    expect(to.slice(1).map((x) => x.split('|')[1])).toEqual(['0.2', '0.2'])
  })
})

describe('modern colour functions are blended by the browser, never grey', () => {
  const MODERN = [
    'color(srgb 0.894 0.341 0.18)',
    'color(srgb-linear 0.7 0.1 0.03)',
    'color(a98-rgb 0.83 0.37 0.22)',
    'color-mix(in srgb, #e4572e 70%, #17bebb)',
    'rgb(from #e4572e r g b)',
  ]

  it.each(MODERN)('%s: solid fill and line stroke carry the opacity', (c) => {
    expect(solidFill(c)).toBe(`color-mix(in srgb, ${c} 50%, transparent)`)
    expect(lineStroke(c)).toBe(`color-mix(in srgb, ${c} 85%, transparent)`)
  })

  it.each(MODERN)(
    '%s: gradient stops are concrete and opacity-matched',
    (c) => {
      for (const s of [...barGradient(c), ...areaGradient(c)]) {
        const [color, opacity] = s.split('|')
        expect(color).not.toBe('')
        expect(color).not.toMatch(GREY)
        expect(Number.isFinite(+opacity)).toBe(true)
      }
      // The area's first stop holds the opacity twice, as a hex stop does
      // (rgba() colour and stop-opacity).
      expect(areaGradient(c)[0]).toBe(
        `color-mix(in srgb, ${c} 65%, transparent)|0.65`,
      )
    },
  )

  it.each([
    ...MODERN,
    'oklch(0.63 0.19 37)',
    'color(display-p3 0.83 0.37 0.22)',
  ])('%s: heatmap and treemap shades differ by value', (c) => {
    for (const type of ['heatmap', 'treemap']) {
      const f = cells(type, c)
      expect(f.length).toBe(3)
      expect(f.filter((x) => GREY.test(x))).toEqual([])
      expect(new Set(f).size).toBe(3)
    }
  })

  it('color(srgb ...) shades with the channel maths, the same as its hex', () => {
    // jsdom computes the colour to itself; parseSrgbColor reads it.
    expect(cells('heatmap', 'color(srgb 0.894 0.341 0.18)')).toEqual(
      cells('heatmap', '#e4572e'),
    )
  })

  it('a colour the maths cannot read shades through color-mix()', () => {
    expect(cells('heatmap', 'oklch(0.63 0.19 37)')).toEqual([
      'color-mix(in srgb, oklch(0.63 0.19 37) 10%, white)',
      'color-mix(in srgb, oklch(0.63 0.19 37) 50%, white)',
      'color-mix(in srgb, oklch(0.63 0.19 37) 90%, white)',
    ])
  })

  it('a cell shaded by 0 keeps a colour the maths cannot read', () => {
    // The top cell of a 0-based heatmap gets no shade; the colour comes back
    // as given and must not fall to the #999999 of an unreadable one.
    const c = createChartWithOptions({
      series: [
        { name: 's1', data: [0, 50, 100].map((y, i) => ({ x: 'c' + i, y })) },
      ],
      colors: ['oklch(0.63 0.19 37)'],
      chart: { type: 'heatmap', height: 200, width: 400 },
    })
    const f = q(c, '.apexcharts-heatmap-rect').map((e) =>
      e.getAttribute('fill'),
    )
    c.destroy()
    expect(f).toContain('oklch(0.63 0.19 37)')
    expect(f.filter((x) => GREY.test(x))).toEqual([])
  })

  it('a pattern fill strokes with the colour as given', () => {
    const c = chart('color(srgb 0.894 0.341 0.18)', {
      fill: { type: 'pattern' },
    })
    const strokes = q(c, 'pattern *')
      .map((e) => e.getAttribute('stroke'))
      .filter(Boolean)
    expect(strokes).toContain('color(srgb 0.894 0.341 0.18)')
    c.destroy()
  })
})

describe('a gradient that fades to opacity 0 keeps its hue', () => {
  // The stop at opacity 0 is hidden by its stop-opacity; its colour is what
  // the gradient fades through. 'transparent' is transparent black, which
  // made a fade-out area pass through grey. Hex keeps its channels at 0
  // (hexToRgba(hex, 0)), and so does a colour the hex maths cannot read.
  const fade = (color, gradient = {}) =>
    stops(color, {
      chart: { type: 'area' },
      fill: {
        type: 'gradient',
        gradient: {
          opacityFrom: 1,
          opacityTo: 0,
          shadeIntensity: 0,
          ...gradient,
        },
      },
    })

  it.each([
    'oklch(0.63 0.19 37)',
    'lab(55 50 50)',
    'color(display-p3 0.85 0.38 0.22)',
  ])('%s', (c) => {
    const s = fade(c)
    expect(s[0]).toBe(`${c}|1`)
    expect(s.slice(1)).toEqual([`${c}|0`, `${c}|0`])
  })

  it('a color(srgb ...) gradientToColors', () => {
    const to = 'color(srgb 0.0902 0.745 0.733)'
    const s = fade('#e4572e', { gradientToColors: [to] })
    expect(s.slice(1)).toEqual([`${to}|0`, `${to}|0`])
  })

  it('hex is unchanged', () => {
    expect(fade('#e4572e')).toEqual([
      'rgba(228,87,46,1)|1',
      'rgba(228,87,46,0)|0',
      'rgba(228,87,46,0)|0',
    ])
  })

  it('a stop between 0 and 1 still bakes its opacity in', () => {
    const c = 'oklch(0.63 0.19 37)'
    expect(fade(c, { opacityTo: 0.5 })[1]).toBe(
      `color-mix(in srgb, ${c} 50%, transparent)|0.5`,
    )
  })
})

describe('colour probes per mark', () => {
  // Whether a string is a colour is asked once per distinct string, not
  // once per heatmap cell or treemap tile of the same series colour.
  it('a treemap of an oklch() colour probes about once per tile, as hex does', () => {
    const n = 120
    const data = Array.from({ length: n }, (_, i) => ({ x: 't' + i, y: i + 1 }))
    const count = (color) => {
      const real = document.createElement.bind(document)
      let divs = 0
      document.createElement = (tag, o) => {
        if (String(tag).toLowerCase() === 'div') divs++
        return real(tag, o)
      }
      try {
        const c = createChartWithOptions({
          series: [{ name: 's1', data }],
          colors: [color],
          chart: { type: 'treemap', height: 300, width: 400 },
        })
        c.destroy()
      } finally {
        document.createElement = real
      }
      return divs
    }
    const hex = count('#e4572e')
    const oklch = count('oklch(0.63 0.19 37)')
    // Hex never probes per tile; oklch resolves each tile's shade (one div
    // each, as in v8.7.0) and asks isColor once.
    expect(oklch - hex).toBeLessThan(n * 1.2)
  })
})

describe('behaviour change: an rgba() nested in another function', () => {
  // Used to take the rgba branch on a substring match, so fill.opacity was
  // ignored and gradient stops were empty. Only a string that starts with
  // rgba( is an rgba() now; this one is blended with fill.opacity.
  it('takes fill.opacity like any modern colour', () => {
    const c = 'color-mix(in srgb, rgba(228,87,46,0.8) 70%, white)'
    expect(solidFill(c)).toBe(`color-mix(in srgb, ${c} 50%, transparent)`)
    expect(barGradient(c).join()).not.toMatch(/(^|,)\||NaN/)
  })
})

describe("'rgba (' keeps its v8.7.0 output", () => {
  // Outside this patch's scope, so pinned to v8.7.0 rather than changed in
  // passing: 'rgba (' (a space before the paren, invalid CSS) still counts
  // as an rgba() and keeps its own alpha over fill.opacity.
  it('the solid fill keeps the string and the gradient its alpha', () => {
    const c = 'rgba (23,190,187,0.7)'
    expect(solidFill(c)).toBe(c)
    expect(solidFill(c, { fill: { opacity: 1 } })).toBe(c)
    expect(barGradient(c)[0].split('|')[1]).toBe('0.7')
  })
})

describe('behaviour change: rgb() with leading whitespace', () => {
  // v8.7.0 read no leading space, so the fill fell to grey #999999 and
  // gradient stops to an empty stop-color. It now reads as the trimmed colour.
  it('fills and stops match the colour written without the space', () => {
    expect(solidFill(' rgb(228, 87, 46)')).toBe(solidFill('rgb(228, 87, 46)'))
    expect(barGradient(' rgb(228, 87, 46)')).toEqual(
      barGradient('rgb(228, 87, 46)'),
    )
  })
})
