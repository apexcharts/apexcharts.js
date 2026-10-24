/**
 * `tooltip.visible: false` (#5382): the hover keeps resolving the point under
 * the pointer and the chart events keep reporting it, while no tooltip box
 * (nor x/y-axis tooltip) is ever shown. `tooltip.enabled: false` is unchanged:
 * no hover handling, so a swept line reports `dataPointIndex: null`.
 *
 * jsdom measures every rect as zero, so `TooltipUtils.plotRect` puts the plot
 * corner at (translateX, translateY) and a pointer at
 * (translateX + px, translateY + py) is plot point (px, py).
 */
import { describe, it, expect, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

let chart
afterEach(() => {
  chart?.destroy()
  chart = null
})

const SERIES = [
  { name: 'A', data: [10, 80, 20, 70, 30] },
  { name: 'B', data: [50, 40, 60, 35, 55] },
]

function make(type, tooltip, extra = {}) {
  const log = []
  const rec = (name) => (e, ctx, o) =>
    log.push([name, o?.seriesIndex ?? null, o?.dataPointIndex ?? null])
  chart = createChartWithOptions({
    chart: {
      type,
      height: 300,
      width: 600,
      events: {
        mouseMove: rec('move'),
        click: rec('click'),
        dataPointMouseEnter: rec('enter'),
        dataPointMouseLeave: rec('leave'),
        dataPointSelection: rec('select'),
      },
    },
    series: SERIES,
    xaxis: { categories: ['a', 'b', 'c', 'd', 'e'] },
    tooltip,
    ...extra,
  })
  return log
}

/** Normalise an index the way a page compares it (the DOM path gives strings). */
const n = (v) => (v === null || v === undefined ? null : Number(v))
const last = (log, name) => {
  const hit = log.filter((r) => r[0] === name).pop()
  return hit ? [n(hit[1]), n(hit[2])] : undefined
}

/**
 * A move (and optionally a click) at series i, point j, dispatched on `target`
 * (the plot by default) so it bubbles through the tooltip's listener and then
 * the chart's own event listener, as a real pointer does.
 */
function pointAt(i, j, { target, click = false } = {}) {
  const w = chart.w
  // The tooltip draws at most once per 20ms and defers the rest; a fresh
  // timestamp keeps every move in this test on the immediate path.
  w.globals.tooltip.lastHoverTime = 0
  const init = {
    bubbles: true,
    clientX: w.layout.translateX + w.globals.seriesXvalues[i][j],
    clientY: w.layout.translateY + w.globals.seriesYvalues[i][j],
  }
  const el = target || w.dom.Paper.node
  el.dispatchEvent(new MouseEvent('mousemove', init))
  if (click) el.dispatchEvent(leftUp(init))
}

/** A left-button mouseup, which Events.js reads as a click (`e.which === 1`). */
function leftUp(init = {}) {
  const e = new MouseEvent('mouseup', { bubbles: true, ...init, button: 0 })
  Object.defineProperty(e, 'which', { value: 1 })
  return e
}

const tooltipEl = () =>
  chart.w.dom.baseEl.querySelector(
    '.apexcharts-tooltip:not(.apexcharts-annotation-tooltip)',
  )

/** Hidden: present (the hover paths need it) but never displayed. */
function expectBoxHidden() {
  const el = tooltipEl()
  expect(el).toBeTruthy()
  expect(el.style.display).toBe('none')
  expect(el.classList.contains('apexcharts-tooltip-hidden')).toBe(true)
  expect(chart.w.dom.baseEl.querySelector('.apexcharts-xaxistooltip')).toBeNull()
  expect(chart.w.dom.baseEl.querySelector('.apexcharts-yaxistooltip')).toBeNull()
}

/** Run the same pointer script with the box shown and hidden; both must agree. */
function bothWays(type, tooltip, script, extra) {
  const out = {}
  for (const visible of [true, false]) {
    const log = make(type, { ...tooltip, visible }, extra)
    script()
    if (!visible) expectBoxHidden()
    out[visible] = log.map((r) => [r[0], n(r[1]), n(r[2])])
    chart.destroy()
    chart = null
  }
  expect(out.false).toEqual(out.true)
  return out.false
}

describe('tooltip.visible: false keeps the hover', () => {
  for (const type of ['line', 'area']) {
    it(`${type}, not shared: mouseMove and click report the swept point`, () => {
      const log = bothWays(type, { shared: false, intersect: false }, () => {
        pointAt(0, 1)
        pointAt(1, 2)
        pointAt(0, 3, { click: true })
      })
      const moves = log.filter((r) => r[0] === 'move').map((r) => r[2])
      expect(moves).toEqual([1, 2, 3])
      expect(log.filter((r) => r[0] === 'move')[1][1]).toBe(1)
      expect(log.find((r) => r[0] === 'click')).toEqual(['click', 0, 3])
    })

    it(`${type}, shared: mouseMove reports the swept point`, () => {
      const log = bothWays(type, { shared: true, intersect: false }, () => {
        for (let j = 0; j < 5; j++) pointAt(0, j)
      })
      expect(log.filter((r) => r[0] === 'move').map((r) => r[2])).toEqual([
        0, 1, 2, 3, 4,
      ])
    })
  }

  it('line, intersect: marker events fire with the right indices', () => {
    const log = bothWays(
      'line',
      { shared: false, intersect: true },
      () => {
        const m = chart.w.dom.baseEl.querySelector(
          '.apexcharts-marker[index="1"][j="2"]',
        )
        m.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
        pointAt(1, 2, { target: m })
        m.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      },
      { markers: { size: 5 } },
    )
    expect(log).toContainEqual(['enter', 1, 2])
    expect(log).toContainEqual(['select', 1, 2])
    expect(log).toContainEqual(['move', 1, 2])
  })

  it('scatter: marker events and mouseMove carry the hovered point', () => {
    const log = bothWays('scatter', {}, () => {
      const m = chart.w.dom.baseEl.querySelector(
        '.apexcharts-marker[index="0"][j="3"]',
      )
      m.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
      pointAt(0, 3, { target: m })
      m.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })
    expect(log).toContainEqual(['enter', 0, 3])
    expect(log).toContainEqual(['select', 0, 3])
    expect(log).toContainEqual(['move', 0, 3])
  })

  it('bar, one at a time: mouseMove names the series of the hovered bar', () => {
    const log = bothWays('bar', {}, () => {
      const w = chart.w
      const bar = w.dom.baseEl.querySelector(
        '.apexcharts-bar-area[index="1"][j="2"]',
      )
      const at = {
        bubbles: true,
        clientX: w.layout.translateX + Number(bar.getAttribute('cx')),
        clientY: w.layout.translateY + Number(bar.getAttribute('cy')) + 2,
      }
      bar.dispatchEvent(new MouseEvent('mouseover', at))
      bar.dispatchEvent(new MouseEvent('mousedown', at))
      w.globals.tooltip.lastHoverTime = 0
      bar.dispatchEvent(new MouseEvent('mousemove', at))
      bar.dispatchEvent(leftUp(at))
    })
    expect(log).toContainEqual(['enter', 1, 2])
    expect(log).toContainEqual(['select', 1, 2])
    expect(log).toContainEqual(['move', 1, 2])
    expect(log).toContainEqual(['click', 1, 2])
  })

  it('bar, shared: the column under the pointer is reported', () => {
    const log = bothWays('bar', { shared: true, intersect: false }, () => {
      const w = chart.w
      w.globals.tooltip.lastHoverTime = 0
      w.dom.Paper.node.dispatchEvent(
        new MouseEvent('mousemove', {
          bubbles: true,
          clientX: w.layout.translateX + (w.layout.gridWidth / 5) * 3.5,
          clientY: w.layout.translateY + w.layout.gridHeight / 2,
        }),
      )
    })
    expect(last(log, 'move')?.[1]).toBe(3)
    // The shared column highlight runs pathMouseEnter for each bar at j.
    expect(log).toContainEqual(['enter', 0, 3])
    expect(log).toContainEqual(['enter', 1, 3])
  })

  it('never shows the box, even while a point is captured', () => {
    make('line', { visible: false, shared: false, intersect: false })
    pointAt(0, 2)
    expect(chart.w.interact.capturedDataPointIndex).toBe(2)
    expectBoxHidden()
  })

  it('an update that turns the box back on shows it again', async () => {
    make('line', { visible: false })
    expectBoxHidden()
    await chart.updateOptions({ tooltip: { visible: true } }, false, false)
    expect(tooltipEl().style.display).toBe('')
    expect(tooltipEl().classList.contains('apexcharts-tooltip-hidden')).toBe(
      false,
    )
  })
})

describe('tooltip.enabled: false is unchanged', () => {
  it('draws no tooltip and a swept line reports no point', () => {
    const log = make('line', { enabled: false, shared: false, intersect: false })
    expect(tooltipEl()).toBeNull()
    const w = chart.w
    w.dom.Paper.node.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        clientX: w.layout.translateX + w.globals.seriesXvalues[0][2],
        clientY: w.layout.translateY + w.globals.seriesYvalues[0][2],
      }),
    )
    expect(last(log, 'move')).toEqual([null, null])
  })

  it('wins over visible: true', () => {
    make('line', { enabled: false, visible: true })
    expect(tooltipEl()).toBeNull()
  })
})

describe('tooltip.visible: false with the keyboard', () => {
  it('moves the captured point and announces it in the live region', async () => {
    make(
      'line',
      { visible: false },
      {
        chart: {
          type: 'line',
          height: 300,
          width: 600,
          animations: { enabled: false },
          accessibility: {
            enabled: true,
            keyboard: { enabled: true, navigation: { enabled: true } },
          },
        },
      },
    )
    const svg = chart.w.dom.Paper.node
    svg.focus()
    svg.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      }),
    )
    expect(chart.w.interact.capturedDataPointIndex).toBe(1)
    expectBoxHidden()
    await new Promise((r) => setTimeout(r, 0))
    const status = chart.w.dom.baseEl.querySelector('.apexcharts-sr-status')
    expect(status.textContent).toBe('A: 80, b')
  })
})
