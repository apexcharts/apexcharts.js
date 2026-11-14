import { it, expect, afterEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

// Issue #5006: a custom chart.events.selection on the brush used to replace
// the built-in target sync (and skip wiring the target's zoom/pan back to
// the brush). The sync always runs; the user's handler is called as well.
// Wrapping that handler on every render used to loop (#1912).

const data = Array.from({ length: 20 }, (_, i) => [Date.UTC(2026, 0, 1 + i), i])
const min = data[4][0]
const max = data[12][0]

const brushOpts = (events) => ({
  chart: {
    id: 'brsel-brush',
    type: 'area',
    width: 500,
    height: 100,
    animations: { enabled: false },
    brush: { enabled: true, target: 'brsel-target' },
    selection: { enabled: true, xaxis: { min, max } },
    events,
  },
  series: [{ data }],
  xaxis: { type: 'datetime' },
})

const targetOpts = (events = {}) => ({
  chart: {
    id: 'brsel-target',
    type: 'line',
    width: 500,
    height: 200,
    animations: { enabled: false },
    events,
  },
  series: [{ data }],
  xaxis: { type: 'datetime' },
})

function countTargetSyncs(target) {
  const calls = []
  const orig = target.updateHelpers._updateOptions.bind(target.updateHelpers)
  target.updateHelpers._updateOptions = (options, ...rest) => {
    if (options && options.xaxis) calls.push(options.xaxis.min)
    return orig(options, ...rest)
  }
  return calls
}

afterEach(() => {
  document.body.innerHTML = ''
})

it('a custom selection handler still syncs the brush target', async () => {
  document.body.innerHTML = '<div id="t"></div><div id="b"></div>'
  const seen = []
  const selection = (chart, e) => {
    seen.push({ chart, min: e.xaxis.min, max: e.xaxis.max })
  }
  const zoomed = () => {}
  const target = new ApexCharts(
    document.querySelector('#t'),
    targetOpts({ zoomed }),
  )
  await target.render()
  const brush = new ApexCharts(
    document.querySelector('#b'),
    brushOpts({ selection }),
  )
  await brush.render()

  expect(seen).toEqual([{ chart: brush, min, max }])
  expect(target.w.globals.minX).toBe(min)
  expect(target.w.globals.maxX).toBe(max)
  expect(target.w.globals.brushSource).toBe(brush)
  expect(target.w.config.chart.events.zoomed).toBe(zoomed)
  expect(typeof target.w.config.chart.events.scrolled).toBe('function')

  const syncs = countTargetSyncs(target)
  const nextMin = data[1][0]
  const nextMax = data[3][0]
  brush.w.config.chart.events.selection(brush, {
    xaxis: { min: nextMin, max: nextMax },
    yaxis: {},
  })

  expect(seen).toHaveLength(2)
  expect(seen[1]).toEqual({ chart: brush, min: nextMin, max: nextMax })
  expect(syncs).toEqual([nextMin])
  expect(target.w.config.xaxis.min).toBe(nextMin)
  expect(target.w.config.xaxis.max).toBe(nextMax)

  // A re-render reports the configured selection once. A nested wrapper
  // would sync the target twice for that one report.
  const before = seen.length
  syncs.length = 0
  await brush.updateOptions({ title: { text: 'again' } })
  expect(seen.length - before).toBe(1)
  expect(seen[seen.length - 1]).toEqual({ chart: brush, min, max })
  expect(syncs).toEqual([min])

  brush.destroy()
  expect(target.w.config.chart.events.zoomed).toBe(zoomed)
  expect(target.w.config.chart.events.scrolled).toBeUndefined()
  expect(target.w.globals.brushSource).toBeUndefined()
  target.destroy()
})

it('replacing the selection callback on update calls the new one, and clearing it stops both', async () => {
  document.body.innerHTML = '<div id="t"></div><div id="b"></div>'
  const seen = []
  const first = (chart, e) => {
    seen.push({ which: 'first', min: e.xaxis.min, max: e.xaxis.max })
  }
  const second = (chart, e) => {
    seen.push({ which: 'second', min: e.xaxis.min, max: e.xaxis.max })
  }
  const target = new ApexCharts(document.querySelector('#t'), targetOpts())
  await target.render()
  const brush = new ApexCharts(
    document.querySelector('#b'),
    brushOpts({ selection: first }),
  )
  await brush.render()

  expect(seen.map((s) => s.which)).toEqual(['first'])
  // Kept across the updates below. It used to close over this first callback.
  const wrapper = brush.w.config.chart.events.selection
  expect(wrapper.__apexBrush).toBe(brush)
  const syncs = countTargetSyncs(target)

  seen.length = 0
  syncs.length = 0
  await brush.updateOptions({
    chart: { events: { selection: second } },
  })

  // The re-render reports the configured selection through the new handler
  // only, and the wrapper from the first render does too. One sync: the
  // new handler is not nested inside the old one.
  expect(seen.map((s) => s.which)).toEqual(['second'])
  expect(syncs).toEqual([min])

  const nextMin = data[1][0]
  const nextMax = data[3][0]
  seen.length = 0
  syncs.length = 0
  wrapper(brush, {
    xaxis: { min: nextMin, max: nextMax },
    yaxis: {},
  })
  expect(seen).toEqual([{ which: 'second', min: nextMin, max: nextMax }])
  expect(syncs).toEqual([nextMin])

  seen.length = 0
  syncs.length = 0
  await brush.updateOptions({
    chart: { events: { selection: undefined } },
  })
  expect(seen).toEqual([])
  expect(syncs).toEqual([min])

  wrapper(brush, {
    xaxis: { min: nextMin, max: nextMax },
    yaxis: {},
  })
  expect(seen).toEqual([])
  expect(syncs).toEqual([min, nextMin])

  // A further render still syncs once, and still does not call a removed handler.
  syncs.length = 0
  await brush.updateOptions({ title: { text: 'again' } })
  expect(seen).toEqual([])
  expect(syncs).toEqual([min])

  brush.destroy()
  target.destroy()
})

it('a brush with no selection handler syncs once per render', async () => {
  document.body.innerHTML = '<div id="t"></div><div id="b"></div>'
  const target = new ApexCharts(document.querySelector('#t'), targetOpts())
  await target.render()
  const syncs = countTargetSyncs(target)
  const brush = new ApexCharts(document.querySelector('#b'), brushOpts())
  await brush.render()

  expect(syncs).toEqual([min])
  expect(target.w.globals.minX).toBe(min)
  expect(target.w.globals.maxX).toBe(max)

  syncs.length = 0
  await brush.updateOptions({ title: { text: 'again' } })
  expect(syncs).toEqual([min])
  expect(target.w.globals.minX).toBe(min)

  target.destroy()
  brush.destroy()
})
