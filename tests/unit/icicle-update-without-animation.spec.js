// updateSeries(data, false) asks for no animation. The sunburst honoured it;
// the icicle, with its own copy of the same mode gate, still tweened every
// cell over dynamicAnimation.speed.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/icicle.js'

const cell = (name) =>
  [...document.querySelectorAll('.apexcharts-icicle-cell')].find(
    (el) => el.getAttribute('data:name') === name,
  )

describe('icicle updateSeries(data, false)', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'Date',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'performance',
      ],
    })
  })
  afterEach(() => vi.useRealTimers())

  it('lands at once', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const c = new ApexCharts(document.querySelector('#chart'), {
      series: [{ data: [{ x: 'A', y: 40 }, { x: 'B', y: 60 }] }],
      chart: {
        type: 'icicle',
        width: 500,
        height: 400,
        animations: {
          enabled: true,
          speed: 300,
          dynamicAnimation: { enabled: true, speed: 800 },
        },
      },
    })
    const p = c.render()
    await vi.advanceTimersByTimeAsync(3000)
    await p

    const up = c.updateSeries(
      [{ data: [{ x: 'A', y: 80 }, { x: 'B', y: 20 }] }],
      false,
    )
    await vi.advanceTimersByTimeAsync(20)
    await up
    const early = cell('B').getAttribute('width')
    await vi.advanceTimersByTimeAsync(3000)
    expect(cell('B').getAttribute('width')).toBe(early)

    // ...while an animated update still tweens.
    const up2 = c.updateSeries([{ data: [{ x: 'A', y: 40 }, { x: 'B', y: 60 }] }])
    await vi.advanceTimersByTimeAsync(20)
    await up2
    const mid = cell('B').getAttribute('width')
    await vi.advanceTimersByTimeAsync(3000)
    expect(cell('B').getAttribute('width')).not.toBe(mid)
    c.destroy()
  })
})
