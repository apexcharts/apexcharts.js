/**
 * Outer (name) labels on a unit chart: `plotOptions.unit.clusterLabels.external`.
 *
 * These are the pie/donut leader-line labels applied to a silhouette's colour
 * bands, so the things worth pinning down are the ones a viewer would notice:
 *  - a leader line lands on a dot of the band it names, not on empty space
 *  - the labels take turns down the two gutters (or follow their band when the
 *    categories run left-to-right instead of top-to-bottom)
 *  - the gutter is genuinely reserved, so no label hangs off the plot
 *  - crowded labels get spaced apart instead of stacking on each other
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/full.js'
import { spaceOutLabels } from '../../src/charts/common/OuterLabels.js'
import { LicenseManager } from 'apex-commons'
import { installTestSigningKey, signedKey } from './utils/license-keys.js'
import { _resetPremiumSignals } from '../../src/modules/license/LicenseEnforcer.js'

installTestSigningKey()
const VALID_KEY = signedKey('2020-01-01', '2099-01-01', 'premium')

/** Row-major fill: category 0 takes the top rows, so the bands stack vertically. */
function rowsLayout(objects, rect) {
  const n = objects.length || 1
  const cols = Math.max(1, Math.ceil(Math.sqrt(n * (rect.width / rect.height))))
  const rows = Math.max(1, Math.ceil(n / cols))
  const dx = rect.width / cols
  const dy = rect.height / rows
  return objects.map((o, k) => ({
    id: o.id,
    x: rect.x + (k % cols) * dx + dx / 2,
    y: rect.y + Math.floor(k / cols) * dy + dy / 2,
  }))
}

/** Column-major fill: category 0 takes the left columns, so the bands run across. */
function colsLayout(objects, rect) {
  const n = objects.length || 1
  const rows = Math.max(1, Math.ceil(Math.sqrt(n * (rect.height / rect.width))))
  const cols = Math.max(1, Math.ceil(n / rows))
  const dx = rect.width / cols
  const dy = rect.height / rows
  return objects.map((o, k) => ({
    id: o.id,
    x: rect.x + Math.floor(k / rows) * dx + dx / 2,
    y: rect.y + (k % rows) * dy + dy / 2,
  }))
}

ApexCharts.registerUnitLayout('test-rows', rowsLayout)
ApexCharts.registerUnitLayout('test-cols', colsLayout)

function chartWith(o = {}) {
  const {
    series = [576, 168, 42, 34],
    labels = ['Owned', 'Mortgaged', 'Renting', 'Other'],
    positions = 'test-rows',
    clusterLabels = {},
    width = 640,
    height = 420,
  } = o
  // `in`, not a destructuring default: a default fires on an explicit
  // `undefined` too, which would silently turn the labels ON in the very tests
  // that mean to leave them off.
  const external = 'external' in o ? o.external : { show: true }
  return createChartWithOptions({
    chart: { type: 'unit', width, height, animations: { enabled: false } },
    series,
    labels,
    plotOptions: {
      unit: {
        layout: 'custom',
        positions,
        clusterLabels: { ...clusterLabels, external },
      },
    },
  })
}

const labelGroups = (chart) =>
  Array.from(
    chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-outer-label-group'),
  )

const connectorOf = (group) =>
  group.querySelector('.apexcharts-unit-label-connector')

/** First point of a leader line's `d` ("M x y L ..."). */
function leaderStart(group) {
  const d = connectorOf(group).getAttribute('d')
  const [, x, y] = d.match(/^M\s+([-\d.]+)\s+([-\d.]+)/)
  return { x: parseFloat(x), y: parseFloat(y) }
}

function textOf(group) {
  const el = group.querySelector('.apexcharts-unit-outer-label')
  const tspans = el.getElementsByTagName('tspan')
  return tspans.length
    ? Array.from(tspans).map((t) => t.textContent)
    : [el.textContent]
}

/** Every drawn dot, grouped by the series it belongs to. */
function dotsBySeries(chart) {
  /** @type {Record<number, {x:number,y:number,r:number}[]>} */
  const out = {}
  chart.w.dom.baseEl.querySelectorAll('.apexcharts-series').forEach((s) => {
    const i = parseInt(s.getAttribute('data:realIndex'), 10)
    out[i] = Array.from(s.querySelectorAll('.apexcharts-unit-area')).map((el) => ({
      x: parseFloat(el.getAttribute('cx')),
      y: parseFloat(el.getAttribute('cy')),
      r: parseFloat(el.getAttribute('r')),
    }))
  })
  return out
}

