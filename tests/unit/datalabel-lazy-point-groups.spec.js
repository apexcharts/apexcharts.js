import { describe, it, expect, afterEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import Graphics from '../../src/modules/Graphics.js'

// Line, area, scatter, bubble and rangeArea labels go through
// DataLabels.drawDataLabel, which made a `g.apexcharts-data-labels` per point
// before knowing whether any label would land in it: a thinned label, a series
// left out of enabledOnSeries or a null value still left an empty group in the
// DOM. Counts them, and pins every drawn label node (digests recorded at the
// base commit) for each chart type that draws its labels there.

let chart = null
afterEach(() => {
  vi.restoreAllMocks()
  chart?.destroy()
  chart = null
})

const hash = (s) => {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++)
    h = Math.imul(h ^ s.charCodeAt(i), 0x01000193)
  return (h >>> 0).toString(16)
}

const N = 24
const vals = (k) =>
  Array.from({ length: N }, (_, i) => ((i * 7 + k * 5) % 11) + 2)

function render(options, animate = false) {
  // jsdom has no layout: a fixed box per label makes the thinning deterministic
  vi.spyOn(Graphics.prototype, 'getTextRects').mockImplementation(() => ({
    width: 40,
    height: 12,
  }))
  document.body.innerHTML = '<div id="chart"></div>'
  const opts = JSON.parse(JSON.stringify(options))
  opts.chart = {
    width: 400,
    height: 300,
    ...opts.chart,
    animations: { enabled: animate },
  }
  chart = new ApexCharts(document.querySelector('#chart'), opts)
  const done = chart.render()
  return { root: chart.w.dom.baseEl, done }
}

const isEmpty = (g) => !g.querySelector('.apexcharts-datalabel')
const emptyGroups = (root) =>
  [...root.querySelectorAll('g.apexcharts-data-labels')].filter(isEmpty).length

/** Every series' label wrap, with any empty point group taken out. */
const labelsDigest = (root) =>
  hash(
    [...root.querySelectorAll('.apexcharts-datalabels')]
      .map((wrap) => {
        const c = wrap.cloneNode(true)
        c.querySelectorAll('g.apexcharts-data-labels').forEach((g) => {
          if (isEmpty(g)) g.remove()
        })
        return c.outerHTML
      })
      .join('\n'),
  )

const two = () => [
  { name: 'a', data: vals(0) },
  { name: 'b', data: vals(1) },
]

// [options, drawn label count, digest at base]
const FIXTURES = {
  line: [
    { chart: { type: 'line' }, dataLabels: { enabled: true }, series: two() },
    48,
    '5ccd8785',
  ],
  lineThinned: [
    {
      chart: { type: 'line' },
      dataLabels: { enabled: true },
      yaxis: { min: 0, max: 20 },
      series: [{ name: 'a', data: vals(0).map((v) => 10 + (v % 3) / 10) }],
    },
    8,
    '4902ddc3',
  ],
  lineOnSeries: [
    {
      chart: { type: 'line' },
      dataLabels: { enabled: true, enabledOnSeries: [1] },
      series: two(),
    },
    24,
    '1fcc478a',
  ],
  lineNulls: [
    {
      chart: { type: 'line' },
      dataLabels: { enabled: true },
      series: [{ name: 'a', data: vals(0).map((v, i) => (i % 3 ? null : v)) }],
    },
    15,
    '7c6adb7',
  ],
  area: [
    { chart: { type: 'area' }, dataLabels: { enabled: true }, series: two() },
    48,
    '5ccd8785',
  ],
  scatter: [
    {
      chart: { type: 'scatter' },
      dataLabels: { enabled: true },
      xaxis: { type: 'numeric' },
      series: [0, 1].map((k) => ({
        name: 's' + k,
        data: vals(k).map((y, i) => [i * 3, y]),
      })),
    },
    48,
    '9409a715',
  ],
  bubble: [
    {
      chart: { type: 'bubble' },
      dataLabels: { enabled: true, style: { fontSize: '13px' } },
      xaxis: { type: 'numeric' },
      series: [0, 1].map((k) => ({
        name: 'b' + k,
        data: vals(k)
          .slice(0, 8)
          .map((y, i) => [i * 10 + k * 4, y, (i % 4) * 9 + 5]),
      })),
    },
    16,
    '862e4f44',
  ],
  rangeArea: [
    {
      chart: { type: 'rangeArea' },
      dataLabels: { enabled: true },
      series: [
        {
          name: 'r',
          data: vals(0).map((v, i) => ({ x: 'c' + i, y: [v, v + 9] })),
        },
      ],
    },
    48,
    '91a36d0f',
  ],
  slope: [
    {
      chart: { type: 'line' },
      plotOptions: { line: { isSlopeChart: true } },
      dataLabels: { enabled: true },
      series: [0, 1, 2].map((k) => ({
        name: 'p' + k,
        data: [
          { x: 'before', y: 10 + k * 7 },
          { x: 'after', y: 30 - k * 4 },
        ],
      })),
    },
    6,
    '9468b7f4',
  ],
}

describe('point label groups', () => {
  it.each(['lineThinned', 'lineOnSeries', 'lineNulls'])(
    'leaves no empty group where %s draws nothing',
    (name) => {
      // base: 15, 23 and 9 empty groups
      const { root } = render(FIXTURES[name][0])
      expect(emptyGroups(root)).toBe(0)
    },
  )

  it.each(Object.keys(FIXTURES))('draws the %s labels as before', (name) => {
    const [options, count, digest] = FIXTURES[name]
    const { root } = render(options)
    expect(root.querySelectorAll('.apexcharts-datalabel').length).toBe(count)
    expect(labelsDigest(root)).toBe(digest)
  })

  // playExitLabels skips a hiding series that "owns" its exit, asking whether
  // its wrap holds any point group. Line labels of a hiding series are never
  // drawn, so the answer is no whether or not empty groups were kept.
  it.each([
    ['plainly', {}],
    [
      'with its axis kept',
      { yaxis: [{ showAlways: true }, { showAlways: true, opposite: true }] },
    ],
    [
      'with labels off on it',
      { dataLabels: { enabled: true, enabledOnSeries: [0] } },
    ],
  ])('a line series hiding %s has no point group', async (_, extra) => {
    const { root, done } = render(
      {
        chart: { type: 'line' },
        dataLabels: { enabled: true },
        series: two(),
        ...extra,
      },
      true,
    )
    await done
    const groupsOf = (ri) =>
      [...root.querySelectorAll('.apexcharts-datalabels')]
        .filter((g) => g.getAttribute('data:realIndex') === String(ri))
        .flatMap((g) => [...g.querySelectorAll('.apexcharts-data-labels')])
    /** @type {any[] | null} */
    let during = null
    chart.addEventListener('updated', () => (during ??= groupsOf(1)))
    await chart.hideSeries('b')
    expect(during).toEqual([])
    expect(groupsOf(0).length).toBe(23)
  })
})
