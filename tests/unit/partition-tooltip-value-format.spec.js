// Users hovering an icicle or sunburst parent saw float noise such as
// 0.30000000000000004, and a custom tooltip.y.formatter was ignored.
import { describe, it, expect } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/icicle.js'

const series = [
  { data: [{ x: 'P', children: [{ x: 'a', y: 0.1 }, { x: 'b', y: 0.2 }] }, { x: 'Q', y: 1 }] },
]

async function hover(name, extra = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  const c = new ApexCharts(document.querySelector('#chart'), {
    chart: { type: 'icicle', width: 600, height: 400, animations: { enabled: false } },
    series,
    ...extra,
  })
  await c.render()
  const el = [...document.querySelectorAll('.apexcharts-icicle-cell')].find(
    (n) => n.getAttribute('data:name') === name,
  )
  el.dispatchEvent(new window.MouseEvent('mouseenter', { bubbles: true }))
  const text = document.querySelector('.apexcharts-tooltip-text-y-value').textContent
  c.destroy()
  return text
}

describe('partition node tooltip value', () => {
  it('trims float noise from a rolled-up parent', async () => {
    expect(await hover('P')).toMatch(/^0\.3 \(/)
  })

  it('goes through tooltip.y.formatter with the node', async () => {
    const seen = []
    const formatter = (v, o) => {
      seen.push(o)
      return `$${Number(v).toFixed(2)}`
    }
    expect(await hover('Q', { tooltip: { y: { formatter } } })).toMatch(/^\$1\.00 \(/)
    expect(seen[0].dataPointIndex).toBe(-1)
    expect(seen[0].node.name).toBe('Q')
  })

  it('trims it from an icicle showValue cell label too', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const c = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'icicle', width: 900, height: 400, animations: { enabled: false } },
      series,
      plotOptions: { icicle: { dataLabels: { showValue: true } } },
    })
    await c.render()
    const texts = [...document.querySelectorAll('.apexcharts-icicle-labels text')].map(
      (t) => t.textContent,
    )
    c.destroy()
    expect(texts).toContain('P: 0.3')
  })
})
