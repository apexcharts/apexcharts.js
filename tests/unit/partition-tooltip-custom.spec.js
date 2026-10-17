// Sunburst and icicle tooltips ignored tooltip.custom: the built-in node row
// always showed. Both charts share NodeTooltip, so the icicle (which jsdom can
// lay out) stands in for the pair.
import { describe, it, expect } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/icicle.js'

const series = [
  {
    data: [
      { x: 'P', children: [{ x: 'a', y: 1 }, { x: 'b', y: 3 }] },
      { x: 'Q', y: 4 },
    ],
  },
]

async function hover(names, extra = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  const c = new ApexCharts(document.querySelector('#chart'), {
    chart: { type: 'icicle', width: 600, height: 400, animations: { enabled: false } },
    series,
    ...extra,
  })
  await c.render()
  const out = []
  for (const name of [].concat(names)) {
    const el = [...document.querySelectorAll('.apexcharts-icicle-cell')].find(
      (n) => n.getAttribute('data:name') === name,
    )
    el.dispatchEvent(new window.MouseEvent('mouseenter', { bubbles: true }))
    out.push(document.querySelector('.apexcharts-tooltip').innerHTML)
  }
  c.destroy()
  return out
}

describe('partition node tooltip.custom', () => {
  it('renders the string a custom fn returns, with the node opts', async () => {
    const seen = []
    const custom = (o) => {
      seen.push(o)
      return `<b class="mine">${o.node.name}</b>`
    }
    const [html] = await hover('a', { tooltip: { custom } })
    expect(html).toBe('<b class="mine">a</b>')
    const o = seen[0]
    expect(o.seriesIndex).toBe(0)
    expect(o.dataPointIndex).toBe(-1)
    expect(o.node.name).toBe('a')
    expect(o.node.value).toBe(1)
    expect(o.percentOfParent).toBe(25)
    expect(o.percentOfTotal).toBe(12.5)
    expect(o.w.config.chart.type).toBe('icicle')
    // core hands custom the chart instance too; samples read opts.ctx.w
    expect(o.ctx.w).toBe(o.w)
    expect(Array.isArray(o.series)).toBe(true)
  })

  it('takes the first entry of the per-series array form', async () => {
    const [html] = await hover('Q', { tooltip: { custom: [() => 'first', () => 'second'] } })
    expect(html).toBe('first')
  })

  it('renders an Element result', async () => {
    const custom = ({ node }) => {
      const d = document.createElement('div')
      d.className = 'el-tip'
      d.textContent = node.name
      return d
    }
    const [html] = await hover('Q', { tooltip: { custom } })
    expect(html).toBe('<div class="el-tip">Q</div>')
  })

  it('falls back to the built-in row when the fn returns nothing', async () => {
    const custom = ({ node }) => (node.name === 'a' ? 'custom a' : undefined)
    const [a, q] = await hover(['a', 'Q'], { tooltip: { custom } })
    expect(a).toBe('custom a')
    expect(q).toContain('apexcharts-tooltip-text-y-value')
    expect(q).toContain('4 (50.0% of parent, 50.0% of total)')
  })

  it('leaves the built-in row unchanged without tooltip.custom', async () => {
    const [html] = await hover('b')
    expect(html).toBe(
      '<div class="apexcharts-tooltip-series-group apexcharts-active" style="display:flex">' +
        '<span class="apexcharts-tooltip-marker" style="background-color: rgb(0, 143, 251);"></span>' +
        '<div class="apexcharts-tooltip-text"><div class="apexcharts-tooltip-y-group">' +
        '<span class="apexcharts-tooltip-text-y-label">b: </span>' +
        '<span class="apexcharts-tooltip-text-y-value">3 (75.0% of parent, 37.5% of total)</span>' +
        '</div></div></div>',
    )
  })
})
