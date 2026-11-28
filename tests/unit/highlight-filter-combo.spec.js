import { describe, test, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/features/highlight-filter.js'

// A column, bar or area chart that also carries a line (a trend, a target)
// draws parts on the series that have them. Any series that carries none —
// the line, or a column under a line that has parts, stacked or not — stays
// as the renderer drew it unless highlightFilter.others is 'fade'. The two
// renderers share one pass, so the columns' targets are still there after
// the line has drawn.

const CATS = ['P', 'Q', 'R', 'S', 'T']
const SALES = [40, 15, 14, 20, 11]
const PARTS = [18, 11, 6, 10, 7]
const TREND = [33, 26, 20, 15, 10]

function combo(extra = {}) {
  const mark = extra.mark || 'column'
  return createChartWithOptions({
    chart: {
      type: extra.type || 'line',
      width: 600,
      height: 300,
      ...(extra.chart || {}),
    },
    series: extra.series || [
      {
        name: 'Sales',
        type: mark,
        data: SALES,
        highlightData: PARTS,
      },
      { name: 'Trend', type: 'line', data: TREND },
    ],
    xaxis: { categories: CATS },
    stroke: { width: mark === 'area' ? [2, 3] : [0, 3] },
    dataLabels: { enabled: !!extra.labels },
    ...(extra.options || {}),
  })
}

const q = (c, sel) => [...c.w.dom.baseEl.querySelectorAll(sel)]
const parts = (c) =>
  q(c, '.apexcharts-highlight-part').filter(
    (n) =>
      !n.classList.contains('apexcharts-highlight-edge') &&
      !n.classList.contains('apexcharts-highlight-hit'),
  )
const barParts = (c) =>
  parts(c).filter((n) => n.classList.contains('apexcharts-bar-highlight-part'))
const lineParts = (c) => q(c, '.apexcharts-line-highlight-part')
const bars = (c) => q(c, '.apexcharts-series > .apexcharts-bar-area')
const lineStrokes = (c) =>
  q(c, '.apexcharts-line').filter(
    (n) =>
      !n.classList.contains('apexcharts-highlight-part') &&
      (n.getAttribute('fill') === 'none' || n.getAttribute('fill') == null),
  )
const keysOf = (set) => [...set.keys()]
const hasPrefix = (list, prefix) => list.some((k) => String(k).indexOf(prefix) === 0)

afterEach(() => vi.restoreAllMocks())

describe('combo charts draw parts on the series that carry them', () => {
  test('columns keep their parts and the overlay line stays plain', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const c = combo()

    expect(c.w.globals.comboCharts).toBe(true)
    expect(c.highlightFilter.canDrawParts()).toBe(true)
    expect(c.highlightFilter.isActive()).toBe(true)
    expect(
      warn.mock.calls.some((args) =>
        String(args[0]).includes('parts are not drawn'),
      ),
    ).toBe(false)

    expect(barParts(c).length).toBe(5)
    expect(lineParts(c).length).toBe(0)
    expect(bars(c).length).toBe(5)
    for (const el of bars(c)) {
      expect(el.getAttribute('fill-opacity')).toBe('0.2')
    }

    const strokes = lineStrokes(c)
    expect(strokes.length).toBeGreaterThan(0)
    for (const el of strokes) {
      expect(el.getAttribute('stroke-dasharray')).not.toBe('4')
      expect(el.getAttribute('stroke-opacity')).not.toBe('0.2')
    }

    const targets = keysOf(c.highlightFilter._targets)
    const seen = [...c.highlightFilter._seen]
    // Bar recorded both maps, then Line drew. Line keeps its own targets and
    // does not wipe the columns it already saw.
    expect(hasPrefix(targets, 'b:')).toBe(true)
    expect(hasPrefix(targets, 'l:')).toBe(true)
    expect(hasPrefix(seen, 'b:')).toBe(true)
    c.destroy()
  })

  test.each(['bar', 'column'])(
    'a %s series plus a line is drawn the same way',
    (mark) => {
      const c = combo({ mark, type: 'line' })
      expect(c.highlightFilter.canDrawParts()).toBe(true)
      expect(c.highlightFilter.isActive()).toBe(true)
      expect(barParts(c).length).toBe(5)
      expect(lineParts(c).length).toBe(0)
      for (const el of lineStrokes(c)) {
        expect(el.getAttribute('stroke-dasharray')).not.toBe('4')
      }
      expect(hasPrefix(keysOf(c.highlightFilter._targets), 'b:')).toBe(true)
      expect(hasPrefix(keysOf(c.highlightFilter._targets), 'l:')).toBe(true)
      c.destroy()
    },
  )

  test('chart.type bar with a line series is a supported combo', () => {
    const c = combo({
      type: 'bar',
      series: [
        { name: 'Sales', data: SALES, highlightData: PARTS },
        { name: 'Trend', type: 'line', data: TREND },
      ],
    })
    expect(c.w.globals.comboCharts).toBe(true)
    expect(c.highlightFilter.canDrawParts()).toBe(true)
    expect(barParts(c).length).toBe(5)
    expect(lineParts(c).length).toBe(0)
    for (const el of lineStrokes(c)) {
      expect(el.getAttribute('stroke-dasharray')).not.toBe('4')
    }
    c.destroy()
  })

  test('an area series keeps its parts and the overlay line stays plain', () => {
    const c = combo({ mark: 'area' })
    expect(c.highlightFilter.canDrawParts()).toBe(true)
    expect(c.highlightFilter.isActive()).toBe(true)
    const areaParts = parts(c).filter((n) =>
      n.classList.contains('apexcharts-area'),
    )
    expect(areaParts.length).toBeGreaterThan(0)
    expect(lineParts(c).filter((n) => n.getAttribute('index') === '1').length).toBe(
      0,
    )
    const overlay = lineStrokes(c).filter((n) => n.getAttribute('index') === '1')
    expect(overlay.length).toBeGreaterThan(0)
    for (const el of overlay) {
      expect(el.getAttribute('stroke-dasharray')).not.toBe('4')
      expect(el.getAttribute('stroke-opacity')).not.toBe('0.2')
    }
    c.destroy()
  })

  test('others: fade gives the overlay line the highlighted whole', () => {
    const c = combo({ options: { highlightFilter: { others: 'fade' } } })
    expect(barParts(c).length).toBe(5)
    const strokes = lineStrokes(c)
    expect(strokes.length).toBeGreaterThan(0)
    for (const el of strokes) {
      expect(el.getAttribute('stroke-dasharray')).toBe('4')
    }
    expect(hasPrefix(keysOf(c.highlightFilter._targets), 'b:')).toBe(true)
    expect(hasPrefix(keysOf(c.highlightFilter._targets), 'l:')).toBe(true)
    c.destroy()
  })

  test.each(['column', 'bar'])(
    'a %s series with no parts stays plain when only the line carries parts',
    (mark) => {
      const c = combo({
        mark,
        labels: true,
        series: [
          { name: 'Sales', type: mark, data: SALES },
          {
            name: 'Trend',
            type: 'line',
            data: TREND,
            highlightData: [10, 8, 6, 4, 2],
          },
        ],
      })
      expect(barParts(c).length).toBe(0)
      expect(lineParts(c).length).toBeGreaterThan(0)
      expect(bars(c).length).toBe(5)
      for (const el of bars(c)) {
        expect(el.getAttribute('fill-opacity')).not.toBe('0.2')
      }
      const strokes = lineStrokes(c)
      expect(strokes.some((n) => n.getAttribute('stroke-dasharray') === '4')).toBe(
        true,
      )
      const texts = (realIndex) =>
        q(c, '.apexcharts-datalabels')
          .filter((g) => g.getAttribute('data:realIndex') === String(realIndex))
          .flatMap((g) => [...g.querySelectorAll('.apexcharts-datalabel')])
          .map((t) => t.textContent)
      expect(texts(0)).toEqual(['40', '15', '14', '20', '11'])
      expect(texts(1)).toEqual(['10', '8', '6', '4', '2'])
      c.destroy()
    },
  )

  test('others: fade still fades a column series that carries no parts', () => {
    const c = combo({
      options: { highlightFilter: { others: 'fade' } },
      series: [
        { name: 'Sales', type: 'column', data: SALES },
        {
          name: 'Trend',
          type: 'line',
          data: TREND,
          highlightData: [10, 8, 6, 4, 2],
        },
      ],
    })
    expect(barParts(c).length).toBe(0)
    expect(bars(c).length).toBe(5)
    for (const el of bars(c)) {
      expect(el.getAttribute('fill-opacity')).toBe('0.2')
    }
    c.destroy()
  })

  test('a line that carries parts is drawn and dashed, beside the columns', () => {
    const c = combo({
      series: [
        {
          name: 'Sales',
          type: 'column',
          data: SALES,
          highlightData: PARTS,
        },
        {
          name: 'Trend',
          type: 'line',
          data: TREND,
          highlightData: [10, 8, 6, 4, 2],
        },
      ],
    })
    expect(barParts(c).length).toBe(5)
    expect(lineParts(c).length).toBeGreaterThan(0)
    const strokes = lineStrokes(c)
    expect(strokes.some((n) => n.getAttribute('stroke-dasharray') === '4')).toBe(
      true,
    )
    expect(hasPrefix(keysOf(c.highlightFilter._targets), 'b:')).toBe(true)
    expect(hasPrefix(keysOf(c.highlightFilter._targets), 'l:')).toBe(true)
    c.destroy()
  })

  test('the overlay line keeps its labels; the columns state the part', () => {
    const c = combo({ labels: true })
    const texts = (realIndex) =>
      q(c, '.apexcharts-datalabels')
        .filter((g) => g.getAttribute('data:realIndex') === String(realIndex))
        .flatMap((g) => [...g.querySelectorAll('.apexcharts-datalabel')])
        .map((t) => t.textContent)
    expect(texts(0)).toEqual(['18', '11', '6', '10', '7'])
    expect(texts(1)).toEqual(['33', '26', '20', '15', '10'])
    c.destroy()
  })

  test('a later render still leaves a partless column and a stacked line plain', async () => {
    const series = [
      { name: 'A', type: 'column', data: [10, 20] },
      { name: 'B', type: 'column', data: [6, 12], highlightData: [2, 5] },
      { name: 'T', type: 'line', data: [8, 16] },
    ]
    const c = createChartWithOptions({
      chart: { type: 'line', stacked: true, width: 600, height: 300 },
      series,
      xaxis: { categories: ['P', 'Q'] },
      stroke: { width: [0, 0, 3] },
      dataLabels: { enabled: false },
    })
    await c.updateSeries(series, false)
    const of = (index) =>
      bars(c).filter((n) => n.getAttribute('index') === index)
    for (const el of of('0')) {
      expect(el.getAttribute('fill-opacity')).not.toBe('0.2')
    }
    for (const el of of('1')) {
      expect(el.getAttribute('fill-opacity')).toBe('0.2')
    }
    expect(lineParts(c).length).toBe(0)
    for (const el of lineStrokes(c)) {
      expect(el.getAttribute('stroke-dasharray')).not.toBe('4')
    }
    c.destroy()
  })

  test('a later render still leaves the line plain and keeps both renderers', async () => {
    const c = combo()
    await c.updateSeries(
      [
        {
          name: 'Sales',
          type: 'column',
          data: SALES,
          highlightData: PARTS,
        },
        { name: 'Trend', type: 'line', data: TREND },
      ],
      false,
    )
    expect(barParts(c).length).toBe(5)
    expect(lineParts(c).length).toBe(0)
    for (const el of lineStrokes(c)) {
      expect(el.getAttribute('stroke-dasharray')).not.toBe('4')
    }
    expect(hasPrefix(keysOf(c.highlightFilter._targets), 'b:')).toBe(true)
    expect(hasPrefix(keysOf(c.highlightFilter._targets), 'l:')).toBe(true)
    expect(hasPrefix([...c.highlightFilter._seen], 'b:')).toBe(true)
    c.destroy()
  })

  test('a new pass drops the previous targets; the same pass does not', () => {
    const c = combo()
    const hf = c.highlightFilter
    hf._targets.set('keep', { d: 'x', f: 1 })
    hf._seen.add('keep')
    hf._beginRender({ id: 'line-again' }, 'l:')
    expect(hf._targets.has('keep')).toBe(true)
    expect(hf._seen.has('keep')).toBe(true)
    expect(hasPrefix(keysOf(hf._targets), 'b:')).toBe(true)

    hf.beginPass()
    hf._beginRender({ id: 'bar-next' }, 'l:')
    expect(hf._targets.has('keep')).toBe(false)
    expect(hf._seen.has('keep')).toBe(false)
    expect(hasPrefix(keysOf(hf._targets), 'b:')).toBe(false)
    c.destroy()
  })

  test('a clear on the next pass leaves no targets behind', async () => {
    const c = combo()
    expect(c.highlightFilter._targets.size).toBeGreaterThan(0)
    await c.highlightFilter.clear({ animate: false })
    expect(c.highlightFilter.isActive()).toBe(false)
    expect(parts(c).length).toBe(0)
    expect(c.highlightFilter._targets.size).toBe(0)
    for (const el of bars(c)) {
      expect(el.getAttribute('fill-opacity')).not.toBe('0.2')
    }
    for (const el of lineStrokes(c)) {
      expect(el.getAttribute('stroke-dasharray')).not.toBe('4')
    }
    c.destroy()
  })
})

