// @ts-nocheck
/**
 * Regression for #5316: when a streaming line/area has a null gap, Line.js
 * joins the segments into one path for drawing, but stream scroll used to
 * project pathFrom from the first segment only. The segment after the gap
 * then had no previous-frame geometry and replayed its entry animation on
 * every update.
 *
 * Goes through Line.js: renders a windowed datetime chart with a null inside
 * the window, shifts the window by one point with updateSeries, and records
 * every pathFrom that Line.js builds through projectPathToPrevFrame.
 *
 * Draw commands (L/C) are counted rather than M: each segment already ends in
 * an extra M, so a first-segment-only pathFrom would have 2 Ms as well.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import './__mocks__/ResizeObserver.js'

const recorded = vi.hoisted(() => [])

vi.mock(
  '../../src/modules/animations/StreamScroll.js',
  async (importOriginal) => {
    const mod = await importOriginal()
    return {
      ...mod,
      projectPathToPrevFrame: (d, transform) => {
        const out = mod.projectPathToPrevFrame(d, transform)
        recorded.push(out)
        return out
      },
    }
  },
)

import ApexCharts from '../../src/entries/standard.js'

const MIN = 60000
const T0 = Date.UTC(2026, 0, 1)
const YS = [10, 14, 12, 18, null, 16, 20, 15, 22, 19]
const WINDOW = 8

/** Rolling window of WINDOW points starting at index `start`. */
const windowAt = (start) =>
  Array.from({ length: WINDOW }, (_, i) => ({
    x: T0 + (start + i) * MIN,
    y: YS[start + i],
  }))

/** Number of drawing commands (L/C) in a path string. */
const drawCommands = (d) => (d.match(/[LC]/g) || []).length

let chart = null

afterEach(() => {
  chart?.destroy()
  chart = null
  document.body.innerHTML = ''
})

async function scrollOnce(type, curve) {
  document.body.innerHTML = '<div id="chart"></div>'
  chart = new ApexCharts(document.querySelector('#chart'), {
    chart: { type, width: 600, height: 300, animations: { enabled: true } },
    stroke: { curve },
    xaxis: { type: 'datetime', range: (WINDOW - 1) * MIN },
    series: [{ name: 's', data: windowAt(0) }],
  })
  await chart.render()
  recorded.length = 0
  await chart.updateSeries([{ name: 's', data: windowAt(1) }])
  return [...document.querySelectorAll('.apexcharts-series path')].filter(
    (el) => el.getAttribute('pathTo'),
  )
}

describe('stream scroll pathFrom across a null gap (#5316)', () => {
  for (const type of ['line', 'area']) {
    for (const curve of ['straight', 'smooth']) {
      it(`${type} (${curve}): pathFrom covers both segments`, async () => {
        const paths = await scrollOnce(type, curve)

        // line: the stroke; area: the fill and the stroke.
        expect(paths.length).toBe(type === 'area' ? 2 : 1)
        // The update was detected as a stream scroll for every path.
        expect(recorded.length).toBe(paths.length)

        // Each pathFrom draws as much as the joined pathTo it morphs into.
        paths.forEach((el, i) => {
          expect(drawCommands(recorded[i])).toBe(
            drawCommands(el.getAttribute('pathTo')),
          )
        })

        // Window after the shift: 3 points before the null, 4 after, so the
        // stroke has 2 + 3 draw commands. The first segment alone has 2.
        const stroke = recorded[recorded.length - 1]
        expect(drawCommands(stroke)).toBe(5)
      })
    }
  }
})
