import { describe, test, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/features/highlight-filter.js'
import '../../src/features/drilldown.js'

// Pie, donut and polarArea: each slice keeps its angle, faded, and its part
// is the same wedge cut to the part's share of the radius, solid in front,
// from the centre (pie, polarArea) or from the hole (donut). The parts come
// in highlightFilter.data, one per slice, or on the slices' own points.

afterEach(() => vi.restoreAllMocks())

const LABELS = ['North', 'South', 'East', 'West']
const VALUES = [40, 30, 20, 10]

function circle(type, extra = {}) {
  return createChartWithOptions({
    chart: { type, width: 420, height: 420, ...(extra.chart || {}) },
    series: extra.series || VALUES,
    labels: extra.labels || LABELS,
    dataLabels: { enabled: true, ...(extra.dataLabels || {}) },
    ...extra.options,
    highlightFilter: { data: [20, 15, 5, null], ...(extra.hf || {}) },
  })
}

const q = (chart, sel) => [...chart.w.dom.baseEl.querySelectorAll(sel)]
const wholes = (chart) => q(chart, '.apexcharts-pie-area')
const parts = (chart) => q(chart, '.apexcharts-pie-highlight-part')
const partOf = (chart, i) =>
  wholes(chart)[i].nextElementSibling?.classList.contains(
    'apexcharts-pie-highlight-part',
  )
    ? wholes(chart)[i].nextElementSibling
    : null
/** The outer radius of a slice path (its first arc). */
const outerR = (d) => parseFloat(/A\s*([-\d.e]+)/.exec(d)[1])
const labels = (chart) =>
  q(chart, '.apexcharts-pie-label').map((t) => ({
    slice: Number(t.parentNode.getAttribute('data:slice')),
    text: t.textContent,
    x: parseFloat(t.getAttribute('x')),
    y: parseFloat(t.getAttribute('y')),
    fill: t.getAttribute('fill'),
    filter: t.getAttribute('filter'),
  }))

describe('parse', () => {
  test('highlightFilter.data gives one part per slice', () => {
    const chart = circle('pie')
    expect(chart.highlightFilter.isActive()).toBe(true)
    expect(chart.w.highlightData.parts).toEqual([[20], [15], [5], [null]])
    // a slice is its own series and datum
    expect(chart.highlightFilter.valueAt(1)).toBe(15)
    expect(chart.highlightFilter.valueAt(1, 1)).toBe(15)
    expect(chart.highlightFilter.valueAt(3)).toBe(null)
  })

  test("a slice's own point wins over data, and points without y stay aligned", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = createChartWithOptions({
      chart: { type: 'donut', width: 400, height: 400 },
      series: [
        {
          data: [
            { x: 'A', y: 40, highlight: 12 },
            { x: 'skipped' },
            { x: 'B', y: 30 },
            { x: 'C', y: 20, highlight: 7 },
          ],
        },
      ],
      highlightFilter: { data: [1, 2, 3] },
    })
    expect(chart.w.seriesData.series).toEqual([40, 30, 20])
    expect(chart.w.highlightData.parts).toEqual([[12], [2], [7]])
    warn.mockRestore()
  })

  test('non-finite values read as null; a hidden slice reads 0', async () => {
    const chart = circle('pie', { hf: { data: [20, NaN, Infinity, 4] } })
    expect(chart.w.highlightData.parts).toEqual([[20], [null], [null], [4]])
    chart.toggleSeries('North')
    expect(chart.w.highlightData.parts[0]).toEqual([0])
  })

  test('a data array of another length is ignored, once, and draws plain', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = circle('pie', { hf: { data: [1, 2] } })
    expect(chart.highlightFilter.isActive()).toBe(false)
    expect(parts(chart).length).toBe(0)
    for (const w of wholes(chart)) {
      expect(w.getAttribute('fill-opacity')).toBe('1')
    }
    chart.updateOptions({ title: { text: 'again' } })
    const said = warn.mock.calls.filter((c) => /ignored until/.test(c[0]))
    expect(said.length).toBe(1)
  })
})

