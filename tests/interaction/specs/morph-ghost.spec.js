/**
 * Cross-type morph: the exit of the OUTGOING marks.
 *
 * The morph engine tears the old chart down before the new one draws its
 * first frame. For pairs whose marks correspond 1:1 (bar -> pie) the outgoing
 * mark IS the incoming mark's first frame and needs no exit. For the unit
 * pairs the correspondence is one-to-many, and the exit is the PIECE LAYER:
 * the outgoing mark is cut into one cell per object and every cell flies to
 * its object, corners rounding off and fill blending, so the ink is conserved
 * and nothing ever fades. Wedges are cut the same way, against their own ink
 * rather than their bounding box, so a donut's hole survives the division.
 * The old whole-chart ghost fade survives only as the fallback (an object
 * count past the piece budget, a unit series whose count cannot be known
 * before the merge, or an environment that cannot hit-test a path).
 *
 * These tests pin the parts that are invisible to a unit test: that the
 * pieces start exactly where the outgoing marks were, that the hidden
 * incoming elements are always revealed, that no overlay survives the
 * transition, that the 1:1 pairs never grow an overlay, and that reduced
 * motion skips all of it.
 *
 * They drive the morph gallery (misc/chart-type-morph), which holds five live
 * charts. Everything below is therefore scoped to ONE of them: CARD is the
 * "one mark becomes many" card, whose buttons cover column, pie, donut and the
 * dot cluster. An unscoped `.apexcharts-bar-area` on that page would also
 * count the shapes card's bars and the histogram card's twenty.
 */

import { test } from '../fixtures/base.js'
import { expect } from '@playwright/test'

// The card under test: its chart container, and the buttons that drive it.
const CARD = '#chart2'
const PIECES = `${CARD} .apexcharts-morph-pieces rect`
const GHOST = `${CARD} .apexcharts-morph-ghost`
const UNIT_BTN = '#card-counted [data-count="dots"]'
const COLUMN_BTN = '#card-counted [data-count="column"]'
const PIE_BTN = '#card-counted [data-count="pie"]'

/**
 * loadChart only waits for the first chart on the page. The card under test is
 * the second, so wait for its own entry animation before measuring geometry:
 * pieces are compared against live marks, and a mark still growing would move
 * under the comparison.
 */
async function settle(page) {
  await page.waitForFunction(
    () => window.chart1 && window.chart1.w.globals.animationEnded === true,
    { timeout: 10_000 },
  )
  await page.waitForTimeout(800)
}