describe('stacked combos leave a series with no parts plain', () => {
  test('a line with no parts is not dashed', () => {
    const c = createChartWithOptions({
      chart: { type: 'line', stacked: true, width: 600, height: 300 },
      series: [
        { name: 'A', type: 'column', data: [10, 20], highlightData: [4, 8] },
        { name: 'B', type: 'column', data: [6, 12], highlightData: [2, 5] },
        { name: 'T', type: 'line', data: [8, 16] },
      ],
      xaxis: { categories: ['P', 'Q'] },
      stroke: { width: [0, 0, 3] },
      dataLabels: { enabled: false },
    })
    expect(barParts(c).length).toBe(4)
    expect(lineParts(c).length).toBe(0)
    for (const el of bars(c)) {
      expect(el.getAttribute('fill-opacity')).toBe('0.2')
    }
    const strokes = lineStrokes(c)
    expect(strokes.length).toBeGreaterThan(0)
    for (const el of strokes) {
      expect(el.getAttribute('stroke-dasharray')).not.toBe('4')
      expect(el.getAttribute('stroke-opacity')).not.toBe('0.2')
    }
    c.destroy()
  })

  test('others: fade still dashes a stacked line that carries no parts', () => {
    const c = createChartWithOptions({
      chart: { type: 'line', stacked: true, width: 600, height: 300 },
      series: [
        { name: 'A', type: 'column', data: [10, 20], highlightData: [4, 8] },
        { name: 'T', type: 'line', data: [8, 16] },
      ],
      xaxis: { categories: ['P', 'Q'] },
      stroke: { width: [0, 3] },
      dataLabels: { enabled: false },
      highlightFilter: { others: 'fade' },
    })
    const strokes = lineStrokes(c)
    expect(strokes.length).toBeGreaterThan(0)
    for (const el of strokes) {
      expect(el.getAttribute('stroke-dasharray')).toBe('4')
    }
    c.destroy()
  })

  test('a stacked line that carries parts is still dashed', () => {
    const c = createChartWithOptions({
      chart: { type: 'line', stacked: true, width: 600, height: 300 },
      series: [
        { name: 'A', type: 'column', data: [10, 20], highlightData: [4, 8] },
        {
          name: 'T',
          type: 'line',
          data: [8, 16],
          highlightData: [3, 4],
        },
      ],
      xaxis: { categories: ['P', 'Q'] },
      stroke: { width: [0, 3] },
      dataLabels: { enabled: false },
    })
    expect(lineParts(c).length).toBeGreaterThan(0)
    expect(
      lineStrokes(c).some((n) => n.getAttribute('stroke-dasharray') === '4'),
    ).toBe(true)
    c.destroy()
  })

  test('a stacked column series with no parts stays plain, and the total stays the part sum', () => {
    const c = createChartWithOptions({
      chart: { type: 'line', stacked: true, width: 600, height: 300 },
      series: [
        { name: 'A', type: 'column', data: [10, 20], highlightData: [4, 8] },
        { name: 'B', type: 'column', data: [6, 12] },
        { name: 'T', type: 'line', data: [8, 16] },
      ],
      xaxis: { categories: ['P', 'Q'] },
      stroke: { width: [0, 0, 3] },
      dataLabels: { enabled: true },
      plotOptions: { bar: { dataLabels: { total: { enabled: true } } } },
    })
    const of = (index) =>
      bars(c).filter((n) => n.getAttribute('index') === index)
    expect(of('0').length).toBe(2)
    expect(of('1').length).toBe(2)
    for (const el of of('0')) {
      expect(el.getAttribute('fill-opacity')).toBe('0.2')
    }
    for (const el of of('1')) {
      expect(el.getAttribute('fill-opacity')).not.toBe('0.2')
    }
    for (const el of lineStrokes(c)) {
      expect(el.getAttribute('stroke-dasharray')).not.toBe('4')
    }
    const texts = (realIndex) =>
      q(c, '.apexcharts-datalabels')
        .filter((g) => g.getAttribute('data:realIndex') === String(realIndex))
        .flatMap((g) => [...g.querySelectorAll('.apexcharts-datalabel')])
        .map((t) => t.textContent)
    expect(texts(0)).toEqual(['4', '8'])
    expect(texts(1)).toEqual(['6', '12'])
    expect(
      q(c, '.apexcharts-datalabel-total').map((t) => t.textContent),
    ).toEqual(['4', '8'])
    c.destroy()
  })

  test('a stacked area with no parts stays plain when the line carries parts', () => {
    const c = createChartWithOptions({
      chart: { type: 'line', stacked: true, width: 600, height: 300 },
      series: [
        { name: 'A', type: 'area', data: [10, 20, 14] },
        {
          name: 'T',
          type: 'line',
          data: [8, 16, 12],
          highlightData: [3, 4, 5],
        },
      ],
      xaxis: { categories: ['P', 'Q', 'R'] },
      stroke: { width: [2, 3] },
      dataLabels: { enabled: false },
    })
    const areaFills = q(c, '.apexcharts-area').filter(
      (n) =>
        n.getAttribute('index') === '0' &&
        !n.classList.contains('apexcharts-highlight-part') &&
        n.getAttribute('fill') !== 'none',
    )
    expect(areaFills.length).toBeGreaterThan(0)
    // A faded area is drawn at fadeOpacity times its own fill. Plain keeps
    // the fill the renderer gave it.
    for (const el of areaFills) {
      expect(parseFloat(el.getAttribute('fill-opacity') ?? '1')).toBeGreaterThan(
        0.5,
      )
    }
    expect(lineParts(c).length).toBeGreaterThan(0)
    c.destroy()
  })
})