describe('drawing', () => {
  test('every whole fades and keeps its angle; parts follow their wholes', () => {
    const chart = circle('pie')
    for (const w of wholes(chart)) {
      expect(w.getAttribute('fill-opacity')).toBe('0.2')
    }
    // three non-null parts, each right after its whole in the slice's group
    expect(parts(chart).length).toBe(3)
    for (let i = 0; i < 3; i++) expect(partOf(chart, i)).not.toBe(null)
    expect(partOf(chart, 3)).toBe(null)
  })

  test('a faded slice keeps its stroke width and takes its colour as the outline', () => {
    const plain = circle('pie', { hf: { enabled: false } })
    const chart = circle('pie')
    wholes(chart).forEach((w, i) => {
      expect(w.getAttribute('stroke-width')).toBe(
        wholes(plain)[i].getAttribute('stroke-width'),
      )
      expect(w.getAttribute('stroke')).toBe(chart.w.globals.colors[i])
    })
    // the parts keep the slice's own separators
    for (const p of parts(chart)) expect(p.getAttribute('stroke')).toBe('#fff')
  })

  test('the DOM contract: no hit, capture or tooltip markers on a part', () => {
    const chart = circle('donut')
    for (const p of parts(chart)) {
      expect(p.classList.contains('apexcharts-highlight-part')).toBe(true)
      expect(p.getAttribute('pointer-events')).toBe('none')
      expect(p.getAttribute('data:hl-share')).not.toBe(null)
      for (const a of ['j', 'index', 'data:cx', 'pathTo', 'rel']) {
        expect(p.getAttribute(a)).toBe(null)
      }
      expect(p.classList.contains('apexcharts-pie-area')).toBe(false)
    }
    expect(parseFloat(parts(chart)[0].getAttribute('data:hl-share'))).toBe(0.5)
    // the next update starts from records keyed by slice
    chart.w.highlightData.capture()
    expect([...chart.w.globals.prevHighlightParts.keys()]).toEqual([
      'p:0',
      'p:1',
      'p:2',
      'p:3',
    ])
  })

  test.each(['pie', 'donut', 'polarArea'])(
    '%s: a part equal to its whole is the whole, path for path',
    (type) => {
      const chart = circle(type, { hf: { data: VALUES } })
      wholes(chart).forEach((w, i) => {
        expect(partOf(chart, i).getAttribute('d')).toBe(w.getAttribute('d'))
      })
    },
  )

  test.each([
    ['pie', { spacing: 4, borderRadius: 6 }],
    ['donut', { spacing: 4, borderRadius: 6 }],
    ['polarArea', { spacing: 3 }],
    ['donut', { startAngle: -90, endAngle: 90 }],
  ])(
    '%s %o: spacing, corners and a half circle keep the parity',
    (type, pie) => {
      const chart = circle(type, {
        hf: { data: VALUES },
        options: { plotOptions: { pie } },
      })
      wholes(chart).forEach((w, i) => {
        expect(partOf(chart, i).getAttribute('d')).toBe(w.getAttribute('d'))
      })
    },
  )

  test('pie and donut: the share sets the radius, linear or by area', () => {
    const R = (c) => c.w.globals.radialSize
    const pie = circle('pie', { hf: { data: [10, 15, 5, 5] } })
    expect(outerR(partOf(pie, 0).getAttribute('d'))).toBeCloseTo(
      R(pie) * 0.25,
      6,
    )
    expect(outerR(partOf(pie, 1).getAttribute('d'))).toBeCloseTo(
      R(pie) * 0.5,
      6,
    )
    const pieArea = circle('pie', {
      hf: { data: [10, 15, 5, 5], pie: { encoding: 'area' } },
    })
    expect(outerR(partOf(pieArea, 0).getAttribute('d'))).toBeCloseTo(
      R(pieArea) * 0.5,
      6,
    )
    const donut = circle('donut', { hf: { data: [10, 15, 5, 5] } })
    const d = donut.w.globals.radialSize * 0.65
    expect(outerR(partOf(donut, 0).getAttribute('d'))).toBeCloseTo(
      d + (R(donut) - d) * 0.25,
      6,
    )
    const donutArea = circle('donut', {
      hf: { data: [10, 15, 5, 5], pie: { encoding: 'area' } },
    })
    const da = donutArea.w.globals.radialSize * 0.65
    const r2 = R(donutArea) ** 2
    expect(outerR(partOf(donutArea, 1).getAttribute('d'))).toBeCloseTo(
      Math.sqrt(da * da + 0.5 * (r2 - da * da)),
      6,
    )
  })

  test('polarArea: a part is its whole radius times the share, whatever the encoding', () => {
    const chart = circle('polarArea', {
      hf: { data: [10, 15, 5, 5], pie: { encoding: 'area' } },
    })
    const sizes = wholes(chart).map((w) => outerR(w.getAttribute('d')))
    expect(outerR(partOf(chart, 0).getAttribute('d'))).toBeCloseTo(
      sizes[0] * 0.25,
      6,
    )
    expect(outerR(partOf(chart, 3).getAttribute('d'))).toBeCloseTo(
      sizes[3] * 0.5,
      6,
    )
  })

  test('nothing solid where there is nothing to share', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // a part of the other sign, a 0 part, a part on a 0 whole
    const pie = circle('pie', {
      series: [40, 30, 0, 10],
      hf: { data: [-5, 0, 4, 5] },
    })
    expect(partOf(pie, 0)).toBe(null)
    expect(partOf(pie, 1)).toBe(null)
    expect(partOf(pie, 2)).toBe(null)
    expect(partOf(pie, 3)).not.toBe(null)
    const polar = circle('polarArea', { hf: { data: [-5, 15, 5, 5] } })
    expect(partOf(polar, 0)).toBe(null)
    warn.mockRestore()
  })

  test('pie: a part past its whole is capped at the rim, marked, and traced', () => {
    const chart = circle('pie', { hf: { data: [60, 15, 5, 5] } })
    const p = partOf(chart, 0)
    expect(p.getAttribute('d')).toBe(wholes(chart)[0].getAttribute('d'))
    expect(p.classList.contains('apexcharts-highlight-overflow')).toBe(true)
    const edge = p.nextElementSibling
    expect(edge.classList.contains('apexcharts-highlight-edge')).toBe(true)
    expect(edge.getAttribute('stroke-width')).toBe('1')
    expect(outerR(edge.getAttribute('d'))).toBeCloseTo(
      chart.w.globals.radialSize - 2,
      6,
    )
    // the label and the share state the true value
    expect(p.getAttribute('data:hl-share')).toBe('1.5')
    expect(labels(chart)[0].text).toBe('60.0%')
  })

  test('polarArea: a part above every whole widens the scale; a held one caps it', () => {
    const plain = circle('polarArea', { hf: { enabled: false } })
    const chart = circle('polarArea', { hf: { data: [80, 15, 5, 5] } })
    const ringLabels = (c) =>
      q(c, '.apexcharts-yaxis-label, .apexcharts-pie text.apexcharts-text')
        .map((t) => t.textContent)
        .filter((t) => /^\d+(\.\d+)?$/.test(t))
    expect(ringLabels(chart)).not.toEqual(ringLabels(plain))
    // every whole shrinks with the wider scale, and the part goes past its
    // whole, marked and traced
    const r0 = outerR(wholes(plain)[0].getAttribute('d'))
    const r1 = outerR(wholes(chart)[0].getAttribute('d'))
    expect(r1).toBeLessThan(r0)
    const p = partOf(chart, 0)
    expect(outerR(p.getAttribute('d'))).toBeCloseTo(r1 * 2, 6)
    expect(p.classList.contains('apexcharts-highlight-overflow')).toBe(true)
    expect(outerR(p.nextElementSibling.getAttribute('d'))).toBeCloseTo(r1, 6)
    // those pixels stand in for the whole under the pointer
    expect(p.getAttribute('pointer-events')).toBe(null)

    for (const held of [
      { hf: { data: [80, 15, 5, 5], axis: 'clamp' } },
      { hf: { data: [80, 15, 5, 5] }, options: { yaxis: { max: 40 } } },
    ]) {
      const c = circle('polarArea', held)
      expect(outerR(wholes(c)[0].getAttribute('d'))).toBeCloseTo(
        c.w.globals.radialSize,
        6,
      )
      expect(outerR(partOf(c, 0).getAttribute('d'))).toBeCloseTo(
        c.w.globals.radialSize,
        6,
      )
    }
  })

  test('the hover band of a slice whose part reaches past it goes round the part', () => {
    const chart = circle('polarArea', { hf: { data: [80, 15, 5, 5] } })
    const pie = chart.ctx.pie
    const r = outerR(partOf(chart, 0).getAttribute('d'))
    pie.w.dom.Paper = chart.w.dom.Paper
    const band = pie.getHoverOutlinePath(0)
    const plainBand = pie.getHoverOutlinePath(1)
    expect(band).not.toBe(null)
    // the band's inner radius sits outside the part
    const inner = Math.min(
      ...band.match(/A\s*([-\d.e]+)/g).map((a) => parseFloat(a.slice(1))),
    )
    expect(inner).toBeGreaterThan(r)
    expect(plainBand).not.toBe(null)
  })
})

