import { describe, it, expect, afterEach } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/history.js'

/**
 * An explicitly configured chart.foreColor is kept whatever the mode, the two
 * built-in defaults included.
 *
 * Options defaults chart.foreColor to '#373d3f', so in the merged config a
 * '#373d3f' the page chose could not be told from the default, and the
 * render-time mode pass swapped it for '#f6f7f8' on a dark chart (and
 * '#f6f7f8' for '#373d3f' on a light one). It could not be set even through
 * updateOptions. Whether the page named a foreColor is now recorded from what
 * it passed, as theme.palette is (theme-explicit-palette.spec.js).
 *
 * What stays as it was: a chart with no foreColor follows the mode, and a
 * mode-only updateOptions puts ANY foreColor, '#ff0000' included, back on the
 * new mode's default (updateThemeOptions fills it in).
 */

const LIGHT = '#373d3f'
const DARK = '#f6f7f8'

/** @param {string | undefined} mode */
const modeDefault = (mode) => (mode === 'dark' ? DARK : LIGHT)
/** The mode an update switches to: the other one, dark from the default. */
const otherMode = (/** @type {string | undefined} */ mode) =>
  mode === 'dark' ? 'light' : 'dark'
/** The built-in default that does NOT belong to `mode`. */
const otherDefault = (/** @type {string | undefined} */ mode) =>
  mode === 'dark' ? LIGHT : DARK

let hosts = 0

/**
 * A two-series line chart with categories, constructed but not yet rendered.
 * @param {Record<string, any>} [opts]
 */
function make(opts = {}) {
  const el = document.createElement('div')
  el.id = `fore-host-${hosts++}`
  document.body.appendChild(el)
  return new ApexCharts(el, {
    ...opts,
    chart: { type: 'line', animations: { enabled: false }, ...opts.chart },
    series: [
      { name: 'A', data: [1, 2, 3, 4] },
      { name: 'B', data: [4, 3, 2, 1] },
    ],
    xaxis: { categories: ['a', 'b', 'c', 'd'] },
  })
}

/**
 * The foreColor the chart reports AND the one its x-axis labels are drawn in.
 * @param {any} chart
 * @param {string} color
 */
function expectFore(chart, color) {
  expect(chart.w.config.chart.foreColor).toBe(color)
  const label = chart.el.querySelector('.apexcharts-xaxis-label')
  expect(label).not.toBeNull()
  expect(label.getAttribute('fill')).toBe(color)
}

const FORE_CASES = [undefined, LIGHT, DARK, '#ff0000']
const MODE_CASES = ['light', 'dark', undefined]

afterEach(() => {
  window.Apex = {}
  document.body.innerHTML = ''
  ApexCharts.unregisterTheme('nightC2')
})

