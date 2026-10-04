/**
 * A treemap update moves everything on a tile with the tile.
 *
 * The tiles already eased from their old boxes. Their labels did not: drawn
 * at the final spot on the first frame, each sat over whatever tile was still
 * there. Their colours switched at once. And a zoomed treemap, which draws
 * only one branch's leaves, read each tile's old box by DOM position against
 * a capture keyed by data index, so the tiles grew in from nothing instead.
 * (The nested parents and headers are covered by update-transition-matrix.)
 * Click-to-zoom, at the end, is the same picture moved by a camera.
 */

import { test, expect } from '@playwright/test'
import { mountChart, loadSample, recordTransition, noJump, expectNoViolations } from '../helpers/frames.js'
import { advance } from '../helpers/virtual-time.js'

const base = (extra) => ({
  chart: { type: 'treemap', height: 320, toolbar: { show: false }, animations: { dynamicAnimation: { speed: 350 } } },
  legend: { show: false },
  ...extra,
})

/** Centre of each tile label, keyed by its text. */
function labelCentres() {
  const out = {}
  document.querySelectorAll('.apexcharts-treemap .apexcharts-data-labels text').forEach((t) => {
    const r = t.getBoundingClientRect()
    out[t.textContent] = [r.x + r.width / 2, r.y + r.height / 2]
  })
  return out
}

test('labels ride their tiles from where they were', async ({ page }) => {
  const series = (s) => [{ name: 'S', data: ['a', 'b', 'c', 'd'].map((x, i) => ({ x, y: s ? [40, 10, 30, 20][i] : [10, 40, 20, 30][i] })) }]
  const errors = await mountChart(page, base({ series: series(0) }))
  const rec = await recordTransition(page, () => page.evaluate((s) => window.chart.updateSeries(s), series(1)), {
    probe: labelCentres,
  })
  const before = rec.probeBefore
  const first = rec.probes[0]
  const last = rec.probes[rec.probes.length - 1]
  let travelled = 0
  for (const name of Object.keys(last)) {
    const [bx, by] = before[name]
    const [fx, fy] = first[name]
    expect(Math.hypot(fx - bx, fy - by), `${name} jumped on the first frame`).toBeLessThan(1.5)
    travelled = Math.max(travelled, Math.hypot(last[name][0] - bx, last[name][1] - by))
    // No frame covers most of the way at once.
    for (let f = 1; f < rec.probes.length; f++) {
      const [ax, ay] = rec.probes[f - 1][name]
      const [cx, cy] = rec.probes[f][name]
      expect(Math.hypot(cx - ax, cy - ay)).toBeLessThan(Math.max(1.5, 0.6 * Math.hypot(last[name][0] - bx, last[name][1] - by)))
    }
  }
  expect(travelled, 'the update should move the tiles').toBeGreaterThan(20)
  expect(errors).toEqual([])
})

test('a tile that changes colour eases between the two', async ({ page }) => {
  const series = (s) => [{ name: 'S', data: ['a', 'b', 'c'].map((x, i) => ({ x, y: s && i === 0 ? 80 : [20, 40, 30][i] })) }]
  const errors = await mountChart(
    page,
    base({
      series: series(0),
      plotOptions: {
        treemap: {
          colorScale: {
            ranges: [
              { from: 0, to: 50, color: '#1e88e5' },
              { from: 51, to: 100, color: '#e53935' },
            ],
          },
        },
      },
    }),
  )
  const probe = () => {
    const rgb = (c) => {
      const s = document.createElement('canvas').getContext('2d')
      s.fillStyle = c
      const h = s.fillStyle
      return h.startsWith('#')
        ? [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16))
        : h.match(/[\d.]+/g).slice(0, 3).map(Number)
    }
    const tile = document.querySelector('.apexcharts-treemap-rect[j="0"]')
    return rgb(tile.getAttribute('fill'))
  }
  const rec = await recordTransition(page, () => page.evaluate((s) => window.chart.updateSeries(s), series(1)), { probe })
  const [from, to] = [rec.probeBefore, rec.probes[rec.probes.length - 1]]
  // Blue to red (each shaded by its value, so not the range colours exactly).
  expect(from[2]).toBeGreaterThan(from[0])
  expect(to[0]).toBeGreaterThan(to[2])
  // Starts on the old colour, and passes through colours in between.
  expect(rec.probes[0]).toEqual(from)
  const between = rec.probes.filter((c) => c.some((v, k) => Math.abs(v - from[k]) > 8 && Math.abs(v - to[k]) > 8))
  expect(between.length, 'no frame between the two colours').toBeGreaterThan(3)
  expect(errors).toEqual([])
})