/** The drawn dot radius, read back off the DOM rather than guessed. */
function dotRadius(chart) {
  const el = chart.w.dom.baseEl.querySelector('.apexcharts-unit-area')
  return parseFloat(el.getAttribute('r'))
}

describe('Unit chart — outer labels', () => {
  let charts = []
  beforeEach(() => {
    LicenseManager.licenseKey = VALID_KEY
    _resetPremiumSignals()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    charts.forEach((c) => c && c.destroy && c.destroy())
    charts = []
    LicenseManager.licenseKey = null
    LicenseManager.validationResult = null
    LicenseManager._resetSignatureState()
    _resetPremiumSignals()
    vi.restoreAllMocks()
  })

  const make = (o) => {
    const c = chartWith(o)
    charts.push(c)
    return c
  }

  it('draws nothing unless asked', () => {
    const chart = make({ external: undefined })
    expect(labelGroups(chart)).toHaveLength(0)
  })

  it('draws one label per non-empty category', () => {
    const chart = make({})
    expect(labelGroups(chart)).toHaveLength(4)
  })

  it('skips a category with no dots', () => {
    const chart = make({ series: [576, 0, 42, 0] })
    expect(labelGroups(chart)).toHaveLength(2)
    const names = labelGroups(chart).map((g) => textOf(g)[0])
    expect(names).toEqual(expect.arrayContaining(['Owned', 'Renting']))
    expect(names).not.toContain('Mortgaged')
  })

  it('names the category and states its share on a second line', () => {
    const chart = make({})
    const lines = labelGroups(chart).map((g) => textOf(g))
    lines.forEach((l) => {
      expect(l).toHaveLength(2)
      expect(l[1]).toMatch(/^\d+\.\d%$/)
    })
    const shares = lines.map((l) => parseFloat(l[1]))
    // shares are of the dot total, so they add up
    expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 0)
  })

  it('honours a formatter, splitting lines on \\n', () => {
    const chart = make({
      clusterLabels: {
        formatter: (name, { value }) => `${name}\n${value} homes`,
      },
    })
    const lines = labelGroups(chart).map((g) => textOf(g))
    expect(lines[0][1]).toMatch(/ homes$/)
    const single = make({
      clusterLabels: { formatter: (name) => name },
    })
    expect(textOf(labelGroups(single)[0])).toHaveLength(1)
  })

  it('lands each leader line on a dot of the band it names', () => {
    const chart = make({})
    const dots = dotsBySeries(chart)
    const r = dotRadius(chart)

    labelGroups(chart).forEach((g) => {
      const start = leaderStart(g)
      const name = textOf(g)[0]
      const i = chart.w.config.labels.indexOf(name)
      expect(i).toBeGreaterThanOrEqual(0)
      // The anchor sits on the rim of one of ITS OWN dots, so the nearest dot in
      // that band is within a radius (plus a pixel of slack) of the line's start.
      const nearest = Math.min(
        ...dots[i].map((d) => Math.hypot(d.x - start.x, d.y - start.y)),
      )
      expect(nearest).toBeLessThanOrEqual(r + 1.5)

      // ...and no dot of any OTHER band is closer than its own.
      Object.keys(dots).forEach((k) => {
        if (parseInt(k, 10) === i) return
        const other = Math.min(
          ...dots[k].map((d) => Math.hypot(d.x - start.x, d.y - start.y)),
        )
        expect(other).toBeGreaterThanOrEqual(nearest - 1e-6)
      })
    })
  })

  it('alternates gutters when the bands stack vertically', () => {
    const chart = make({ positions: 'test-rows' })
    const mid = chart.w.layout.gridWidth / 2
    // sorted top to bottom, the labels take turns
    const sides = labelGroups(chart)
      .map((g) => {
        const start = leaderStart(g)
        const x = parseFloat(
          g.querySelector('.apexcharts-unit-outer-label').getAttribute('x'),
        )
        return { y: start.y, side: x >= mid ? 'right' : 'left' }
      })
      .sort((a, b) => a.y - b.y)
      .map((s) => s.side)
    expect(sides).toEqual(['right', 'left', 'right', 'left'])
  })

  it('sends each label to its own side when the bands run across', () => {
    const chart = make({ positions: 'test-cols', series: [200, 200, 200, 200] })
    const mid = chart.w.layout.gridWidth / 2
    const dots = dotsBySeries(chart)
    labelGroups(chart).forEach((g) => {
      const name = textOf(g)[0]
      const i = chart.w.config.labels.indexOf(name)
      const cx = dots[i].reduce((a, d) => a + d.x, 0) / dots[i].length
      const labelX = parseFloat(
        g.querySelector('.apexcharts-unit-outer-label').getAttribute('x'),
      )
      // a band left of centre is labelled on the left, and vice versa
      expect(labelX >= mid).toBe(cx >= mid)
    })
  })

  it('reserves the gutter: the shape gives up room on both sides, evenly', () => {
    const off = make({ external: undefined })
    const on = make({})
    const spanOf = (chart) => {
      const xs = Object.values(dotsBySeries(chart)).flat().map((d) => d.x)
      return { min: Math.min(...xs), max: Math.max(...xs) }
    }
    const a = spanOf(off)
    const b = spanOf(on)
    expect(b.min).toBeGreaterThan(a.min)
    expect(b.max).toBeLessThan(a.max)
    // taken off both sides equally, so the silhouette stays centred
    const gw = on.w.layout.gridWidth
    expect(b.min - a.min).toBeCloseTo(a.max - b.max, 0)
    expect((b.min + b.max) / 2).toBeCloseTo(gw / 2, 0)
  })

  it('keeps every label inside the plot rect', () => {
    const chart = make({})
    const gw = chart.w.layout.gridWidth
    const gh = chart.w.layout.gridHeight
    labelGroups(chart).forEach((g) => {
      const el = g.querySelector('.apexcharts-unit-outer-label')
      const x = parseFloat(el.getAttribute('x'))
      const y = parseFloat(el.getAttribute('y'))
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(gw)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(gh)
    })
  })

  it('spaces a crowded gutter apart instead of stacking labels', () => {
    // eight thin bands in a 300px-tall plot: their natural label positions
    // overlap, so the de-overlap pass has to do real work
    const chart = make({
      series: [40, 40, 40, 40, 40, 40, 40, 40],
      labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      height: 300,
    })
    const mid = chart.w.layout.gridWidth / 2
    const bySide = { left: [], right: [] }
    labelGroups(chart).forEach((g) => {
      const el = g.querySelector('.apexcharts-unit-outer-label')
      const x = parseFloat(el.getAttribute('x'))
      bySide[x >= mid ? 'right' : 'left'].push(parseFloat(el.getAttribute('y')))
    })
    Object.values(bySide).forEach((ys) => {
      ys.sort((a, b) => a - b)
      for (let k = 1; k < ys.length; k++) {
        // two lines at 13px => an 18px line height; a 2-line block must clear
        expect(ys[k] - ys[k - 1]).toBeGreaterThanOrEqual(30)
      }
    })
  })

  it('takes the connector colour from the band, and respects an override', () => {
    const chart = make({})
    const colors = chart.w.globals.colors
    labelGroups(chart).forEach((g) => {
      const name = textOf(g)[0]
      const i = chart.w.config.labels.indexOf(name)
      expect(connectorOf(g).getAttribute('stroke')).toBe(colors[i])
    })

    const fixed = make({ external: { show: true, connector: { color: '#333' } } })
    labelGroups(fixed).forEach((g) => {
      expect(connectorOf(g).getAttribute('stroke')).toBe('#333')
    })
  })

  it('can drop the leader line and keep the label', () => {
    const chart = make({ external: { show: true, connector: { show: false } } })
    const groups = labelGroups(chart)
    expect(groups).toHaveLength(4)
    groups.forEach((g) => expect(connectorOf(g)).toBeNull())
  })

  it('ignores external labels on the generated layouts', () => {
    const chart = createChartWithOptions({
      chart: { type: 'unit', width: 640, height: 420, animations: { enabled: false } },
      series: [576, 168, 42, 34],
      labels: ['Owned', 'Mortgaged', 'Renting', 'Other'],
      plotOptions: {
        unit: { layout: 'packed', clusterLabels: { external: { show: true } } },
      },
    })
    charts.push(chart)
    expect(labelGroups(chart)).toHaveLength(0)
  })

  it('stays out of the way when clusterLabels are off entirely', () => {
    const chart = make({ clusterLabels: { show: false } })
    expect(labelGroups(chart)).toHaveLength(0)
  })
})