describe('chart.foreColor: an explicit foreColor beats the mode default', () => {
  for (const fore of FORE_CASES) {
    for (const mode of MODE_CASES) {
      const label = `${fore || 'no foreColor'} + ${mode || 'no mode'}`
      const opts = {
        ...(fore ? { chart: { foreColor: fore } } : {}),
        ...(mode ? { theme: { mode } } : {}),
      }

      it(`${label}: render`, async () => {
        const chart = make(opts)
        await chart.render()
        expectFore(chart, fore || modeDefault(mode))
        chart.destroy()
      })

      it(`${label}: updateOptions with only a mode change`, async () => {
        const chart = make(opts)
        await chart.render()
        const next = otherMode(mode)
        await chart.updateOptions({ theme: { mode: next } })
        // Unchanged behaviour: the mode-only update fills the new mode's
        // default in, over any foreColor, explicit or not.
        expectFore(chart, modeDefault(next))
        // ...and the chart then follows the mode again.
        await chart.updateOptions({ theme: { mode: otherMode(next) } })
        expectFore(chart, modeDefault(otherMode(next)))
        chart.destroy()
      })

      it(`${label}: updateOptions with only a foreColor change`, async () => {
        const chart = make(opts)
        await chart.render()
        const want = otherDefault(mode)
        await chart.updateOptions({ chart: { foreColor: want } })
        expectFore(chart, want)
        // An unrelated update keeps it.
        await chart.updateOptions({ title: { text: 'kept' } })
        expectFore(chart, want)
        chart.destroy()
      })

      it(`${label}: updateOptions with mode and foreColor together`, async () => {
        const chart = make(opts)
        await chart.render()
        const next = otherMode(mode)
        // The default of the mode being left: the value the swap used to undo.
        const want = otherDefault(next)
        await chart.updateOptions({
          theme: { mode: next },
          chart: { foreColor: want },
        })
        expectFore(chart, want)
        await chart.updateOptions({ title: { text: 'kept' } })
        expectFore(chart, want)
        chart.destroy()
      })
    }
  }

  it('a dark chart can be given dark text through updateOptions', async () => {
    const chart = make({
      theme: { mode: 'dark' },
      chart: { background: '#fff' },
    })
    await chart.render()
    expectFore(chart, DARK)
    await chart.updateOptions({ chart: { foreColor: LIGHT } })
    expectFore(chart, LIGHT)
    chart.destroy()
  })

  it("an explicit foreColor wins over a fore token, the other mode's default included", async () => {
    ApexCharts.registerTheme('nightC2', { tokens: { fore: '#abcdef' } })
    const kept = make({
      theme: { mode: 'dark', name: 'nightC2' },
      chart: { foreColor: LIGHT },
    })
    await kept.render()
    expectFore(kept, LIGHT)
    // Unchanged: a chart without one takes the token.
    const token = make({ theme: { mode: 'dark', name: 'nightC2' } })
    await token.render()
    expectFore(token, '#abcdef')
    kept.destroy()
    token.destroy()
  })

  // v8.7.0 parity: a foreColor equal to the default of its OWN mode is still
  // replaceable by a fore token, as the grid and axis defaults are. Only the
  // other mode's default is kept as a choice.
  for (const mode of ['light', 'dark']) {
    const own = modeDefault(mode)
    it(`${mode}: an explicit ${own} (this mode's default) yields to a fore token`, async () => {
      ApexCharts.registerTheme('nightC2', { tokens: { fore: '#abcdef' } })
      const chart = make({
        theme: { mode, name: 'nightC2' },
        chart: { foreColor: own },
      })
      await chart.render()
      expectFore(chart, '#abcdef')
      await chart.updateOptions({ title: { text: 'kept' } })
      expectFore(chart, '#abcdef')
      chart.destroy()
    })
  }

  it('a window.Apex foreColor equal to the light default yields to a fore token', async () => {
    ApexCharts.registerTheme('nightC2', { tokens: { fore: '#abcdef' } })
    window.Apex = { chart: { foreColor: LIGHT } }
    const chart = make({ theme: { name: 'nightC2' } })
    await chart.render()
    expectFore(chart, '#abcdef')
    chart.destroy()
  })

  it('an updateOptions foreColor equal to the light default yields to a fore token', async () => {
    ApexCharts.registerTheme('nightC2', { tokens: { fore: '#abcdef' } })
    const chart = make({ theme: { name: 'nightC2' } })
    await chart.render()
    expectFore(chart, '#abcdef')
    await chart.updateOptions({ chart: { foreColor: LIGHT } })
    expectFore(chart, '#abcdef')
    chart.destroy()
  })

  it('an explicit foreColor survives a registered dark theme', async () => {
    ApexCharts.registerTheme('nightC2', { mode: 'dark' })
    const kept = make({
      theme: { name: 'nightC2' },
      chart: { foreColor: LIGHT },
    })
    await kept.render()
    expect(kept.w.config.theme.mode).toBe('dark')
    expectFore(kept, LIGHT)
    // Unchanged: without one, the late dark mode still gives the dark default.
    const plain = make({ theme: { name: 'nightC2' } })
    await plain.render()
    expectFore(plain, DARK)
    kept.destroy()
    plain.destroy()
  })

  it('a foreColor passed to one chart of a group is explicit on every chart it reaches', async () => {
    const a = make({
      theme: { mode: 'dark' },
      chart: { id: 'fa', group: 'fg' },
    })
    const b = make({
      theme: { mode: 'dark' },
      chart: { id: 'fb', group: 'fg' },
    })
    await a.render()
    await b.render()
    await a.updateOptions({ chart: { foreColor: LIGHT } })
    expectFore(a, LIGHT)
    expectFore(b, LIGHT)
    a.destroy()
    b.destroy()
  })

  it('a reused mode-only payload is not written into', async () => {
    const chart = make({ theme: { mode: 'light' } })
    await chart.render()
    const payload = { theme: { mode: 'dark' } }
    await chart.updateOptions(payload)
    expect(payload).toEqual({ theme: { mode: 'dark' } })
    chart.destroy()
  })
})