describe('labels', () => {
  test("a slice's label states its part's share of the circle, at the part", () => {
    const seen = []
    const chart = circle('pie', {
      dataLabels: {
        formatter: (v, o) => {
          seen.push(o.highlight)
          return v.toFixed(1) + '%'
        },
      },
    })
    const ls = labels(chart)
    // no label where there is no part
    expect(ls.map((l) => l.slice)).toEqual([0, 1, 2])
    expect(ls.map((l) => l.text)).toEqual(['20.0%', '15.0%', '5.0%'])
    // (the renderer formats the whole's labels first, with no highlight)
    expect(seen.filter(Boolean)[0]).toEqual({
      value: 20,
      total: 40,
      share: 0.5,
      overflow: false,
    })
    // on the renderer's label ring at the part's radius
    const pie = chart.ctx.pie
    const w0 = wholes(chart)[0]
    const mid =
      Number(w0.getAttribute('data:startAngle')) +
      Number(w0.getAttribute('data:angle')) / 2
    const r = outerR(partOf(chart, 0).getAttribute('d')) / 1.25
    const rad = ((mid - 90) * Math.PI) / 180
    expect(ls[0].x).toBeCloseTo(pie.centerX + r * Math.cos(rad), 6)
    expect(ls[0].y).toBeCloseTo(pie.centerY + r * Math.sin(rad), 6)
  })

  test('at a share of 1 the label sits where its whole put it', () => {
    const plain = circle('donut', { hf: { enabled: false } })
    const chart = circle('donut', { hf: { data: VALUES } })
    labels(chart).forEach((l, i) => {
      expect(l.x).toBeCloseTo(labels(plain)[i].x, 6)
      expect(l.y).toBeCloseTo(labels(plain)[i].y, 6)
    })
  })

  test('a part too thin for its text keeps the label where its whole put it', () => {
    const plain = circle('pie', { hf: { enabled: false } })
    const chart = circle('pie', { hf: { data: [1, 15, 5, 5] } })
    expect(labels(chart)[0].x).toBe(labels(plain)[0].x)
    expect(labels(chart)[0].y).toBe(labels(plain)[0].y)
    // it sits on the faded tint, so it takes the chart's text colour
    expect(labels(chart)[0].fill).toBe(chart.w.config.chart.foreColor)
    expect(labels(chart)[0].filter).toBe(null)
  })

  test("dataLabels.value 'whole' keeps the whole's labels, in a colour that reads", () => {
    const plain = circle('pie', { hf: { enabled: false } })
    const chart = circle('pie', { hf: { dataLabels: { value: 'whole' } } })
    const at = (c) =>
      labels(c).map(({ slice, text, x, y }) => [slice, text, x, y])
    expect(at(chart)).toEqual(at(plain))
    // the last slice has no part, so its label sits on the faded tint
    expect(labels(chart)[3].fill).toBe(chart.w.config.chart.foreColor)
  })
})