describe('Unit chart — outer label reveal', () => {
  let charts = []
  beforeEach(() => {
    LicenseManager.licenseKey = VALID_KEY
    _resetPremiumSignals()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    charts.forEach((c) => c && c.destroy && c.destroy())
    charts = []
    LicenseManager.licenseKey = null
    LicenseManager.validationResult = null
    LicenseManager._resetSignatureState()
    _resetPremiumSignals()
    vi.restoreAllMocks()
  })

  // Built directly, NOT through createChartWithOptions: that helper force-disables
  // animations for every chart it makes, which is exactly what these tests are
  // about.
  function animatedChart(speed = 900) {
    document.body.innerHTML = '<div id="chart" />'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: {
        type: 'unit',
        width: 640,
        height: 420,
        animations: { enabled: true, speed },
      },
      series: [576, 168, 42, 34],
      labels: ['Owned', 'Mortgaged', 'Renting', 'Other'],
      plotOptions: {
        unit: {
          layout: 'custom',
          positions: 'test-rows',
          clusterLabels: { external: { show: true } },
        },
      },
    })
    chart.render()
    charts.push(chart)
    return chart
  }

  const group = (chart) =>
    chart.w.dom.baseEl.querySelector('.apexcharts-unit-outer-labels')

  it('holds the labels back only for a fraction of the gather', () => {
    const chart = animatedChart(900)
    const g = group(chart)
    expect(g.classList.contains('apexcharts-unit-label-delay')).toBe(true)
    // Not the old "wait for the very last dot" timing (speed + stagger = 1.35s),
    // which read as the labels being broken.
    const delay = parseFloat(g.style.animationDelay)
    expect(delay).toBeGreaterThan(0)
    expect(delay).toBeLessThanOrEqual(0.6)
  })

  it('caps the wait however slow the configured speed is', () => {
    const g = group(animatedChart(6000))
    expect(parseFloat(g.style.animationDelay)).toBeLessThanOrEqual(0.6)
  })

  it('does not wait on an update — the crowd is already on screen', () => {
    const chart = animatedChart(900)
    expect(group(chart).classList.contains('apexcharts-unit-label-delay')).toBe(true)
    chart.updateSeries([400, 300, 80, 40])
    const g = group(chart)
    expect(g).not.toBeNull()
    expect(g.classList.contains('apexcharts-unit-label-delay')).toBe(false)
    expect(g.style.animationDelay).toBe('')
  })

  it('never delays when animations are off', () => {
    const chart = chartWith({})
    charts.push(chart)
    const g = group(chart)
    expect(g.classList.contains('apexcharts-unit-label-delay')).toBe(false)
  })
})

