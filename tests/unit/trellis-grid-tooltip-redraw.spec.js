// The trellis grid card runs on a continuous rAF loop while the pointer is
// over the grid. A frame whose hovered panel, index, title and split are all
// unchanged must not rebuild the card (innerHTML, formatter calls, a forced
// layout) or look up the hovered panel's tooltip title again; a pointer that
// moves within the same point only repositions the card.
import { describe, it, expect, vi } from 'vitest'
import TrellisTooltip from '../../src/modules/trellis/TrellisTooltip.js'

const setup = () => {
  const wrap = document.createElement('div')
  const cell = document.createElement('div')
  cell.className = 'apexcharts-trellis-cell'
  const title = document.createElement('div')
  title.className = 'apexcharts-tooltip-title'
  title.textContent = 'Jan'
  const target = document.createElement('span')
  cell.append(title, target)
  wrap.appendChild(cell)
  document.body.appendChild(wrap)
  wrap.getBoundingClientRect = () =>
    /** @type {any} */ ({ left: 0, top: 0, width: 1000, height: 500 })
  const grid = document.createElement('div')

  const chart = {
    w: {
      config: {
        chart: { type: 'line' },
        xaxis: { tickPlacement: 'on', convertedCatToNumeric: false },
      },
      globals: { dataPoints: 4, barPadForNumericAxis: 0 },
      layout: { gridWidth: 300, gridHeight: 100, translateX: 0, translateY: 0 },
      dom: {},
    },
  }
  const formatter = vi.fn((v) => `$${v}`)
  const split = {
    seriesNames: ['a', 'b'],
    panels: [
      {
        key: 'North',
        series: [
          { name: 'a', data: [1, 2, 3, 4] },
          { name: 'b', data: [5, 6, 7, 8] },
        ],
      },
    ],
  }
  const trellis = {
    w: { config: { tooltip: { y: { formatter } }, yaxis: [{}] } },
    split,
    panels: [{ key: 'North', cellEl: cell, chart }],
    scales: null,
  }
  const tt = new TrellisTooltip(/** @type {any} */ (trellis))
  tt.wire(grid, wrap)
  const qs = vi.spyOn(cell, 'querySelector')
  return { tt, wrap, grid, cell, title, target, trellis, formatter, qs }
}

describe('trellis grid tooltip: redraw only on change', () => {
  it('a resting pointer neither rebuilds the card nor re-queries the title', () => {
    const { tt, wrap, target, formatter, qs } = setup()
    tt._lastEvent = { target, clientX: 5, clientY: 5 }
    tt._update(wrap)
    const row = tt.el.querySelector('.apexcharts-trellis-tooltip-row')
    expect(row.textContent).toBe('North$1$5')
    expect(formatter).toHaveBeenCalledTimes(2)
    tt._update(wrap)
    tt._update(wrap)
    expect(tt.el.querySelector('.apexcharts-trellis-tooltip-row')).toBe(row)
    expect(formatter).toHaveBeenCalledTimes(2)
    expect(qs).toHaveBeenCalledTimes(1)
    tt.destroy()
    wrap.remove()
  })

  it('moving within one point repositions without a rebuild', () => {
    const { tt, wrap, target, formatter } = setup()
    tt._lastEvent = { target, clientX: 5, clientY: 5 }
    tt._update(wrap)
    const row = tt.el.querySelector('.apexcharts-trellis-tooltip-row')
    const left = tt.el.style.left
    tt._lastEvent = { target, clientX: 30, clientY: 5 }
    tt._update(wrap)
    expect(tt.el.querySelector('.apexcharts-trellis-tooltip-row')).toBe(row)
    expect(formatter).toHaveBeenCalledTimes(2)
    expect(tt.el.style.left).not.toBe(left)
    tt.destroy()
    wrap.remove()
  })

  it('a new index, a late title or a new split rebuilds', () => {
    const { tt, wrap, target, title, trellis } = setup()
    tt._lastEvent = { target, clientX: 5, clientY: 5 }
    tt._update(wrap)
    // index 1 (points every 100px)
    tt._lastEvent = { target, clientX: 105, clientY: 5 }
    tt._update(wrap)
    const text = () =>
      tt.el.querySelector('.apexcharts-trellis-tooltip-row').textContent
    expect(text()).toBe('North$2$6')
    // the panel's own tooltip fills its title a frame later
    title.textContent = 'Feb'
    tt._update(wrap)
    expect(tt.el.querySelector('.apexcharts-tooltip-title').textContent).toBe(
      'Feb',
    )
    // updateSeries hands the trellis a new split
    trellis.split = {
      ...trellis.split,
      panels: [{ key: 'North', series: [{ name: 'a', data: [9, 9, 9, 9] }] }],
    }
    tt._update(wrap)
    expect(text()).toBe('North$9')
    tt.destroy()
    wrap.remove()
  })

  it('an in-place updateOptions (new scales, same split) rebuilds', () => {
    const { tt, wrap, target, trellis } = setup()
    tt._lastEvent = { target, clientX: 5, clientY: 5 }
    tt._update(wrap)
    // applyPanelOptions keeps the split and re-resolves only the scales
    trellis.w.config.tooltip.y.formatter = vi.fn((v) => `F${v}`)
    trellis.scales = /** @type {any} */ ({ colorOf: () => '#00ff00' })
    tt._update(wrap)
    const row = tt.el.querySelector('.apexcharts-trellis-tooltip-row')
    expect(row.textContent).toBe('NorthF1F5')
    expect(row.innerHTML).toContain('#00ff00')
    tt.destroy()
    wrap.remove()
  })

  it('a still pointer follows the points when the panel rescales', () => {
    const { tt, wrap, target, trellis } = setup()
    tt._lastEvent = { target, clientX: 105, clientY: 5 }
    tt._update(wrap)
    const text = () =>
      tt.el.querySelector('.apexcharts-trellis-tooltip-row').textContent
    expect(text()).toBe('North$2$6')
    // a wheel zoom or resize redraws the panel under the resting pointer
    trellis.panels[0].chart.w.layout.gridWidth = 900
    tt._update(wrap)
    expect(text()).toBe('North$1$5')
    tt.destroy()
    wrap.remove()
  })

  it('leaving and re-entering at the same point shows the card again', () => {
    const { tt, wrap, grid, target } = setup()
    const ev = { target, clientX: 5, clientY: 5 }
    tt._lastEvent = ev
    tt._update(wrap)
    expect(tt.el.classList.contains('apexcharts-trellis-tooltip-active')).toBe(
      true,
    )
    grid.dispatchEvent(new Event('mouseleave'))
    tt._lastEvent = { ...ev }
    tt._update(wrap)
    expect(tt.el.classList.contains('apexcharts-trellis-tooltip-active')).toBe(
      true,
    )
    tt.destroy()
    wrap.remove()
  })
})
