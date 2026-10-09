import { describe, test, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Utils from '../../src/utils/Utils'
import '../../src/features/highlight-filter.js'
import '../../src/features/morph.js'

// radialBar and the gauge: a solid arc in front of the faded ring, from the
// same start ('arc'), a ring's band split in two lanes, the whole light
// outside and the part solid inside ('lanes', opt-in), or a second needle at
// the part with the ring left as it is ('needle', the first ring only).
// Unset, every ring gets the arc, except on a gauge that draws its own
// needle, which gets a second needle (and fades its own). The parts come in
// highlightFilter.data, one per ring, or on the rings' own points.

afterEach(() => vi.restoreAllMocks())

function radial(extra = {}) {
  return createChartWithOptions({
    series: extra.series || [70],
    labels: extra.labels,
    ...extra.options,
    chart: {
      type: 'radialBar',
      width: 400,
      height: 400,
      ...(extra.chart || {}),
    },
    plotOptions: { radialBar: extra.rb || {} },
    highlightFilter: { data: [40], ...(extra.hf || {}) },
  })
}

const baseRadial = radial
const q = (chart, sel) => [...chart.w.dom.baseEl.querySelectorAll(sel)]
const wholes = (chart) =>
  q(chart, '.apexcharts-radial-series .apexcharts-radialbar-area')
const parts = (chart) => q(chart, '.apexcharts-radialbar-highlight-part')
const partOf = (chart, i) => {
  const n = wholes(chart).find((w) => w.getAttribute('j') === String(i))
  const next = n?.nextElementSibling
  return next?.classList.contains('apexcharts-radialbar-highlight-part')
    ? next
    : null
}
const needle = (chart) =>
  chart.w.dom.baseEl.querySelector('.apexcharts-gauge-needle-highlight')
const rotation = (g) =>
  parseFloat(/rotate\(([-\d.e]+)\)/.exec(g.getAttribute('transform'))[1])

describe('parse', () => {
  test('highlightFilter.data gives one part per ring, on radialBar and the gauge', () => {
    for (const type of ['radialBar', 'gauge']) {
      const chart = radial({
        chart: { type },
        series: [70, 50],
        hf: { data: [40, null] },
      })
      expect(chart.highlightFilter.isActive()).toBe(true)
      expect(chart.w.highlightData.parts).toEqual([[40], [null]])
      expect(chart.highlightFilter.valueAt(0)).toBe(40)
      expect(chart.highlightFilter.valueAt(1)).toBe(null)
    }
  })

  test('a wrong length warns once and draws plain; non-finite reads null', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = radial({ series: [70, 50], hf: { data: [1] } })
    expect(chart.highlightFilter.isActive()).toBe(false)
    expect(parts(chart).length).toBe(0)
    expect(needle(chart)).toBe(null)
    for (const w of wholes(chart)) {
      expect(w.getAttribute('stroke-opacity')).toBe('1')
    }
    expect(
      warn.mock.calls.filter((c) => /ignored until/.test(c[0])).length,
    ).toBe(1)
    const odd = radial({ series: [70, 50], hf: { data: [NaN, Infinity] } })
    expect(odd.w.highlightData.parts).toEqual([[null], [null]])
  })

  test("a ring's own point wins; enabled false keeps the parts and draws plain", () => {
    const chart = createChartWithOptions({
      chart: { type: 'radialBar', width: 400, height: 400 },
      series: [
        {
          data: [
            { x: 'A', y: 70, highlight: 30 },
            { x: 'B', y: 50 },
          ],
        },
      ],
      highlightFilter: { data: [1, 2] },
    })
    expect(chart.w.highlightData.parts).toEqual([[30], [2]])
    const off = radial({ hf: { enabled: false } })
    expect(off.highlightFilter.isActive()).toBe(false)
    expect(needle(off)).toBe(null)
  })

  test('the series the page handed in are never written', () => {
    const series = [70, 50]
    const data = [40, 60]
    radial({ series, hf: { data } })
    expect(series).toEqual([70, 50])
    expect(data).toEqual([40, 60])
  })
})