describe('stacked combo extent follows each series type', () => {
  test('columns diverge and the line does not join their stack', () => {
    const c = createChartWithOptions({
      chart: { type: 'line', stacked: true, width: 600, height: 300 },
      series: [
        { name: 'A', type: 'column', data: [10], highlightData: [4] },
        { name: 'B', type: 'column', data: [6], highlightData: [-2] },
        { name: 'T', type: 'line', data: [8] },
      ],
      xaxis: { categories: ['P'] },
      stroke: { width: [0, 0, 3] },
      dataLabels: { enabled: false },
    })
    // Positives and negatives are separate sums, as a bar stack draws them.
    // Netting them (the line chart's rule) would make the second part 2.
    expect(c.w.highlightData.active).toBe(true)
    expect(c.w.highlightData.ext).toEqual([[4], [-2], [null]])
    expect(barParts(c).length).toBe(2)
    expect(lineParts(c).length).toBe(0)
    c.destroy()
  })
})

describe('a combo with an unsupported series still draws no parts', () => {
  test('a column plus a scatter is refused', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const c = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 300 },
      series: [
        {
          name: 'Sales',
          type: 'column',
          data: [10, 20],
          highlightData: [4, 5],
        },
        { name: 'Dots', type: 'scatter', data: [3, 4] },
      ],
      xaxis: { categories: ['P', 'Q'] },
      dataLabels: { enabled: false },
    })
    expect(c.w.globals.comboCharts).toBe(true)
    expect(c.highlightFilter.canDrawParts()).toBe(false)
    expect(c.highlightFilter.isActive()).toBe(false)
    expect(parts(c).length).toBe(0)
    expect(
      warn.mock.calls.some((args) =>
        String(args[0]).includes('parts are not drawn'),
      ),
    ).toBe(true)
    c.destroy()
  })
})
