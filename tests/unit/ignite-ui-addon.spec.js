import { describe, it, expect, afterEach } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import InitCtxVariables from '../../src/modules/helpers/InitCtxVariables'
import '../../src/features/ignite-ui.js'
import { igniteSheet } from './utils/ignite-ui-sheet.js'

// Plan 36, revised D1: Ignite UI theming is an opt-in add-on
// (`apexcharts/features/ignite-ui`). Without it a page's Ignite UI sheet is
// ignored: nothing is read, nothing is injected, and the chart renders as it
// does on a page with no sheet. With it, its stylesheet twins go right after
// the main sheet in the chart's root, under the main sheet's own rule.

const REG = InitCtxVariables._featureRegistry
const STYLES = REG.get('designSystemStyles')
const SLOT = '__apex_design_systems_v1__'
const G = /** @type {any} */ (globalThis)
const HELD_SLOT = G[SLOT]
const TWIN_ID = 'apexcharts-igniteui-css'

/** No add-on on the page: neither ApexCharts' entry nor any other product's. */
function dropAddon({ keepSlot = false } = {}) {
  REG.delete('designSystemStyles')
  if (!keepSlot) delete G[SLOT]
}

/** @type {ReturnType<typeof igniteSheet> | null} */
let page = null
/** @type {any[]} */
let charts = []

afterEach(() => {
  for (const c of charts) c.destroy()
  charts = []
  page?.restore()
  page = null
  REG.set('designSystemStyles', STYLES)
  G[SLOT] = HELD_SLOT
  document.head.querySelectorAll('style').forEach((s) => s.remove())
  document.body.innerHTML = ''
})

/**
 * @param {Record<string, any>} [options]
 * @param {Node} [parent] where the chart's element goes
 */
async function chartWith(options = {}, parent = document.body) {
  const el = document.createElement('div')
  parent.appendChild(el)
  const chart = new ApexCharts(el, {
    series: [
      { name: 'A', data: [1, 2, 3, 4] },
      { name: 'B', data: [4, 3, 2, 1] },
    ],
    xaxis: { categories: ['a', 'b', 'c', 'd'] },
    ...options,
    chart: {
      type: 'bar',
      animations: { enabled: false },
      ...(options.chart || {}),
    },
  })
  charts.push(chart)
  await chart.render()
  return chart
}

/** @param {any} chart */
const gateClasses = (chart) =>
  [...chart.w.dom.elWrap.classList].filter((c) => c.includes('igniteui'))

/** Ids of the <style> elements in a root, in order. */
const sheetIds = (/** @type {ParentNode} */ root) =>
  [...root.querySelectorAll('style')].map((s) => s.id).filter(Boolean)

/**
 * What a chart looks like: its resolved colours and chrome, and its markup
 * with the generated ids taken out (the chart id is random and svg.js
 * numbers every element from one page-wide counter).
 * @param {any} chart
 */
function look(chart) {
  const w = chart.w
  const id = w.globals.chartID
  return {
    colors: w.globals.colors,
    fore: w.config.chart.foreColor,
    font: w.config.chart.fontFamily,
    grid: w.config.grid.borderColor,
    mode: w.config.theme.mode,
    tooltip: w.config.tooltip.theme,
    background: w.config.chart.background,
    tokenChrome: w.globals.tokenChrome,
    wrapClass: w.dom.elWrap.getAttribute('class').split(id).join('CHART'),
    html: chart.el.innerHTML
      .split(id)
      .join('CHART')
      .replace(/Svgjs([A-Za-z]+)\d+/g, 'Svgjs$1'),
  }
}

describe('without the add-on', () => {
  it('renders a page with an Ignite UI sheet exactly as a page with none, reading no --ig-* token', async () => {
    dropAddon()
    page = igniteSheet({ sheet: null })
    const bare = look(await chartWith())
    expect(page.igReads()).toEqual([])
    charts.pop().destroy()

    for (const sheet of ['light/indigo', 'dark/indigo']) {
      page.use(sheet)
      page.reads.length = 0
      const chart = await chartWith()
      expect(look(chart), sheet).toEqual(bare)
      expect(gateClasses(chart)).toEqual([])
      expect(page.igReads(), sheet).toEqual([])
      expect(document.getElementById(TWIN_ID)).toBeNull()
      await chart.refreshTokens()
      expect(page.igReads(), sheet).toEqual([])
      expect(look(chart), sheet).toEqual(bare)
      charts.pop().destroy()
    }
  })

  it("stays unthemed with only another product's adapter registered", async () => {
    // What a page that loaded `apextree/ignite-ui` alone has: the commons
    // adapter in the shared slot, and no ApexCharts stylesheet for it.
    dropAddon({ keepSlot: true })
    expect(G[SLOT] && G[SLOT].igniteui).toBeTruthy()
    page = igniteSheet({ sheet: 'dark/indigo' })
    const chart = await chartWith()
    expect(gateClasses(chart)).toEqual([])
    expect(chart.w.config.theme.mode).not.toBe('dark')
    expect(page.igReads()).toEqual([])
    expect(document.getElementById(TWIN_ID)).toBeNull()
  })
})