describe('outer name labels', () => {
  test('stay on the rim where the slices put them', () => {
    const ext = {
      options: {
        plotOptions: { pie: { dataLabels: { external: { show: true } } } },
      },
    }
    const plain = circle('pie', { ...ext, hf: { enabled: false } })
    const chart = circle('pie', ext)
    const names = (c) =>
      q(c, '.apexcharts-pie-name-label-group').map((n) =>
        n.outerHTML.replace(/SvgjsFilter\d+/g, 'F'),
      )
    expect(names(plain).length).toBeGreaterThan(0)
    expect(names(chart)).toEqual(names(plain))
  })
})

describe('centre', () => {
  const donut = (hf = {}, labelsCfg = {}) =>
    circle('donut', {
      hf,
      options: {
        plotOptions: {
          pie: {
            donut: {
              labels: { show: true, total: { show: true }, ...labelsCfg },
            },
          },
        },
      },
    })
  const centre = (chart) =>
    chart.w.dom.baseEl.querySelector('.apexcharts-datalabel-value').textContent

  test('the total states the parts, or the wholes', () => {
    expect(centre(donut())).toBe('40')
    expect(centre(donut({ dataLabels: { total: 'whole' } }))).toBe('100')
  })

  test('a total formatter adds up the parts, is told the highlight, and the totals come back', () => {
    const seen = []
    const chart = donut(
      {},
      {
        total: {
          show: true,
          formatter: (w, o) => {
            seen.push(o?.highlight)
            return 'T' + w.globals.seriesTotals.reduce((a, b) => a + b, 0)
          },
        },
      },
    )
    expect(centre(chart)).toBe('T40')
    expect(seen[0]).toEqual({
      value: 40,
      total: 100,
      share: 0.4,
      overflow: false,
    })
    expect(chart.w.globals.seriesTotals).toEqual(VALUES)
  })

  test('hovering a slice shows its part; leaving it shows the part total again', () => {
    const seen = []
    const chart = donut(
      {},
      {
        value: {
          show: true,
          formatter: (v, w, o) => {
            seen.push(o?.highlight)
            return 'v' + v
          },
        },
      },
    )
    const w1 = wholes(chart)[1]
    w1.dispatchEvent(new MouseEvent('mouseenter'))
    expect(centre(chart)).toBe('v15')
    expect(seen.at(-1)).toEqual({
      value: 15,
      total: 30,
      share: 0.5,
      overflow: false,
    })
    w1.dispatchEvent(new MouseEvent('mouseleave'))
    expect(centre(chart)).toBe('40')
  })

  test('a one-slice donut states its part in the centre', () => {
    const chart = createChartWithOptions({
      chart: { type: 'donut', width: 400, height: 400 },
      series: [70],
      labels: ['Only'],
      plotOptions: { pie: { donut: { labels: { show: true } } } },
      highlightFilter: { data: [25] },
    })
    expect(centre(chart)).toBe('25')
  })
})

