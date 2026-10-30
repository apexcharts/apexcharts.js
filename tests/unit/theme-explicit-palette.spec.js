import { describe, it, expect, afterEach } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import { getThemePalettes } from '../../src/utils/ThemePalettes.js'
// Tier 2 features the standard entry does not register: their restores replay
// a captured palette, which must not turn the mode default into a choice.
import '../../src/features/history.js'
import '../../src/features/perspectives.js'

/**
 * An explicitly configured theme.palette always wins over the mode default.
 *
 * Options defaulted theme.palette to 'palette1', so an explicit palette1 could
 * not be told apart from "no palette", and the render-time mode normalisation
 * swapped palette1 for palette4 in dark mode (and palette4 for palette1 in
 * light mode) whatever the user asked for. A chart that names no palette keeps
 * following the mode: palette4 in dark, palette1 in light, and a mode switch
 * through updateOptions switches the default palette with it.
 */

const PALETTES = /** @type {Record<string, string[]>} */ (getThemePalettes())

/** @param {'light'|'dark'} mode */
const modeDefault = (mode) => (mode === 'dark' ? 'palette4' : 'palette1')
const other = (/** @type {'light'|'dark'} */ mode) =>
  mode === 'dark' ? 'light' : 'dark'

let hosts = 0

/**
 * A two-series line chart, constructed but not yet rendered.
 * @param {Record<string, any> | undefined} theme
 * @param {Record<string, any>} [extra]
 */
function make(theme, extra = {}) {
  const el = document.createElement('div')
  el.id = `palette-host-${hosts++}`
  document.body.appendChild(el)
  return new ApexCharts(el, {
    chart: { type: 'line', animations: { enabled: false } },
    series: [
      { name: 'A', data: [1, 2, 3, 4] },
      { name: 'B', data: [4, 3, 2, 1] },
    ],
    ...(theme ? { theme } : {}),
    ...extra,
  })
}

/**
 * The palette the chart reports AND the colours it actually painted with.
 * @param {any} chart
 * @param {string} palette
 */
function expectPalette(chart, palette) {
  expect(chart.w.config.theme.palette).toBe(palette)
  expect(chart.w.globals.colors.slice(0, 2)).toEqual(
    PALETTES[palette].slice(0, 2),
  )
}

const PALETTE_CASES = [undefined, 'palette1', 'palette4', 'palette7']
const MODES = /** @type {const} */ (['light', 'dark'])

afterEach(() => {
  window.Apex = {}
  document.body.innerHTML = ''
})

describe('theme.palette: an explicit palette beats the mode default', () => {
  for (const palette of PALETTE_CASES) {
    for (const mode of MODES) {
      const label = `${palette || 'no palette'} + ${mode}`
      const theme = palette ? { mode, palette } : { mode }
      // What the chart should show for `mode`: the user's palette when one
      // was configured, the mode's default otherwise.
      const expected = (/** @type {'light'|'dark'} */ m) =>
        palette || modeDefault(m)

      it(`${label}: render`, async () => {
        const chart = make(theme)
        await chart.render()
        expectPalette(chart, expected(mode))
        chart.destroy()
      })

      it(`${label}: updateOptions with only a mode change`, async () => {
        const chart = make(theme)
        await chart.render()
        const next = other(mode)
        await chart.updateOptions({ theme: { mode: next } })
        expectPalette(chart, expected(next))
        // and back again
        await chart.updateOptions({ theme: { mode } })
        expectPalette(chart, expected(mode))
        chart.destroy()
      })

      it(`${label}: updateOptions with only a palette change`, async () => {
        const chart = make(theme)
        await chart.render()
        // The palette the caller now names, including the one that is this
        // mode's default (the sentinel the bug swapped away).
        for (const p of ['palette1', 'palette4', 'palette7']) {
          await chart.updateOptions({ theme: { palette: p } })
          expectPalette(chart, p)
        }
        // Once named, it survives a later mode switch.
        await chart.updateOptions({ theme: { mode: other(mode) } })
        expectPalette(chart, 'palette7')
        chart.destroy()
      })

      it(`${label}: updateOptions with mode and palette together`, async () => {
        const chart = make(theme)
        await chart.render()
        const next = other(mode)
        for (const p of ['palette1', 'palette4', 'palette7']) {
          await chart.updateOptions({ theme: { mode: next, palette: p } })
          expectPalette(chart, p)
          await chart.updateOptions({ theme: { mode, palette: p } })
          expectPalette(chart, p)
        }
        chart.destroy()
      })

      it(`${label}: an unrelated updateOptions keeps the palette`, async () => {
        const chart = make(theme)
        await chart.render()
        await chart.updateOptions({ title: { text: 'Updated' } })
        expectPalette(chart, expected(mode))
        chart.destroy()
      })
    }
  }

  it('reports the resolved palette in w.config before the first render', () => {
    expect(make({ mode: 'dark' }).w.config.theme.palette).toBe('palette4')
    expect(make({ mode: 'light' }).w.config.theme.palette).toBe('palette1')
    expect(make({}).w.config.theme.palette).toBe('palette1')
    expect(
      make({ mode: 'dark', palette: 'palette1' }).w.config.theme.palette,
    ).toBe('palette1')
  })

  it('a chart with no theme at all stays on palette1 and follows a later dark mode', async () => {
    const chart = make(undefined)
    await chart.render()
    expectPalette(chart, 'palette1')
    await chart.updateOptions({ theme: { mode: 'dark' } })
    expectPalette(chart, 'palette4')
    chart.destroy()
  })
})

