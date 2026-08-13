/**
 * Cross-type morph: the exit of the OUTGOING marks.
 *
 * The morph engine tears the old chart down before the new one draws its
 * first frame. For pairs whose marks correspond 1:1 (bar -> pie) the outgoing
 * mark IS the incoming mark's first frame and needs no exit. For the unit
 * pairs the correspondence is one-to-many, and the exit is the PIECE LAYER:
 * the outgoing mark is cut into one cell per object and every cell flies to
 * its object, corners rounding off and fill blending, so the ink is conserved
 * and nothing ever fades. The old whole-chart ghost fade survives only as the
 * fallback (an unsupported source family such as radial, or an object count
 * past the piece budget).
 *
 * These tests pin the parts that are invisible to a unit test: that the
 * pieces start exactly where the outgoing marks were, that the hidden
 * incoming elements are always revealed, that no overlay survives the
 * transition, that the 1:1 pairs never grow an overlay, and that reduced
 * motion skips all of it.
 */

import { test } from '../fixtures/base.js'
import { expect } from '@playwright/test'

const PIECES = '.apexcharts-morph-pieces rect'
const GHOST = '.apexcharts-morph-ghost'
const UNIT_BTN = '.actions button[data-type="unit"]'
const COLUMN_BTN = '.actions button[data-type="bar"][data-horizontal="false"]'

