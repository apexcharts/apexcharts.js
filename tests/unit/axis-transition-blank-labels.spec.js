import { describe, it, expect, afterEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import { BrowserAPIs } from '../../src/ssr/BrowserAPIs.js'

// A long category axis with tickAmount draws most of its labels with empty
// text. The axis transition used to start a tween on every one of them
// (position and fade), although an empty label paints nothing. Counts the
// chrome tweens an update starts, and pins a mid-flight frame and the
// settled chrome, both recorded at the base commit, so the labels that do
// show (including ones that turn blank or stop being blank in the update)
// move exactly as before.

const cats = (n) => Array.from({ length: n }, (_, i) => `C${i}`)
const vals = (n, s = 0) =>
  Array.from({ length: n }, (_, i) => (((i + s) * 7) % 23) + 1)

/** FNV-1a, so a frame can be pinned without pasting it. */
const hash = (s) => {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++)
    h = Math.imul(h ^ s.charCodeAt(i), 0x01000193)
  return (h >>> 0).toString(16)
}

function clock() {
  const frames = []
  let now = 1000
  vi.spyOn(BrowserAPIs, 'requestAnimationFrame').mockImplementation((cb) => {
    frames.push(cb)
    return frames.length
  })
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  return {
    at: (t) => (now = t),
    pump(t) {
      now = t
      frames.splice(0).forEach((cb) => cb(t))
    },
    settle(from) {
      for (let t = from; t < from + 2000; t += 16) this.pump(t)
    },
  }
}

/** What is painted: labels with text, ghosts, every line, the plot origin. */
function painted(root) {
  const out = []
  root.querySelectorAll('.apexcharts-xaxis-texts-g text').forEach((t) => {
    if (!t.textContent) return
    out.push(
      [
        t.textContent,
        t.getAttribute('x'),
        t.getAttribute('y'),
        t.getAttribute('transform'),
        t.style.opacity,
      ].join(','),
    )
  })
  root.querySelectorAll('line').forEach((l) => {
    out.push(
      ['x1', 'y1', 'x2', 'y2'].map((a) => l.getAttribute(a)).join(',') +
        l.style.opacity,
    )
  })
  out.push(
    root.querySelector('.apexcharts-graphical').getAttribute('transform'),
  )
  return out.join(';')
}