describe('spaceOutLabels', () => {
  it('pushes overlapping labels apart, keeping their order', () => {
    const items = [
      { idealY: 100, labelY: 0 },
      { idealY: 104, labelY: 0 },
      { idealY: 108, labelY: 0 },
    ]
    spaceOutLabels(items, 20, 400)
    expect(items.map((i) => i.labelY)).toEqual([100, 120, 140])
  })

  it('pulls a column that ran past the bottom back up as a block', () => {
    const items = [
      { idealY: 380, labelY: 0 },
      { idealY: 385, labelY: 0 },
    ]
    spaceOutLabels(items, 20, 400)
    expect(items.map((i) => i.labelY)).toEqual([380, 400])
  })

  it('clamps the top only when a ceiling is given', () => {
    const unclamped = [{ idealY: 5, labelY: 0 }, { idealY: 8, labelY: 0 }]
    spaceOutLabels(unclamped, 20, 20)
    expect(unclamped[0].labelY).toBeLessThan(10)

    const clamped = [{ idealY: 5, labelY: 0 }, { idealY: 8, labelY: 0 }]
    spaceOutLabels(clamped, 20, 400, 10)
    expect(clamped.map((i) => i.labelY)).toEqual([10, 30])
  })

  it('does not reorder the caller\'s array', () => {
    const items = [
      { idealY: 300, labelY: 0, tag: 'b' },
      { idealY: 100, labelY: 0, tag: 'a' },
    ]
    spaceOutLabels(items, 20, 400)
    expect(items.map((i) => i.tag)).toEqual(['b', 'a'])
    expect(items[1].labelY).toBe(100)
  })
})
