/**
 * Storyboard (scrollytelling), against the real demo page.
 *
 * Uses the storyboard-scrollytelling fixture: a sticky 12-column revenue
 * chart plus 5 prose beats bound via chart.storyboard.bind. The demo's
 * design rule, and what these specs pin, is that every beat keeps the SAME
 * twelve marks: emphasis moves via per-column colors and annotations, and
 * the finale is a 1:1 bar-to-donut morph. Verifies:
 *   - binding activates the first beat and the page UI follows beatChange
 *   - scrolling forward applies each beat (spotlight colors, annotations)
 *     without ever changing the mark count
 *   - scrolling back up rewinds to the earlier beat's state
 *   - the finale morphs to a dark 12-slice donut and back
 *   - a beat is exactly ONE updateOptions call (the single-render contract
 *     that keeps transitions animated)
 *   - goTo() jumps by index and key; reduced motion still applies state
 */

import { test, expect } from '../fixtures/base.js'

const INDIGO = '#818cf8'
const FADE = '#e3e8f4'
const RED = '#f87171'

async function scrollToStep(page, n) {
  await page.evaluate((n) => {
    document
      .querySelector('#sb-step-' + n)
      .scrollIntoView({ block: 'center' })
  }, n)
}

function beatState(page) {
  return page.evaluate(() => {
    const w = window.chart.w
    return {
      index: window.chart.storyboard.current()?.index,
      chip: document.getElementById('sb-chip').textContent,
      activeStep: document.querySelector('.sb-step.is-active')?.id,
      colors: w.config.colors.slice(),
      xAnnos: (w.config.annotations.xaxis || []).map((a) => a.x),
      bars: window.chart.el.querySelectorAll('.apexcharts-bar-area').length,
      mode: w.config.theme.mode,
    }
  })
}

