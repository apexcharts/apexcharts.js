/**
 * A treemap hides the grid and the value axis through its type defaults
 * (Defaults.treemap, Defaults.typeYAxisDefaults), which updateOptions hands
 * over in both directions. Render used to force both off into w.config as
 * well, so the treemap overwrote an explicit ask on every render.
 */
import { describe, it, expect, afterEach } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import './__mocks__/ResizeObserver.js'

afterEach(() => {
  document.body.innerHTML = ''
})

function host() {
  const d = document.createElement('div')
  document.body.appendChild(d)
  return d
}

const CHART = { width: 400, height: 300, animations: { enabled: false } }
const TREE = [{ data: [{ x: 'a', y: 10 }, { x: 'b', y: 6 }, { x: 'c', y: 3 }] }]
const LINE = [{ name: 's', data: [3, 6, 10] }]

describe('treemap presets', () => {
  it('a default treemap has no grid and no y axis', async () => {
    const chart = new ApexCharts(host(), {
      chart: { ...CHART, type: 'treemap' },
      series: TREE,
    })
    await chart.render()
    expect(chart.w.config.grid.show).toBe(false)
    expect(chart.w.config.yaxis[0].show).toBe(false)
    expect(chart.el.querySelector('.apexcharts-yaxis-texts-g')).toBeNull()
    // An update that pushes a y-axis keeps the treemap's hidden one.
    await chart.updateOptions({ yaxis: { min: 0 } })
    expect(chart.w.config.yaxis[0].show).toBe(false)
    chart.destroy()
  })

  it('line to treemap and back hands the grid and y axis over', async () => {
    const chart = new ApexCharts(host(), {
      chart: { ...CHART, type: 'line' },
      series: LINE,
    })
    await chart.render()
    await chart.updateOptions({ chart: { type: 'treemap' }, series: TREE })
    expect(chart.w.config.grid.show).toBe(false)
    expect(chart.w.config.yaxis[0].show).toBe(false)
    await chart.updateOptions({ chart: { type: 'line' }, series: LINE })
    expect(chart.w.config.grid.show).toBe(true)
    expect(chart.w.config.yaxis[0].show).toBe(true)
    chart.destroy()
  })

  it('render does not overwrite an explicit grid ask', async () => {
    const chart = new ApexCharts(host(), {
      chart: { ...CHART, type: 'treemap' },
      grid: { show: true },
      series: TREE,
    })
    await chart.render()
    expect(chart.w.config.grid.show).toBe(true)
    chart.destroy()
  })
})