describe('indicators', () => {
  test('one ring: a needle at the part, the ring left as it is', async () => {
    const chart = radial({
      hf: { data: [40], radialBar: { indicator: 'needle' } },
    })
    expect(parts(chart).length).toBe(0)
    expect(wholes(chart)[0].getAttribute('stroke-opacity')).toBe('1')
    const g = needle(chart)
    expect(g).not.toBe(null)
    // the pointer on it is on the ring (see 'the pointer on a needle')
    expect(g.getAttribute('pointer-events')).toBe(null)
    expect(wholes(chart)[0]._apxHits.has(g)).toBe(true)
    // in the arcs group, over the hollow and under the centre labels (a
    // hollow in front joins once the rings are drawn)
    await Promise.resolve()
    expect(g.parentNode.querySelector('.apexcharts-radial-series')).not.toBe(
      null,
    )
    expect(
      g.previousElementSibling.classList.contains(
        'apexcharts-radialbar-hollow',
      ),
    ).toBe(true)
    expect(
      g.nextElementSibling.classList.contains('apexcharts-datalabels-group'),
    ).toBe(true)
    // 40 of 0..100 round a full circle (which ends at 359.99)
    expect(rotation(g)).toBeCloseTo(0.4 * 359.99, 5)
    const shape = g.querySelector('.apexcharts-gauge-needle-highlight-shape')
    expect(shape.classList.contains('apexcharts-highlight-part')).toBe(true)
    expect(shape.getAttribute('fill')).toBe(chart.w.globals.colors[0])
  })

  test('unset, every ring shares its track (single or several), a needle gauge gets a needle', () => {
    // a gauge on the arc shape, a plain progress ring: the shared track,
    // the whole faded and the part solid in front of it, never lanes
    for (const extra of [
      { chart: { type: 'gauge' } },
      { labels: ['Progress'] },
    ]) {
      const chart = radial(extra)
      expect(needle(chart)).toBe(null)
      expect(q(chart, '.apexcharts-radialbar-highlight-lane').length).toBe(0)
      expect(parts(chart).length).toBe(1)
      expect(partOf(chart, 0)).not.toBe(null)
      expect(wholes(chart)[0].getAttribute('stroke-opacity')).toBe('0.2')
    }
    // several rings: the whole faded on its track, the part solid on it
    for (const extra of [
      { chart: { type: 'gauge' }, series: [70, 50], hf: { data: [40, 20] } },
      { series: [70, 50], hf: { data: [40, 20] } },
    ]) {
      const chart = radial(extra)
      const n = chart.w.seriesData.series.length
      expect(needle(chart)).toBe(null)
      expect(q(chart, '.apexcharts-radialbar-highlight-lane').length).toBe(0)
      expect(parts(chart).length).toBe(n)
      for (const w of wholes(chart)) {
        expect(w.getAttribute('stroke-opacity')).toBe('0.2')
      }
    }
    // the needle shape: a second needle, with or without the value arc, on
    // radialBar and the gauge alike
    for (const extra of [
      { chart: { type: 'gauge' }, rb: { shape: 'needle' } },
      { rb: { shape: 'needle', needle: { showValueArc: true } } },
    ]) {
      const shaped = radial(extra)
      expect(needle(shaped)).not.toBe(null)
      expect(parts(shaped).length).toBe(0)
    }
    // with several rings the first takes the needle, the others arcs (D18)
    const two = radial({
      chart: { type: 'gauge' },
      series: [70, 50],
      rb: { shape: 'needle', needle: { showValueArc: true } },
      hf: { data: [40, 20] },
    })
    expect(needle(two)).not.toBe(null)
    expect(partOf(two, 0)).toBe(null)
    expect(partOf(two, 1)).not.toBe(null)
  })

  test.each([
    ['front', '#ffffff'],
    ['back', '#e8eef5'],
  ])(
    'a filled hollow in the %s never covers the needle; the labels stay over it',
    async (position, background) => {
      for (const extra of [
        {
          chart: { type: 'gauge' },
          hf: { radialBar: { indicator: 'needle' } },
        },
        {
          series: [70, 50],
          hf: { data: [40, 20], radialBar: { indicator: 'needle' } },
        },
      ]) {
        const chart = radial({
          ...extra,
          rb: { hollow: { position, background } },
        })
        await Promise.resolve()
        const g = needle(chart)
        const kids = [...g.parentNode.children]
        const at = (cls) => kids.findIndex((n) => n.classList.contains(cls))
        const me = kids.indexOf(g)
        expect(me).toBe(at('apexcharts-radialbar-hollow') + 1)
        expect(me).toBeLessThan(at('apexcharts-datalabels-group'))
      }
    },
  )

  test('a needle past the gauge max is pinned to the end and marked', () => {
    const dial = { type: 'gauge' }
    const rb = { shape: 'needle' }
    const chart = radial({ chart: dial, rb, hf: { data: [130] } })
    const g = needle(chart)
    expect(g.classList.contains('apexcharts-highlight-overflow')).toBe(true)
    expect(rotation(g)).toBeCloseTo(
      chart.w.config.plotOptions.radialBar.endAngle,
      5,
    )
    const atMax = needle(radial({ chart: dial, rb, hf: { data: [100] } }))
    expect(atMax.classList.contains('apexcharts-highlight-overflow')).toBe(
      false,
    )
  })

  test('several rings: each part an arc on its faded ring', () => {
    const chart = radial({ series: [70, 50, 30], hf: { data: [40, 20, null] } })
    expect(needle(chart)).toBe(null)
    for (const w of wholes(chart)) {
      expect(w.getAttribute('stroke-opacity')).toBe('0.2')
    }
    expect(parts(chart).length).toBe(2)
    for (const i of [0, 1]) {
      const p = partOf(chart, i)
      const w = p.previousElementSibling
      // the part sits right after its whole, inside the ring's group
      expect(p.parentNode.getAttribute('rel')).toBe(String(i + 1))
      for (const a of [
        'stroke',
        'stroke-width',
        'stroke-dasharray',
        'stroke-linecap',
      ]) {
        expect(p.getAttribute(a)).toBe(w.getAttribute(a))
      }
      expect(p.getAttribute('stroke-opacity')).toBe('1')
      expect(p.getAttribute('fill')).toBe('none')
    }
    expect(partOf(chart, 2)).toBe(null)
  })

  test('an explicit indicator wins either way', () => {
    const arc = radial({ hf: { radialBar: { indicator: 'arc' } } })
    expect(needle(arc)).toBe(null)
    expect(parts(arc).length).toBe(1)
    expect(wholes(arc)[0].getAttribute('stroke-opacity')).toBe('0.2')
    const both = radial({
      series: [70, 50],
      hf: { data: [40, 20], radialBar: { indicator: 'needle' } },
    })
    // the first ring takes the needle and keeps its look; the others arcs
    expect(needle(both)).not.toBe(null)
    expect(partOf(both, 0)).toBe(null)
    expect(partOf(both, 1)).not.toBe(null)
    expect(wholes(both).map((w) => w.getAttribute('stroke-opacity'))).toEqual(
      expect.arrayContaining(['1', '0.2']),
    )
  })

  test('a needle gauge with no value arc points its needle, whatever the indicator', () => {
    const chart = radial({
      rb: { shape: 'needle' },
      hf: { radialBar: { indicator: 'arc' } },
    })
    expect(parts(chart).length).toBe(0)
    expect(needle(chart)).not.toBe(null)
  })

  test('the DOM contract: no hit, capture or tooltip markers on a part', () => {
    const chart = radial({ series: [70, 50], hf: { data: [40, 20] } })
    for (const p of parts(chart)) {
      expect(p.classList.contains('apexcharts-highlight-part')).toBe(true)
      expect(p.classList.contains('apexcharts-radialbar-area')).toBe(false)
      expect(p.getAttribute('pointer-events')).toBe('none')
      for (const a of ['j', 'index', 'data:cx', 'data:value', 'rel']) {
        expect(p.getAttribute(a)).toBe(null)
      }
    }
    // the wholes keep their own values
    expect(wholes(chart).map((w) => w.getAttribute('data:value'))).toEqual([
      '70',
      '50',
    ])
    chart.w.highlightData.capture()
    expect([...chart.w.globals.prevHighlightParts.keys()].sort()).toEqual([
      'r:0',
      'r:1',
    ])
  })
})

describe('parity with the renderer', () => {
  test.each([
    ['default', {}, [70]],
    ['three quarters', { startAngle: -135, endAngle: 135 }, [33]],
    ['half', { startAngle: -90, endAngle: 90 }, [50]],
    ['full at 100', { startAngle: 0, endAngle: 360 }, [100]],
    ['full from -180', { startAngle: -180, endAngle: 180 }, [100]],
    ['a 0..240 domain', { min: 0, max: 240 }, [180]],
    ['inner rings, inverse order', { inverseOrder: true }, [44, 55, 67]],
  ])(
    '%s: a part equal to its whole is the whole, path for path',
    (_n, rb, series) => {
      const chart = radial({
        series,
        rb,
        hf: { data: series, radialBar: { indicator: 'arc' } },
      })
      expect(parts(chart).length).toBe(series.length)
      series.forEach((_, i) => {
        const p = partOf(chart, i)
        expect(p.getAttribute('d')).toBe(
          p.previousElementSibling.getAttribute('d'),
        )
      })
    },
  )

  test("styled like the gauge's own needle, the second needle is it, path for path", () => {
    const own = { length: '70%', baseWidth: 8, tipWidth: 2, offsetY: 10 }
    const chart = radial({
      series: [62],
      rb: { shape: 'needle', needle: { ...own, color: '#123456' } },
      hf: { data: [62] },
    })
    const main = chart.w.dom.baseEl.querySelector('.apexcharts-gauge-needle')
    const g = needle(chart)
    expect(
      g
        .querySelector('.apexcharts-gauge-needle-highlight-shape')
        .getAttribute('d'),
    ).toBe(
      main.querySelector('.apexcharts-gauge-needle-shape').getAttribute('d'),
    )
    expect(g.getAttribute('transform')).toBe(main.getAttribute('transform'))
    expect(g.getAttribute('transform-origin')).toBe(
      main.getAttribute('transform-origin'),
    )
    // its colour is the series', not the gauge needle's
    expect(
      g
        .querySelector('.apexcharts-gauge-needle-highlight-shape')
        .getAttribute('fill'),
    ).toBe(chart.w.globals.colors[0])
  })

  test('each needle key falls back to the gauge needle, and each of its own wins', () => {
    const base = { length: 50, baseWidth: 6, tipWidth: 2, offsetY: 4 }
    const d = (hf) =>
      needle(
        radial({
          series: [50],
          rb: { needle: base },
          hf: {
            data: [50],
            radialBar: { indicator: 'needle', ...hf.radialBar },
          },
        }),
      )
        .querySelector('path')
        .getAttribute('d')
    const fallback = d({})
    for (const [k, v] of [
      ['length', 30],
      ['baseWidth', 12],
      ['tipWidth', 5],
      ['offsetY', 20],
    ]) {
      expect(d({ radialBar: { needle: { [k]: v } } })).not.toBe(fallback)
    }
    const same = d({ radialBar: { needle: { ...base } } })
    expect(same).toBe(fallback)
    const red = needle(
      radial({
        hf: {
          radialBar: { indicator: 'needle', needle: { color: '#e11d48' } },
        },
      }),
    ).querySelector('path')
    expect(red.getAttribute('fill')).toBe('#e11d48')
    expect(red.getAttribute('stroke')).toBe('#e11d48')
  })
})