test.describe('Cross-type morph exit layer', () => {
  test('column -> unit: the pieces tile the outgoing bars exactly', async ({
    page,
    loadChart,
  }) => {
    await loadChart('misc', 'chart-type-morph')
    await settle(page)

    const r = await page.evaluate(async ([card, piecesSel, unitBtn]) => {
      const scope = document.querySelector(card)

      // The bars' page-space geometry before anything changes.
      const bars = [...scope.querySelectorAll('.apexcharts-bar-series path[pathTo]')].map(
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
        hiddenDots: scope.querySelectorAll('.apexcharts-unit-area[data-piece-hidden]').length,
        dots: scope.querySelectorAll('.apexcharts-unit-area').length,
        ghosts: scope.querySelectorAll('.apexcharts-morph-ghost').length,
      }
    }, [CARD, PIECES, UNIT_BTN])

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
    await settle(page)

    const r = await page.evaluate(async ([card, piecesSel, unitBtn]) => {
      const scope = document.querySelector(card)
      document.querySelector(unitBtn).click()
      const timeline = []
      for (let k = 0; k < 90; k++) {
        await new Promise((res) => requestAnimationFrame(res))
        const pieces = document.querySelectorAll(piecesSel).length
        const visible = [...scope.querySelectorAll('.apexcharts-unit-area')].filter(
          (d) => d.getAttribute('opacity') !== '0',
        ).length
        timeline.push({ pieces, visible })
        if (pieces === 0 && k > 5) break
      }
      await new Promise((res) => setTimeout(res, 1000))
      return {
        timeline,
        settledPieces: document.querySelectorAll(piecesSel).length,
        settledHidden: scope.querySelectorAll('[data-piece-hidden]').length,
        settledVisible: [...scope.querySelectorAll('.apexcharts-unit-area')].filter(
          (d) => d.getAttribute('opacity') !== '0',
        ).length,
        dots: scope.querySelectorAll('.apexcharts-unit-area').length,
      }
    }, [CARD, PIECES, UNIT_BTN])

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
    await settle(page)
    await page.click(UNIT_BTN)
    await page.waitForSelector(`${CARD} .apexcharts-unit-area`)
    await page.waitForTimeout(1500)

    const r = await page.evaluate(async ([card, piecesSel, columnBtn]) => {
      const scope = document.querySelector(card)
      const dotsBefore = scope.querySelectorAll('.apexcharts-unit-area').length
      document.querySelector(columnBtn).click()
      await new Promise((res) => requestAnimationFrame(res))

      const first = {
        pieces: document.querySelectorAll(piecesSel).length,
        hiddenMarks: scope.querySelectorAll('path[data-piece-hidden]').length,
        bars: scope.querySelectorAll('.apexcharts-bar-series path[pathTo]').length,
        ghosts: scope.querySelectorAll('.apexcharts-morph-ghost').length,
      }

      // A mark reveals only when its whole mosaic has landed, so the visible
      // count must step up mark by mark, never dot by dot.
      const seen = new Set()
      for (let k = 0; k < 90; k++) {
        await new Promise((res) => requestAnimationFrame(res))
        const visible = [
          ...scope.querySelectorAll('.apexcharts-bar-series path[pathTo]'),
        ].filter((p) => p.getAttribute('opacity') !== '0').length
        seen.add(visible)
        if (document.querySelectorAll(piecesSel).length === 0 && k > 5) break
      }
      await new Promise((res) => setTimeout(res, 1000))
      return {
        dotsBefore,
        first,
        revealSteps: [...seen].sort((a, b) => a - b),
        settledPieces: document.querySelectorAll(piecesSel).length,
        settledHidden: scope.querySelectorAll('[data-piece-hidden]').length,
      }
    }, [CARD, PIECES, COLUMN_BTN])

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
    await settle(page)
    await page.click(UNIT_BTN)
    await page.waitForSelector(`${CARD} .apexcharts-unit-area`)
    await page.waitForTimeout(1500)

    const r = await page.evaluate(async ([card, piecesSel, columnBtn]) => {
      const scope = document.querySelector(card)
      document.querySelector(columnBtn).click()
      await new Promise((res) => requestAnimationFrame(res))

      // Sample every claimed bar's geometry from its first frame until well
      // past the enter tween's would-be end (stagger + full speed). The bar
      // is hidden while the mosaic assembles, but it still has geometry, and
      // that geometry must never move: the mark's own enter tween used to
      // keep running underneath and replayed as a bounce after the reveal.
      const barsOf = () => [
        ...scope.querySelectorAll('.apexcharts-bar-series path[pathTo]'),
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
        settledHidden: scope.querySelectorAll('[data-piece-hidden]').length,
      }
    }, [CARD, PIECES, COLUMN_BTN])

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
    await settle(page)

    const r = await page.evaluate(async ([piecesSel, ghostSel, pieBtn]) => {
      let pieces = 0
      let ghosts = 0
      document.querySelector(pieBtn).click()
      for (let k = 0; k < 70; k++) {
        await new Promise((res) => requestAnimationFrame(res))
        pieces = Math.max(pieces, document.querySelectorAll(piecesSel).length)
        ghosts = Math.max(ghosts, document.querySelectorAll(ghostSel).length)
      }
      return { pieces, ghosts }
    }, [PIECES, GHOST, PIE_BTN])

    expect(r.pieces).toBe(0)
    expect(r.ghosts).toBe(0)
  })

  test('unit -> pie tiles the wedges too, and leaves no ghost', async ({
    page,
    loadChart,
  }) => {
    await loadChart('misc', 'chart-type-morph')
    await settle(page)
    await page.click(UNIT_BTN)
    await page.waitForTimeout(1500)

    const r = await page.evaluate(async ([card, piecesSel, ghostSel, pieBtn]) => {
      const scope = document.querySelector(card)
      const dotsBefore = scope.querySelectorAll('.apexcharts-unit-area').length
      let pieces = 0
      let ghosts = 0
      document.querySelector(pieBtn).click()
      await new Promise((res) => requestAnimationFrame(res))
      const hiddenWedges = scope.querySelectorAll(
        '.apexcharts-pie-area[data-piece-hidden]',
      ).length
      for (let k = 0; k < 70; k++) {
        await new Promise((res) => requestAnimationFrame(res))
        pieces = Math.max(pieces, document.querySelectorAll(piecesSel).length)
        ghosts = Math.max(ghosts, document.querySelectorAll(ghostSel).length)
      }
      await new Promise((res) => setTimeout(res, 1200))
      return {
        dotsBefore,
        pieces,
        ghosts,
        hiddenWedges,
        wedges: scope.querySelectorAll('.apexcharts-pie-area').length,
        after: document.querySelectorAll(ghostSel).length,
        stranded: scope.querySelectorAll('[data-piece-hidden]').length,
      }
    }, [CARD, PIECES, GHOST, PIE_BTN])

    // Every outgoing dot becomes a piece, every incoming wedge waits hidden
    // for its mosaic, and the fade never runs.
    expect(r.pieces).toBe(r.dotsBefore)
    expect(r.hiddenWedges).toBe(r.wedges)
    expect(r.ghosts).toBe(0)
    expect(r.after).toBe(0)
    expect(r.stranded).toBe(0)
  })

  test('a wedge is cut where its ink is, and a donut keeps its hole', async ({
    page,
    loadChart,
  }) => {
    // The reason the radial pairs used to fade: a rectangular grid over a
    // wedge's bounding box puts cells where the wedge has no ink at all, and
    // over a donut it fills the hole. The divider probes the mark instead, so
    // this asserts the property directly rather than the mechanism.
    await loadChart('misc', 'chart-type-morph')
    await settle(page)

    for (const kind of ['pie', 'donut']) {
      const r = await page.evaluate(async ([type, card]) => {
        const scope = document.querySelector(card)
        document.querySelector(`#card-counted [data-count="${type}"]`).click()
        await new Promise((res) => setTimeout(res, 1700))

        // The wedges as plain numbers: their path data and the matrix from
        // their user space to the page. The morph destroys the elements, so
        // nothing may hold a reference to them.
        const snap = [...scope.querySelectorAll('.apexcharts-pie-area')].map((p) => {
          const m = p.getScreenCTM()
          return { d: p.getAttribute('d'), m: [m.a, m.b, m.c, m.d, m.e, m.f] }
        })

        document.querySelector('#card-counted [data-count="dots"]').click()
        await new Promise((res) => requestAnimationFrame(res))
        const pieces = [
          ...scope.querySelectorAll('.apexcharts-morph-pieces rect'),
        ].map((el) => {
          const b = el.getBoundingClientRect()
          return {
            i: +el.getAttribute('data-i'),
            x: b.x + b.width / 2,
            y: b.y + b.height / 2,
          }
        })

        // Rebuild each wedge live and hit-test the piece centres against it.
        const holder = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        holder.setAttribute('style', 'position:fixed;left:-9999px;width:1200px;height:900px')
        document.body.appendChild(holder)
        const probes = snap.map((sn) => {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
          path.setAttribute('d', sn.d)
          holder.appendChild(path)
          const [a, b, c, d, e, f] = sn.m
          const det = a * d - b * c
          return {
            path,
            inv: (X, Y) => ({
              x: (d * (X - e) - c * (Y - f)) / det,
              y: (a * (Y - f) - b * (X - e)) / det,
            }),
          }
        })
        const pt = holder.createSVGPoint()
        let inside = 0
        for (const pc of pieces) {
          const probe = probes[pc.i]
          if (!probe) continue
          const local = probe.inv(pc.x, pc.y)
          pt.x = local.x
          pt.y = local.y
          if (probe.path.isPointInFill(pt) || probe.path.isPointInStroke(pt)) inside++
        }
        holder.remove()

        await new Promise((res) => setTimeout(res, 1700))
        document.querySelector('#card-counted [data-count="column"]').click()
        await new Promise((res) => setTimeout(res, 1500))
        return { pieces: pieces.length, inside }
      }, [kind, CARD])

      expect(r.pieces).toBeGreaterThan(40)
      // Cells follow the ink. The few that miss sit on the stepped edge of a
      // curve, where a rectangular cell cannot help overshooting slightly; a
      // bounding-box grid scores far below this (a quarter of a pie's box is
      // outside the wedge, and a donut's hole is most of its middle).
      expect(r.inside / r.pieces).toBeGreaterThan(0.85)
    }
  })

  test('past the piece budget the ghost fallback runs and nothing hides', async ({
    page,
    loadChart,
  }) => {
    await loadChart('misc', 'chart-type-morph')

    const r = await page.evaluate(async () => {
      // Its own container, appended to the gallery rather than replacing it:
      // tearing five live charts out from under themselves is not what this
      // test is about.
      const host = document.createElement('div')
      host.id = 'budget-probe'
      host.style.width = '760px'
      document.body.appendChild(host)
      const scope = () => document.querySelector('#budget-probe')

      let seed = 3
      const rand = () => {
        seed = (seed * 16807) % 2147483647
        return (seed - 1) / 2147483646
      }
      const obs = Array.from({ length: 1700 }, () => Math.round(20 + rand() * 60))
      const chart = new window.ApexCharts(host, {
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
        pieces: scope().querySelectorAll('.apexcharts-morph-pieces rect').length,
        ghosts: scope().querySelectorAll('.apexcharts-morph-ghost').length,
        hidden: scope().querySelectorAll('[data-piece-hidden]').length,
        visibleDots: [...scope().querySelectorAll('.apexcharts-unit-area')].filter(
          (d) => d.getAttribute('opacity') !== '0',
        ).length,
      }
      await new Promise((res) => setTimeout(res, 1400))
      return { first, dots: scope().querySelectorAll('.apexcharts-unit-area').length }
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
    await settle(page)

    const r = await page.evaluate(async ([card, unitBtn, columnBtn]) => {
      const scope = document.querySelector(card)
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
          scope.querySelectorAll('.apexcharts-morph-pieces').length +
            scope.querySelectorAll('.apexcharts-morph-ghost').length,
        )
      }
      await new Promise((res) => setTimeout(res, 1400))
      return {
        peakLayers,
        layersAfter:
          scope.querySelectorAll('.apexcharts-morph-pieces').length +
          scope.querySelectorAll('.apexcharts-morph-ghost').length,
        hiddenAfter: scope.querySelectorAll('[data-piece-hidden]').length,
        canvases: scope.querySelectorAll('.apexcharts-canvas').length,
      }
    }, [CARD, UNIT_BTN, COLUMN_BTN])

    expect(r.peakLayers).toBeLessThanOrEqual(1)
    expect(r.layersAfter).toBe(0)
    expect(r.hiddenAfter).toBe(0)
    expect(r.canvases).toBe(1)
  })

  test('reduced motion skips pieces, ghost and hiding alike', async ({ page, loadChart }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await loadChart('misc', 'chart-type-morph')
    await settle(page)

    const r = await page.evaluate(async ([card, piecesSel, ghostSel, unitBtn]) => {
      const scope = document.querySelector(card)
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
        hidden: scope.querySelectorAll('[data-piece-hidden]').length,
        dots: scope.querySelectorAll('.apexcharts-unit-area').length,
      }
    }, [CARD, PIECES, GHOST, UNIT_BTN])

    expect(r.pieces).toBe(0)
    expect(r.ghosts).toBe(0)
    expect(r.hidden).toBe(0)
    expect(r.dots).toBeGreaterThan(0)
  })
})
