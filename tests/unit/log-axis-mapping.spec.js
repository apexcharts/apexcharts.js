import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/standard.js'

function expectSeriesPositions(chart) {
  const w = chart.w
  w.config.series.forEach((series, i) => {
    const axis = w.globals.seriesYAxisReverseMap[i]
    const { niceMin, niceMax } = w.globals.yAxisScale[axis]
    const logarithmic = w.config.yaxis[axis].logarithmic
    const scale = (value) => (logarithmic ? Math.log(value) : value)
    const group = [...chart.el.querySelectorAll('.apexcharts-series')].find(
      (el) => el.getAttribute('data:realIndex') === String(i),
    )
    const paths = [
      ...group.querySelectorAll('path.apexcharts-line, path.apexcharts-area'),
    ].map((path) =>
      [
        ...path.getAttribute('d').matchAll(/[ML]\s*[-\d.]+[\s,]+([-\d.]+)/g),
      ].map((match) => Number(match[1])),
    )
    const ys = paths.sort((a, b) => a.length - b.length)[0]
    expect(ys).toHaveLength(series.data.length)
    series.data.forEach((value, j) => {
      const fraction =
        (scale(value) - scale(niceMin)) / (scale(niceMax) - scale(niceMin))
      expect(w.globals.seriesLog[i][j]).toBeCloseTo(
        logarithmic ? fraction : value,
        10,
      )
      expect(ys[j]).toBeCloseTo(w.layout.gridHeight * (1 - fraction), 1)
    })
  })
}

