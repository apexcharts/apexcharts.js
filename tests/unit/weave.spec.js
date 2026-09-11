import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/full.js'

// ---------------------------------------------------------------------------
// Reference + probe plugins
// ---------------------------------------------------------------------------

function leastSquares(pts) {
  const n = pts.length
  let sx = 0,
    sy = 0,
    sxy = 0,
    sxx = 0
  for (const p of pts) {
    sx += p.x
    sy += p.y
    sxy += p.x * p.y
    sxx += p.x * p.x
  }
  const m = (n * sxy - sx * sy) / (n * sxx - sx * sx)
  const b = (sy - m * sx) / n
  return { m, b }
}

const regression = {
  name: 'regression',
  apiVersion: 1,
  setup(api) {
    api.on('draw', ({ scales, data }) => {
      if (!scales) return
      const layer = api.layer({ z: 'front', className: 'regression' })
      data.forEach((s, i) => {
        if (s.hidden) return
        const pts = s.points.filter((p) => p.y != null)
        if (pts.length < 2) return
        const { m, b } = leastSquares(pts)
        const [x0, x1] = scales.domainX
        layer.path({
          d: `M ${scales.x(x0)} ${scales.y(m * x0 + b, i)} L ${scales.x(x1)} ${scales.y(m * x1 + b, i)}`,
          stroke: api.theme.seriesColor(i),
          width: 2,
          dash: 4,
        })
      })
    })
  },
}

const watermark = {
  name: 'watermark',
  apiVersion: 1,
  setup(api) {
    api.on('draw', ({ scales }) => {
      if (!scales) return
      api.layer({ z: 'front' }).text({
        x: scales.gridWidth - 8,
        y: scales.gridHeight - 8,
        text: api.options.text || '',
        anchor: 'end',
        color: api.theme.foreColor,
      })
    })
  },
}

// module-scoped capture for facade/lifecycle assertions
const probeState = {}
const probe = {
  name: 'probe',
  apiVersion: 1,
  setup(api) {
    probeState.api = api
    probeState.hasNoRawW = api.w === undefined
    probeState.chartDestroyExcluded = api.chart.destroy === undefined
    probeState.chartHasUpdateOptions = typeof api.chart.updateOptions === 'function'
    probeState.optionsFrozen = Object.isFrozen(api.options)
    probeState.apiFrozen = Object.isFrozen(api)
    probeState.drawCount = 0
    probeState.destroyed = false
    api.on('draw', () => {
      probeState.drawCount++
    })
    api.on('destroy', () => {
      probeState.destroyed = true
    })
  },
}

const orderLog = []
const pluginA = {
  name: 'a',
  apiVersion: 1,
  setup(api) {
    api.on('draw', () => orderLog.push('a'))
  },
}
const pluginB = {
  name: 'b',
  apiVersion: 1,
  setup(api) {
    api.on('draw', () => orderLog.push('b'))
  },
}
const thrower = {
  name: 'thrower',
  apiVersion: 1,
  setup(api) {
    api.on('draw', () => {
      throw new Error('boom')
    })
  },
}
let badSetupRan = false
const badVersion = {
  name: 'badver',
  apiVersion: 99,
  setup() {
    badSetupRan = true
  },
}

beforeAll(() => {
  ;[regression, watermark, probe, pluginA, pluginB, thrower, badVersion].forEach(
    (p) => ApexCharts.registerPlugin(p),
  )
})

function scatterChart(plugins, extra = {}) {
  return createChartWithOptions({
    chart: {
      type: 'scatter',
      // explicit pixel size: jsdom has no layout, so without it the grid
      // geometry (and the api.scales pixel assertions) would be NaN
      width: 400,
      height: 300,
      animations: { enabled: false },
      toolbar: { show: false },
      ...extra.chart,
    },
    legend: { show: false },
    series: [
      { name: 'S1', data: [[0, 1], [2, 5], [4, 9], [6, 13], [8, 17]] },
      { name: 'S2', data: [[0, 10], [2, 8], [4, 6], [6, 4], [8, 2]] },
    ],
    xaxis: { type: 'numeric', min: 0, max: 8 },
    plugins,
  })
}