describe('tooltip', () => {
  const ttRow = (whole) => {
    const marker = document.createElement('span')
    marker.appendChild(
      document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
    )
    const yValue = document.createElement('span')
    yValue.innerHTML = whole
    return { marker, yValue }
  }

  test('a slice row reads part / whole, with the formatter opts core gives a pie', () => {
    const chart = circle('pie', { hf: { tooltip: { share: true } } })
    const seen = []
    const f = {
      yLbFormatter: (v, o) => {
        seen.push(o)
        return String(v)
      },
    }
    const r = ttRow('30')
    chart.highlightFilter.tooltipRow(r, 1, null, f)
    expect(r.yValue.textContent).toBe('15 / 30 · 50%')
    expect(seen[0].seriesIndex).toBe(1)
    expect(seen[0].dataPointIndex).toBe(1)
    expect(seen[0].globals).toBe(chart.w.globals)
    expect(seen[0].highlight).toEqual({
      value: 15,
      total: 30,
      share: 0.5,
      overflow: false,
    })
    // a pie fills its rows with the slice colour, so no two-tone marker
    expect(r.marker.style.background).toBe('')
    // a slice with no part shows its whole alone, muted
    const n = ttRow('10')
    chart.highlightFilter.tooltipRow(n, 3, null, f)
    expect(n.yValue.textContent).toBe('10')
    expect(n.yValue.querySelector('.apexcharts-highlight-total')).not.toBe(null)
  })
})