describe('edge values', () => {
  const arc = (series, data, rb = {}) =>
    radial({ series, rb, hf: { data, radialBar: { indicator: 'arc' } } })

  test('a part past its whole but within max is drawn past it, unmarked, and hoverable', () => {
    const chart = arc([50], [80])
    const p = partOf(chart, 0)
    expect(p.classList.contains('apexcharts-highlight-overflow')).toBe(false)
    // the part stands in for its whole under the pointer
    expect(p.getAttribute('pointer-events')).toBe(null)
    expect(wholes(chart)[0]._apxHits.has(p)).toBe(true)
    expect(p.getAttribute('d')).toBe(
      partOf(arc([80], [80]), 0).getAttribute('d'),
    )
  })

  test('a part past the gauge max is drawn to the end and marked', () => {
    const chart = arc([50], [140])
    const p = partOf(chart, 0)
    expect(p.classList.contains('apexcharts-highlight-overflow')).toBe(true)
    expect(p.getAttribute('d')).toBe(
      partOf(arc([100], [100]), 0).getAttribute('d'),
    )
  })

  test('negatives, zeros and rings of nothing', () => {
    // a negative or zero part draws no arc
    expect(parts(arc([50, 40], [-10, 0])).length).toBe(0)
    // a part on a ring of nothing draws nothing, needle included
    // a ring of nothing still shows its part, as the readouts state it:
    // the needle on a gauge, an arc that stands in for its ring
    const dial = (series) =>
      radial({
        chart: { type: 'gauge' },
        rb: { shape: 'needle' },
        series,
        hf: { data: [40] },
      })
    const gauge = dial([0])
    expect(rotation(needle(gauge))).toBeCloseTo(rotation(needle(dial([1]))), 5)
    expect(
      gauge.w.dom.baseEl.querySelector('.apexcharts-datalabel-value')
        .textContent,
    ).toBe('40%')
    const zero = arc([0, 50], [40, 20])
    expect(parts(zero).length).toBe(2)
    expect(partOf(zero, 0).getAttribute('d')).toBe(
      partOf(arc([1, 50], [40, 20]), 0).getAttribute('d'),
    )
    expect(wholes(zero)[0]._apxHits.has(partOf(zero, 0))).toBe(true)
    // a needle at a zero or negative part points at the start
    for (const v of [0, -10]) {
      const c = radial({
        series: [50],
        hf: { data: [v], radialBar: { indicator: 'needle' } },
      })
      expect(rotation(needle(c))).toBeCloseTo(
        c.w.config.plotOptions.radialBar.startAngle,
        5,
      )
    }
  })
})

describe('centre', () => {
  test('one ring states its part, told the highlight; value whole states the whole', () => {
    const seen = []
    const chart = radial({
      rb: {
        dataLabels: {
          value: {
            formatter: (v, w, o) => {
              seen.push(o?.highlight)
              return `${v}!`
            },
          },
        },
      },
    })
    const value = () =>
      chart.w.dom.baseEl.querySelector('.apexcharts-datalabel-value')
        .textContent
    expect(value()).toBe('40!')
    expect(seen.pop()).toEqual({
      value: 40,
      total: 70,
      share: 40 / 70,
      overflow: false,
    })
    // leaving a ring re-renders the centre: still the part
    wholes(chart)[0].dispatchEvent(new Event('mouseleave'))
    expect(value()).toBe('40!')
    const whole = radial({ hf: { dataLabels: { value: 'whole' } } })
    expect(
      whole.w.dom.baseEl.querySelector('.apexcharts-datalabel-value')
        .textContent,
    ).toBe('70%')
    const none = radial({ hf: { data: [null] } })
    expect(
      none.w.dom.baseEl.querySelector('.apexcharts-datalabel-value')
        .textContent,
    ).toBe('70%')
  })

  test('several rings: the total averages the parts, a hovered ring states its own', () => {
    const chart = radial({
      series: [70, 50],
      labels: ['A', 'B'],
      rb: { dataLabels: { total: { show: true } } },
      hf: { data: [40, 20] },
    })
    const value = () =>
      chart.w.dom.baseEl.querySelector('.apexcharts-datalabel-value')
        .textContent
    expect(value()).toBe('30%')
    expect(chart.w.globals.seriesTotals).toEqual([70, 50])
    const ring1 = wholes(chart).find((w) => w.getAttribute('j') === '1')
    ring1.dispatchEvent(new Event('mouseenter'))
    expect(value()).toBe('20%')
    expect(ring1.getAttribute('data:value')).toBe('50')
    ring1.dispatchEvent(new Event('mouseleave'))
    expect(value()).toBe('30%')
  })
})

describe('tooltip', () => {
  test('a ring row reads part / whole', () => {
    const chart = radial({ series: [70, 50], hf: { data: [40, null] } })
    const marker = document.createElement('span')
    marker.appendChild(
      document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
    )
    const yValue = document.createElement('span')
    yValue.innerHTML = '70'
    const f = { yLbFormatter: (v) => String(v) }
    chart.highlightFilter.tooltipRow({ marker, yValue }, 0, null, f)
    expect(yValue.textContent).toBe('40 / 70')
    const y2 = document.createElement('span')
    y2.innerHTML = '50'
    chart.highlightFilter.tooltipRow({ marker, yValue: y2 }, 1, null, f)
    expect(y2.textContent).toBe('50')
  })
})

