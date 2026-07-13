import { describe, it, expect, vi, beforeAll } from 'vitest'
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

describe('Weave — registry', () => {
  it('registerPlugin is a static function; bad shape does not throw', () => {
    expect(typeof ApexCharts.registerPlugin).toBe('function')
    expect(() => ApexCharts.registerPlugin({ nope: true })).not.toThrow()
  })
})

describe('Weave — activation + layers', () => {
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

  it('api.scales aligns to the grid edges', async () => {
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
    expect(captured.x(captured.domainX[0])).toBeCloseTo(L.translateX, 0)
    expect(captured.x(captured.domainX[1])).toBeCloseTo(
      L.translateX + L.gridWidth,
      0,
    )
    chart.destroy()
  })
})

describe('Weave — facade integrity', () => {
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

describe('Weave — layer lifecycle', () => {
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

describe('Weave — order + isolation + version gate', () => {
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

describe('Weave — dynamic add/remove via updateOptions', () => {
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