// ---------------------------------------------------------------------------

describe('Weave: registry', () => {
  it('registerPlugin is a static function; bad shape does not throw', () => {
    expect(typeof ApexCharts.registerPlugin).toBe('function')
    expect(() => ApexCharts.registerPlugin({ nope: true })).not.toThrow()
  })
})

describe('Weave: activation + layers', () => {
  it('activates plugins and draws their layers', async () => {
    const chart = scatterChart([
      { name: 'regression' },
      { name: 'watermark', options: { text: 'ACME' } },
    ])
    await chart.render()
    const el = chart.w.dom.baseEl
    expect(el.querySelector('.apexcharts-plugin-regression')).toBeTruthy()
    expect(el.querySelector('.apexcharts-plugin-watermark')).toBeTruthy()
    expect(
      el.querySelectorAll('.apexcharts-plugin-regression path').length,
    ).toBe(2)
    expect(el.querySelector('.apexcharts-plugin-watermark text').textContent).toBe(
      'ACME',
    )
    expect(el.querySelectorAll('.apexcharts-series').length).toBeGreaterThan(0)
    chart.destroy()
  })

  it('api.scales is layer-local: the domain edges map to 0 and the grid size', async () => {
    // The plugin layer <g> sits inside elGraphical, which already carries the
    // layout translate. These scales used to add the translate AGAIN, so
    // everything a plugin drew landed shifted by exactly the grid offset;
    // asserting the edges at 0 and gridWidth pins the coordinate space the
    // layer actually lives in.
    let captured = null
    const alignProbe = {
      name: 'align',
      apiVersion: 1,
      setup(api) {
        api.on('draw', ({ scales }) => {
          if (scales) captured = scales
        })
      },
    }
    ApexCharts.registerPlugin(alignProbe)
    const chart = scatterChart([{ name: 'align' }])
    await chart.render()
    const L = chart.w.layout
    expect(captured).toBeTruthy()
    expect(captured.x(captured.domainX[0])).toBeCloseTo(0, 6)
    expect(captured.x(captured.domainX[1])).toBeCloseTo(L.gridWidth, 6)
    expect(captured.y(captured.domainY(0)[1])).toBeCloseTo(0, 6)
    expect(captured.y(captured.domainY(0)[0])).toBeCloseTo(L.gridHeight, 6)
    chart.destroy()
  })

  it('api.scales projects a datum onto the same pixels the chart drew its marker at', async () => {
    // The contract behind api.layer: a plugin drawing at scales coordinates
    // must land ON the data. Markers carry their layer-local position as
    // cx/cy, so comparing against them proves the alignment end to end rather
    // than agreeing with the scales' own arithmetic.
    let captured = null
    const markerProbe = {
      name: 'markeralign',
      apiVersion: 1,
      setup(api) {
        api.on('draw', ({ scales }) => {
          if (scales) captured = scales
        })
      },
    }
    ApexCharts.registerPlugin(markerProbe)
    const chart = scatterChart([{ name: 'markeralign' }])
    await chart.render()
    expect(captured).toBeTruthy()

    const markers = Array.from(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-marker'),
    ).map((m) => ({
      cx: parseFloat(m.getAttribute('cx')),
      cy: parseFloat(m.getAttribute('cy')),
    }))
    expect(markers.length).toBeGreaterThan(0)

    // First and last datum of S1 in scatterChart's fixture.
    for (const [x, y] of [
      [0, 1],
      [8, 17],
    ]) {
      const px = captured.x(x)
      const py = captured.y(y, 0)
      const hit = markers.some(
        (m) => Math.abs(m.cx - px) < 0.5 && Math.abs(m.cy - py) < 0.5,
      )
      expect(hit).toBe(true)
    }
    chart.destroy()
  })
})