describe('updates', () => {
  test('set(), set(fn) and clear() go through highlightFilter.data, and say so', async () => {
    const seen = []
    const chart = radial({
      series: [70, 50],
      labels: ['A', 'B'],
      hf: { data: null },
      chart: {
        events: { highlightFilterChanged: (c, o) => seen.push(o.phase) },
      },
    })
    const spy = vi.spyOn(chart, 'updateOptions')
    await chart.highlightFilter.set([30, 20])
    expect(spy.mock.calls[0][0]).toEqual({
      highlightFilter: { data: [30, 20] },
    })
    expect(parts(chart).length).toBe(2)
    await chart.highlightFilter.set((c) => c.value / 2)
    expect(chart.w.highlightData.parts).toEqual([[35], [25]])
    await chart.highlightFilter.clear()
    expect(parts(chart).length).toBe(0)
    expect(seen).toEqual(['enter', 'update', 'clear'])
  })

  test('set() reads one-value rows as one part per ring, and draws them', async () => {
    const chart = radial({ series: [70], hf: { data: [40] } })
    await chart.highlightFilter.set([[60], [10]], { series: [80, 30] })
    expect(chart.highlightFilter.isActive()).toBe(true)
    expect(chart.w.highlightData.parts).toEqual([[60], [10]])
    expect(wholes(chart).length).toBe(2)
    expect(parts(chart).length).toBe(2)
    expect(partOf(chart, 0)).not.toBe(null)
    expect(partOf(chart, 1)).not.toBe(null)
    // The flat form draws the same.
    const flat = radial({ series: [70], hf: { data: [40] } })
    await flat.highlightFilter.set([60, 10], { series: [80, 30] })
    expect(flat.w.highlightData.parts).toEqual(chart.w.highlightData.parts)
    // So does highlightFilter.data written as rows, and a pie reads it alike.
    for (const type of ['radialBar', 'gauge', 'pie']) {
      const rows = radial({
        chart: { type },
        series: [70, 50],
        hf: { data: [[40], [null]] },
      })
      expect(rows.highlightFilter.isActive()).toBe(true)
      expect(rows.w.highlightData.parts).toEqual([[40], [null]])
    }
  })

  test('a row of more than one value on a circle warns once and draws plain', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = radial({ series: [70], hf: { data: [40] } })
    await chart.highlightFilter.set([[60, 5], [10]], { series: [80, 30] })
    expect(chart.highlightFilter.isActive()).toBe(false)
    expect(parts(chart).length).toBe(0)
    for (const w of wholes(chart)) {
      expect(w.getAttribute('stroke-opacity')).toBe('1')
    }
    expect(
      warn.mock.calls.filter((c) => /one value per slice/.test(c[0])).length,
    ).toBe(1)
  })

  test('a clear without animation leaves the plain chart behind', async () => {
    for (const hf of [
      { data: [40, 80] },
      { data: [40], radialBar: { indicator: 'needle' } },
    ]) {
      const series = hf.data.length > 1 ? [70, 50] : [70]
      const plain = radial({ series, hf: { data: null } })
      const chart = radial({ series, hf })
      await chart.highlightFilter.clear()
      const strip = (c) =>
        c.w.dom.baseEl
          .querySelector('.apexcharts-radialbar')
          .outerHTML.replace(/SvgjsFilter\d+/g, 'F')
          .replace(/SvgjsLinearGradient\d+/g, 'G')
          .replace(/apexcharts\w*?\d{3,}/g, 'ID')
      expect(strip(chart)).toBe(strip(plain))
    }
  })

  test('a cross-type morph never captures a part', () => {
    const chart = radial({ series: [70, 50], hf: { data: [40, 80] } })
    const { marks } = chart.ctx.morphTypeChange._captureFromDOM('radialBar')
    expect(marks.length).toBe(2)
  })

  test("a part takes its ring's hover and selection filter", async () => {
    const chart = radial({ series: [70, 50], hf: { data: [40, 80] } })
    const [w0, w1] = [0, 1].map((i) => partOf(chart, i).previousElementSibling)
    w0.setAttribute('filter', 'url(#a)')
    await new Promise((r) => setTimeout(r, 0))
    expect(partOf(chart, 0).getAttribute('filter')).toBe('url(#a)')
    expect(partOf(chart, 1).getAttribute('filter')).toBe(null)
    w0.removeAttribute('filter')
    w1.setAttribute('filter', 'url(#b)')
    await new Promise((r) => setTimeout(r, 0))
    expect(partOf(chart, 0).getAttribute('filter')).toBe(null)
    expect(partOf(chart, 1).getAttribute('filter')).toBe('url(#b)')
  })

  test('the canvas renderer leaves the rings, and their parts, in SVG', () => {
    const chart = radial({
      series: [70, 50],
      chart: { renderer: 'canvas' },
      hf: { data: [40, 20] },
    })
    expect(parts(chart).length).toBe(2)
  })

  test('the wraps live on the render they were made for', () => {
    const chart = radial({ series: [70, 50], hf: { data: [40, 20] } })
    const r = chart.highlightFilter._render
    expect(Object.keys(r)).toEqual(
      expect.arrayContaining([
        'animatePaths',
        'renderInnerDataLabels',
        'printInnerLabels',
      ]),
    )
    for (const m of ['_arcEnd', 'needlePath', 'needleMotion', 'getPiePath']) {
      expect(typeof r[m]).toBe('function')
    }
  })
})