test('an update while zoomed into a branch starts each tile from its own box', async ({ page }) => {
  const series = (s) => [
    {
      name: 'S',
      data: ['G0', 'G1'].map((x, g) => ({
        x,
        children: [0, 1, 2].map((i) => ({ x: `${x}-${i}`, y: 10 + ((g * 3 + i) * 7 + s * 5) % 23 })),
      })),
    },
  ]
  const errors = await mountChart(page, base({ series: series(0), plotOptions: { treemap: { zoom: { enabled: true } } } }))
  // Zoom into the second branch: its leaves are data rows 3 to 5, drawn as
  // the first three tiles.
  await page.locator('.apexcharts-treemap-parent-header').nth(1).click()
  await page.evaluate(() => window.__vt.advance(2000))
  expect(await page.locator('.apexcharts-treemap-rect').evaluateAll((els) => els.map((e) => e.getAttribute('j')))).toEqual(['3', '4', '5'])

  const rec = await recordTransition(page, () => page.evaluate((s) => window.chart.updateSeries(s), series(1)))
  expectNoViolations(noJump(rec), 'frame 0 of the update')
  expect(errors).toEqual([])
})

// ---------------------------------------------------------------------------
// Click-to-zoom. A zoom reframes the same tree, so it moves like a camera:
// what stays on screen eases to its new box, what the new view leaves out
// rides off the plot, and what it adds rides in from outside. It used to
// re-render with whatever flags the last update left: zooming in snapped
// everything, and zooming back out replayed the mount animation for the
// tiles while the containers, headers and labels snapped.
// ---------------------------------------------------------------------------

/**
 * Everything the treemap paints inside the plot, as sorted strings: rects by
 * fill and box, texts by content and centre, each with its opacity. Ghosts
 * riding out count like anything else: it is what a viewer sees.
 */
function treemapPicture(sel) {
  const out = []
  const scope = sel ? document.querySelector(sel) : document
  const chart = sel ? window.__freshChart : window.chart
  const tm = scope.querySelector('.apexcharts-treemap')
  const svg = scope.querySelector('.apexcharts-svg').getBoundingClientRect()
  const L = chart.w.layout
  const left = svg.x + L.translateX
  const top = svg.y + L.translateY
  const inPlot = (b) =>
    b.right > left + 1 && b.left < left + L.gridWidth - 1 && b.bottom > top + 1 && b.top < top + L.gridHeight - 1
  const opacity = (el) => {
    let o = 1
    for (let n = el; n && n !== tm.parentNode; n = n.parentNode) o *= parseFloat(getComputedStyle(n).opacity)
    return o
  }
  const px = (v) => Math.round(v)
  tm.querySelectorAll('rect').forEach((r) => {
    const b = r.getBoundingClientRect()
    const o = opacity(r)
    if (b.width < 0.5 || b.height < 0.5 || o < 0.02 || !inPlot(b)) return
    out.push(`R ${r.getAttribute('fill')} ${px(b.x - svg.x)},${px(b.y - svg.y)},${px(b.width)},${px(b.height)} ${o.toFixed(1)}`)
  })
  tm.querySelectorAll('text').forEach((t) => {
    const b = t.getBoundingClientRect()
    const o = opacity(t)
    if (!b.width || o < 0.02 || !inPlot(b)) return
    out.push(`X ${t.textContent} ${px(b.x + b.width / 2 - svg.x)},${px(b.y + b.height / 2 - svg.y)} ${o.toFixed(1)}`)
  })
  return out.sort()
}

/**
 * Where everything the new view keeps sits, by key: tiles, containers, their
 * header strips and the tile labels. Plus how many ghosts are riding out and
 * whether the treemap is clipped to the plot.
 */
function treemapBoxes() {
  const out = { ghosts: document.querySelectorAll('.apexcharts-treemap-ghosts > *').length }
  out.clipped = !!document.querySelector('.apexcharts-treemap')?.getAttribute('clip-path')
  const box = (el) => {
    const b = el.getBoundingClientRect()
    return [b.x + b.width / 2, b.y + b.height / 2, b.width, b.height]
  }
  document.querySelectorAll('.apexcharts-treemap-rect').forEach((e) => (out[`T${e.getAttribute('data:key')}`] = box(e)))
  document.querySelectorAll('.apexcharts-treemap-parent-rect').forEach((e) => {
    out[`P${e.getAttribute('data:key')}`] = box(e)
    const head = e.parentNode.querySelector('.apexcharts-treemap-parent-header')
    if (head) out[`H${e.getAttribute('data:key')}`] = box(head)
  })
  // Labels at full strength: one cross-fading with its old self is checked
  // on its own, below.
  document.querySelectorAll('.apexcharts-treemap .apexcharts-data-labels[data\\:key]').forEach((e) => {
    if (e.getAttribute('opacity') === null) out[`L${e.getAttribute('data:key')}`] = box(e).slice(0, 2)
  })
  return out
}

