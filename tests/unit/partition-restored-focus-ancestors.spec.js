// A zoom focus restored by key after a re-render (resize, width change,
// legend toggle, a branch-keeping updateSeries) used to have no _parent, since
// parents were only linked while placing the tree. The breadcrumb then lost
// its ancestors ("All / sub"), a click on the focus zoomed all the way out
// instead of one level, and the icicle's maxDepth cap read the focus as depth 0.
import { describe, it, expect } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/sunburst.js'
import '../../src/entries/icicle.js'

const deep = () => [
  {
    data: [
      {
        x: 'root',
        children: [
          {
            x: 'mid',
            children: [
              {
                x: 'sub',
                children: [
                  { x: 'leaf', y: 10 },
                  { x: 'leaf2', y: 5 },
                ],
              },
              { x: 'm2', y: 3 },
            ],
          },
          { x: 'other', y: 40 },
        ],
      },
    ],
  },
]

const mark = (type, name) =>
  [...document.querySelectorAll(`.apexcharts-${type}`)].find(
    (el) => el.getAttribute('data:name') === name,
  )
const click = (type, name) =>
  mark(type, name).dispatchEvent(
    new window.MouseEvent('click', { bubbles: true }),
  )
const crumb = () =>
  document.querySelector('.apexcharts-breadcrumb')?.textContent || ''

function create(type, extra = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  return new ApexCharts(document.querySelector('#chart'), {
    series: deep(),
    ...extra,
    chart: {
      type,
      width: 500,
      height: 500,
      animations: { enabled: false },
    },
  })
}

describe('a restored partition focus keeps its ancestors', () => {
  it('sunburst: breadcrumb and one-level zoom-out survive updateOptions', async () => {
    const c = create('sunburst')
    await c.render()
    click('sunburst-arc', 'mid')
    click('sunburst-arc', 'sub')
    const before = crumb()
    expect(before).toContain('mid')
    await c.updateOptions({ chart: { width: 520 } })
    expect(crumb()).toBe(before)
    click('sunburst-arc', 'sub')
    expect(c.w.globals.sunburstFocusKey).toBe('/0:root/0:mid')
    c.destroy()
  })

  it("icicle zoomType 'both': breadcrumb and one-level zoom-out survive", async () => {
    const c = create('icicle', {
      plotOptions: { icicle: { zoomType: 'both' } },
    })
    await c.render()
    click('icicle-cell', 'mid')
    click('icicle-cell', 'sub')
    const before = crumb()
    expect(before).toContain('mid')
    await c.updateOptions({ chart: { width: 520 } })
    expect(crumb()).toBe(before)
    click('icicle-cell', 'sub')
    expect(c.w.globals.icicleFocusKey).toBe('/0:root/0:mid')
    c.destroy()
  })

  it('icicle default zoomType: the maxDepth cap follows the restored focus', async () => {
    const c = create('icicle', { plotOptions: { icicle: { maxDepth: 2 } } })
    await c.render()
    click('icicle-cell', 'mid')
    click('icicle-cell', 'sub')
    const shown = () => {
      const el = mark('icicle-cell', 'leaf')
      return !!el && el.style.display !== 'none'
    }
    expect(shown()).toBe(true)
    await c.updateOptions({ chart: { width: 520 } })
    // The focus is two levels down, so the cap still reaches its children.
    expect(shown()).toBe(true)
    expect(mark('icicle-cell', 'sub').getAttribute('data:clipped')).toBe(
      'false',
    )
    c.destroy()
  })
})
