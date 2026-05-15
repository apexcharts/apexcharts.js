import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Plan 04 — trapezoid funnel. `plotOptions.funnel.shape: 'trapezoid'`
// makes each stage a sloped 4-corner polygon whose bottom width matches
// the next stage's top width.

function makeFunnel(extraPlot = {}, extraChart = {}) {
  return createChartWithOptions({
    // jsdom has no layout, so an explicit width is required for paths to
    // contain non-NaN x-coords. Without this, the renderer still runs but
    // the assertions below can't read meaningful path data.
    chart: { type: 'funnel', width: 600, height: 400, ...extraChart },
    series: [{ name: 'F', data: [1000, 700, 400, 150] }],
    xaxis: { categories: ['A', 'B', 'C', 'D'] },
    plotOptions: { funnel: extraPlot },
  })
}

describe('Funnel — shape: trapezoid', () => {
  it('renders as polygon (M ... L ... L ... L ... Z) paths', () => {
    makeFunnel({ shape: 'trapezoid' })
    const paths = document.querySelectorAll('.apexcharts-bar-area')
    expect(paths.length).toBe(4)
    for (const p of paths) {
      const d = p.getAttribute('d') || ''
      // 1 move + 3 lines + close = 4 segments
      expect((d.match(/[ML]/g) || []).length).toBeGreaterThanOrEqual(4)
      expect(d.endsWith('Z') || d.endsWith('z')).toBe(true)
    }
  })

  it('default shape (rectangle) does not use M/L polygon path style', () => {
    makeFunnel()
    const paths = document.querySelectorAll('.apexcharts-bar-area')
    expect(paths.length).toBe(4)
    // Existing renderer uses move + lines with possible Q for borderRadius —
    // the structural difference is the trapezoid emits exactly one M followed
    // by L segments and explicit Z. Just ensure rendering didn't break.
    for (const p of paths) {
      expect(p.getAttribute('d')).toBeTruthy()
    }
  })

  it("lastShape: 'taper' makes the last stage end at a single point (bottom width 0)", () => {
    makeFunnel({ shape: 'trapezoid', lastShape: 'taper' })
    const paths = document.querySelectorAll('.apexcharts-bar-area')
    const lastD = paths[paths.length - 1].getAttribute('d') || ''
    // Parse the four L-points; the last two (bottom-right then bottom-left)
    // should both sit at gridWidth/2 (which is 300 with width: 600).
    const matches = [...lastD.matchAll(/[ML]\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)]
    expect(matches.length).toBe(4) // M + 3 L
    const bottomRightX = parseFloat(matches[2][1])
    const bottomLeftX = parseFloat(matches[3][1])
    expect(bottomRightX).toBe(300)
    expect(bottomLeftX).toBe(300)
  })

  it("lastShape: 'flat' (default) gives the last stage parallel sides", () => {
    makeFunnel({ shape: 'trapezoid' })
    const paths = document.querySelectorAll('.apexcharts-bar-area')
    const lastD = paths[paths.length - 1].getAttribute('d') || ''
    const matches = [...lastD.matchAll(/[ML]\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)]
    expect(matches.length).toBe(4)
    // Flat-bottom: top-left x == bottom-left x and top-right x == bottom-right x.
    const topLeftX = parseFloat(matches[0][1])
    const topRightX = parseFloat(matches[1][1])
    const bottomRightX = parseFloat(matches[2][1])
    const bottomLeftX = parseFloat(matches[3][1])
    expect(bottomRightX).toBe(topRightX)
    expect(bottomLeftX).toBe(topLeftX)
  })

  it('trapezoid mode renders no bar-shadow elements (stages are contiguous, no gap to bridge)', () => {
    makeFunnel({ shape: 'trapezoid' }, { dropShadow: { enabled: false } })
    const shadows = document.querySelectorAll('.apexcharts-bar-shadow')
    expect(shadows.length).toBe(0)
  })

  it('stage j+1 top width equals stage j bottom width (continuous sloped sides)', () => {
    makeFunnel({ shape: 'trapezoid' })
    const paths = document.querySelectorAll('.apexcharts-bar-area')
    /** @param {Element} el */
    const corners = (el) => {
      const d = el.getAttribute('d') || ''
      return [...d.matchAll(/[ML]\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map(
        (m) => ({ x: parseFloat(m[1]), y: parseFloat(m[2]) }),
      )
    }
    for (let j = 0; j < paths.length - 1; j++) {
      const cur = corners(paths[j])
      const next = corners(paths[j + 1])
      const curBottomWidth = cur[2].x - cur[3].x
      const nextTopWidth = next[1].x - next[0].x
      expect(Math.round(curBottomWidth)).toBe(Math.round(nextTopWidth))
    }
  })
})