/** Every keyed box that is on screen before and after moves without a jump. */
function easedViolations(rec) {
  const out = []
  const seq = [rec.probeBefore, ...rec.probes]
  const last = seq[seq.length - 1]
  for (const k of Object.keys(last)) {
    if (!/^[TPHL]/.test(k) || !rec.probeBefore[k]) continue
    const at = seq.map((s) => s[k])
    if (at.some((v) => !v)) continue
    const travel = Math.max(...at.map((v) => Math.hypot(...v.map((c, i) => c - at[0][i]))))
    if (Math.hypot(...at[1].map((c, i) => c - at[0][i])) > 1.5) out.push(`${k} jumped at frame 0`)
    for (let f = 2; f < at.length; f++) {
      const step = Math.hypot(...at[f].map((c, i) => c - at[f - 1][i]))
      if (step > Math.max(1.5, 0.6 * travel)) out.push(`${k} jumped ${step.toFixed(1)}px at frame ${f - 1}`)
    }
  }
  return out
}

const header = (page, n) => () => page.locator('.apexcharts-treemap-parent-header').nth(n).click()
const crumb = (page, n) => () => page.locator('.apexcharts-breadcrumb .apexcharts-breadcrumb-item').nth(n).click()

/**
 * The picture a chart rendered from scratch, at rest, draws for the view the
 * zoom landed on: the same options, focused on the same branch.
 */
async function restingPicture(page) {
  return page.evaluate(async (fn) => {
    const pic = (0, eval)(`(${fn})`)
    const o = window.__frameLib.clone(window.__opts0)
    o.chart = { ...o.chart, animations: { enabled: false } }
    const host = document.createElement('div')
    host.id = '__fresh'
    host.style.width = window.chart.el.getBoundingClientRect().width + 'px'
    window.chart.el.parentNode.appendChild(host)
    const c = new window.ApexCharts(host, o)
    c.w.globals.treemapFocusKey = window.chart.w.globals.treemapFocusKey
    window.__freshChart = c
    await c.render()
    await window.__vt.advance(50)
    const p = pic('#__fresh')
    c.destroy()
    host.remove()
    return p
  }, treemapPicture.toString())
}