describe('chart.foreColor and tooltip.theme from window.Apex', () => {
  it('a global dark mode is not written into window.Apex', async () => {
    window.Apex = { theme: { mode: 'dark' } }
    const chart = make()
    await chart.render()
    expectFore(chart, DARK)
    expect(chart.w.config.tooltip.theme).toBe('dark')
    // (_chartInstances is the library's own registry, not an option.)
    expect(window.Apex.theme).toEqual({ mode: 'dark' })
    expect(window.Apex.tooltip).toBeUndefined()
    expect(window.Apex.chart).toBeUndefined()
    chart.destroy()
  })

  it('a light chart after a global dark one gets light text and a light tooltip', async () => {
    window.Apex = { theme: { mode: 'dark' } }
    const first = make()
    await first.render()
    const light = make({ theme: { mode: 'light' } })
    await light.render()
    expectFore(light, LIGHT)
    expect(light.w.config.tooltip.theme).toBe('light')
    // and with the global mode taken back, nothing of it is left behind
    window.Apex = {}
    const plain = make()
    await plain.render()
    expectFore(plain, LIGHT)
    expect(plain.w.config.tooltip.theme).toBe('light')
    first.destroy()
    light.destroy()
    plain.destroy()
  })

  it('a global foreColor equal to the light default is kept on a dark chart', async () => {
    window.Apex = { theme: { mode: 'dark' }, chart: { foreColor: LIGHT } }
    const chart = make()
    await chart.render()
    expectFore(chart, LIGHT)
    expect(chart.w.globals.themeForeColorExplicit).toBe(true)
    chart.destroy()
  })

  it('a global light tooltip stays light on a dark chart', async () => {
    window.Apex = { theme: { mode: 'dark' }, tooltip: { theme: 'light' } }
    const chart = make()
    await chart.render()
    expect(chart.w.config.tooltip.theme).toBe('light')
    expectFore(chart, DARK)
    chart.destroy()
  })

  it('a local foreColor beats the dark default of a global mode', async () => {
    window.Apex = { theme: { mode: 'dark' } }
    const chart = make({ chart: { foreColor: '#ff0000' } })
    await chart.render()
    expectFore(chart, '#ff0000')
    chart.destroy()
  })
})

describe('chart.foreColor: what the fix must leave alone', () => {
  it('pins the defaults: light, dark and no mode', async () => {
    for (const [mode, fore, tooltip] of [
      ['light', LIGHT, 'light'],
      ['dark', DARK, 'dark'],
      [undefined, LIGHT, 'light'],
    ]) {
      const chart = make(mode ? { theme: { mode } } : {})
      await chart.render()
      expectFore(chart, fore)
      expect(chart.w.config.tooltip.theme).toBe(tooltip)
      chart.destroy()
    }
  })

  it('an explicit dark tooltip on a light chart stays dark', async () => {
    const chart = make({ theme: { mode: 'light' }, tooltip: { theme: 'dark' } })
    await chart.render()
    expect(chart.w.config.tooltip.theme).toBe('dark')
    chart.destroy()
  })

  it('an explicit light tooltip on a dark chart stays light', async () => {
    const chart = make({ theme: { mode: 'dark' }, tooltip: { theme: 'light' } })
    await chart.render()
    expect(chart.w.config.tooltip.theme).toBe('light')
    chart.destroy()
  })

  it('a mode-only update still resets an explicit tooltip theme to the mode', async () => {
    const chart = make({
      theme: { mode: 'light' },
      tooltip: { theme: 'light' },
    })
    await chart.render()
    await chart.updateOptions({ theme: { mode: 'dark' } })
    expect(chart.w.config.tooltip.theme).toBe('dark')
    await chart.updateOptions({ theme: { mode: 'light' } })
    expect(chart.w.config.tooltip.theme).toBe('light')
    chart.destroy()
  })
})

const sleep = (/** @type {number} */ ms) =>
  new Promise((r) => setTimeout(r, ms))
const COALESCE = 20
const settle = () => sleep(COALESCE + 50)

describe('chart.foreColor: undo keeps whether a foreColor was named', () => {
  /** @param {Record<string, any>} opts */
  async function historyChart(opts) {
    const chart = make({
      ...opts,
      chart: {
        ...opts.chart,
        history: { enabled: true, coalesceMs: COALESCE },
      },
    })
    await chart.render()
    await settle()
    return chart
  }

  it('a chart with no foreColor still takes a fore token after an undo', async () => {
    const chart = await historyChart({ theme: { mode: 'dark' } })
    await chart.updateOptions({ title: { text: 'x' } }, false, false)
    await settle()
    await chart.history.undo()
    await settle()
    // The restore replays the whole config, foreColor and tooltip theme
    // included; that must not turn the defaults into choices.
    ApexCharts.registerTheme('nightC2', { tokens: { fore: '#abcdef' } })
    await chart.updateOptions({ theme: { name: 'nightC2' } })
    expectFore(chart, '#abcdef')
    chart.destroy()
  })

  it('a named foreColor stays named after an undo', async () => {
    const chart = await historyChart({
      theme: { mode: 'dark' },
      chart: { foreColor: LIGHT },
    })
    await chart.updateOptions({ title: { text: 'x' } }, false, false)
    await settle()
    await chart.history.undo()
    await settle()
    expectFore(chart, LIGHT)
    expect(chart.w.globals.themeForeColorExplicit).toBe(true)
    chart.destroy()
  })
})