describe('the overflow tick', () => {
  const ticks = (chart) => q(chart, '.apexcharts-radialbar-highlight-edge')
  const arc = (series, data, extra = {}) =>
    radial({
      series,
      ...extra,
      hf: { data, radialBar: { indicator: 'arc' }, ...(extra.hf || {}) },
    })
  /** Where the tick should be: across ring i's track at the angle its
   * whole ends on (jsdom lays the circle out at its own size). */
  const across = (chart, i) => {
    const whole = partOf(chart, i).previousElementSibling
    const h = chart.w.dom.baseEl.querySelector('.apexcharts-radialbar-hollow')
    const cx = +h.getAttribute('cx')
    const cy = +h.getAttribute('cy')
    const R = parseFloat(/A\s*([-\d.e]+)/.exec(whole.getAttribute('d'))[1])
    const sw = +whole.getAttribute('stroke-width')
    const a = chart.highlightFilter._render._arcEnd(
      chart.w.seriesData.series[i],
    )
    const p = Utils.polarToCartesian(cx, cy, R - sw / 2, a)
    const q = Utils.polarToCartesian(cx, cy, R + sw / 2, a)
    return `M ${p.x} ${p.y} L ${q.x} ${q.y}`
  }

  test("a part past its whole marks the whole's end across the track", () => {
    const chart = arc([70, 50, 30], [40, 80, 60], {
      rb: { startAngle: -135, endAngle: 135 },
    })
    // rings B and C overflow, A does not
    expect(ticks(chart).length).toBe(2)
    for (const i of [1, 2]) {
      const p = partOf(chart, i)
      const t = p.nextElementSibling
      expect(t.classList.contains('apexcharts-radialbar-highlight-edge')).toBe(
        true,
      )
      // the edge's own look: its class, a white dash, never the pointer's
      expect(t.classList.contains('apexcharts-highlight-edge')).toBe(true)
      expect(t.classList.contains('apexcharts-highlight-part')).toBe(true)
      expect(t.getAttribute('stroke')).toBe('#fff')
      expect(t.getAttribute('stroke-width')).toBe('1')
      expect(t.getAttribute('stroke-dasharray')).toBe('3')
      expect(t.getAttribute('stroke-opacity')).toBe('0.75')
      expect(t.getAttribute('pointer-events')).toBe('none')
      // at the angle the whole ends on, from the track's inner edge to its
      // outer edge
      expect(t.getAttribute('d')).toBe(across(chart, i))
    }
    // the ring and its part keep the classes they had
    expect(
      partOf(chart, 1).classList.contains('apexcharts-highlight-overflow'),
    ).toBe(false)
  })

  test('none where the part is within its whole, or equal to it; one past max too', () => {
    expect(ticks(arc([70], [40])).length).toBe(0)
    expect(ticks(arc([70], [70])).length).toBe(0)
    // a part past the gauge's end: drawn to it, the whole's end marked
    const past = arc([50], [140])
    expect(ticks(past).length).toBe(1)
    expect(
      partOf(past, 0).classList.contains('apexcharts-highlight-overflow'),
    ).toBe(true)
    // both past the end: nothing of the whole is hidden
    expect(ticks(arc([120], [140])).length).toBe(0)
    // the needle shows no arc, so no tick
    expect(
      ticks(
        radial({
          series: [50],
          hf: { data: [80], radialBar: { indicator: 'needle' } },
        }),
      ).length,
    ).toBe(0)
  })

  test('a clear without animation, a capture and a morph leave no tick behind', async () => {
    const chart = arc([70, 50], [40, 80])
    expect(ticks(chart).length).toBe(1)
    // the record carries the tick's strength for the next update
    chart.w.highlightData.capture()
    expect(chart.w.globals.prevHighlightParts.get('r:1').tk).toBe(0.75)
    const { marks } = chart.ctx.morphTypeChange._captureFromDOM('radialBar')
    expect(marks.length).toBe(2)
    await chart.highlightFilter.clear()
    expect(ticks(chart).length).toBe(0)
  })
})

describe('the needle shape', () => {
  const main = (chart) =>
    chart.w.dom.baseEl.querySelector('.apexcharts-gauge-needle')
  const dial = (extra = {}) =>
    radial({
      chart: { type: 'gauge' },
      ...extra,
      rb: { shape: 'needle', ...(extra.rb || {}) },
    })

  test("the gauge's own needle takes the whole's look while a pick is active", async () => {
    const chart = dial({ hf: { data: [40], fadeOpacity: 0.3 } })
    expect(main(chart).getAttribute('opacity')).toBe('0.3')
    // the part's needle stays solid
    expect(needle(chart).getAttribute('opacity')).toBe(null)
    await chart.highlightFilter.clear()
    expect(main(chart).getAttribute('opacity')).toBe(null)
    // never touched without a pick
    expect(main(dial({ hf: { data: null } })).getAttribute('opacity')).toBe(
      null,
    )
  })

  /** The reading's baseline below the gauge's centre. */
  const y = (chart) => {
    const h = chart.w.dom.baseEl.querySelector('.apexcharts-radialbar-hollow')
    const v = chart.w.dom.baseEl.querySelector('.apexcharts-datalabel-value')
    return +v.getAttribute('y') - +h.getAttribute('cy')
  }
  /** How far below its pivot the gauge's own needle reaches at either end
   * of the dial, and the pivot below the centre. */
  const reach = (chart) => {
    const g = main(chart)
    const [, py] = g.getAttribute('transform-origin').split(' ').map(Number)
    const n = g.firstChild
      .getAttribute('d')
      .match(/[-\d.e]+/g)
      .map(Number)
    const rb = chart.w.config.plotOptions.radialBar
    const low = Math.max(
      0,
      ...[rb.startAngle, rb.endAngle].map(
        (a) => -Math.cos((a * Math.PI) / 180),
      ),
    )
    const h = chart.w.dom.baseEl.querySelector('.apexcharts-radialbar-hollow')
    return { below: (py - n[10]) * low, pivot: py - +h.getAttribute('cy') }
  }

  test('a needle gauge sets its reading below where the needle reaches; a page offset wins', () => {
    const plain = { hf: { data: null } }
    const chart = dial(plain)
    // (jsdom lays the gauge out with no width, so the needle is short here;
    // the interaction spec measures the real one)
    const { below, pivot } = reach(chart)
    // the reading's top (32px type) clears the needle at either end
    expect(y(chart)).toBeGreaterThan(32)
    expect(y(chart) - 32 - pivot).toBeGreaterThan(below)
    // a pivot moved down takes the reading with it
    const moved = dial({ ...plain, rb: { needle: { offsetY: 30 } } })
    expect(reach(moved).pivot).toBe(30)
    expect(y(moved) - y(chart)).toBeCloseTo(30, 6)
    // the config is left unset: the reading is placed as it is drawn
    expect(chart.w.config.plotOptions.radialBar.dataLabels.value.offsetY).toBe(
      undefined,
    )
    expect(
      y(dial({ ...plain, rb: { dataLabels: { value: { offsetY: 12 } } } })),
    ).toBe(12)
    // the arc shape keeps its own
    expect(y(radial({ chart: { type: 'gauge' }, ...plain }))).toBe(8)
  })

  test('the reading follows a shape changed by an update; a page offset still wins', async () => {
    const chart = dial({ hf: { data: null } })
    const low = y(chart)
    expect(low).toBeGreaterThan(32)
    await chart.updateOptions({ plotOptions: { radialBar: { shape: 'arc' } } })
    expect(y(chart)).toBe(8)
    await chart.updateOptions({
      plotOptions: { radialBar: { shape: 'needle' } },
    })
    expect(y(chart)).toBeCloseTo(low, 6)
    await chart.updateOptions({
      plotOptions: { radialBar: { dataLabels: { value: { offsetY: 12 } } } },
    })
    expect(y(chart)).toBe(12)
    await chart.updateOptions({ plotOptions: { radialBar: { shape: 'arc' } } })
    expect(y(chart)).toBe(12)
  })
})