describe('set, clear, drilldown', () => {
  test('set() and clear() send the parts in highlightFilter.data', async () => {
    const chart = circle('donut', { hf: { data: null } })
    expect(chart.highlightFilter.isActive()).toBe(false)
    const spy = vi.spyOn(chart, 'updateOptions')
    await chart.highlightFilter.set([4, 3, 2, 1])
    expect(spy.mock.calls[0][0]).toEqual({
      highlightFilter: { data: [4, 3, 2, 1] },
    })
    expect(chart.highlightFilter.valueAt(2)).toBe(2)
    const seen = []
    await chart.highlightFilter.set((c) => {
      seen.push([c.seriesIndex, c.dataPointIndex, c.seriesName, c.value])
      return c.value / 2
    })
    expect(seen).toEqual([
      [0, 0, 'North', 40],
      [1, 1, 'South', 30],
      [2, 2, 'East', 20],
      [3, 3, 'West', 10],
    ])
    expect(chart.w.highlightData.parts).toEqual([[20], [15], [10], [5]])
    await chart.highlightFilter.clear()
    expect(chart.highlightFilter.isActive()).toBe(false)
    expect(parts(chart).length).toBe(0)
    for (const w of wholes(chart)) {
      expect(w.getAttribute('fill-opacity')).toBe('1')
    }
  })

  test('clear() takes the parts off the slices’ own points', async () => {
    const series = [
      {
        data: [
          { x: 'A', y: 40, highlight: 12 },
          { x: 'B', y: 30, highlight: 3 },
        ],
      },
    ]
    const chart = createChartWithOptions({
      chart: { type: 'pie', width: 400, height: 400 },
      series,
    })
    expect(chart.highlightFilter.isActive()).toBe(true)
    await chart.highlightFilter.clear()
    expect(chart.highlightFilter.isActive()).toBe(false)
    expect(chart.w.config.series[0].data).toEqual([
      { x: 'A', y: 40 },
      { x: 'B', y: 30 },
    ])
    // the page's own objects are left as they were
    expect(series[0].data[0].highlight).toBe(12)
  })

  test('drilling into a level with as many slices drops the pick, with one clear', async () => {
    const seen = []
    const chart = createChartWithOptions({
      chart: {
        type: 'pie',
        width: 400,
        height: 400,
        events: { highlightFilterChanged: (c, o) => seen.push(o.phase) },
      },
      series: [
        {
          data: [
            { x: 'A', y: 40, drilldown: 'a' },
            { x: 'B', y: 30 },
          ],
        },
      ],
      drilldown: {
        enabled: true,
        series: [
          {
            id: 'a',
            name: 'A',
            data: [
              { x: 'A1', y: 25 },
              { x: 'A2', y: 15 },
            ],
          },
        ],
      },
    })
    await chart.highlightFilter.set([10, 20])
    expect(chart.highlightFilter.isActive()).toBe(true)
    await chart.drillDown('a')
    expect(chart.w.seriesData.seriesNames).toEqual(['A1', 'A2'])
    expect(chart.w.config.highlightFilter.data).toBe(null)
    expect(chart.highlightFilter.isActive()).toBe(false)
    expect(parts(chart).length).toBe(0)
    expect(seen).toEqual(['enter', 'clear'])
  })

  test('a pick re-sent at a level of other size, then back up: dropped each way, one clear each, no warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const seen = []
    const chart = createChartWithOptions({
      chart: {
        type: 'donut',
        width: 400,
        height: 400,
        events: { highlightFilterChanged: (c, o) => seen.push(o.phase) },
      },
      series: [
        {
          data: [
            { x: 'A', y: 40, drilldown: 'a' },
            { x: 'B', y: 30 },
          ],
        },
      ],
      highlightFilter: { data: [10, 20] },
      drilldown: {
        enabled: true,
        series: [
          {
            id: 'a',
            name: 'A',
            data: [
              { x: 'A1', y: 25 },
              { x: 'A2', y: 10 },
              { x: 'A3', y: 5 },
            ],
          },
        ],
      },
    })
    // the mount reports the pick it was given
    await new Promise((r) => setTimeout(r, 0))
    expect(seen).toEqual(['enter'])
    await chart.drillDown('a')
    expect(chart.w.seriesData.seriesNames).toEqual(['A1', 'A2', 'A3'])
    expect(chart.w.config.highlightFilter.data).toBe(null)
    expect(parts(chart).length).toBe(0)
    expect(seen).toEqual(['enter', 'clear'])
    // The page re-sends the pick for the level on screen.
    await chart.highlightFilter.set([5, null, 5])
    expect(parts(chart).length).toBe(2)
    expect(chart.w.seriesData.seriesNames).toEqual(['A1', 'A2', 'A3'])
    await chart.drillUp()
    expect(chart.w.seriesData.seriesNames).toEqual(['A', 'B'])
    expect(chart.w.config.highlightFilter.data).toBe(null)
    expect(chart.highlightFilter.isActive()).toBe(false)
    expect(parts(chart).length).toBe(0)
    expect(seen).toEqual(['enter', 'clear', 'enter', 'clear'])
    expect(
      warn.mock.calls.filter((c) => /highlightFilter/.test(String(c[0]))),
    ).toEqual([])
  })
})