/** The settled axis and grid markup, minus the per-instance ids. */
function settled(root) {
  return ['.apexcharts-xaxis', '.apexcharts-grid']
    .map((s) => root.querySelector(s).outerHTML)
    .join('')
    .replace(/ id="[^"]*"/g, '')
    .replace(/url\(#[^)]*\)/g, '')
}

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('axis transition skips blank labels', () => {
  it('tweens only labels that draw text, with the same frames', async () => {
    const c = clock()
    document.body.innerHTML = '<div id="c"></div>'
    const chart = new ApexCharts(document.querySelector('#c'), {
      chart: {
        type: 'bar',
        width: 600,
        height: 300,
        animations: {
          enabled: true,
          speed: 300,
          dynamicAnimation: { enabled: true, speed: 300 },
        },
      },
      dataLabels: { enabled: false },
      grid: { xaxis: { lines: { show: true } } },
      xaxis: { categories: cats(24), tickAmount: 4 },
      series: [{ name: 'A', data: vals(24) }],
    })
    await chart.render()
    c.settle(1000)
    const gl = chart.w.globals
    const root = chart.w.dom.baseEl
    const shown = () =>
      [...root.querySelectorAll('.apexcharts-xaxis-texts-g text')]
        .map((t) => t.textContent)
        .filter(Boolean)
    const before = shown()

    // 24 to 36 categories: the shown step goes from every 5th to every 7th,
    // so C5, C10, C15 and C20 turn blank and C7, C14, ... stop being blank.
    c.at(5000)
    gl.pendingCapture = null
    await chart.updateOptions({
      xaxis: { categories: cats(36) },
      series: [{ data: vals(36, 2) }],
    })
    const live = gl.chromeTweens.size
    c.pump(5000)
    c.pump(5150)
    const mid = painted(root)
    c.settle(5166)
    // The frame pinned above really is mid-flight.
    expect(painted(root)).not.toBe(mid)
    const rest = settled(root)
    const after = shown()

    expect(before).toContain('C5')
    expect(after).not.toContain('C5')
    expect(after).toContain('C7')
    // Before: 36 (the blank labels' position tweens too).
    expect(live).toBe(6)
    expect(hash(mid)).toBe('15ac92a7')
    expect(hash(rest)).toBe('1b9f3788')
    chart.destroy()
  })

  it('still tweens blank value-axis labels, which the next capture reads', async () => {
    // A blank y label is an anchor of the y projection (its outermost
    // labels) when an update supersedes one in flight: it has to be captured
    // at its in-flight position, so it keeps its tween.
    const c = clock()
    document.body.innerHTML = '<div id="c"></div>'
    const blank = new Set([0, 50, 100])
    // Passed with every update, which replaces the whole y axis config.
    const y = (max) => ({
      min: 0,
      max,
      tickAmount: 4,
      labels: { formatter: (v) => (blank.has(v) ? '' : String(v)) },
    })
    const chart = new ApexCharts(document.querySelector('#c'), {
      chart: {
        type: 'line',
        width: 600,
        height: 300,
        animations: {
          enabled: true,
          speed: 300,
          dynamicAnimation: { enabled: true, speed: 300 },
        },
      },
      dataLabels: { enabled: false },
      yaxis: y(100),
      xaxis: { categories: cats(6) },
      series: [{ name: 'A', data: vals(6) }],
    })
    await chart.render()
    c.settle(1000)
    const gl = chart.w.globals
    const root = chart.w.dom.baseEl
    const ys = () =>
      [...root.querySelectorAll('.apexcharts-yaxis-texts-g text')]
        .map((t) => [t.textContent, t.getAttribute('y'), t.style.opacity])
        .join(';')

    c.at(5000)
    gl.pendingCapture = null
    blank.clear()
    ;[0, 1000].forEach((v) => blank.add(v))
    await chart.updateOptions({ yaxis: y(1000) })
    c.pump(5000)
    c.pump(5060)
    c.pump(5120)
    // A second update while the first is in flight.
    gl.pendingCapture = null
    blank.clear()
    ;[0, 200].forEach((v) => blank.add(v))
    await chart.updateOptions({ yaxis: y(200) })
    const frames = [5120, 5168, 5270, 5360].map((t) => {
      c.pump(t)
      return ys()
    })
    c.settle(5376)
    expect(frames[2]).not.toBe(ys())
    // The bottom label is blank in all three renders, matched by occurrence
    // to the old middle one, which was still riding at the second capture.
    expect(frames[1].split(';').filter((e) => e[0] === ',').length).toBe(2)
    // Recorded at the base commit. With blank y labels skipped, the entering
    // labels slide in from elsewhere: 58fc24e0, 5f2f7444, fbf7c1fd, c3ea1dea.
    expect(frames.map(hash)).toEqual([
      '5a1c5997',
      '4ea94988',
      'dd9f912a',
      '6256bc5e',
    ])
    chart.destroy()
  })

  it('reads no skipped category label when a later update supersedes', async () => {
    // Nothing projects a category axis, so the next capture reading a
    // skipped blank label at its final rather than in-flight spot is unseen.
    const c = clock()
    document.body.innerHTML = '<div id="c"></div>'
    const chart = new ApexCharts(document.querySelector('#c'), {
      chart: {
        type: 'bar',
        width: 600,
        height: 300,
        animations: {
          enabled: true,
          speed: 300,
          dynamicAnimation: { enabled: true, speed: 300 },
        },
      },
      dataLabels: { enabled: false },
      xaxis: { categories: cats(24), tickAmount: 4 },
      series: [{ name: 'A', data: vals(24) }],
    })
    await chart.render()
    c.settle(1000)
    const gl = chart.w.globals
    const root = chart.w.dom.baseEl
    c.at(5000)
    gl.pendingCapture = null
    await chart.updateOptions({
      xaxis: { categories: cats(36), tickAmount: 4 },
      series: [{ data: vals(36, 2) }],
    })
    const live = gl.chromeTweens.size
    c.pump(5000)
    c.pump(5120)
    gl.pendingCapture = null
    await chart.updateOptions({
      xaxis: { categories: cats(30), tickAmount: 4 },
      series: [{ data: vals(30, 1) }],
    })
    const frames = [5120, 5168, 5270, 5360].map((t) => {
      c.pump(t)
      return painted(root)
    })
    c.settle(5376)
    expect(frames[2]).not.toBe(painted(root))
    // Before: 36.
    expect(live).toBe(6)
    // Recorded at the base commit.
    expect(frames.map(hash)).toEqual([
      'b3cd0d0c',
      '649ac7e8',
      'b5d8f4fd',
      '4adece52',
    ])
    chart.destroy()
  })
})