test.describe('Cross-type morph exit layer', () => {
  test('column -> unit: the pieces tile the outgoing bars exactly', async ({
    page,
    loadChart,
  }) => {
    await loadChart('misc', 'chart-type-morph')
    // Geometry is measured against the LIVE bars, so the entry animation must
    // be fully settled first; animationEnded fires before the last staggered
    // bar has reached its final height.
    await page.waitForTimeout(800)

    const r = await page.evaluate(async ([piecesSel, unitBtn]) => {
      // The bars' page-space geometry before anything changes.
      const bars = [...document.querySelectorAll('.apexcharts-bar-series path[pathTo]')].map(
        (p) => {
          const b = p.getBoundingClientRect()
          return { x: b.x, y: b.y, w: b.width, h: b.height }
        },
      )

      document.querySelector(unitBtn).click()
      await new Promise((res) => requestAnimationFrame(res))

      // Union of each cluster's pieces, in the same page space.
      const unions = {}
      document.querySelectorAll(piecesSel).forEach((el) => {
        const i = el.getAttribute('data-i')
        const b = el.getBoundingClientRect()
        const u = (unions[i] = unions[i] || { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9, n: 0 })
        u.x0 = Math.min(u.x0, b.x)
        u.y0 = Math.min(u.y0, b.y)
        u.x1 = Math.max(u.x1, b.x + b.width)
        u.y1 = Math.max(u.y1, b.y + b.height)
        u.n++
      })

      const drift = bars.map((bar, i) => {
        const u = unions[i]
        if (!u) return null
        return Math.max(
          Math.abs(u.x0 - bar.x),
          Math.abs(u.y0 - bar.y),
          Math.abs(u.x1 - (bar.x + bar.w)),
          Math.abs(u.y1 - (bar.y + bar.h)),
        )
      })

      return {
        bars: bars.length,
        clusters: Object.keys(unions).length,
        pieces: Object.values(unions).reduce((n, u) => n + u.n, 0),
        maxDrift: Math.max(...drift.filter((d) => d != null)),
        hiddenDots: document.querySelectorAll('.apexcharts-unit-area[data-piece-hidden]').length,
        dots: document.querySelectorAll('.apexcharts-unit-area').length,
        ghosts: document.querySelectorAll('.apexcharts-morph-ghost').length,
      }
    }, [PIECES, UNIT_BTN])

    expect(r.bars).toBeGreaterThan(0)
    expect(r.clusters).toBe(r.bars)
    // One piece per object, and every dot waits hidden for its piece.
    expect(r.pieces).toBe(r.dots)
    expect(r.hiddenDots).toBe(r.dots)
    // The cells tile the mark by construction, so the union of a cluster's
    // pieces must reproduce its bar's rect to the sub-pixel.
    expect(r.maxDrift).toBeLessThan(1)
    // Ink is conserved: no fading photocopy anywhere.
    expect(r.ghosts).toBe(0)
  })

  test('column -> unit: dots are revealed as pieces land, none fade', async ({
    page,
    loadChart,
  }) => {
    await loadChart('misc', 'chart-type-morph')

    const r = await page.evaluate(async ([piecesSel, unitBtn]) => {
      document.querySelector(unitBtn).click()
      const timeline = []
      for (let k = 0; k < 90; k++) {
        await new Promise((res) => requestAnimationFrame(res))
        const pieces = document.querySelectorAll(piecesSel).length
        const visible = [...document.querySelectorAll('.apexcharts-unit-area')].filter(
          (d) => d.getAttribute('opacity') !== '0',
        ).length
        timeline.push({ pieces, visible })
        if (pieces === 0 && k > 5) break
      }
      await new Promise((res) => setTimeout(res, 1000))
      return {
        timeline,
        settledPieces: document.querySelectorAll(piecesSel).length,
        settledHidden: document.querySelectorAll('[data-piece-hidden]').length,
        settledVisible: [...document.querySelectorAll('.apexcharts-unit-area')].filter(
          (d) => d.getAttribute('opacity') !== '0',
        ).length,
        dots: document.querySelectorAll('.apexcharts-unit-area').length,
      }
    }, [PIECES, UNIT_BTN])

    // The reveal is a swap: visible-dot count only ever grows, and every dot
    // that appears does so because its piece just landed on it (pieces shrink
    // by exactly what visibility gains).
    const t = r.timeline
    for (let k = 1; k < t.length; k++) {
      expect(t[k].visible).toBeGreaterThanOrEqual(t[k - 1].visible)
      expect(t[k].pieces + t[k].visible).toBe(t[0].pieces)
    }
    expect(r.settledPieces).toBe(0)
    expect(r.settledHidden).toBe(0)
    expect(r.settledVisible).toBe(r.dots)
  })

  test('unit -> column: dots fly in and tile each mark, which reveals whole', async ({
    page,
    loadChart,
  }) => {
    await loadChart('misc', 'chart-type-morph')
    await page.click(UNIT_BTN)
    await page.waitForSelector('.apexcharts-unit-area')
    await page.waitForTimeout(1500)

    const r = await page.evaluate(async ([piecesSel, columnBtn]) => {
      const dotsBefore = document.querySelectorAll('.apexcharts-unit-area').length
      document.querySelector(columnBtn).click()
      await new Promise((res) => requestAnimationFrame(res))

      const first = {
        pieces: document.querySelectorAll(piecesSel).length,
        hiddenMarks: document.querySelectorAll('path[data-piece-hidden]').length,
        bars: document.querySelectorAll('.apexcharts-bar-series path[pathTo]').length,
        ghosts: document.querySelectorAll('.apexcharts-morph-ghost').length,
      }

      // A mark reveals only when its whole mosaic has landed, so the visible
      // count must step up mark by mark, never dot by dot.
      const seen = new Set()
      for (let k = 0; k < 90; k++) {
        await new Promise((res) => requestAnimationFrame(res))
        const visible = [...document.querySelectorAll('.apexcharts-bar-series path[pathTo]')].filter(
          (p) => p.getAttribute('opacity') !== '0',
        ).length
        seen.add(visible)
        if (document.querySelectorAll(piecesSel).length === 0 && k > 5) break
      }
      await new Promise((res) => setTimeout(res, 1000))
      return {
        dotsBefore,
        first,
        revealSteps: [...seen].sort((a, b) => a - b),
        settledPieces: document.querySelectorAll(piecesSel).length,
        settledHidden: document.querySelectorAll('[data-piece-hidden]').length,
      }
    }, [PIECES, COLUMN_BTN])

    // Every outgoing dot became a piece; every incoming mark held for its
    // mosaic.
    expect(r.first.pieces).toBe(r.dotsBefore)
    expect(r.first.hiddenMarks).toBe(r.first.bars)
    expect(r.first.ghosts).toBe(0)
    // The staggered assembly reveals marks progressively (at least a few
    // distinct visible-counts before all are shown).
    expect(r.revealSteps.length).toBeGreaterThan(2)
    expect(r.revealSteps[r.revealSteps.length - 1]).toBe(r.first.bars)
    expect(r.settledPieces).toBe(0)
    expect(r.settledHidden).toBe(0)
  })

  test('unit -> column: incoming bars are born final and never re-animate', async ({
    page,
    loadChart,
  }) => {
    await loadChart('misc', 'chart-type-morph')
    await page.click(UNIT_BTN)
    await page.waitForSelector('.apexcharts-unit-area')
    await page.waitForTimeout(1500)

    const r = await page.evaluate(async ([piecesSel, columnBtn]) => {
      document.querySelector(columnBtn).click()
      await new Promise((res) => requestAnimationFrame(res))

      // Sample every claimed bar's geometry from its first frame until well
      // past the enter tween's would-be end (stagger + full speed). The bar
      // is hidden while the mosaic assembles, but it still has geometry, and
      // that geometry must never move: the mark's own enter tween used to
      // keep running underneath and replayed as a bounce after the reveal.
      const barsOf = () => [
        ...document.querySelectorAll('.apexcharts-bar-series path[pathTo]'),
      ]
      const rectsOf = () =>
        barsOf().map((p) => {
          const b = p.getBoundingClientRect()
          return [b.x, b.y, b.width, b.height]
        })

      const samples = [rectsOf()]
      for (let k = 0; k < 60; k++) {
        await new Promise((res) => requestAnimationFrame(res))
        await new Promise((res) => requestAnimationFrame(res))
        samples.push(rectsOf())
      }
      // Past every clock in play: morph flight, animations.speed, stagger.
      await new Promise((res) => setTimeout(res, 1200))
      const finals = rectsOf()

      let maxDrift = 0
      for (const sample of samples) {
        if (sample.length !== finals.length) continue
        sample.forEach((rect, b) => {
          rect.forEach((v, q) => {
            maxDrift = Math.max(maxDrift, Math.abs(v - finals[b][q]))
          })
        })
      }

      return {
        bars: finals.length,
        sampled: samples.length,
        maxDrift,
        settledPieces: document.querySelectorAll(piecesSel).length,
        settledHidden: document.querySelectorAll('[data-piece-hidden]').length,
      }
    }, [PIECES, COLUMN_BTN])

    expect(r.bars).toBeGreaterThan(0)
    expect(r.sampled).toBeGreaterThan(30)
    // Born at final geometry, revealed in place, and not one pixel of motion
    // before or after the reveal: all movement belongs to the pieces.
    expect(r.maxDrift).toBeLessThan(1)
    expect(r.settledPieces).toBe(0)
    expect(r.settledHidden).toBe(0)
  })

  test('bar -> pie never grows an exit overlay: the wedge starts as the bar', async ({
    page,
    loadChart,
  }) => {
    await loadChart('misc', 'chart-type-morph')

    const r = await page.evaluate(async ([piecesSel, ghostSel]) => {
      let pieces = 0
      let ghosts = 0
      document.querySelector('.actions button[data-type="pie"]').click()
      for (let k = 0; k < 70; k++) {
        await new Promise((res) => requestAnimationFrame(res))
        pieces = Math.max(pieces, document.querySelectorAll(piecesSel).length)
        ghosts = Math.max(ghosts, document.querySelectorAll(ghostSel).length)
      }
      return { pieces, ghosts }
    }, [PIECES, GHOST])

    expect(r.pieces).toBe(0)
    expect(r.ghosts).toBe(0)
  })

  test('unit -> pie keeps the ghost fallback: wedges cannot be tiled yet', async ({
    page,
    loadChart,
  }) => {
    await loadChart('misc', 'chart-type-morph')
    await page.click(UNIT_BTN)
    await page.waitForTimeout(1500)

    const r = await page.evaluate(async ([piecesSel, ghostSel]) => {
      let pieces = 0
      let ghosts = 0
      document.querySelector('.actions button[data-type="pie"]').click()
      for (let k = 0; k < 70; k++) {
        await new Promise((res) => requestAnimationFrame(res))
        pieces = Math.max(pieces, document.querySelectorAll(piecesSel).length)
        ghosts = Math.max(ghosts, document.querySelectorAll(ghostSel).length)
      }
      await new Promise((res) => setTimeout(res, 1000))
      return { pieces, ghosts, after: document.querySelectorAll(ghostSel).length }
    }, [PIECES, GHOST])

    expect(r.pieces).toBe(0)
    expect(r.ghosts).toBe(1)
    expect(r.after).toBe(0)
  })

  test('past the piece budget the ghost fallback runs and nothing hides', async ({
    page,
    loadChart,
  }) => {
    await loadChart('misc', 'chart-type-morph')

    const r = await page.evaluate(async () => {
      document.body.innerHTML = '<div id="probe" style="width:760px"></div>'
      let seed = 3
      const rand = () => {
        seed = (seed * 16807) % 2147483647
        return (seed - 1) / 2147483646
      }
      const obs = Array.from({ length: 1700 }, () => Math.round(20 + rand() * 60))
      const chart = new window.ApexCharts(document.querySelector('#probe'), {
        chart: { id: 'probe', type: 'histogram', height: 400 },
        series: [{ name: 'Big', data: obs }],
        plotOptions: { histogram: { bins: 20 } },
      })
      await chart.render()
      chart.updateOptions({
        chart: { type: 'unit' },
        series: chart.rowSeries({ maxRows: 5000 }),
        plotOptions: { unit: { layout: 'packed', unitValue: 1 } },
      })
      await new Promise((res) => requestAnimationFrame(res))
      const first = {
        pieces: document.querySelectorAll('.apexcharts-morph-pieces rect').length,
        ghosts: document.querySelectorAll('.apexcharts-morph-ghost').length,
        hidden: document.querySelectorAll('[data-piece-hidden]').length,
        visibleDots: [...document.querySelectorAll('.apexcharts-unit-area')].filter(
          (d) => d.getAttribute('opacity') !== '0',
        ).length,
      }
      await new Promise((res) => setTimeout(res, 1400))
      return { first, dots: document.querySelectorAll('.apexcharts-unit-area').length }
    })

    // 1700 objects exceed the budget: pieces stand down, the fade covers the
    // exit, and the dots never hide (they burst as before).
    expect(r.dots).toBe(1700)
    expect(r.first.pieces).toBe(0)
    expect(r.first.ghosts).toBe(1)
    expect(r.first.hidden).toBe(0)
    expect(r.first.visibleDots).toBeGreaterThan(0)
  })

  test('re-morphing mid-flight never stacks overlays or strands hidden marks', async ({
    page,
    loadChart,
  }) => {
    await loadChart('misc', 'chart-type-morph')

    const r = await page.evaluate(async ([unitBtn, columnBtn]) => {
      let peakLayers = 0
      document.querySelector(unitBtn).click()
      await new Promise((res) => setTimeout(res, 90))
      document.querySelector(columnBtn).click()
      await new Promise((res) => setTimeout(res, 90))
      document.querySelector(unitBtn).click()
      for (let k = 0; k < 70; k++) {
        await new Promise((res) => requestAnimationFrame(res))
        peakLayers = Math.max(
          peakLayers,
          document.querySelectorAll('.apexcharts-morph-pieces').length +
            document.querySelectorAll('.apexcharts-morph-ghost').length,
        )
      }
      await new Promise((res) => setTimeout(res, 1400))
      return {
        peakLayers,
        layersAfter:
          document.querySelectorAll('.apexcharts-morph-pieces').length +
          document.querySelectorAll('.apexcharts-morph-ghost').length,
        hiddenAfter: document.querySelectorAll('[data-piece-hidden]').length,
        canvases: document.querySelectorAll('.apexcharts-canvas').length,
      }
    }, [UNIT_BTN, COLUMN_BTN])

    expect(r.peakLayers).toBeLessThanOrEqual(1)
    expect(r.layersAfter).toBe(0)
    expect(r.hiddenAfter).toBe(0)
    expect(r.canvases).toBe(1)
  })

  test('reduced motion skips pieces, ghost and hiding alike', async ({ page, loadChart }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await loadChart('misc', 'chart-type-morph')

    const r = await page.evaluate(async ([piecesSel, ghostSel, unitBtn]) => {
      let pieces = 0
      let ghosts = 0
      document.querySelector(unitBtn).click()
      for (let k = 0; k < 40; k++) {
        await new Promise((res) => requestAnimationFrame(res))
        pieces = Math.max(pieces, document.querySelectorAll(piecesSel).length)
        ghosts = Math.max(ghosts, document.querySelectorAll(ghostSel).length)
      }
      return {
        pieces,
        ghosts,
        hidden: document.querySelectorAll('[data-piece-hidden]').length,
        dots: document.querySelectorAll('.apexcharts-unit-area').length,
      }
    }, [PIECES, GHOST, UNIT_BTN])

    expect(r.pieces).toBe(0)
    expect(r.ghosts).toBe(0)
    expect(r.hidden).toBe(0)
    expect(r.dots).toBeGreaterThan(0)
  })
})