describe('theme.palette from window.Apex', () => {
  for (const palette of PALETTE_CASES) {
    for (const mode of MODES) {
      const label = `global ${palette || 'no palette'} + global ${mode}`
      it(`${label}: render, mode-only update and back`, async () => {
        window.Apex = { theme: palette ? { mode, palette } : { mode } }
        const chart = make(undefined)
        await chart.render()
        expectPalette(chart, palette || modeDefault(mode))
        await chart.updateOptions({ theme: { mode: other(mode) } })
        expectPalette(chart, palette || modeDefault(other(mode)))
        chart.destroy()
      })
    }
  }

  it('a global palette survives a local mode that differs from the global one', async () => {
    window.Apex = { theme: { palette: 'palette1' } }
    const chart = make({ mode: 'dark' })
    await chart.render()
    expectPalette(chart, 'palette1')
    chart.destroy()
  })

  it('a local palette beats a global one', async () => {
    window.Apex = { theme: { mode: 'dark', palette: 'palette7' } }
    const chart = make({ palette: 'palette4' })
    await chart.render()
    expectPalette(chart, 'palette4')
    chart.destroy()
  })

  it('a global dark mode does not leave a palette behind for the next chart', async () => {
    window.Apex = { theme: { mode: 'dark' } }
    const first = make(undefined)
    await first.render()
    expectPalette(first, 'palette4')
    expect(window.Apex.theme.palette).toBeUndefined()

    // The second chart overrides the mode locally and names no palette, so
    // it gets the light default, not a palette the first chart wrote into
    // the shared global.
    const second = make({ mode: 'light' })
    await second.render()
    expectPalette(second, 'palette1')
    second.destroy()
    first.destroy()
  })
})

describe('theme.palette: what the fix must leave alone', () => {
  it('a palette set by a responsive breakpoint still applies', async () => {
    const chart = make(
      { mode: 'dark' },
      {
        responsive: [
          { breakpoint: 100000, options: { theme: { palette: 'palette7' } } },
        ],
      },
    )
    await chart.render()
    expectPalette(chart, 'palette7')
    chart.destroy()
  })

  it('a mode-only payload is not written into, so reusing it keeps the palette following the mode', async () => {
    const chart = make({ mode: 'light' })
    await chart.render()
    const toDark = { theme: { mode: 'dark' } }
    const toLight = { theme: { mode: 'light' } }
    await chart.updateOptions(toDark)
    expect(toDark).toEqual({ theme: { mode: 'dark' } })
    expectPalette(chart, 'palette4')
    await chart.updateOptions(toLight)
    expectPalette(chart, 'palette1')
    await chart.updateOptions(toDark)
    expectPalette(chart, 'palette4')
    chart.destroy()
  })

  for (const empty of [undefined, null]) {
    it(`a payload with palette: ${empty} keeps the palette the chart has`, async () => {
      for (const [theme, expected] of [
        [{ mode: 'dark' }, 'palette4'],
        [{ mode: 'light' }, 'palette1'],
        [{ mode: 'dark', palette: 'palette7' }, 'palette7'],
      ]) {
        const chart = make(theme)
        await chart.render()
        // The shape a serialised options object (a framework wrapper) sends
        // when it restates the theme: every key present, the unset ones empty.
        await chart.updateOptions({
          theme: { mode: theme.mode, palette: empty },
        })
        expectPalette(chart, expected)
        await chart.updateOptions({ theme: { palette: empty } })
        expectPalette(chart, expected)
        chart.destroy()
      }
    })
  }

  it('a mode switch still flips the tooltip theme and foreColor defaults', async () => {
    const chart = make({ mode: 'light', palette: 'palette1' })
    await chart.render()
    await chart.updateOptions({ theme: { mode: 'dark' } })
    expect(chart.w.config.tooltip.theme).toBe('dark')
    expect(chart.w.config.chart.foreColor).toBe('#f6f7f8')
    expectPalette(chart, 'palette1')
    chart.destroy()
  })

  it('a palette passed to one chart of a group is explicit on every chart it reaches', async () => {
    const a = make(
      { mode: 'light' },
      { chart: { id: 'pa', group: 'pg', type: 'line' } },
    )
    const b = make(
      { mode: 'light' },
      { chart: { id: 'pb', group: 'pg', type: 'line' } },
    )
    await a.render()
    await b.render()
    await a.updateOptions({ theme: { palette: 'palette1' } })
    await a.updateOptions({ theme: { mode: 'dark' } })
    // b took the mode switch too, so palette1 there is kept, not left over.
    expect(b.w.config.theme.mode).toBe('dark')
    expectPalette(a, 'palette1')
    expectPalette(b, 'palette1')
    a.destroy()
    b.destroy()
  })
})

