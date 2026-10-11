import { describe, it, expect, vi } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'

// The update entry points used to normalise the CALLER's
// payload in place (normalizeAxisBounds, extendYAxis, annotation extenders,
// options.series reassignment, CoreUtils stamping series.group). A deep-frozen
// payload (immutable store state) therefore threw.
const deepFreeze = (o) => {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o)
    Object.values(o).forEach(deepFreeze)
  }
  return o
}

const mount = async () => {
  document.body.innerHTML = '<div id="c"></div>'
  const el = document.querySelector('#c')
  const chart = new ApexCharts(el, {
    chart: {
      type: 'line',
      width: 600,
      height: 300,
      animations: { enabled: false },
    },
    series: [{ name: 'A', data: [1, 2, 3] }],
    xaxis: { categories: ['a', 'b', 'c'] },
  })
  await chart.render()
  return chart
}

describe('update entry points treat payloads as read-only', () => {
  // NOTE: the constructor also throws on a deep-frozen config today
  // (Config.init -> extendYAxis, Config.js:370 `opts.yaxis = ...`), so frozen
  // input was never supported anywhere; this spec pins the update paths only.

  const cases = {
    'updateOptions({yaxis:{min,max}})': (c) =>
      c.updateOptions(deepFreeze({ yaxis: { min: 0, max: 100 } })),
    'updateOptions({series})': (c) =>
      c.updateOptions(deepFreeze({ series: [{ name: 'A', data: [3, 2, 1] }] })),
    'updateOptions({annotations:{yaxis}})': (c) =>
      c.updateOptions(deepFreeze({ annotations: { yaxis: [{ y: 2 }] } })),
    'updateSeries([...])': (c) =>
      c.updateSeries(deepFreeze([{ name: 'A', data: [3, 2, 1] }])),
  }

  for (const [name, run] of Object.entries(cases)) {
    it(`${name} with a deep-frozen payload resolves`, async () => {
      const chart = await mount()
      let err = null
      try {
        await run(chart)
      } catch (e) {
        err = e
      }
      expect(err && String(err.message)).toBe(null)
      chart.destroy()
    })
  }

  it('updateOptions does not rewrite the caller xaxis Date bound', async () => {
    document.body.innerHTML = '<div id="c"></div>'
    const chart = new ApexCharts(document.querySelector('#c'), {
      chart: {
        type: 'line',
        width: 600,
        height: 300,
        animations: { enabled: false },
      },
      series: [
        {
          name: 'A',
          data: [
            [Date.UTC(2024, 0, 1), 1],
            [Date.UTC(2024, 0, 10), 2],
          ],
        },
      ],
      xaxis: { type: 'datetime' },
    })
    await chart.render()
    const max = new Date(Date.UTC(2024, 0, 8))
    const payload = { xaxis: { max } }
    await chart.updateOptions(payload)
    expect(payload.xaxis.max).toBe(max)
    chart.destroy()
  })

  it('keeps the caller series objects untouched and their data by reference', async () => {
    const chart = await mount()
    const data = [3, 2, 1]
    const s = { name: 'A', data }
    await chart.updateSeries([s])
    expect(Object.keys(s)).toEqual(['name', 'data'])
    expect(chart.w.config.series[0]).not.toBe(s)
    expect(chart.w.config.series[0].data).toBe(data)
    chart.destroy()
  })

  it('updateOptions(undefined) resolves instead of throwing synchronously', async () => {
    const chart = await mount()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    let ret
    expect(() => {
      ret = chart.updateOptions(undefined)
    }).not.toThrow()
    await expect(ret).resolves.toBe(chart)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
    chart.destroy()
  })
})
