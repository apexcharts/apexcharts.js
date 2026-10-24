import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

/**
 * #5379: the runtime add*Annotation methods threw on charts without axes
 * (their annotation groups are only built for axis charts), and a line chart
 * carrying a runtime annotation rejected when switched to pie, because the
 * render replays remembered annotations onto the new type.
 *
 * Now the call warns, draws nothing, and keeps the annotation in memory so
 * it behaves like one passed in options.
 */

const NON_AXIS = {
  radialBar: { series: [62], labels: ['Score'] },
  gauge: { series: [70] },
  pie: { series: [3, 5, 2], labels: ['a', 'b', 'c'] },
  donut: { series: [3, 5, 2], labels: ['a', 'b', 'c'] },
  polarArea: { series: [3, 5, 2], labels: ['a', 'b', 'c'] },
}

const CALLS = [
  ['addYaxisAnnotation', { y: 30, label: { text: 'y' } }],
  ['addXaxisAnnotation', { x: 'b', label: { text: 'x' } }],
  ['addPointAnnotation', { x: 'b', y: 30, marker: { size: 6 } }],
]

const annoEls = (chart) =>
  chart.w.dom.baseEl.querySelectorAll(
    '.apexcharts-xaxis-annotations > *, .apexcharts-yaxis-annotations > *, .apexcharts-point-annotations > *',
  ).length

afterEach(() => vi.restoreAllMocks())

describe('runtime annotations on charts without axes (#5379)', () => {
  for (const [type, opts] of Object.entries(NON_AXIS)) {
    for (const [method, params] of CALLS) {
      it(`${method} on ${type} warns once, draws nothing, keeps it`, () => {
        const chart = createChartWithOptions({ chart: { type }, ...opts })
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        expect(() => chart[method]({ ...params })).not.toThrow()
        expect(warn).toHaveBeenCalledTimes(1)
        expect(warn.mock.calls[0][0]).toContain(`${method}()`)
        expect(annoEls(chart)).toBe(0)
        expect(chart.w.globals.memory.methodsToExec).toHaveLength(1)
      })
    }
  }

  it('a line chart with a runtime annotation switches to pie and back', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ name: 's', data: [1, 2, 3] }],
      xaxis: { categories: ['a', 'b', 'c'] },
    })
    chart.addYaxisAnnotation({ id: 'y2', y: 2 })
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-yaxis-annotations line'),
    ).toHaveLength(1)

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(
      chart.updateOptions({
        chart: { type: 'pie' },
        series: [1, 2, 3],
        labels: ['a', 'b', 'c'],
      }),
    ).resolves.toBe(chart)
    // the replay is silent and does not add a second memory entry
    expect(warn).not.toHaveBeenCalled()
    expect(chart.w.globals.memory.methodsToExec).toHaveLength(1)

    await chart.updateOptions({
      chart: { type: 'line' },
      series: [{ name: 's', data: [1, 2, 3] }],
    })
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-yaxis-annotations line'),
    ).toHaveLength(1)
  })
})
