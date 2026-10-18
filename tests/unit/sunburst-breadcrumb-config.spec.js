// The sunburst's zoom breadcrumb was a private copy of the shared renderer
// that treemap and icicle use: it hard-coded 'All' and ' / ', ignored
// drilldown.breadcrumb (show, rootLabel, separator, formatter, position,
// offsets), dropped aria-current, and on a single-root tree listed the root
// as a second, dead crumb for the view 'All' already names.
import { describe, it, expect, afterEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/sunburst.js'
import '../../src/entries/icicle.js'

const TREE = () => [
  {
    data: [
      { x: 'Europe', children: [{ x: 'France', y: 30 }, { x: 'Spain', y: 20 }] },
      { x: 'Asia', children: [{ x: 'Japan', y: 15 }, { x: 'India', y: 10 }] },
    ],
  },
]
const SINGLE = () => [
  {
    data: [
      {
        x: 'root',
        children: [
          { x: 'mid', children: [{ x: 'leaf', y: 10 }, { x: 'leaf2', y: 5 }] },
          { x: 'other', y: 40 },
        ],
      },
    ],
  },
]

async function mount(o = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  const c = new ApexCharts(document.querySelector('#chart'), {
    series: TREE(),
    ...o,
    chart: { type: 'sunburst', width: 500, height: 400, animations: { enabled: false } },
  })
  await c.render()
  return c
}
const click = (name) =>
  [...document.querySelectorAll('.apexcharts-sunburst-arc')]
    .find((el) => el.getAttribute('data:name') === name)
    .dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
const nav = () => document.querySelector('.apexcharts-breadcrumb')
const shown = (name) =>
  [...document.querySelectorAll('.apexcharts-sunburst-arc')].some(
    (el) => el.getAttribute('data:name') === name && el.style.display !== 'none',
  )

describe('sunburst zoom breadcrumb on the shared renderer', () => {
  let chart
  afterEach(() => chart?.destroy())

  it('honours rootLabel, separator and formatter, and marks the current crumb', async () => {
    chart = await mount({
      drilldown: {
        breadcrumb: {
          rootLabel: 'World',
          separator: ' > ',
          formatter: (label, { index }) => (index ? label.toUpperCase() : label),
        },
      },
    })
    click('Europe')
    expect(nav().textContent).toBe('←World > EUROPE')
    const cur = nav().querySelector('.apexcharts-breadcrumb-current')
    expect(cur.getAttribute('aria-current')).toBe('page')
    expect(nav().getAttribute('aria-label')).toBe('Sunburst breadcrumb')
    expect(
      nav().querySelector('.apexcharts-breadcrumb-separator').getAttribute('aria-hidden'),
    ).toBe('true')
  })

  it('keeps the default text and top-left corner', async () => {
    chart = await mount()
    click('Europe')
    expect(nav().textContent).toBe('←All / Europe')
    expect(nav().style.top).toBe('0px')
    expect(nav().style.left).toBe('0px')
  })

  it('renders nothing with show: false, and the zoom still works', async () => {
    chart = await mount({ drilldown: { breadcrumb: { show: false } } })
    click('Europe')
    expect(nav()).toBe(null)
    expect(shown('Asia')).toBe(false)
  })

  it('honours position and offsets', async () => {
    chart = await mount({
      drilldown: { breadcrumb: { position: 'top-right', offsetX: -10, offsetY: 6 } },
    })
    click('Europe')
    expect(nav().style.right).toBe('13px')
    expect(nav().style.top).toBe('6px')
  })

  it('a single-root tree names the root once, and its crumb zooms back out', async () => {
    chart = await mount({ series: SINGLE() })
    click('mid')
    expect(nav().textContent).toBe('←All / mid')
    nav().querySelector('button').click()
    expect(nav()).toBe(null)
    expect(chart.w.globals.sunburstFocusKey).toBeFalsy()
    expect(shown('other')).toBe(true)
  })
})

describe('a keyboard crumb keeps focus on the breadcrumb', () => {
  const DEEP = () => [
    {
      data: [
        {
          x: 'Europe',
          children: [
            { x: 'West', children: [{ x: 'France', y: 30 }, { x: 'Spain', y: 20 }] },
            { x: 'East', y: 12 },
          ],
        },
        { x: 'Asia', y: 25 },
      ],
    },
  ]
  for (const [type, cls] of [
    ['sunburst', '.apexcharts-sunburst-arc'],
    ['icicle', '.apexcharts-icicle-cell'],
  ]) {
    it(type, async () => {
      document.body.innerHTML = '<div id="chart"></div>'
      const c = new ApexCharts(document.querySelector('#chart'), {
        series: DEEP(),
        chart: { type, width: 500, height: 400, animations: { enabled: false } },
      })
      await c.render()
      ;[...document.querySelectorAll(cls)]
        .find((el) => el.getAttribute('data:name') === 'West')
        .dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      const crumbs = () => [...nav().querySelectorAll('button')]
      crumbs()[1].focus()
      // Enter or Space on a button: a click with detail 0.
      crumbs()[1].dispatchEvent(new window.MouseEvent('click', { detail: 0 }))
      expect(nav().textContent).toBe('←All / Europe')
      expect(document.activeElement).toBe(crumbs()[0])
      // A pointer click (detail 1) leaves focus to the browser.
      crumbs()[0].dispatchEvent(new window.MouseEvent('click', { detail: 1 }))
      expect(nav()).toBe(null)
      c.destroy()
    })
  }
})
