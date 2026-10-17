import { describe, it, expect } from 'vitest'
import { streamgraphTransform } from '../../src/features/streamgraph'

// The wiggle baseline carries a running sum of the movement of every band
// below, so it costs O(series x columns) rather than re-summing the bands
// below for each band (O(series^2 x columns)). This pins the result to the
// direct definition on random data.

/** Deterministic PRNG (mulberry32), so a failure reproduces. */
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The wiggle baseline exactly as defined: each band re-sums those below. */
function referenceWiggle(order, stack, m) {
  const base = new Array(m).fill(0)
  let y = 0
  for (let j = 1; j < m; j++) {
    let s1 = 0
    let s2 = 0
    for (let i = 0; i < order.length; i++) {
      const vi = stack[order[i]]
      const now = vi[j]
      let moved = (now - vi[j - 1]) / 2
      for (let k = 0; k < i; k++) {
        const vk = stack[order[k]]
        moved += vk[j] - vk[j - 1]
      }
      s1 += now
      s2 += moved * now
    }
    if (s1) y -= s2 / s1
    base[j] = y
  }
  return base
}

function randomSeries(rand, n, m) {
  return Array.from({ length: n }, (_, k) => ({
    name: `S${k}`,
    // Some zeros, so a column can be empty for a band.
    data: Array.from({ length: m }, () =>
      rand() < 0.1 ? 0 : Math.round(rand() * 1000) / 10,
    ),
  }))
}

describe('streamgraph wiggle baseline', () => {
  for (const [seed, n, m, collapsed] of [
    [1, 3, 12, []],
    [7, 25, 120, [3, 11]],
    [42, 60, 300, [0]],
  ]) {
    it(`matches the direct definition (seed ${seed}, ${n} x ${m})`, () => {
      const w = {
        config: { xaxis: {}, plotOptions: {} },
        globals: { collapsedSeriesIndices: collapsed },
      }
      streamgraphTransform(randomSeries(rng(seed), n, m), w)
      const d = w.streamgraphData
      const ref = referenceWiggle(d.order, d.values, m)
      const bottom = d.lows[d.order[0]]
      let worst = 0
      for (let j = 0; j < m; j++) {
        worst = Math.max(worst, Math.abs(bottom[j] - ref[j]))
      }
      expect(worst).toBeLessThan(1e-9)
    })
  }
})