describe('Weave: facade integrity', () => {
  it('never exposes raw internals; freezes api/options; whitelists chart methods', async () => {
    const chart = scatterChart([{ name: 'probe' }])
    await chart.render()
    expect(probeState.hasNoRawW).toBe(true)
    expect(probeState.chartDestroyExcluded).toBe(true)
    expect(probeState.chartHasUpdateOptions).toBe(true)
    expect(probeState.optionsFrozen).toBe(true)
    expect(probeState.apiFrozen).toBe(true)
    chart.destroy()
  })
})

describe('Weave: layer lifecycle', () => {
  it('does not duplicate layers across a fast-path redraw; destroy hook fires on destroy only', async () => {
    probeState.drawCount = 0
    probeState.destroyed = false
    const chart = scatterChart([{ name: 'probe' }, { name: 'regression' }])
    await chart.render()
    const el = chart.w.dom.baseEl
    const before = probeState.drawCount

    await chart.updateSeries(
      [
        { name: 'S1', data: [[0, 2], [2, 6], [4, 10], [6, 14], [8, 18]] },
        { name: 'S2', data: [[0, 9], [2, 7], [4, 5], [6, 3], [8, 1]] },
      ],
      false,
    )
    expect(probeState.drawCount).toBeGreaterThan(before)
    expect(el.querySelectorAll('.apexcharts-plugin-regression').length).toBe(1)

    await chart.updateOptions({ title: { text: 'x' } }, false, false)
    expect(probeState.destroyed).toBe(false)
    chart.destroy()
    expect(probeState.destroyed).toBe(true)
  })
})

describe('Weave: order + isolation + version gate', () => {
  it('fires plugins in ascending order', async () => {
    orderLog.length = 0
    const chart = scatterChart([
      { name: 'a', order: 10 },
      { name: 'b', order: 5 },
    ])
    await chart.render()
    expect(orderLog[0]).toBe('b')
    expect(orderLog[1]).toBe('a')
    chart.destroy()
  })

  it('isolates a throwing plugin and disables it after repeated errors', async () => {
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {})
    const chart = scatterChart([{ name: 'thrower' }, { name: 'regression' }])
    await chart.render()
    const el = chart.w.dom.baseEl
    expect(el.querySelectorAll('.apexcharts-series').length).toBeGreaterThan(0)
    expect(
      el.querySelectorAll('.apexcharts-plugin-regression path').length,
    ).toBe(2)
    for (let i = 0; i < 4; i++) {
      await chart.updateSeries(
        chart.w.config.series.map((s) => ({ data: s.data })),
        false,
      )
    }
    const rec = chart.weave.active.find((r) => r.def.name === 'thrower')
    expect(rec.disabled).toBe(true)
    warn.mockRestore()
    chart.destroy()
  })

  it('skips a plugin whose apiVersion mismatches; chart still renders', async () => {
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {})
    badSetupRan = false
    const chart = scatterChart([{ name: 'badver' }, { name: 'regression' }])
    await chart.render()
    expect(badSetupRan).toBe(false)
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-plugin-regression path')
        .length,
    ).toBe(2)
    warn.mockRestore()
    chart.destroy()
  })
})

describe('Weave: emit namespacing + live options', () => {
  it('namespaces api.emit so a plugin cannot fire internal events', async () => {
    let payload = null
    let rawFired = false
    ApexCharts.registerPlugin({
      name: 'emitter',
      apiVersion: 1,
      setup(api) {
        api.on('draw', () => api.emit('ping', { ok: true }))
      },
    })
    const chart = scatterChart([{ name: 'emitter' }])
    await chart.render()
    chart.addEventListener('plugin:emitter:ping', (c, d) => {
      payload = d
    })
    chart.addEventListener('ping', () => {
      rawFired = true
    })
    // trigger another draw pass now that the listeners are attached
    await chart.updateSeries(
      [
        { name: 'S1', data: [[0, 1], [2, 5], [4, 9], [6, 13], [8, 17]] },
        { name: 'S2', data: [[0, 10], [2, 8], [4, 6], [6, 4], [8, 2]] },
      ],
      false,
    )
    expect(payload).toEqual({ ok: true })
    expect(rawFired).toBe(false)
    chart.destroy()
  })

  it('refreshes api.options when the plugins config changes (no stale reconcile)', async () => {
    let seen = null
    ApexCharts.registerPlugin({
      name: 'optprobe',
      apiVersion: 1,
      setup(api) {
        api.on('draw', () => {
          seen = api.options.label
        })
      },
    })
    const chart = scatterChart([{ name: 'optprobe', options: { label: 'one' } }])
    await chart.render()
    expect(seen).toBe('one')
    await chart.updateOptions(
      { plugins: [{ name: 'optprobe', options: { label: 'two' } }] },
      false,
      false,
    )
    expect(seen).toBe('two')
    chart.destroy()
  })
})