test.describe('Storyboard: scroll-driven choreography', () => {
  test.beforeEach(async ({ loadChart }) => {
    // bind() runs on window load; each spec then waits for the first beat to
    // activate from the initial IntersectionObserver pass.
    await loadChart('misc', 'storyboard-scrollytelling')
  })

  test('binding activates the first beat and drives the page UI', async ({
    page,
  }) => {
    await page.waitForFunction(
      () => window.chart.storyboard.current()?.index === 0,
    )
    const s = await beatState(page)
    expect(s.chip).toBe('Beat 1 of 5')
    expect(s.activeStep).toBe('sb-step-1')
    expect(s.bars).toBe(12)
    expect(s.colors).toEqual(new Array(12).fill(INDIGO))
    expect(s.xAnnos).toEqual([])
  })

  test('scrolling forward moves the spotlight without changing mark count', async ({
    page,
  }) => {
    await page.waitForFunction(
      () => window.chart.storyboard.current()?.index === 0,
    )

    // Beat 2: the outage spotlight. March turns red, the months outside the
    // window fade, an annotation marks the month. Still 12 columns.
    await scrollToStep(page, 2)
    await page.waitForFunction(
      () => window.chart.w.config.annotations.xaxis.length === 1,
    )
    let s = await beatState(page)
    expect(s.index).toBe(1)
    expect(s.xAnnos).toEqual(['Mar'])
    expect(s.colors[2]).toBe(RED)
    expect(s.colors[1]).toBe(INDIGO)
    expect(s.colors[0]).toBe(FADE)
    expect(s.colors[7]).toBe(FADE)
    expect(s.bars).toBe(12)

    // Beat 3: the spotlight slides to May onward.
    await scrollToStep(page, 3)
    await page.waitForFunction(
      () => window.chart.w.config.annotations.xaxis[0]?.x === 'May',
    )
    s = await beatState(page)
    expect(s.index).toBe(2)
    expect(s.colors[4]).toBe(INDIGO)
    expect(s.colors[11]).toBe(INDIGO)
    expect(s.colors[0]).toBe(FADE)
    expect(s.bars).toBe(12)

    // Beat 4: full color returns as four quarter groups, no annotations.
    await scrollToStep(page, 4)
    await page.waitForFunction(
      () => window.chart.w.config.annotations.xaxis.length === 0,
    )
    s = await beatState(page)
    expect(s.index).toBe(3)
    expect(s.colors[0]).toBe('#818cf8')
    expect(s.colors[3]).toBe('#7dd3fc')
    expect(s.colors[6]).toBe('#4ade80')
    expect(s.colors[9]).toBe('#fbbf24')
    expect(s.bars).toBe(12)
  })

  test('scrolling back up rewinds the story', async ({ page }) => {
    await page.waitForFunction(
      () => window.chart.storyboard.current()?.index === 0,
    )
    for (const n of [2, 3, 4]) {
      await scrollToStep(page, n)
      await page.waitForFunction(
        (idx) => window.chart.storyboard.current()?.index === idx,
        n - 1,
      )
    }
    // Back to the outage beat: its annotation and spotlight return.
    await scrollToStep(page, 2)
    await page.waitForFunction(
      () => window.chart.storyboard.current()?.index === 1,
    )
    await page.waitForFunction(
      () => window.chart.w.config.annotations.xaxis[0]?.x === 'Mar',
    )
    const s = await beatState(page)
    expect(s.colors[2]).toBe(RED)
    expect(s.colors[7]).toBe(FADE)
    expect(s.bars).toBe(12)
    expect(s.activeStep).toBe('sb-step-2')
  })

  test('the finale morphs the columns into a dark donut ring and back', async ({
    page,
  }) => {
    await page.waitForFunction(
      () => window.chart.storyboard.current()?.index === 0,
    )
    for (const n of [2, 3, 4]) {
      await scrollToStep(page, n)
      await page.waitForFunction(
        (idx) => window.chart.storyboard.current()?.index === idx,
        n - 1,
      )
    }

    // The finale: each of the 12 columns becomes its own slice; the quarter
    // colors and the values carry over unchanged; the theme stays light.
    await scrollToStep(page, 5)
    await page.waitForFunction(
      () => window.chart.w.config.chart.type === 'donut',
    )
    let s = await page.evaluate(() => ({
      mode: window.chart.w.config.theme.mode,
      series: window.chart.w.config.series,
      labels: window.chart.w.config.labels.length,
      slices: window.chart.el.querySelectorAll('.apexcharts-pie-area').length,
    }))
    expect(s.mode).toBe('light')
    expect(s.series).toEqual([12, 14, 9, 15, 18, 22, 26, 31, 37, 44, 52, 61])
    expect(s.labels).toBe(12)
    expect(s.slices).toBe(12)

    // Scrub back: the ring unrolls into the quarter columns, with clean
    // labels (the donut's month labels must not leak into the axis mapping).
    await scrollToStep(page, 4)
    await page.waitForFunction(
      () => window.chart.w.config.chart.type === 'bar',
    )
    s = await page.evaluate(() => ({
      mode: window.chart.w.config.theme.mode,
      bars: window.chart.el.querySelectorAll('.apexcharts-bar-area').length,
      labels: window.chart.w.config.labels,
    }))
    expect(s.mode).toBe('light')
    expect(s.bars).toBe(12)
    expect(s.labels).toEqual([])

    // And all the way home: the opening all-indigo year.
    await scrollToStep(page, 1)
    await page.waitForFunction(
      () => window.chart.storyboard.current()?.index === 0,
    )
    const home = await beatState(page)
    expect(home.bars).toBe(12)
    expect(home.colors).toEqual(new Array(12).fill(INDIGO))
    expect(home.xAnnos).toEqual([])
    expect(home.mode).toBe('light')
  })

  test('a beat is exactly one render, so its transition stays animated', async ({
    page,
  }) => {
    await page.waitForFunction(
      () => window.chart.storyboard.current()?.index === 0,
    )
    // Spy on updateOptions: the view and the beat's option payload must land
    // in a single call. A second immediate call would kill the first one's
    // animation mid-flight (the "beats do not animate" regression).
    const calls = await page.evaluate(async () => {
      const orig = window.chart.updateOptions.bind(window.chart)
      let n = 0
      window.chart.updateOptions = (...a) => {
        n++
        return orig(...a)
      }
      window.chart.storyboard.goTo(1)
      await new Promise((r) => setTimeout(r, 100))
      const afterSpotlightBeat = n
      window.chart.storyboard.goTo(4)
      await new Promise((r) => setTimeout(r, 100))
      return { afterSpotlightBeat, afterMorphBeat: n - afterSpotlightBeat }
    })
    expect(calls.afterSpotlightBeat).toBe(1)
    expect(calls.afterMorphBeat).toBe(1)
  })

  test('goTo jumps by index and key; reduced motion still applies state', async ({
    page,
  }) => {
    await page.waitForFunction(
      () => window.chart.storyboard.current()?.index === 0,
    )

    // Collect beatChange payloads via addEventListener.
    await page.evaluate(() => {
      window.__beats = []
      window.chart.addEventListener('beatChange', (chart, info) => {
        window.__beats.push({ index: info.index, direction: info.direction })
      })
    })

    await page.evaluate(() => window.chart.storyboard.goTo(2))
    await page.waitForFunction(
      () => window.chart.w.config.annotations.xaxis[0]?.x === 'May',
    )
    let r = await page.evaluate(() => ({
      beats: window.__beats,
      current: window.chart.storyboard.current(),
    }))
    expect(r.current).toEqual({ index: 2, key: '2' })
    expect(r.beats).toEqual([{ index: 2, direction: 'down' }])

    // By key (beats bound without explicit keys default to their index).
    await page.evaluate(() => window.chart.storyboard.goTo('0'))
    await page.waitForFunction(
      () => window.chart.w.config.annotations.xaxis.length === 0,
    )
    r = await page.evaluate(() => ({
      beats: window.__beats,
      current: window.chart.storyboard.current(),
    }))
    expect(r.current).toEqual({ index: 0, key: '0' })
    expect(r.beats[1]).toEqual({ index: 0, direction: 'up' })

    // Reduced motion: the beat still applies, just without animation.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.evaluate(() => window.chart.storyboard.goTo(1))
    await page.waitForFunction(
      () => window.chart.w.config.annotations.xaxis[0]?.x === 'Mar',
    )
    const s = await beatState(page)
    expect(s.index).toBe(1)
    expect(s.colors[2]).toBe('#f87171')
  })
})