test.describe('Treemap click-to-zoom', () => {
  // In, one level deeper, then straight back out to the whole tree.
  const STEPS = [
    ['zooming into a sector', (page) => header(page, 1)],
    ['zooming one level deeper', (page) => header(page, 1)],
    ['going back to the whole tree', (page) => crumb(page, 0)],
  ]

  test('each step starts on the picture that was on screen and lands at rest', async ({ page }) => {
    const errors = await loadSample(page, 'treemap', 'nested-market-map')
    for (const [what, act] of STEPS) {
      const rec = await recordTransition(page, act(page), { probe: treemapPicture, ms: 1200 })
      const before = new Set(rec.probeBefore)
      const first = new Set(rec.probes[0])
      expect([...before].filter((x) => !first.has(x)), `${what}: gone at frame 0`).toEqual([])
      expect([...first].filter((x) => !before.has(x)), `${what}: new at frame 0`).toEqual([])
      // Ends exactly where a render of the new view at rest draws it.
      const last = rec.probes[rec.probes.length - 1]
      expect(last, `${what}: final frame`).toEqual(await restingPicture(page))
    }
    expect(errors).toEqual([])
  })

  test('what stays on screen eases to its new place, and nothing is left behind', async ({ page }) => {
    const errors = await loadSample(page, 'treemap', 'nested-market-map')
    for (const [what, act] of STEPS) {
      const rec = await recordTransition(page, act(page), { probe: treemapBoxes, ms: 1200 })
      expectNoViolations(easedViolations(rec), what)
      const moving = Object.keys(rec.probeBefore).filter(
        (k) => /^[TP]/.test(k) && rec.probes.at(-1)[k] && Math.abs(rec.probes.at(-1)[k][2] - rec.probeBefore[k][2]) > 20,
      )
      expect(moving.length, `${what}: nothing kept on screen changed size`).toBeGreaterThan(0)
      // Clipped while things ride across the plot edge, then put back.
      expect(rec.probes[0].clipped, what).toBe(true)
      expect(rec.probes.at(-1).clipped, what).toBe(false)
      expect(rec.probes.at(-1).ghosts, what).toBe(0)
    }
    expect(errors).toEqual([])
  })

  test('what the new view leaves out rides off the plot instead of vanishing', async ({ page }) => {
    const errors = await loadSample(page, 'treemap', 'nested-market-map')
    const ghosts = () =>
      [...document.querySelectorAll('.apexcharts-treemap-ghosts rect')].map((r) => {
        const b = r.getBoundingClientRect()
        return [b.x, b.y, b.width, b.height]
      })
    const rec = await recordTransition(page, header(page, 1), { probe: ghosts, ms: 1200 })
    const first = rec.probes[0]
    expect(first.length, 'the sectors left out are carried, not dropped').toBeGreaterThan(100)
    // They move every frame, and are gone once they have left the plot.
    const lastWith = rec.probes.filter((g) => g.length).at(-1)
    expect(lastWith.some((b, i) => Math.hypot(b[0] - first[i][0], b[1] - first[i][1]) > 100)).toBe(true)
    expect(rec.probes.at(-1)).toEqual([])
    expect(errors).toEqual([])
  })

  test('a label the zoom draws differently cross-fades instead of switching', async ({ page }) => {
    const errors = await loadSample(page, 'treemap', 'nested-market-map')
    // A tile that grows on the way in may turn its label upright, or show
    // more of its name; the header that becomes the outermost one gets
    // another size and its value. Each text's copies and their strength.
    const copies = () => {
      const out = {}
      document.querySelectorAll('.apexcharts-treemap text').forEach((t) => {
        let o = 1
        for (let n = t; n && !n.classList?.contains('apexcharts-treemap'); n = n.parentNode) o *= parseFloat(getComputedStyle(n).opacity)
        ;(out[t.textContent] = out[t.textContent] || []).push(o)
      })
      return out
    }
    const rec = await recordTransition(page, header(page, 1), { probe: copies, ms: 1200 })
    // About a third of the way through the sample's 350ms.
    const mid = rec.probes[7]
    const fading = Object.keys(mid).filter((k) => mid[k].length === 2)
    expect(fading.length, 'labels and headers changing how they read').toBeGreaterThan(3)
    for (const k of fading) {
      // Both visible, together at full strength: neither switches.
      expect(Math.min(...mid[k]), k).toBeGreaterThan(0.05)
      expect(mid[k][0] + mid[k][1], k).toBeGreaterThan(0.85)
      expect(mid[k][0] + mid[k][1], k).toBeLessThan(1.15)
      // One copy at full strength once it is over.
      expect(rec.probes.at(-1)[k], k).toEqual([1])
    }
    expect(errors).toEqual([])
  })

  test('a header strip eases its height when the zoom changes its depth', async ({ page }) => {
    const errors = await loadSample(page, 'treemap', 'nested-market-map')
    await header(page, 1)()
    await advance(page, 2000)
    // The industry about to be focused: a 15px strip one level down, the
    // outermost 26px one once it is the root.
    const rec = await recordTransition(page, header(page, 1), { probe: treemapBoxes, ms: 1200 })
    const key = Object.keys(rec.probes.at(-1)).find((k) => k.startsWith('H') && rec.probeBefore[k] && rec.probeBefore[k][3] < rec.probes.at(-1)[k][3] - 5)
    expect(key, 'a header that grows').toBeTruthy()
    const heights = new Set([rec.probeBefore, ...rec.probes].map((p) => p[key][3].toFixed(1)))
    expect(heights.size).toBeGreaterThan(5)
    expect(errors).toEqual([])
  })
})

