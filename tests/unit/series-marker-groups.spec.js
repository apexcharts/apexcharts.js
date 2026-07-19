import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

/**
 * Phase-1 of the render-2026 perf work: markers live in ONE
 * `.apexcharts-series-markers` group per SERIES (previously one group per
 * point, doubling the node count on large scatters). Per-point interactivity
 * is delegation-based and reads rel/j/index off the marker path itself, so
 * the structure change must keep those attributes and the delegated events.
 *
 * NOTE: line/area marker DOM cannot be asserted under jsdom (marker positions
 * resolve to NaN without real layout, a long-standing jsdom limitation), so
 * line-marker structure is covered by the e2e snapshots and the interaction
 * suite; this spec covers the scatter/bubble path, which does render.
 */

const pts = (n, off = 0) =>
  Array.from({ length: n }, (_, i) => [i, ((i * 7) % 50) + off])

/** jsdom can't parse the `[data\\:realIndex]` selector; filter by attrs. */
const marker = (index, j) =>
  [...document.querySelectorAll('.apexcharts-marker')].find(
    (m) =>
      m.getAttribute('index') === String(index) &&
      m.getAttribute('j') === String(j),
  )

describe('series-level marker groups (scatter/bubble)', () => {
  it('renders exactly ONE markers group per scatter series', () => {
    const chart = createChartWithOptions({
      chart: { type: 'scatter' },
      series: [
        { name: 'a', data: pts(60) },
        { name: 'b', data: pts(60, 30) },
      ],
      markers: { size: 3 },
      dataLabels: { enabled: false },
      xaxis: { type: 'numeric' },
    })

    const wraps = document.querySelectorAll('.apexcharts-series-markers')
    expect(wraps.length).toBe(2)

    // every data point's marker lives inside its series' single group
    // (>= n: the doubled first connector point also lands here in browsers)
    wraps.forEach((wrap) => {
      expect(
        wrap.querySelectorAll('.apexcharts-marker').length,
      ).toBeGreaterThanOrEqual(60)
    })

    // no data-point marker exists OUTSIDE a series wrap (per-point wrap
    // groups are gone; strays would mean the old structure came back)
    const strays = [...document.querySelectorAll('.apexcharts-marker')].filter(
      (m) =>
        m.getAttribute('j') !== null &&
        !m.closest('.apexcharts-series-markers'),
    )
    expect(strays).toEqual([])

    chart.destroy()
  })

  it('markers keep the delegation identity attributes (rel/j/index)', () => {
    const chart = createChartWithOptions({
      chart: { type: 'scatter' },
      series: [
        { name: 'a', data: pts(10) },
        { name: 'b', data: pts(10, 30) },
      ],
      markers: { size: 3 },
      dataLabels: { enabled: false },
      xaxis: { type: 'numeric' },
    })

    const m = marker(1, 7)
    expect(m).toBeTruthy()
    expect(m.getAttribute('rel')).toBe('7')
    expect(m.getAttribute('default-marker-size')).toBe('3')
    expect(m.getAttribute('cx')).not.toBeNull()
    expect(m.getAttribute('cy')).not.toBeNull()
    expect(m.getAttribute('class')).toContain('apexcharts-marker')

    chart.destroy()
  })

  it('delegated dataPointMouseEnter still fires with correct indices', () => {
    const events = []
    const chart = createChartWithOptions({
      chart: {
        type: 'scatter',
        events: {
          dataPointMouseEnter: (e, ctx, { seriesIndex, dataPointIndex }) =>
            events.push([seriesIndex, dataPointIndex]),
        },
      },
      series: [
        { name: 'a', data: pts(10) },
        { name: 'b', data: pts(10, 30) },
      ],
      markers: { size: 3 },
      dataLabels: { enabled: false },
      xaxis: { type: 'numeric' },
    })

    const target = marker(0, 4)
    expect(target).toBeTruthy()
    target.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))

    expect(events).toContainEqual([0, 4])

    chart.destroy()
  })

  it('bubble z-radius still varies per point through the shared config', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bubble' },
      series: [
        {
          name: 'a',
          data: Array.from({ length: 20 }, (_, i) => [i, i % 7, 5 + (i % 6)]),
        },
      ],
      dataLabels: { enabled: false },
      xaxis: { type: 'numeric' },
    })

    const sizes = new Set(
      [...document.querySelectorAll('.apexcharts-marker')]
        .filter((el) => el.getAttribute('j') !== null)
        .map((el) => el.getAttribute('default-marker-size')),
    )
    expect(sizes.size).toBeGreaterThan(1)

    chart.destroy()
  })

  it('discrete markers still override size/shape per point', () => {
    const chart = createChartWithOptions({
      chart: { type: 'scatter' },
      series: [{ name: 'a', data: pts(12) }],
      markers: {
        size: 3,
        discrete: [
          {
            seriesIndex: 0,
            dataPointIndex: 5,
            fillColor: '#ff0000',
            strokeColor: '#000',
            size: 9,
            shape: 'square',
          },
        ],
      },
      dataLabels: { enabled: false },
      xaxis: { type: 'numeric' },
    })

    const disc = marker(0, 5)
    expect(disc.getAttribute('default-marker-size')).toBe('9')
    expect(disc.getAttribute('shape')).toBe('square')

    const plain = marker(0, 6)
    expect(plain.getAttribute('default-marker-size')).toBe('3')
    expect(plain.getAttribute('shape')).toBe('circle')

    chart.destroy()
  })
})