describe('theme.palette: leaving dark mode for the default mode', () => {
  // '' is the documented default (auto) and a serialised wrapper sends null;
  // both draw light chrome, so a chart with no palette goes back to palette1.
  for (const mode of ['', null]) {
    it(`a chart with no palette returns to palette1 on mode ${JSON.stringify(mode)}`, async () => {
      const chart = make({ mode: 'light' })
      await chart.render()
      await chart.updateOptions({ theme: { mode: 'dark' } })
      expectPalette(chart, 'palette4')
      await chart.updateOptions({ theme: { mode } })
      expectPalette(chart, 'palette1')
      expect(chart.w.config.chart.foreColor).toBe('#373d3f')
      chart.destroy()

      const fromDark = make({ mode: 'dark' })
      await fromDark.render()
      await fromDark.updateOptions({ theme: { mode } })
      expectPalette(fromDark, 'palette1')
      fromDark.destroy()
    })

    it(`a named palette4 stays on mode ${JSON.stringify(mode)}`, async () => {
      const chart = make({ mode: 'dark', palette: 'palette4' })
      await chart.render()
      await chart.updateOptions({ theme: { mode } })
      expectPalette(chart, 'palette4')
      chart.destroy()
    })
  }
})

describe('theme.palette: an empty local palette next to a window.Apex one', () => {
  for (const empty of [null, undefined]) {
    it(`palette: ${empty} in the chart keeps the global palette`, async () => {
      window.Apex = { theme: { palette: 'palette7' } }
      const chart = make({ mode: 'dark', palette: empty })
      expect(chart.w.config.theme.palette).toBe('palette7')
      await chart.render()
      expectPalette(chart, 'palette7')
      await chart.updateOptions({ theme: { mode: 'light' } })
      expectPalette(chart, 'palette7')
      chart.destroy()
    })

    it(`palette: ${empty} in the chart with only a global mode follows the mode`, async () => {
      window.Apex = { theme: { mode: 'dark' } }
      const chart = make({ palette: empty })
      await chart.render()
      expectPalette(chart, 'palette4')
      await chart.updateOptions({ theme: { mode: 'light' } })
      expectPalette(chart, 'palette1')
      chart.destroy()
    })
  }
})

const sleep = (/** @type {number} */ ms) =>
  new Promise((r) => setTimeout(r, ms))
// History coalesces captures on a timer; wait past it after each change.
const COALESCE = 20
const settle = () => sleep(COALESCE + 50)

/**
 * A chart with history enabled, rendered and with its baseline captured.
 * @param {Record<string, any>} theme
 */
async function historyChart(theme) {
  const chart = make(theme, {
    chart: {
      type: 'line',
      animations: { enabled: false },
      history: { enabled: true, coalesceMs: COALESCE },
    },
    xaxis: { type: 'numeric' },
  })
  await chart.render()
  await settle()
  return chart
}

