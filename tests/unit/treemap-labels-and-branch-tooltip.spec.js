import { describe, it, expect } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

// A row with a null or missing x threw from the label size pass, so the
// treemap rendered nothing, and one numeric x (a year, an id) made the shared
// average NaN and dropped every label. Hovering a branch header wrote into the
// shared tooltip: its inline opacity:0 hid every later leaf tooltip, and its
// innerHTML replaced the nodes the leaf tooltip fills, so leaves showed the
// branch's numbers.

async function mount(series, extra = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    chart: {
      type: 'treemap',
      height: 500,
      width: 800,
      animations: { enabled: false },
    },
    series,
    ...extra,
  })
  await chart.render()
  return chart
}

const rects = (c) => c.el.querySelectorAll('.apexcharts-treemap-rect')
const labels = (c) =>
  [...c.el.querySelectorAll('.apexcharts-data-labels text')].map(
    (t) => t.textContent,
  )

describe('treemap x labels', () => {
  it('renders a row whose x is null or missing', async () => {
    const c = await mount([
      { data: [{ x: 'a', y: 10 }, { x: null, y: 20 }, { y: 30 }] },
    ])
    expect(rects(c)).toHaveLength(3)
    expect(labels(c)).toContain('a')
  })

  it('renders a null x in a series that starts with a multi-line label', async () => {
    const c = await mount([
      {
        data: [
          { x: ['Line', 'Two'], y: 10 },
          { x: null, y: 20 },
          { x: 'zz', y: 30 },
        ],
      },
    ])
    expect(rects(c)).toHaveLength(3)
  })

  it('keeps every label when one x is a number', async () => {
    const c = await mount([
      {
        data: [
          { x: 'Alpha', y: 10 },
          { x: 2024, y: 20 },
          { x: 'Gamma', y: 30 },
        ],
      },
    ])
    expect(labels(c)).toEqual(
      expect.arrayContaining(['Alpha', '2024', 'Gamma']),
    )
  })
})

describe('treemap branch tooltip', () => {
  const nested = [
    {
      data: [
        {
          x: 'G1',
          children: [
            { x: 'a', y: 100 },
            { x: 'b', y: 40 },
          ],
        },
        {
          x: 'G2',
          children: [
            { x: 'c', y: 300 },
            { x: 'd', y: 200 },
          ],
        },
      ],
    },
  ]
  const hover = (el) => {
    for (const t of ['mouseover', 'mouseenter', 'mousemove']) {
      el.dispatchEvent(
        new MouseEvent(t, { bubbles: true, clientX: 50, clientY: 50 }),
      )
    }
  }

  it('uses its own element and leaves the shared tooltip intact', async () => {
    const c = await mount(nested)
    const tip = c.el.querySelector('.apexcharts-tooltip')
    const before = tip.innerHTML
    const hdr = c.el.querySelector('.apexcharts-treemap-parent-header')

    hdr.dispatchEvent(
      new MouseEvent('mouseenter', { clientX: 10, clientY: 10 }),
    )
    const branch = c.el.querySelector('.apexcharts-treemap-tooltip')
    expect(branch).not.toBe(tip)
    expect(branch.classList.contains('apexcharts-tooltip')).toBe(true)
    expect(branch.classList.contains('apexcharts-active')).toBe(true)
    expect(branch.textContent).toContain('G1')
    expect(branch.hasAttribute('aria-hidden')).toBe(false)
    expect(tip.innerHTML).toBe(before)

    hdr.dispatchEvent(
      new MouseEvent('mouseleave', { clientX: 10, clientY: 10 }),
    )
    expect(branch.classList.contains('apexcharts-active')).toBe(false)
    expect(branch.getAttribute('aria-hidden')).toBe('true')

    hover(rects(c)[0])
    expect(tip.classList.contains('apexcharts-active')).toBe(true)
    expect(tip.style.opacity).toBe('')
    expect(tip.textContent).toContain('a: 100')
    expect(tip.textContent).not.toContain('items')
  })

  it('reuses one branch element across headers', async () => {
    const c = await mount(nested)
    for (const h of c.el.querySelectorAll(
      '.apexcharts-treemap-parent-header',
    )) {
      h.dispatchEvent(new MouseEvent('mouseenter'))
      h.dispatchEvent(new MouseEvent('mouseleave'))
    }
    expect(c.el.querySelectorAll('.apexcharts-treemap-tooltip')).toHaveLength(1)
  })
})