test.describe('Treemap click-to-zoom, edge cases', () => {
  /** Two series whose branches share names and positions (2025, 2026). */
  const twoYears = (extra = {}) =>
    base({
      chart: {
        type: 'treemap',
        height: 320,
        toolbar: { show: false },
        animations: { dynamicAnimation: { speed: 350 } },
        ...(extra.chart || {}),
      },
      legend: { show: false },
      plotOptions: { treemap: { zoom: { enabled: true } } },
      series: ['2025', '2026'].map((name, s) => ({
        name,
        data: ['G1', 'G2'].map((g, gi) => ({
          x: g,
          children: [0, 1, 2].map((i) => ({ x: `${g}-${i}`, y: 10 + ((s * 7 + gi * 5 + i * 3) % 13) })),
        })),
      })),
      ...extra,
      ...(extra.chart ? { chart: undefined } : {}),
    })

  /** Every ghost rect's box against the plot, at each frame. */
  function ghostsVsPlot() {
    const L = window.chart.w.layout
    const svg = document.querySelector('#chart .apexcharts-svg').getBoundingClientRect()
    const left = svg.x + L.translateX
    const top = svg.y + L.translateY
    const tm = document.querySelector('#chart .apexcharts-treemap')
    return [...document.querySelectorAll('#chart .apexcharts-treemap-ghosts rect')].map((r) => {
      const b = r.getBoundingClientRect()
      let o = 1
      for (let n = r; n && n !== tm; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity)
      // Area of the ghost still showing inside the plot, by its strength.
      const w = Math.max(0, Math.min(b.right, left + L.gridWidth) - Math.max(b.left, left))
      const h = Math.max(0, Math.min(b.bottom, top + L.gridHeight) - Math.max(b.top, top))
      return w * h * o
    })
  }

  test('zooming into a branch of the second series carries the rest off the plot', async ({ page }) => {
    const opts = twoYears()
    opts.chart = { ...opts.chart, type: 'treemap' }
    const errors = await mountChart(page, opts)
    // Series 1's G1 header: series 0 draws 3 headers (its root and G1, G2)
    // only when there are several series; find it by name and series.
    const idx = await page.evaluate(() =>
      [...document.querySelectorAll('.apexcharts-treemap-parent-header')].findIndex(
        (h) =>
          h.closest('.apexcharts-series')?.getAttribute('data:realIndex') === '1' &&
          h.parentNode.querySelector('.apexcharts-treemap-parent-rect').getAttribute('data:key').endsWith('G1'),
      ),
    )
    expect(idx).toBeGreaterThan(-1)
    const rec = await recordTransition(page, header(page, idx), { probe: ghostsVsPlot, ms: 1200 })
    // The ghosts start on screen and end off it: none ends up covering the plot.
    expect(rec.probes[0].length).toBeGreaterThan(0)
    const lastWith = rec.probes.filter((g) => g.length).at(-1)
    expect(Math.max(...lastWith), 'ghost area left showing in the plot').toBeLessThan(2000)
    expect(errors).toEqual([])
  })

  test('the containers it leaves out paint under their tiles, as they did', async ({ page }) => {
    const errors = await loadSample(page, 'treemap', 'nested-market-map')
    const order = () => {
      const g = document.querySelector('#chart .apexcharts-treemap-ghosts')
      if (!g) return null
      // First ghost tile (a bare rect) and last ghost container (a group).
      const kids = [...g.children]
      const firstTile = kids.findIndex((k) => k.tagName.toLowerCase() === 'rect')
      const lastGroup = kids.map((k) => k.tagName.toLowerCase()).lastIndexOf('g')
      return { firstTile, lastGroup }
    }
    const rec = await recordTransition(page, header(page, 1), { probe: order, ms: 200 })
    const o = rec.probes[0]
    expect(o && o.firstTile > -1 && o.lastGroup > -1).toBe(true)
    expect(o.lastGroup, 'every container before the first tile').toBeLessThan(o.firstTile)
    expect(errors).toEqual([])
  })

  test('tiles it leaves out keep a gradient fill on their way off', async ({ page }) => {
    const opts = twoYears({ fill: { type: 'gradient' } })
    opts.chart = { ...opts.chart, type: 'treemap' }
    const errors = await mountChart(page, opts)
    const fills = () =>
      [...document.querySelectorAll('#chart .apexcharts-treemap-ghosts rect')]
        .map((r) => r.getAttribute('fill') || '')
        .filter((f) => f.startsWith('url('))
        .map((f) => !!document.getElementById(f.slice(5, -1)))
    const rec = await recordTransition(page, header(page, 1), { probe: fills, ms: 200 })
    expect(rec.probes[0].length, 'gradient-filled ghosts').toBeGreaterThan(0)
    expect(rec.probes[0].every(Boolean), 'each ghost fill resolves').toBe(true)
    expect(errors).toEqual([])
  })

  test('a second zoom while the first is moving starts from the picture on screen', async ({ page }) => {
    const errors = await loadSample(page, 'treemap', 'nested-market-map')
    await recordTransition(page, header(page, 1), { ms: 64 })
    const rec = await recordTransition(page, header(page, 1), { probe: treemapPicture, ms: 1200 })
    const before = new Set(rec.probeBefore)
    const first = new Set(rec.probes[0])
    const gone = [...before].filter((x) => !first.has(x))
    // Riding labels and fades are measured to 0.1: allow those few.
    expect(gone.length, `gone at frame 0: ${gone.slice(0, 6).join(' | ')}`).toBeLessThan(6)
    expect(errors).toEqual([])
  })
})