describe('Weave: dynamic add/remove via updateOptions', () => {
  it('adds and removes plugins when the plugins config changes', async () => {
    const chart = scatterChart([{ name: 'regression' }])
    await chart.render()
    const el = chart.w.dom.baseEl
    expect(el.querySelector('.apexcharts-plugin-regression')).toBeTruthy()
    expect(el.querySelector('.apexcharts-plugin-watermark')).toBeFalsy()

    await chart.updateOptions(
      { plugins: [{ name: 'regression' }, { name: 'watermark', options: { text: 'W' } }] },
      false,
      false,
    )
    expect(el.querySelector('.apexcharts-plugin-watermark')).toBeTruthy()

    await chart.updateOptions(
      { plugins: [{ name: 'watermark', options: { text: 'W' } }] },
      false,
      false,
    )
    expect(el.querySelector('.apexcharts-plugin-regression')).toBeFalsy()
    expect(el.querySelector('.apexcharts-plugin-watermark')).toBeTruthy()
    chart.destroy()
  })
})

describe('Weave: scales on a chart laid out in bands', () => {
  /**
   * Reported against apex-analyst: six drawing tools on a bar chart, six
   * buttons lit, nothing on the chart. The parser computes no x range for a
   * category bar, so globals.minX/maxX kept the sentinels they are seeded
   * with, and the facade divided every value down to the same pixel.
   *
   * Asserted against the marks the chart itself drew rather than against the
   * scales' own arithmetic, which is the only way this means anything: the
   * old behaviour also "worked" if you only asked it to be self-consistent.
   */
  const bandProbe = (name) => {
    const out = {}
    ApexCharts.registerPlugin({
      name,
      apiVersion: 2,
      setup(api) {
        api.on('draw', () => {
          out.scales = api.scales
          out.data = api.data
        })
      },
    })
    return out
  }

  /** The x of each bar path, which is where the chart really put it. */
  const barLefts = (chart) =>
    Array.from(chart.w.dom.baseEl.querySelectorAll('.apexcharts-bar-area')).map(
      (b) => Number(((b.getAttribute('d') || '').match(/-?\d+\.?\d*/g) || [])[0]),
    )

  it('places a category bar on its own band rather than on one pixel', async () => {
    const out = bandProbe('bandprobe')
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 800, height: 300 },
      series: [{ name: 'A', data: [10, 20, 30, 40, 50, 60] }],
      xaxis: { categories: ['a', 'b', 'c', 'd', 'e', 'f'] },
      plugins: [{ name: 'bandprobe' }],
    })
    await chart.render()

    const xs = out.data[0].points.map((p) => p.x)
    expect(xs).toEqual([0, 1, 2, 3, 4, 5])

    // Every band lands somewhere different, which is the whole defect.
    const px = xs.map((v) => out.scales.x(v))
    expect(new Set(px).size).toBe(6)

    // And each one lands on the centre of the bar it describes.
    const lefts = barLefts(chart)
    const barWidth = chart.w.globals.barWidth
    px.forEach((p, i) => {
      expect(Math.abs(p - (lefts[i] + barWidth / 2))).toBeLessThan(0.5)
    })

    chart.destroy()
  })

  it('keeps the contract that the domain edges are 0 and gridWidth', async () => {
    const out = bandProbe('bandedges')
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 800, height: 300 },
      series: [{ name: 'A', data: [10, 20, 30] }],
      xaxis: { categories: ['a', 'b', 'c'] },
      plugins: [{ name: 'bandedges' }],
    })
    await chart.render()

    // apex-analyst rebases by subtracting x(domainX[0]), which has to stay the
    // no-op the layer-local fix made it.
    const [lo, hi] = out.scales.domainX
    expect(out.scales.x(lo)).toBeCloseTo(0, 6)
    expect(out.scales.x(hi)).toBeCloseTo(chart.w.layout.gridWidth, 6)
    chart.destroy()
  })

  it('leaves a numeric or datetime x alone', async () => {
    const out = bandProbe('bandnumeric')
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 800, height: 300 },
      series: [{ name: 'A', data: [{ x: 1, y: 10 }, { x: 2, y: 20 }, { x: 3, y: 30 }] }],
      xaxis: { type: 'numeric' },
      plugins: [{ name: 'bandnumeric' }],
    })
    await chart.render()

    // The value itself, not a band index: this path was never broken and the
    // band projection must not reach it.
    expect(out.scales.domainX).toEqual([1, 3])
    expect(out.scales.x(1)).toBeCloseTo(0, 6)
    chart.destroy()
  })
})