describe('the tooltip under a pick', () => {
  const tip = (chart) => chart.w.dom.baseEl.querySelector('.apexcharts-tooltip')

  test('a pick turns it on for radialBar and the gauge, and a clear puts it back', async () => {
    for (const extra of [
      { series: [70, 50], hf: { data: [40, 80] } },
      { chart: { type: 'gauge' } },
      { chart: { type: 'gauge' }, rb: { shape: 'needle' } },
    ]) {
      const chart = radial(extra)
      expect(tip(chart)).not.toBe(null)
      // the setting itself stays the chart's own once the render is drawn
      await new Promise((r) => setTimeout(r, 0))
      expect(chart.w.config.tooltip.enabled).toBe(false)
      await chart.highlightFilter.clear()
      expect(tip(chart)).toBe(null)
      expect(chart.w.config.tooltip.enabled).toBe(false)
      await chart.highlightFilter.set(
        chart.w.seriesData.series.map((v) => v / 2),
      )
      expect(tip(chart)).not.toBe(null)
    }
  })

  test("a page's own tooltip.enabled wins, on the chart or in an update", async () => {
    const off = radial({ options: { tooltip: { enabled: false } } })
    expect(tip(off)).toBe(null)
    const later = radial({ hf: { data: null } })
    await later.updateOptions({ tooltip: { enabled: false } })
    await later.highlightFilter.set([40])
    expect(tip(later)).toBe(null)
    await later.updateOptions({ tooltip: { enabled: true } })
    await later.highlightFilter.clear()
    // turned on by the page, it stays on after a clear
    expect(tip(later)).not.toBe(null)
    expect(later.w.config.tooltip.enabled).toBe(true)
  })

  test('a pick and a clear in one tick leave the chart its own setting', async () => {
    const chart = radial({ hf: { data: null } })
    chart.highlightFilter.set([40])
    await chart.highlightFilter.clear()
    await new Promise((r) => setTimeout(r, 0))
    expect(tip(chart)).toBe(null)
    expect(chart.w.config.tooltip.enabled).toBe(false)
    // the same through updateOptions
    chart.highlightFilter.set([40])
    await chart.updateOptions({ highlightFilter: { data: null } })
    await new Promise((r) => setTimeout(r, 0))
    expect(tip(chart)).toBe(null)
    expect(chart.w.config.tooltip.enabled).toBe(false)
    // and a re-pick still turns it on
    await chart.highlightFilter.set([30])
    expect(tip(chart)).not.toBe(null)
  })

  test('a page turning the tooltip on in the tick of a pick keeps it on', async () => {
    const chart = radial({ hf: { data: null } })
    chart.highlightFilter.set([40])
    await chart.updateOptions({ tooltip: { enabled: true } })
    await new Promise((r) => setTimeout(r, 0))
    expect(chart.w.config.tooltip.enabled).toBe(true)
    await chart.highlightFilter.clear()
    await new Promise((r) => setTimeout(r, 0))
    expect(chart.w.config.tooltip.enabled).toBe(true)
    expect(tip(chart)).not.toBe(null)
  })

  test('the pointer on either needle is on the first ring', async () => {
    const chart = radial({
      chart: { type: 'gauge' },
      rb: { shape: 'needle', needle: { showValueArc: true } },
    })
    await Promise.resolve()
    const ring = wholes(chart)[0]
    const seen = []
    ring.addEventListener('mousemove', () => seen.push('ring'))
    const own = chart.w.dom.baseEl.querySelector('.apexcharts-gauge-needle')
    own.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }))
    needle(chart).dispatchEvent(new MouseEvent('mousemove', { bubbles: true }))
    expect(seen).toEqual(['ring', 'ring'])
  })
})

