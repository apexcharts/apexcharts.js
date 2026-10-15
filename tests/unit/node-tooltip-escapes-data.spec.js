// Hovering a sunburst or icicle node, or a treemap leaf, wrote its name, and
// a node's data colour, straight into the tooltip's innerHTML, so a name such
// as <img src=x onerror=...> from user data ran script on hover. Data strings
// are now HTML-escaped in every node tooltip (treemap branches and leaves
// included), a data colour is set as a style property so it cannot add CSS
// declarations, and what a user formatter returns is still rendered as HTML.
import { describe, it, expect, afterEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/entries/sunburst.js'
import '../../src/entries/icicle.js'

const EVIL = '<img src=x onerror="window.__pwned=1">'
const EVIL_COLOR = 'red"><img src=x onerror="window.__pwned=1'
const CSS_COLOR = 'red;background-image:url(//host/beacon);position:fixed'

let chart = null
afterEach(() => {
  chart?.destroy()
  chart = null
})

async function mount(type, extra = {}, color = EVIL_COLOR) {
  document.body.innerHTML = '<div id="chart"></div>'
  chart = new ApexCharts(document.querySelector('#chart'), {
    chart: { type, width: 600, height: 400, animations: { enabled: false } },
    series: [
      {
        data: [
          {
            x: EVIL,
            color,
            children: [
              { x: 'a', y: 10 },
              { x: 'b', y: 20 },
            ],
          },
          { x: 'Q', y: 5 },
        ],
      },
    ],
    ...extra,
  })
  await chart.render()
  return chart
}

const MARK = {
  sunburst: '.apexcharts-sunburst-arc',
  icicle: '.apexcharts-icicle-cell',
  treemap: '.apexcharts-treemap-parent-header',
}

function hover(type) {
  const el = [...document.querySelectorAll(MARK[type])].find((n) =>
    type === 'treemap'
      ? n.getAttribute('aria-label')?.startsWith(EVIL) ||
        n.parentNode.textContent.includes(EVIL)
      : n.getAttribute('data:name') === EVIL,
  )
  expect(el).toBeTruthy()
  el.dispatchEvent(
    new window.MouseEvent('mouseenter', { clientX: 20, clientY: 20 }),
  )
  const tip =
    type === 'treemap'
      ? document.querySelector('.apexcharts-treemap-tooltip')
      : document.querySelector('.apexcharts-tooltip')
  return tip
}

describe('node tooltips escape data strings', () => {
  it.each(['sunburst', 'icicle', 'treemap'])(
    '%s: a hostile node name renders as text',
    async (type) => {
      await mount(type)
      const tip = hover(type)
      expect(tip.classList.contains('apexcharts-active')).toBe(true)
      expect(tip.querySelector('img')).toBeNull()
      expect(tip.textContent).toContain(EVIL)
    },
  )

  it.each(['sunburst', 'icicle'])(
    '%s: a hostile data colour cannot break out of the style attribute',
    async (type) => {
      await mount(type)
      const tip = hover(type)
      expect(tip.querySelector('img')).toBeNull()
      expect(
        tip.querySelector('.apexcharts-tooltip-marker').getAttribute('style') ||
          '',
      ).not.toContain('img')
    },
  )

  it.each(['sunburst', 'icicle'])(
    '%s: a data colour cannot add CSS declarations',
    async (type) => {
      await mount(type, { tooltip: { fillSeriesColor: true } }, CSS_COLOR)
      const tip = hover(type)
      for (const el of [
        tip.querySelector('.apexcharts-tooltip-series-group'),
        tip.querySelector('.apexcharts-tooltip-marker'),
      ]) {
        const css = el.getAttribute('style') || ''
        expect(css).not.toContain('background-image')
        expect(css).not.toContain('fixed')
      }
    },
  )

  it.each(['sunburst', 'icicle'])(
    '%s: a valid data colour still paints the marker and the group',
    async (type) => {
      await mount(type, { tooltip: { fillSeriesColor: true } }, '#ff0000')
      const tip = hover(type)
      expect(
        tip.querySelector('.apexcharts-tooltip-series-group').style
          .backgroundColor,
      ).toBe('rgb(255, 0, 0)')
      expect(
        tip.querySelector('.apexcharts-tooltip-marker').style.backgroundColor,
      ).toBe('rgb(255, 0, 0)')
    },
  )
})

async function mountLeaves(extra = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  chart = new ApexCharts(document.querySelector('#chart'), {
    chart: {
      type: 'treemap',
      width: 600,
      height: 400,
      animations: { enabled: false },
    },
    series: [
      {
        data: [
          { x: EVIL, y: 10 },
          { x: 'b&c', y: 20 },
        ],
      },
    ],
    ...extra,
  })
  await chart.render()
}

// Leaves go through the core tooltip, which may defer a hover by up to 20ms.
async function hoverLeaf(k) {
  const rect = document.querySelectorAll('.apexcharts-treemap-rect')[k]
  rect.dispatchEvent(
    new window.MouseEvent('mousemove', {
      bubbles: true,
      clientX: 20,
      clientY: 20,
    }),
  )
  await new Promise((r) => setTimeout(r, 40))
  return document.querySelector('.apexcharts-tooltip')
}

describe('treemap leaf tooltips escape data strings', () => {
  it('a hostile leaf name renders as text in the core tooltip', async () => {
    await mountLeaves()
    const tip = await hoverLeaf(0)
    expect(tip.querySelector('img')).toBeNull()
    expect(
      tip.querySelector('.apexcharts-tooltip-text-y-label').textContent,
    ).toBe(`${EVIL}: `)
  })

  it.each([
    ['an object', { formatter: (v) => `${v}` }],
    ['an array', [{ formatter: (v) => `${v}` }]],
  ])(
    'the name stays text when tooltip.y is %s without a title formatter',
    async (_, y) => {
      await mountLeaves({ tooltip: { y } })
      const tip = await hoverLeaf(0)
      expect(tip.querySelector('img')).toBeNull()
      expect(
        tip.querySelector('.apexcharts-tooltip-text-y-label').textContent,
      ).toBe(`${EVIL}: `)
    },
  )

  it('an ampersand in a leaf name reads back unchanged', async () => {
    await mountLeaves()
    const tip = await hoverLeaf(1)
    expect(
      tip.querySelector('.apexcharts-tooltip-text-y-label').textContent,
    ).toBe('b&c: ')
  })

  it('tooltip.y.title.formatter gets the raw name and returns markup', async () => {
    const seen = []
    await mountLeaves({
      tooltip: {
        y: {
          title: {
            formatter: (name) => {
              seen.push(name)
              return '<b class="ttl">T</b>'
            },
          },
        },
      },
    })
    const tip = await hoverLeaf(0)
    expect(tip.querySelector('b.ttl')?.textContent).toBe('T')
    expect(seen).toContain(EVIL)
  })
})

describe('node tooltip formatters still return HTML', () => {
  it.each(['sunburst', 'icicle'])(
    '%s: tooltip.y.formatter output is markup',
    async (type) => {
      await mount(type, {
        tooltip: { y: { formatter: (v) => `<b class="fmt">${v}</b>` } },
      })
      const tip = hover(type)
      expect(tip.querySelector('b.fmt')?.textContent).toBe('30')
    },
  )

  it('treemap: parents.tooltip.formatter output is markup and gets raw values', async () => {
    const seen = []
    await mount('treemap', {
      plotOptions: {
        treemap: {
          parents: {
            tooltip: {
              formatter: (o) => {
                seen.push(o.name)
                return `<b class="fmt">${o.value}</b>`
              },
            },
          },
        },
      },
    })
    const tip = hover('treemap')
    expect(tip.querySelector('b.fmt')?.textContent).toBe('30')
    expect(seen[0]).toBe(EVIL)
  })

  it('treemap: tooltip.y.formatter output is markup in the branch value', async () => {
    await mount('treemap', {
      tooltip: { y: { formatter: (v) => `<b class="fmt">${v}</b>` } },
    })
    const tip = hover('treemap')
    expect(tip.querySelector('b.fmt')?.textContent).toBe('30')
    expect(tip.querySelector('img')).toBeNull()
  })
})