// ---------------------------------------------------------------------------
// api.reserve (v3): a plugin asking the chart to make room for its own UI
// ---------------------------------------------------------------------------

describe('Weave: reserving container space for a plugin UI', () => {
  // Each probe reads its box from here rather than closing over a constant, so
  // one registered plugin can cover every case and a test can change the
  // reservation of a chart that is already on screen.
  const want = { one: null, two: null }
  let draws = 0

  const reserver = {
    name: 'reserver',
    apiVersion: 2,
    setup(api) {
      api.on('draw', () => {
        draws++
        api.reserve(want.one)
      })
    },
  }

  const reserver2 = {
    name: 'reserver2',
    apiVersion: 2,
    setup(api) {
      api.on('draw', () => api.reserve(want.two))
    },
  }

  let sawReserve = null
  const peek = {
    name: 'peek',
    apiVersion: 2,
    setup(api) {
      sawReserve = typeof api.reserve
    },
  }

  beforeAll(() => {
    ;[reserver, reserver2, peek].forEach((p) => ApexCharts.registerPlugin(p))
  })

  beforeEach(() => {
    want.one = null
    want.two = null
    draws = 0
    sawReserve = null
  })

  /**
   * reserve() re-renders on a deferred task, so that calling it from inside a
   * draw handler cannot re-enter the render. Nothing public reports when that
   * has landed, so wait for the box to move rather than for a fixed tick count.
   */
  const settle = async (chart, read, target, tries = 25) => {
    for (let i = 0; i < tries; i++) {
      if (read(chart) === target) return true
      await new Promise((r) => setTimeout(r, 0))
    }
    return read(chart)
  }

  const widthOf = (chart) => chart.w.globals.svgWidth
  const heightOf = (chart) => chart.w.globals.svgHeight

  const lineChart = (plugins, chartOpts = {}) =>
    createChartWithOptions({
      chart: {
        type: 'line',
        width: 600,
        height: 400,
        toolbar: { show: false },
        ...chartOpts,
      },
      legend: { show: false },
      series: [{ name: 'a', data: [1, 2, 3, 4] }],
      xaxis: { categories: ['w', 'x', 'y', 'z'] },
      plugins,
    })

  it('leaves the drawing box alone when nothing is reserved', () => {
    const chart = lineChart([{ name: 'reserver' }])
    expect(widthOf(chart)).toBe(600)
    expect(heightOf(chart)).toBe(400)
    expect(chart.weave.reservedBox()).toEqual({ left: 0, right: 0, top: 0, bottom: 0 })
    chart.destroy()
  })

  it('narrows the chart by the reserved gutter', async () => {
    want.one = { right: 160 }
    const chart = lineChart([{ name: 'reserver' }])
    expect(await settle(chart, widthOf, 440)).toBe(true)
    chart.destroy()
  })

  it('does not shorten an auto-height chart when the gutter is horizontal', async () => {
    // The whole reason the reservation is applied after the auto-height block:
    // opening a side panel must not move everything below the chart.
    want.one = { right: 150 }
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, toolbar: { show: false } },
      legend: { show: false },
      series: [{ name: 'a', data: [1, 2, 3, 4] }],
      plugins: [{ name: 'reserver' }],
    })
    expect(await settle(chart, widthOf, 450)).toBe(true)
    expect(heightOf(chart)).toBeCloseTo(600 / 1.61, 6)
    chart.destroy()
  })

  it('takes a vertical gutter off the height', async () => {
    want.one = { top: 40, bottom: 60 }
    const chart = lineChart([{ name: 'reserver' }])
    expect(await settle(chart, heightOf, 300)).toBe(true)
    expect(widthOf(chart)).toBe(600)
    chart.destroy()
  })

  it('sums the reservations of two plugins rather than overlapping them', async () => {
    want.one = { right: 100 }
    want.two = { left: 60 }
    const chart = lineChart([{ name: 'reserver' }, { name: 'reserver2' }])
    expect(await settle(chart, widthOf, 440)).toBe(true)
    expect(chart.weave.reservedBox()).toEqual({ left: 60, right: 100, top: 0, bottom: 0 })
    chart.destroy()
  })

  it('gives the space back when the reservation is dropped', async () => {
    want.one = { right: 200 }
    const chart = lineChart([{ name: 'reserver' }])
    expect(await settle(chart, widthOf, 400)).toBe(true)

    want.one = null
    chart.weave.active[0].api.reserve(null)
    expect(await settle(chart, widthOf, 600)).toBe(true)
    chart.destroy()
  })

  it('re-renders once for a change and not again for the same box', async () => {
    // The draw handler reserves the same numbers on every pass. Without the
    // unchanged-box comparison in _reserve this is an infinite render loop
    // rather than a failing assertion, so the timeout is the real assertion.
    want.one = { right: 120 }
    const chart = lineChart([{ name: 'reserver' }])
    expect(await settle(chart, widthOf, 480)).toBe(true)
    const settledDraws = draws
    await new Promise((r) => setTimeout(r, 30))
    expect(draws).toBe(settledDraws)
    chart.destroy()
  })

  it('keeps the chart at half the box however much a plugin asks for', async () => {
    want.one = { right: 5000 }
    const chart = lineChart([{ name: 'reserver' }])
    expect(await settle(chart, widthOf, 300)).toBe(true)
    chart.destroy()
  })

  it('reserves nothing for values that are not usable pixel counts', () => {
    // A NaN reaching svgWidth makes the chart vanish with no error to trace it
    // back from, so unusable numbers are dropped rather than propagated.
    want.one = { right: NaN, left: -40, top: 'lots', bottom: Infinity }
    const chart = lineChart([{ name: 'reserver' }])
    expect(widthOf(chart)).toBe(600)
    expect(chart.weave.reservedBox()).toEqual({ left: 0, right: 0, top: 0, bottom: 0 })
    chart.destroy()
  })

  it('hands the gutter back when the plugin is removed from the chart', async () => {
    want.one = { right: 180 }
    const chart = lineChart([{ name: 'reserver' }])
    expect(await settle(chart, widthOf, 420)).toBe(true)

    await chart.updateOptions({ plugins: [] })
    expect(await settle(chart, widthOf, 600)).toBe(true)
    chart.destroy()
  })

  it('is offered to a plugin that declares the older API version', () => {
    // apex-analyst ships one build against both a v2 and a v3 host, so it
    // declares v2 (a host at v2 SKIPS a plugin declaring v3 outright) and
    // feature-detects this method. That only works if v2 plugins are given it.
    const chart = lineChart([{ name: 'peek' }])
    expect(sawReserve).toBe('function')
    chart.destroy()
  })
})