describe('logarithmic bounds use the assigned axis', () => {
  it.each(['line', 'area'])(
    'keeps added %s series on their shared axis',
    async (type) => {
      const chart = createChartWithOptions({
        chart: { type, width: 600, height: 400 },
        stroke: { curve: 'straight' },
        series: [{ name: 'A', data: [1e-5, 1e-4, 1e-3] }],
        yaxis: { logarithmic: true },
      })
      await chart.updateSeries(
        [
          { name: 'A', data: [1e-5, 1e-4, 1e-3] },
          { name: 'B', data: [2e-5, 2e-4, 2e-3] },
        ],
        false,
      )
      expect(chart.w.globals.isMultipleYAxis).toBe(false)
      expect(chart.w.globals.seriesYAxisReverseMap).toEqual([0, 0])
      expectSeriesPositions(chart)

      await chart.appendSeries({ name: 'C', data: [3e-5, 3e-4, 3e-3] }, false)
      expect(chart.w.globals.seriesYAxisReverseMap).toEqual([0, 0, 0])
      expectSeriesPositions(chart)
      chart.destroy()
    },
  )

  it('uses the mapped domains when axes and series have different orders', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 400 },
      stroke: { curve: 'straight' },
      series: [
        { name: 'A', data: [1, 128, 16384] },
        { name: 'B', data: [0.01, 1, 100] },
      ],
      yaxis: [
        { seriesName: ['B'], logarithmic: true, min: 0.01, max: 100 },
        {
          seriesName: ['A'],
          logarithmic: true,
          logBase: 2,
          min: 1,
          max: 16384,
          opposite: true,
        },
      ],
    })
    expect(chart.w.globals.seriesYAxisReverseMap).toEqual([1, 0])
    expectSeriesPositions(chart)
    chart.destroy()
  })

  it('draws multiple series supplied initially on a shared logarithmic axis', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 400 },
      stroke: { curve: 'straight' },
      series: [
        { name: 'A', data: [1, 100, 10000] },
        { name: 'B', data: [2, 200, 20000] },
      ],
      yaxis: { logarithmic: true },
    })
    expect(chart.w.config.yaxis).toHaveLength(2)
    expect(chart.w.globals.isMultipleYAxis).toBe(true)
    expect(chart.w.globals.seriesYAxisReverseMap).toEqual([0, 0])
    expectSeriesPositions(chart)
    chart.destroy()
  })

  it.each([
    [2, 3],
    [3, 2],
    [2, 2],
  ])(
    'keeps %i series started on a shared axis on it when updated to %i',
    async (before, after) => {
      const rows = [
        [1, 100, 10000],
        [2, 200, 20000],
        [3, 300, 30000],
      ]
      const make = (n, prefix) =>
        rows.slice(0, n).map((data, i) => ({ name: prefix + i, data }))
      const chart = createChartWithOptions({
        chart: { type: 'line', width: 600, height: 400 },
        stroke: { curve: 'straight' },
        series: make(before, 'S'),
        yaxis: { logarithmic: true },
      })
      await chart.updateSeries(make(after, 'N'), false)
      const fresh = createChartWithOptions({
        chart: { type: 'line', width: 600, height: 400 },
        stroke: { curve: 'straight' },
        series: make(after, 'N'),
        yaxis: { logarithmic: true },
      })
      expect(chart.w.config.yaxis).toHaveLength(after)
      expect(chart.w.globals.seriesYAxisReverseMap).toEqual(
        Array(after).fill(0),
      )
      expect(chart.w.globals.seriesLog).toEqual(fresh.w.globals.seriesLog)
      expectSeriesPositions(chart)
      chart.destroy()
      fresh.destroy()
    },
  )

  it.each([
    ['updateSeries', ['A', 'B'], ['B', 'A']],
    ['updateOptions', ['A', 'B'], ['B', 'A']],
    ['updateSeries', ['A', 'B', 'C'], ['Z', 'B', 'A']],
    ['updateSeries', ['A', 'B', 'C'], ['A', 'C', 'B']],
  ])(
    'keeps reordered series on the shared axis (%s, %j to %j)',
    async (method, before, after) => {
      // #5353: same count, but the series the axes name moved.
      const rows = { A: [1, 100, 10000], B: [5, 50, 500], C: [3, 300, 3000] }
      const make = (names) =>
        names.map((name) => ({ name, data: rows[name] || [2, 20, 200] }))
      const options = (names) => ({
        chart: { type: 'line', width: 600, height: 400 },
        stroke: { curve: 'straight' },
        series: make(names),
        yaxis: { logarithmic: true },
      })
      const chart = createChartWithOptions(options(before))
      if (method === 'updateSeries') {
        await chart.updateSeries(make(after), false)
      } else {
        await chart.updateOptions({ series: make(after) }, false, false)
      }
      const fresh = createChartWithOptions(options(after))
      expect(chart.w.globals.seriesYAxisReverseMap).toEqual(
        Array(after.length).fill(0),
      )
      expect(chart.w.globals.yAxisScale[0]).toEqual(
        fresh.w.globals.yAxisScale[0],
      )
      expect(chart.w.globals.seriesLog).toEqual(fresh.w.globals.seriesLog)
      expectSeriesPositions(chart)
      chart.destroy()
      fresh.destroy()
    },
  )

  it('keeps the shared axis when resetSeries restores a different order', async () => {
    const rows = { A: [1, 100, 10000], B: [5, 50, 500], C: [3, 30, 3000000] }
    const make = (names) => names.map((name) => ({ name, data: rows[name] }))
    const options = (names) => ({
      chart: { type: 'line', width: 600, height: 400 },
      stroke: { curve: 'straight' },
      series: make(names),
      yaxis: { logarithmic: true },
    })
    const chart = createChartWithOptions(options(['A', 'B', 'C']))
    // Not overwriting initialSeries, so the reset goes back to A, B, C.
    await chart.updateSeries(make(['C', 'B', 'A']), false, false)
    expect(chart.w.globals.seriesYAxisReverseMap).toEqual([0, 0, 0])
    chart.resetSeries()
    await new Promise((resolve) => setTimeout(resolve, 0))
    const fresh = createChartWithOptions(options(['A', 'B', 'C']))
    expect(chart.w.config.series.map((s) => s.name)).toEqual(['A', 'B', 'C'])
    expect(chart.w.globals.seriesYAxisReverseMap).toEqual([0, 0, 0])
    expect(chart.w.globals.yAxisScale[0]).toEqual(fresh.w.globals.yAxisScale[0])
    chart.destroy()
    fresh.destroy()
  })

  it.each([
    [['B', 'A']],
    [['B', 'A', 'C']],
  ])(
    'keeps reordered series on the shared axis while a logarithmic breakpoint is active (%j)',
    async (after) => {
      const rows = { A: [1, 100, 10000], B: [5, 50, 500], C: [3, 300, 3000] }
      const make = (names) => names.map((name) => ({ name, data: rows[name] }))
      const options = (names) => ({
        chart: { type: 'line', width: 600, height: 400 },
        stroke: { curve: 'straight' },
        series: make(names),
        yaxis: { logarithmic: true },
        responsive: [
          {
            breakpoint: 1000,
            options: { yaxis: { logarithmic: true, tickAmount: 3 } },
          },
        ],
      })
      const width = window.innerWidth
      window.innerWidth = 500
      try {
        const chart = createChartWithOptions(options(['A', 'B']))
        await chart.updateSeries(make(after), false)
        const fresh = createChartWithOptions(options(after))
        expect(chart.w.globals.seriesYAxisReverseMap).toEqual(
          Array(after.length).fill(0),
        )
        expect(chart.w.globals.yAxisScale[0]).toEqual(
          fresh.w.globals.yAxisScale[0],
        )
        chart.destroy()
        fresh.destroy()
      } finally {
        window.innerWidth = width
      }
    },
  )

  it('keeps series added by updateOptions on the shared axis', async () => {
    const rows = [
      [1, 100, 10000],
      [2, 200, 20000],
      [3, 300, 30000],
    ]
    const make = (n) =>
      rows.slice(0, n).map((data, i) => ({ name: 'S' + i, data }))
    const options = (n) => ({
      chart: { type: 'line', width: 600, height: 400 },
      stroke: { curve: 'straight' },
      series: make(n),
      yaxis: { logarithmic: true },
    })
    const chart = createChartWithOptions(options(2))
    await chart.updateOptions({ series: make(3) }, false, false)
    const fresh = createChartWithOptions(options(3))
    expect(chart.w.globals.seriesYAxisReverseMap).toEqual([0, 0, 0])
    expect(chart.w.globals.seriesLog).toEqual(fresh.w.globals.seriesLog)
    expectSeriesPositions(chart)
    chart.destroy()
    fresh.destroy()
  })

  it('keeps added series on the shared axis through a zoom', async () => {
    const rows = [
      [1, 100, 10000, 100000],
      [2, 200, 20000, 200000],
      [3, 300, 30000, 300000],
    ]
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 400 },
      stroke: { curve: 'straight' },
      series: rows.slice(0, 2).map((data, i) => ({
        name: 'S' + i,
        data: data.map((y, x) => [x, y]),
      })),
      xaxis: { type: 'numeric' },
      yaxis: { logarithmic: true },
    })
    await chart.updateSeries(
      rows.map((data, i) => ({
        name: 'S' + i,
        data: data.map((y, x) => [x, y]),
      })),
      false,
    )
    chart.zoomX(1, 3)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(chart.w.globals.seriesYAxisReverseMap).toEqual([0, 0, 0])
    expect(chart.w.globals.seriesLog.flat().every(Number.isFinite)).toBe(true)
    chart.destroy()
  })

  it.each([
    ['one series to three', [1], [3]],
    ['no series to three', [0], [3]],
    ['two to one to three', [2, 1], [3]],
  ])(
    'keeps added series on the shared axis: %s',
    async (_label, steps, last) => {
      const rows = [
        [1, 100, 10000],
        [2, 200, 20000],
        [3, 300, 30000],
      ]
      const make = (n) =>
        rows.slice(0, n).map((data, i) => ({ name: 'S' + i, data }))
      const [first, ...rest] = steps
      const chart = createChartWithOptions({
        chart: { type: 'line', width: 600, height: 400 },
        stroke: { curve: 'straight' },
        series: make(first),
        yaxis: { logarithmic: true },
      })
      for (const n of [...rest, ...last])
        await chart.updateSeries(make(n), false)
      expect(chart.w.globals.seriesYAxisReverseMap).toEqual([0, 0, 0])
      expectSeriesPositions(chart)
      chart.destroy()
    },
  )

  it('keeps added series on the shared axis while a breakpoint sets yaxis', async () => {
    const width = window.innerWidth
    window.innerWidth = 500
    const rows = [
      [1, 100, 10000],
      [2, 200, 20000],
      [3, 300, 30000],
    ]
    const make = (n) =>
      rows.slice(0, n).map((data, i) => ({ name: 'S' + i, data }))
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 400 },
      stroke: { curve: 'straight' },
      series: make(2),
      yaxis: { logarithmic: true },
      responsive: [
        { breakpoint: 1000, options: { yaxis: { labels: { show: true } } } },
      ],
    })
    await chart.updateSeries(make(3), false)
    window.innerWidth = width
    expect(chart.w.globals.seriesYAxisReverseMap).toEqual([0, 0, 0])
    chart.destroy()
  })

  it('does not touch frozen unnamed series passed to updateSeries', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 400 },
      stroke: { curve: 'straight' },
      series: [{ data: [1, 100, 10000] }, { data: [2, 200, 20000] }],
      yaxis: { logarithmic: true },
    })
    const next = [
      { data: [1, 100, 10000] },
      { data: [2, 200, 20000] },
      { data: [3, 300, 30000] },
    ].map((s) => Object.freeze({ ...s }))
    await chart.updateSeries(next, false)
    expect(next.every((s) => !('name' in s))).toBe(true)
    expect(chart.w.globals.seriesYAxisReverseMap).toEqual([0, 0, 0])
    chart.destroy()
  })

  it('does not touch a frozen unnamed payload passed to updateOptions', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 400 },
      stroke: { curve: 'straight' },
      series: [{ data: [1, 100, 10000] }, { data: [2, 200, 20000] }],
      yaxis: { logarithmic: true },
    })
    const series = [
      { data: [1, 100, 10000] },
      { data: [2, 200, 20000] },
      { data: [3, 300, 30000] },
    ].map((s) => Object.freeze({ ...s }))
    const payload = Object.freeze({ series: Object.freeze(series) })
    await chart.updateOptions(payload, false, false)
    expect(series.every((s) => !('name' in s))).toBe(true)
    expect(chart.w.globals.seriesYAxisReverseMap).toEqual([0, 0, 0])
    chart.destroy()
  })

  it('keeps the axes and names the series when unnamed series are updated in place', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 400 },
      stroke: { curve: 'straight' },
      series: [{ data: [1, 100, 10000] }, { data: [2, 200, 20000] }],
      yaxis: { logarithmic: true },
    })
    const w = chart.w
    const axes = w.config.yaxis
    const initialAxes = w.globals.initialConfig.yaxis
    const next = [{ data: [1, 100, 10000] }, { data: [5, 500, 5000] }]
    await chart.updateSeries(next, false)
    expect(w.config.yaxis).toBe(axes)
    expect(w.globals.initialConfig.yaxis).toBe(initialAxes)
    expect(w.config.series.map((s) => s.name)).toEqual(['series-1', 'series-2'])
    expect(next.every((s) => !('name' in s))).toBe(true)
    await chart.updateOptions({ series: next }, false, false)
    expect(w.config.yaxis).toBe(axes)
    expect(w.globals.initialConfig.yaxis).toBe(initialAxes)
    expect(w.globals.seriesYAxisReverseMap).toEqual([0, 0])
    chart.destroy()
  })

  it('keeps the axes when the visible axis names another series', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 400 },
      stroke: { curve: 'straight' },
      series: [
        { name: 'A', data: [1, 100, 10000] },
        { name: 'B', data: [2, 200, 20000] },
      ],
      yaxis: [
        { logarithmic: true, seriesName: 'B' },
        { logarithmic: true, show: false, seriesName: 'B' },
      ],
    })
    const w = chart.w
    const axes = w.config.yaxis
    await chart.updateSeries(
      [
        { name: 'A', data: [1, 100, 10000] },
        { name: 'B', data: [4, 400, 4000] },
      ],
      false,
    )
    expect(w.config.yaxis).toBe(axes)
    expect(w.config.yaxis[0].seriesName).toBe('B')
    chart.destroy()
  })

  it.each([
    ['a linear chart', {}, [{ name: 'A', data: [1, 2, 3] }]],
    [
      'named series on a shared log axis',
      { yaxis: { logarithmic: true } },
      [
        { name: 'A', data: [1, 2, 3] },
        { name: 'B', data: [2, 4, 6] },
      ],
    ],
  ])('does not copy the series of %s', (_label, extra, series) => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 400 },
      series,
      ...extra,
    })
    let reads = 0
    const next = series.map((s) => {
      const copy = { name: s.name }
      Object.defineProperty(copy, 'data', {
        enumerable: true,
        get() {
          reads++
          return s.data
        },
      })
      return copy
    })
    expect(chart.updateHelpers.syncSharedLogAxes(next)).toBe(next)
    expect(reads).toBe(0)
    chart.destroy()
  })

  it('leaves a hidden log axis the user declared alone on updateSeries', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 400 },
      stroke: { curve: 'straight' },
      series: [
        { name: 'A', data: [1, 100, 10000] },
        { name: 'B', data: [2, 200, 20000] },
      ],
      yaxis: [
        { logarithmic: true, min: 1, max: 10000 },
        { logarithmic: true, show: false, min: 2, max: 20000 },
      ],
    })
    await chart.updateSeries(
      [
        { name: 'A', data: [1, 100, 10000] },
        { name: 'B', data: [4, 400, 4000] },
      ],
      false,
    )
    expect(chart.w.config.yaxis).toHaveLength(2)
    expect(chart.w.globals.seriesYAxisReverseMap).toEqual([0, 1])
    expectSeriesPositions(chart)
    chart.destroy()
  })

  it('keeps reversed linear and logarithmic axes distinct after updates', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 400 },
      stroke: { curve: 'straight' },
      series: [
        { name: 'A', data: [1, 100, 10000] },
        { name: 'B', data: [0, 50, 100] },
      ],
      yaxis: [
        { seriesName: ['B'], min: 0, max: 100 },
        { seriesName: ['A'], logarithmic: true, min: 1, max: 10000 },
      ],
    })
    expect(chart.w.globals.seriesYAxisReverseMap).toEqual([1, 0])
    expectSeriesPositions(chart)
    await chart.updateSeries(
      [
        { name: 'A', data: [10, 1000, 10000] },
        { name: 'B', data: [25, 75, 100] },
      ],
      false,
    )
    expectSeriesPositions(chart)
    chart.destroy()
  })

  it.each([false, true])(
    'renders and clears a logarithmic radar chart (initial data: %s)',
    async (hasData) => {
      document.body.innerHTML = '<div id="chart" />'
      const series = [{ name: 'A', data: [1, 10, 100, 1000, 10000] }]
      const chart = new ApexCharts(document.querySelector('#chart'), {
        chart: {
          type: 'radar',
          width: 600,
          height: 400,
          animations: { enabled: false },
        },
        series: hasData ? series : [],
        labels: ['a', 'b', 'c', 'd', 'e'],
        yaxis: { logarithmic: true },
      })
      await chart.render()
      await chart.updateSeries([], false)
      expect(chart.w.config.series).toEqual([])
      await chart.updateSeries(series, false)
      expect(chart.w.config.series[0].data).toEqual(series[0].data)
      expect(
        chart.el.querySelector('.apexcharts-radar-series .apexcharts-series'),
      ).not.toBeNull()
      const paths = chart.el.querySelectorAll(
        '.apexcharts-radar-series .apexcharts-series path',
      )
      expect(paths.length).toBeGreaterThan(0)
      paths.forEach((path) => {
        const d = path.getAttribute('d')
        expect(d).toMatch(/\d/)
        expect(d).not.toMatch(/NaN|Infinity/)
      })
      chart.destroy()
    },
  )

  it('keeps per-series bounds when adding a series to one of multiple axes', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 400 },
      stroke: { curve: 'straight' },
      series: [
        { name: 'A', data: [1, 100, 10000] },
        { name: 'B', data: [0, 50, 100] },
      ],
      yaxis: [
        { seriesName: ['A', 'C'], logarithmic: true, min: 1, max: 100000 },
        { seriesName: ['B'], min: 0, max: 100 },
      ],
    })
    await chart.appendSeries({ name: 'C', data: [10, 1000, 100000] }, false)
    expect(chart.w.globals.isMultipleYAxis).toBe(true)
    expect(chart.w.globals.seriesYAxisReverseMap).toEqual([0, 1, 0])
    expectSeriesPositions(chart)
    await chart.updateSeries(
      [
        { name: 'A', data: [1, 100, 10000] },
        { name: 'B', data: [25, 75, 100] },
        { name: 'C', data: [100, 10000, 100000] },
      ],
      false,
    )
    expectSeriesPositions(chart)
    chart.destroy()
  })
})