describe('with the add-on', () => {
  it('registers its stylesheet with the adapter it put in the shared slot', () => {
    expect(STYLES.name).toBe('igniteui')
    expect(STYLES.adapter).toBe(G[SLOT].igniteui)
    expect(STYLES.css).toBeDefined()
  })

  it('injects nothing on a page without an Ignite UI sheet', async () => {
    page = igniteSheet({ sheet: null })
    const chart = await chartWith()
    expect(gateClasses(chart)).toEqual([])
    expect(document.getElementById(TWIN_ID)).toBeNull()
  })

  it('puts its twins right after the main sheet, with the nonce, and the last destroy takes them away', async () => {
    page = igniteSheet({ sheet: 'light/indigo' })
    const a = await chartWith({ chart: { nonce: 'n0nce' } })
    const b = await chartWith({ chart: { nonce: 'n0nce' } })
    expect(gateClasses(a)).toEqual([
      'apexcharts-igniteui',
      'apexcharts-igniteui-light',
    ])
    expect(sheetIds(document.head)).toEqual(['apexcharts-css', TWIN_ID])
    expect(document.getElementById(TWIN_ID)?.getAttribute('nonce')).toBe(
      'n0nce',
    )
    a.destroy()
    expect(document.getElementById(TWIN_ID)).not.toBeNull()
    b.destroy()
    charts = []
    expect(document.getElementById(TWIN_ID)).toBeNull()
    expect(document.getElementById('apexcharts-css')).toBeNull()
  })

  it('goes into a shadow root after the main sheet there', async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = host.attachShadow({ mode: 'open' })
    const chart = await chartWith({}, root)
    expect(gateClasses(chart)).toEqual([
      'apexcharts-igniteui',
      'apexcharts-igniteui-dark',
    ])
    expect(sheetIds(root)).toEqual(['apexcharts-css', TWIN_ID])
    expect(document.getElementById(TWIN_ID)).toBeNull()
  })

  it('follows chart.injectStyleSheet: none in the light DOM, both in a shadow root', async () => {
    page = igniteSheet({ sheet: 'light/bootstrap' })
    const chart = await chartWith({ chart: { injectStyleSheet: false } })
    expect(gateClasses(chart)).toEqual([
      'apexcharts-igniteui',
      'apexcharts-igniteui-light',
    ])
    expect(sheetIds(document.head)).toEqual([])

    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = host.attachShadow({ mode: 'open' })
    await chartWith({ chart: { injectStyleSheet: false } }, root)
    expect(sheetIds(root)).toEqual(['apexcharts-css', TWIN_ID])
  })

  it('stays out while theme.designSystem is false', async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    const chart = await chartWith({ theme: { designSystem: false } })
    expect(gateClasses(chart)).toEqual([])
    expect(page.igReads()).toEqual([])
    expect(document.getElementById(TWIN_ID)).toBeNull()
  })

  it('is picked up by refreshTokens() after a late import', async () => {
    dropAddon()
    page = igniteSheet({ sheet: 'light/bootstrap' })
    const chart = await chartWith()
    const before = look(chart)
    expect(gateClasses(chart)).toEqual([])

    // What `import 'apexcharts/features/ignite-ui'` does once the chart is up.
    REG.set('designSystemStyles', STYLES)
    G[SLOT] = HELD_SLOT
    await chart.refreshTokens()
    expect(gateClasses(chart)).toEqual([
      'apexcharts-igniteui',
      'apexcharts-igniteui-light',
    ])
    expect(sheetIds(document.head)).toEqual(['apexcharts-css', TWIN_ID])
    expect(chart.w.globals.colors[0]).toBe(page.hex('--ig-primary-seed'))
    expect(chart.w.globals.colors[0]).not.toBe(before.colors[0])
  })
})