describe('theme.palette: undo and redo keep whether a palette was named', () => {
  it('a chart with no palette still follows the mode after an undo', async () => {
    const chart = await historyChart({ mode: 'light' })
    await chart.updateOptions({ xaxis: { min: 2, max: 4 } }, false, false)
    await settle()
    await chart.history.undo()
    await settle()
    expectPalette(chart, 'palette1')
    await chart.updateOptions({ theme: { mode: 'dark' } })
    expectPalette(chart, 'palette4')
    await chart.updateOptions({ theme: { mode: 'light' } })
    expectPalette(chart, 'palette1')
    chart.destroy()
  })

  it('and after a redo', async () => {
    const chart = await historyChart({ mode: 'dark' })
    await chart.updateOptions({ xaxis: { min: 2, max: 4 } }, false, false)
    await settle()
    await chart.history.undo()
    await settle()
    await chart.history.redo()
    await settle()
    expect(chart.w.config.xaxis.min).toBe(2)
    expectPalette(chart, 'palette4')
    await chart.updateOptions({ theme: { mode: 'light' } })
    expectPalette(chart, 'palette1')
    chart.destroy()
  })

  for (const [palette, mode] of [
    ['palette1', 'dark'],
    ['palette4', 'light'],
  ]) {
    it(`a named ${palette} in ${mode} mode survives an undo and a mode switch`, async () => {
      const chart = await historyChart({ mode, palette })
      await chart.updateOptions({ xaxis: { min: 2, max: 4 } }, false, false)
      await settle()
      await chart.history.undo()
      await settle()
      expectPalette(chart, palette)
      await chart.updateOptions({ theme: { mode: other(mode) } })
      expectPalette(chart, palette)
      chart.destroy()
    })
  }

  it('undoing the update that named a palette brings back the mode default', async () => {
    const chart = await historyChart({ mode: 'light' })
    await chart.updateOptions({ theme: { palette: 'palette7' } })
    await settle()
    expectPalette(chart, 'palette7')
    await chart.history.undo()
    await settle()
    expectPalette(chart, 'palette1')
    await chart.updateOptions({ theme: { mode: 'dark' } })
    expectPalette(chart, 'palette4')
    chart.destroy()
  })
})

describe('theme.palette: applying a perspective keeps whether a palette was named', () => {
  /** @param {any} chart @param {any} token */
  const apply = async (chart, token) => {
    chart.perspectives.apply(token, { animate: false })
    await sleep(30)
  }

  it('a chart with no palette records that, and still follows the mode after apply', async () => {
    const chart = make({ mode: 'light' })
    await chart.render()
    const token = chart.perspectives.capture()
    expect(token.view.theme).toEqual({
      mode: 'light',
      palette: 'palette1',
      paletteExplicit: false,
    })
    await apply(chart, token)
    await chart.updateOptions({ theme: { mode: 'dark' } })
    expectPalette(chart, 'palette4')
    chart.destroy()
  })

  it('so does a token that went through encode and decode', async () => {
    const chart = make({ mode: 'dark' })
    await chart.render()
    await apply(chart, chart.perspectives.encode())
    expectPalette(chart, 'palette4')
    await chart.updateOptions({ theme: { mode: 'light' } })
    expectPalette(chart, 'palette1')
    chart.destroy()
  })

  it('a named palette1 in dark mode stays named after apply', async () => {
    const chart = make({ mode: 'dark', palette: 'palette1' })
    await chart.render()
    const token = chart.perspectives.capture()
    expect(token.view.theme.paletteExplicit).toBe(true)
    await apply(chart, token)
    expectPalette(chart, 'palette1')
    await chart.updateOptions({ theme: { mode: 'light' } })
    await chart.updateOptions({ theme: { mode: 'dark' } })
    expectPalette(chart, 'palette1')
    chart.destroy()
  })

  it('a view taken before a palette was named restores the mode default', async () => {
    const chart = make({ mode: 'light' })
    await chart.render()
    const token = chart.perspectives.capture()
    await chart.updateOptions({ theme: { palette: 'palette7' } })
    await apply(chart, token)
    expectPalette(chart, 'palette1')
    await chart.updateOptions({ theme: { mode: 'dark' } })
    expectPalette(chart, 'palette4')
    chart.destroy()
  })

  it('a view without paletteExplicit (an older token) names only a non-default palette', async () => {
    const chart = make({ mode: 'light' })
    await chart.render()
    const token = chart.perspectives.capture()
    delete token.view.theme.paletteExplicit
    await apply(chart, token)
    await chart.updateOptions({ theme: { mode: 'dark' } })
    expectPalette(chart, 'palette4')

    const named = chart.perspectives.capture()
    delete named.view.theme.paletteExplicit
    named.view.theme = { mode: 'light', palette: 'palette4' }
    await apply(chart, named)
    expectPalette(chart, 'palette4')
    await chart.updateOptions({ theme: { mode: 'dark' } })
    await chart.updateOptions({ theme: { mode: 'light' } })
    expectPalette(chart, 'palette4')
    chart.destroy()
  })
})