describe('the renderer it hangs off', () => {
  test("a slice's movers take its part and edge along", () => {
    const chart = circle('pie', { hf: { data: [60, 15, 5, 5] } })
    const movers = chart.ctx.pie.getSliceMovers(0)
    expect(movers).toContain(partOf(chart, 0))
    expect(movers).toContain(partOf(chart, 0).nextElementSibling)
    chart.ctx.pie.offsetSlice(0, 10, false)
    const t = wholes(chart)[0].getAttribute('transform')
    expect(partOf(chart, 0).getAttribute('transform')).toBe(t)
    expect(partOf(chart, 0).nextElementSibling.getAttribute('transform')).toBe(
      t,
    )
  })

  test('the wrapped methods exist on the renderer, and a plain render wraps nothing', () => {
    const plain = circle('pie', { hf: { data: null } })
    const own = Object.keys(plain.ctx.pie)
    for (const m of [
      'animatePaths',
      'drawArcs',
      'getSliceMovers',
      'getHoverOutlinePath',
      'renderInnerDataLabels',
      'printInnerLabels',
    ]) {
      expect(typeof plain.ctx.pie[m]).toBe('function')
      expect(own).not.toContain(m)
    }
    const picked = circle('pie')
    expect(Object.keys(picked.ctx.pie)).toContain('drawArcs')
  })

  test('a cross-type morph out of a circle takes the slices, never a part', () => {
    for (const type of ['donut', 'polarArea']) {
      const chart = circle(type)
      const { marks } = chart.ctx.morphTypeChange._captureFromDOM(type)
      expect(marks.map((m) => m.d)).toEqual(
        wholes(chart).map((n) => n.getAttribute('d')),
      )
      const own = parts(chart).map((n) => n.getAttribute('d'))
      expect(own.length).toBe(3)
      expect(marks.some((m) => own.includes(m.d))).toBe(false)
    }
  })

  test("a part takes its whole's filter however the selection changes", async () => {
    for (const [type, options] of [
      ['polarArea', {}],
      ['pie', { plotOptions: { pie: { expandOnClick: false } } }],
    ]) {
      const chart = circle(type, { options })
      const filters = () =>
        wholes(chart)
          .map((n, i) => [n, partOf(chart, i)])
          .filter(([, p]) => p)
          .map(([n, p]) => [n.getAttribute('filter'), p.getAttribute('filter')])
      // No pointer event on any slice: the filters change the way the API,
      // the keyboard and another slice's click change them (the real paths
      // run in the interaction suite; jsdom cannot find a slice by index).
      const ws = wholes(chart)
      ws[0].setAttribute('filter', 'url(#a)')
      ws[1].setAttribute('filter', 'url(#b)')
      await new Promise((r) => setTimeout(r, 0))
      expect(filters().map(([, p]) => p)).toEqual(['url(#a)', 'url(#b)', null])
      ws[0].removeAttribute('filter')
      ws[1].removeAttribute('filter')
      ws[2].setAttribute('filter', 'url(#c)')
      await new Promise((r) => setTimeout(r, 0))
      expect(filters()).toEqual([
        [null, null],
        [null, null],
        ['url(#c)', 'url(#c)'],
      ])
    }
  })

  test('a clear without animation leaves the plain chart behind', async () => {
    const plain = circle('donut', { hf: { data: null } })
    const chart = circle('donut', { hf: { data: [60, 15, 5, 5] } })
    await chart.highlightFilter.clear()
    const strip = (c) =>
      c.w.dom.baseEl
        .querySelector('.apexcharts-pie')
        .outerHTML.replace(/SvgjsFilter\d+/g, 'F')
        .replace(/apexcharts\w*?\d{3,}/g, 'ID')
    expect(strip(chart)).toBe(strip(plain))
  })
})
