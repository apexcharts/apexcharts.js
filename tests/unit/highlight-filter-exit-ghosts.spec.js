import { test, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/features/highlight-filter.js'

// A datum that leaves while a pick is on screen exits as the renderer's ghost.
// The ghost takes the fade its whole was drawn with, whichever series it came
// from: a series that kept no datum at all still has ghosts to fade.

const pts = (ys, hs) =>
  ys.map((y, k) => ({ x: 'abcd'[k], y, highlight: hs ? hs[k] : null }))

test('exit ghosts keep the fade, also for a series that kept no datum', async () => {
  const chart = createChartWithOptions({
    chart: { type: 'bar', width: 600, height: 300 },
    series: [
      { name: 'A', data: pts([10, 20, 30, 40], [5, 5, 5, 5]) },
      { name: 'B', data: pts([15, 25, 35, 45], [5, 5, 5, 5]) },
    ],
    dataLabels: { enabled: false },
  })
  // The test mount turns animations off; this update is animated.
  chart.w.config.chart.animations.enabled = true
  await chart.updateSeries([
    { name: 'A', data: pts([10, 20], [5, 5]) },
    { name: 'B', data: [] },
  ])
  await Promise.resolve()
  const ghosts = [
    ...chart.w.dom.baseEl.querySelectorAll('.apexcharts-bar-ghost'),
  ]
  const keys = ghosts.map((g) => g.getAttribute('data:ghostKey')).sort()
  expect(keys).toEqual([
    '0::c:c',
    '0::c:d',
    '1::c:a',
    '1::c:b',
    '1::c:c',
    '1::c:d',
  ])
  for (const g of ghosts) {
    expect(
      g.getAttribute('fill-opacity'),
      g.getAttribute('data:ghostKey'),
    ).toBe('0.2')
  }
  // Each exiting datum's part rides out in front of its ghost, once.
  expect(
    chart.w.dom.baseEl.querySelectorAll('.apexcharts-highlight-ghost').length,
  ).toBe(6)
  chart.destroy()
})

test('an update where nothing leaves does not search the plot for ghosts', async () => {
  const chart = createChartWithOptions({
    chart: { type: 'bar', width: 600, height: 300 },
    series: [{ name: 'A', data: pts([10, 20, 30, 40], [5, 5, 5, 5]) }],
    dataLabels: { enabled: false },
  })
  chart.w.config.chart.animations.enabled = true
  const plot = chart.w.dom.elGraphical.node
  const qsa = plot.querySelectorAll.bind(plot)
  const asked = []
  plot.querySelectorAll = (sel) => (asked.push(sel), qsa(sel))
  await chart.updateSeries([{ name: 'A', data: pts([11, 21, 31, 41], [6, 6, 6, 6]) }])
  await Promise.resolve()
  expect(asked.filter((s) => s.includes('apexcharts-bar-ghost'))).toEqual([])
  chart.destroy()
})