describe('lanes', () => {
  // Lanes are opt-in: every chart here asks for them unless it names its
  // own indicator.
  const radial = (extra = {}) =>
    baseRadial({
      ...extra,
      hf: {
        ...(extra.hf || {}),
        radialBar: { indicator: 'lanes', ...(extra.hf?.radialBar || {}) },
      },
    })
  const lanes = (chart, i = 0) => {
    const g = chart.w.dom.baseEl.querySelector(
      `.apexcharts-radial-series[rel="${i + 1}"]`,
    )
    return {
      ring: g.querySelector('.apexcharts-radialbar-area'),
      whole: g.querySelector('.apexcharts-radialbar-highlight-whole'),
      part: g.querySelector(
        '.apexcharts-radialbar-highlight-lane.apexcharts-radialbar-highlight-part',
      ),
    }
  }
  const tracks = (chart) =>
    q(chart, '.apexcharts-tracks > g').map((g) => ({
      own: g.querySelector('.apexcharts-radialbar-area'),
      inner: g.querySelector('.apexcharts-radialbar-highlight-track'),
    }))
  const line = (chart) =>
    chart.w.dom.baseEl.querySelector('.apexcharts-datalabel-whole')
  const value = (chart) =>
    chart.w.dom.baseEl.querySelector('.apexcharts-datalabel-value').textContent

  test('the band splits: the ring hidden under a light whole lane and a solid part lane, each on a track', () => {
    for (const type of ['radialBar', 'gauge']) {
      const chart = radial({ chart: { type } })
      const { ring, whole, part } = lanes(chart)
      // in the ring's group, right after it, the whole's lane first
      expect(ring.nextElementSibling).toBe(whole)
      expect(whole.nextElementSibling).toBe(part)
      expect(ring.getAttribute('stroke-opacity')).toBe('0')
      expect(whole.getAttribute('stroke-opacity')).toBe('0.45')
      expect(part.getAttribute('stroke-opacity')).toBe('1')
      for (const n of [whole, part]) {
        expect(n.getAttribute('stroke')).toBe(ring.getAttribute('stroke'))
        expect(n.getAttribute('stroke-dasharray')).toBe(
          ring.getAttribute('stroke-dasharray'),
        )
        expect(n.getAttribute('stroke-linecap')).toBe(
          ring.getAttribute('stroke-linecap'),
        )
        expect(n.classList.contains('apexcharts-highlight-part')).toBe(true)
        expect(n.classList.contains('apexcharts-radialbar-area')).toBe(false)
        // the ring under the lanes takes the pointer
        expect(n.getAttribute('pointer-events')).toBe('none')
        for (const a of ['j', 'index', 'data:cx', 'data:value', 'rel']) {
          expect(n.getAttribute(a)).toBe(null)
        }
      }
      // the ring keeps its own value and is still the one captured
      expect(ring.getAttribute('data:value')).toBe('70')
      expect(
        chart.ctx.morphTypeChange._captureFromDOM('radialBar').marks.length,
      ).toBe(1)
      // the inner lane's track: a copy of the ring's, right after it
      const [t] = tracks(chart)
      expect(t.own.nextElementSibling).toBe(t.inner)
      expect(t.inner.getAttribute('stroke')).toBe(t.own.getAttribute('stroke'))
      expect(t.inner.classList.contains('apexcharts-highlight-part')).toBe(true)
      expect(t.inner.getAttribute('pointer-events')).toBe('none')
      expect(t.inner.getAttribute('id')).toBe(null)
      // no overflow tick in lanes
      expect(q(chart, '.apexcharts-radialbar-highlight-edge').length).toBe(0)
    }
  })

  test('the whole lane takes lanes.opacity times its own strength', () => {
    const chart = radial({ hf: { radialBar: { lanes: { opacity: 0.6 } } } })
    expect(lanes(chart).whole.getAttribute('stroke-opacity')).toBe('0.6')
  })

  test('the overflow class marks a part past its whole (or past max); there is no tick', () => {
    const over = (series, data) =>
      lanes(radial({ series, hf: { data } })).part.classList.contains(
        'apexcharts-highlight-overflow',
      )
    expect(over([50], [80])).toBe(true)
    expect(over([50], [140])).toBe(true)
    expect(over([120], [110])).toBe(true)
    expect(over([70], [40])).toBe(false)
    expect(over([70], [70])).toBe(false)
    const chart = radial({ series: [50], hf: { data: [80] } })
    expect(q(chart, '.apexcharts-radialbar-highlight-edge').length).toBe(0)
    // past its whole, the part lane stands in for the ring under the pointer
    const { ring, part } = lanes(chart)
    expect(part.getAttribute('pointer-events')).toBe(null)
    expect(ring._apxHits.has(part)).toBe(true)
  })

  test('a ring with no part or a part of 0 still splits, its inner lane empty', () => {
    for (const data of [[null], [0]]) {
      const chart = radial({ hf: { data } })
      const { ring, whole, part } = lanes(chart)
      expect(ring.getAttribute('stroke-opacity')).toBe('0')
      expect(whole.getAttribute('stroke-opacity')).toBe('0.45')
      expect(part.getAttribute('d')).toBe('')
      expect(tracks(chart)[0].inner).not.toBe(null)
    }
  })

  test('lanes are opt-in on one ring and several; explicit wins', () => {
    // unset, neither a single dial nor several rings split in lanes
    for (const extra of [
      {},
      { chart: { type: 'gauge' } },
      { series: [70, 50], hf: { data: [40, 20] } },
    ]) {
      const arcs = baseRadial(extra)
      expect(q(arcs, '.apexcharts-radialbar-highlight-lane').length).toBe(0)
      expect(partOf(arcs, 0)).not.toBe(null)
      expect(line(arcs)).toBe(null)
    }
    const pairs = radial({
      series: [70, 50, 30],
      hf: { data: [40, 80, null], radialBar: { indicator: 'lanes' } },
    })
    expect(q(pairs, '.apexcharts-radialbar-highlight-lane').length).toBe(6)
    expect(q(pairs, '.apexcharts-radialbar-highlight-track').length).toBe(3)
    // each ring's inner track follows its own track, inverse order too
    const inv = radial({
      series: [70, 50],
      rb: { inverseOrder: true },
      hf: { data: [40, 20], radialBar: { indicator: 'lanes' } },
    })
    expect(tracks(inv).every((t) => t.inner)).toBe(true)
    // a single dial told 'arc' splits its arc
    const one = radial({ hf: { radialBar: { indicator: 'arc' } } })
    expect(q(one, '.apexcharts-radialbar-highlight-lane').length).toBe(0)
    expect(partOf(one, 0)).not.toBe(null)
    // a needle gauge without its value arc has no band: the needle
    const bare = radial({
      chart: { type: 'gauge' },
      rb: { shape: 'needle' },
      hf: { radialBar: { indicator: 'lanes' } },
    })
    expect(q(bare, '.apexcharts-radialbar-highlight-lane').length).toBe(0)
    expect(needle(bare)).not.toBe(null)
    expect(line(bare)).toBe(null)
    // with it, lanes on the arc, and its own needle fades as the whole
    const shown = radial({
      chart: { type: 'gauge' },
      rb: { shape: 'needle', needle: { showValueArc: true } },
      hf: { radialBar: { indicator: 'lanes' } },
    })
    expect(q(shown, '.apexcharts-radialbar-highlight-lane').length).toBe(2)
    expect(needle(shown)).toBe(null)
    expect(
      shown.w.dom.baseEl
        .querySelector('.apexcharts-gauge-needle')
        .getAttribute('opacity'),
    ).toBe('0.2')
  })

  test('a clear leaves the plain chart behind, tracks and centre included', async () => {
    const strip = (c) =>
      c.w.dom.baseEl
        .querySelector('.apexcharts-radialbar')
        .outerHTML.replace(/SvgjsFilter\d+/g, 'F')
        .replace(/SvgjsLinearGradient\d+/g, 'G')
        .replace(/apexcharts\w*?\d{3,}/g, 'ID')
    for (const extra of [
      {},
      { chart: { type: 'gauge' } },
      {
        series: [70, 50],
        hf: { data: [40, 80], radialBar: { indicator: 'lanes' } },
      },
    ]) {
      const plain = radial({
        ...extra,
        hf: { ...(extra.hf || {}), data: null },
      })
      const chart = radial(extra)
      await chart.highlightFilter.clear()
      expect(strip(chart)).toBe(strip(plain))
    }
  })

  test('the records carry the split, both lanes and the centre line', () => {
    const chart = radial()
    chart.w.highlightData.capture()
    const prev = chart.w.globals.prevHighlightParts
    const r = prev.get('r:0')
    expect(r.s).toBe(1)
    expect(r.f).toBe(0.45)
    expect(typeof r.we).toBe('number')
    expect(typeof r.e).toBe('number')
    expect(prev.get('r:w')).toMatchObject({ f: 1, t: '/ 70%' })
  })

  test('the canvas renderer leaves the rings and their lanes in SVG', () => {
    const chart = radial({ chart: { renderer: 'canvas' } })
    expect(q(chart, '.apexcharts-radialbar-highlight-lane').length).toBe(2)
    expect(line(chart).textContent).toBe('/ 70%')
  })

  describe('the tooltip row', () => {
    const row = (chart, s, opts = {}) => {
      const marker = document.createElement('span')
      marker.appendChild(
        document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
      )
      const yValue = document.createElement('span')
      yValue.innerHTML = String(chart.w.seriesData.series[s])
      chart.highlightFilter.tooltipRow({ marker, yValue }, s, null, {
        yLbFormatter: (v) => String(v),
        ...opts,
      })
      return { text: yValue.textContent, html: yValue.innerHTML, marker }
    }

    test('the part lane reads part / whole, the whole lane the whole with the part named', () => {
      const chart = radial()
      const hf = chart.highlightFilter
      expect(row(chart, 0).text).toBe('40 / 70')
      hf._lane = [0, 'whole']
      const w = row(chart, 0)
      expect(w.text).toBe('70 (part 40)')
      // the whole bold as the row has it, the part muted
      expect(w.html).toMatch(/^70 <span class="apexcharts-highlight-total"/)
      hf._lane = [0, 'part']
      expect(row(chart, 0).text).toBe('40 / 70')
      // no part: the whole alone
      const none = radial({ hf: { data: [null] } })
      none.highlightFilter._lane = [0, 'whole']
      expect(row(none, 0).text).toBe('70')
      // not in arc mode
      const arcs = radial({ hf: { radialBar: { indicator: 'arc' } } })
      arcs.highlightFilter._lane = [0, 'whole']
      expect(row(arcs, 0).text).toBe('40 / 70')
    })

    test("the whole lane names the part in the chart's locale", () => {
      const locale = (part) =>
        radial({
          chart: {
            locales: [
              {
                name: 'de',
                options: part ? { highlightFilter: { part } } : {},
              },
            ],
            defaultLocale: 'de',
          },
        })
      const de = locale('Teil')
      de.highlightFilter._lane = [0, 'whole']
      expect(row(de, 0).text).toBe('70 (Teil 40)')
      // a locale without the word: the English one
      const bare = locale(null)
      bare.highlightFilter._lane = [0, 'whole']
      expect(row(bare, 0).text).toBe('70 (part 40)')
    })

    test('the formatter is told the lane; the swatch is the lane', () => {
      const seen = []
      const chart = radial({
        options: { tooltip: { fillSeriesColor: false } },
        hf: {
          tooltip: {
            formatter: (p, whole, o) => {
              seen.push(o.lane)
              return `${o.lane}:${p}/${whole}`
            },
          },
        },
      })
      expect(row(chart, 0).text).toBe('part:40/70')
      chart.highlightFilter._lane = [0, 'whole']
      const r = row(chart, 0)
      expect(r.text).toBe('whole:40/70')
      expect(seen).toEqual(['part', 'whole'])
      // the whole lane's swatch is the light lane, the part's solid
      expect(r.marker.style.background).not.toContain('gradient')
      chart.highlightFilter._lane = [0, 'part']
      const p = row(chart, 0)
      expect(p.marker.style.background).not.toContain('gradient')
      expect(p.marker.style.background).not.toBe(r.marker.style.background)
      // arc mode keeps its two-tone swatch and no lane
      const arcs = radial({
        options: { tooltip: { fillSeriesColor: false } },
        hf: { radialBar: { indicator: 'arc' } },
      })
      expect(row(arcs, 0).marker.style.background).toContain('gradient')
    })

    test('the lane under the pointer is the one outside or inside the middle of the gap', () => {
      const chart = radial()
      const { ring } = lanes(chart)
      const rec = chart.highlightFilter._targets.get('r:0')
      Object.assign(rec, { cx: 0, cy: 0, mid: 10 })
      ring.getScreenCTM = () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 })
      const at = (x, type = 'mousemove') => {
        ring.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: 0 }))
        return chart.highlightFilter._lane
      }
      expect(at(14)).toEqual([0, 'whole'])
      expect(at(6, 'mouseover')).toEqual([0, 'part'])
      expect(at(10.5)).toEqual([0, 'whole'])
      // a forwarded event from the part lane past its whole reads the same
      expect(at(3, 'mousedown')).toEqual([0, 'part'])
    })
  })

  describe('the centre', () => {
    test('one ring: the value states the part, a muted line under it the whole', () => {
      const chart = radial({ chart: { type: 'gauge' } })
      expect(value(chart)).toBe('40%')
      const l = line(chart)
      expect(l.textContent).toBe('/ 70%')
      expect(l.getAttribute('fill-opacity')).toBe('0.6')
      expect(l.getAttribute('opacity')).toBe(null)
      // smaller than the value, under it
      const v = chart.w.dom.baseEl.querySelector('.apexcharts-datalabel-value')
      expect(parseFloat(l.getAttribute('font-size'))).toBe(16)
      expect(+l.getAttribute('y')).toBeGreaterThan(+v.getAttribute('y') + 16)
      // a revert of the centre (leaving the ring) draws it again
      lanes(chart).ring.dispatchEvent(new Event('mouseleave'))
      expect(q(chart, '.apexcharts-datalabel-whole').length).toBe(1)
      expect(line(chart).textContent).toBe('/ 70%')
    })

    test('a ring with no part: the value states its whole alone, with no line', () => {
      for (const type of ['radialBar', 'gauge']) {
        const chart = radial({ chart: { type }, hf: { data: [null] } })
        expect(value(chart)).toBe('70%')
        expect(line(chart)).toBe(null)
      }
      const two = (data) =>
        radial({
          series: [70, 50],
          labels: ['A', 'B'],
          rb: { dataLabels: { total: { show: true } } },
          hf: { data, radialBar: { indicator: 'lanes' } },
        })
      // no ring with a part: no total line
      expect(line(two([null, null]))).toBe(null)
      // a hovered ring with no part: its whole alone, the line empty
      const some = two([40, null])
      expect(line(some).textContent).toBe('/ 60%')
      const ring1 = wholes(some).find((w) => w.getAttribute('j') === '1')
      ring1.dispatchEvent(new Event('mouseenter'))
      expect(value(some)).toBe('50%')
      expect(line(some).textContent).toBe('')
    })

    test('several rings with no total: a hovered ring gets its own line, gone on leaving', () => {
      const chart = radial({
        series: [70, 50],
        labels: ['A', 'B'],
        hf: { data: [40, 60], radialBar: { indicator: 'lanes' } },
      })
      expect(line(chart)).toBe(null)
      const ring1 = wholes(chart).find((w) => w.getAttribute('j') === '1')
      ring1.dispatchEvent(new Event('mouseenter'))
      expect(value(chart)).toBe('60%')
      const l = line(chart)
      expect(l.textContent).toBe('/ 50%')
      expect(l.getAttribute('fill-opacity')).toBe('0.6')
      // under the value, in its group
      const v = chart.w.dom.baseEl.querySelector('.apexcharts-datalabel-value')
      expect(l.previousSibling).toBe(v)
      expect(+l.getAttribute('y')).toBeGreaterThan(+v.getAttribute('y'))
      ring1.dispatchEvent(new Event('mouseleave'))
      expect(line(chart)).toBe(null)
      // and not on a cleared chart
      const plain = radial({
        series: [70, 50],
        labels: ['A', 'B'],
        hf: { data: null, radialBar: { indicator: 'lanes' } },
      })
      wholes(plain)[1].dispatchEvent(new Event('mouseenter'))
      expect(line(plain)).toBe(null)
    })

    test('a formatter writes the line itself when it reads opts.lane', () => {
      const seen = []
      const chart = radial({
        rb: {
          dataLabels: {
            value: {
              formatter: (v, w, o) => {
                seen.push(o?.lane)
                return (o?.lane === 'whole' ? 'company ' : '') + v + '%'
              },
            },
          },
        },
      })
      expect(value(chart)).toBe('40%')
      expect(line(chart).textContent).toBe('company 70%')
      expect(seen).toContain('whole')
    })

    test('never in arc or needle modes, nor when the value states the whole', () => {
      for (const hf of [
        { radialBar: { indicator: 'arc' } },
        { radialBar: { indicator: 'needle' } },
        { dataLabels: { value: 'whole' } },
      ]) {
        expect(line(radial({ hf }))).toBe(null)
      }
      expect(line(radial({ hf: { data: null } }))).toBe(null)
    })

    test('several rings in lanes: the total line reads the wholes; a hovered ring its own', () => {
      const chart = radial({
        series: [70, 50],
        labels: ['A', 'B'],
        rb: { dataLabels: { total: { show: true } } },
        hf: { data: [40, 20], radialBar: { indicator: 'lanes' } },
      })
      expect(value(chart)).toBe('30%')
      expect(line(chart).textContent).toBe('/ 60%')
      const ring1 = wholes(chart).find((w) => w.getAttribute('j') === '1')
      ring1.dispatchEvent(new Event('mouseenter'))
      expect(value(chart)).toBe('20%')
      expect(line(chart).textContent).toBe('/ 50%')
      ring1.dispatchEvent(new Event('mouseleave'))
      expect(value(chart)).toBe('30%')
      expect(line(chart).textContent).toBe('/ 60%')
    })
  })
})
