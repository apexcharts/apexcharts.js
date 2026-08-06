import { createChartWithOptions } from './utils/utils.js'
import Graphics from '../../src/modules/Graphics.js'
import Markers from '../../src/modules/Markers.js'

// Behavior-lock harness for Graphics.pathMouseDown (the data-point click
// selection state machine). pathMouseDown is otherwise only exercised by the
// Playwright interaction suite; these jsdom tests pin the observable contract
// (selected attribute, w.interact.selectedDataPoints, event payload, the
// single-select clear, the NaN guard, and the crossfilter skip) so the audit-G3
// extraction can be proven behavior-neutral.

function makeBarChart(extra = {}) {
  const onSelect = vi.fn()
  const chart = createChartWithOptions({
    chart: {
      type: 'bar',
      id: 'pmd-' + Math.random().toString(36).slice(2),
      events: { dataPointSelection: onSelect },
      ...(extra.chart || {}),
    },
    states: {
      active: { filter: { type: 'darken', value: 0.35 } },
      ...(extra.states || {}),
    },
    series: [{ name: 'A', data: [3, 5, 7] }],
    xaxis: { categories: ['x', 'y', 'z'] },
  })
  return { chart, onSelect }
}

function makeDonutChart() {
  const onSelect = vi.fn()
  const chart = createChartWithOptions({
    chart: {
      type: 'donut',
      id: 'pmd-donut-' + Math.random().toString(36).slice(2),
      events: { dataPointSelection: onSelect },
    },
    labels: ['A', 'B'],
    series: [3, 5],
  })
  return { chart, onSelect }
}

function makeScatterChart() {
  const onSelect = vi.fn()
  const chart = createChartWithOptions({
    chart: {
      type: 'scatter',
      id: 'pmd-scatter-' + Math.random().toString(36).slice(2),
      events: { dataPointSelection: onSelect },
    },
    dataLabels: { enabled: false },
    markers: { size: 4 },
    series: [{ name: 'A', data: [[1, 3], [2, 5]] }],
    xaxis: { type: 'numeric' },
  })
  return { chart, onSelect }
}

/** Find the rendered bar path wrapper with the given series/data-point index. */
function bar(chart, index, j) {
  const paths = chart.w.dom.Paper.find(
    '.apexcharts-series path:not(.apexcharts-decoration-element)',
  )
  return Array.prototype.find.call(
    paths,
    (p) =>
      p.node.getAttribute('index') === String(index) &&
      p.node.getAttribute('j') === String(j),
  )
}

const g = (chart) => new Graphics(chart.w, chart.ctx)
const evt = { type: 'mousedown' }

describe('Graphics.pathMouseDown selection state machine', () => {
  it('handles a donut slice mousedown through its DOM listener', () => {
    const { chart, onSelect } = makeDonutChart()
    const slice = document.querySelector('.apexcharts-pie-area[j="0"]')

    slice.dispatchEvent(new MouseEvent('mousedown'))

    expect(onSelect).toHaveBeenCalledOnce()
    const [, ctx, options] = onSelect.mock.calls[0]
    expect(ctx).toBe(chart)
    expect(options.dataPointIndex).toBe(0)
    chart.destroy()
  })

  it('handles a marker mousedown through its direct DOM listener', () => {
    const { chart, onSelect } = makeScatterChart()
    const marker = document.querySelector('.apexcharts-marker[index="0"][j="0"]')
    const markers = new Markers(chart.w, chart.ctx)
    markers.addEvents(marker.instance)

    marker.dispatchEvent(new MouseEvent('mousedown'))

    expect(onSelect).toHaveBeenCalledOnce()
    const [, ctx, options] = onSelect.mock.calls[0]
    expect(ctx).toBe(chart)
    expect(options.dataPointIndex).toBe(0)
    chart.destroy()
  })

  it('selects a point on first click and fires dataPointSelection', () => {
    const { chart, onSelect } = makeBarChart()
    const b0 = bar(chart, 0, 0)

    g(chart).pathMouseDown(b0, evt)

    expect(b0.node.getAttribute('selected')).toBe('true')
    expect(chart.w.interact.selectedDataPoints).toEqual([[0]])
    expect(onSelect).toHaveBeenCalledTimes(1)
    const payload = onSelect.mock.calls[0][2]
    expect(payload.seriesIndex).toBe(0)
    expect(payload.dataPointIndex).toBe(0)
    expect(payload.selectedDataPoints).toEqual([[0]])
  })

  it('deselects the same point on a second click', () => {
    const { chart } = makeBarChart()
    const b0 = bar(chart, 0, 0)

    g(chart).pathMouseDown(b0, evt)
    g(chart).pathMouseDown(b0, evt)

    expect(b0.node.getAttribute('selected')).toBe('false')
    expect(chart.w.interact.selectedDataPoints).toEqual([[]])
  })

  it('single-select mode clears the previous point when another is clicked', () => {
    const { chart } = makeBarChart()
    const b0 = bar(chart, 0, 0)
    const b1 = bar(chart, 0, 1)

    g(chart).pathMouseDown(b0, evt)
    g(chart).pathMouseDown(b1, evt)

    expect(b0.node.getAttribute('selected')).toBe('false')
    expect(b1.node.getAttribute('selected')).toBe('true')
    expect(chart.w.interact.selectedDataPoints).toEqual([[1]])
  })

  it('multi-select mode keeps both points selected', () => {
    const { chart } = makeBarChart({
      states: {
        active: {
          allowMultipleDataPointsSelection: true,
          filter: { type: 'darken', value: 0.35 },
        },
      },
    })
    const b0 = bar(chart, 0, 0)
    const b1 = bar(chart, 0, 1)

    g(chart).pathMouseDown(b0, evt)
    g(chart).pathMouseDown(b1, evt)

    expect(b0.node.getAttribute('selected')).toBe('true')
    expect(b1.node.getAttribute('selected')).toBe('true')
    expect(chart.w.interact.selectedDataPoints).toEqual([[0, 1]])
  })

  it('ignores a click when index/j attributes are missing (NaN guard)', () => {
    const { chart, onSelect } = makeBarChart()
    const b0 = bar(chart, 0, 0)
    b0.node.removeAttribute('index')
    b0.node.removeAttribute('j')

    g(chart).pathMouseDown(b0, evt)

    expect(onSelect).not.toHaveBeenCalled()
    expect(chart.w.interact.selectedDataPoints).toEqual([])
    expect(b0.node.getAttribute('selected')).toBeNull()
  })

  it('skips selection bookkeeping in crossfilter/link mode but still fires the event', () => {
    const { chart, onSelect } = makeBarChart({ chart: { link: { enabled: true } } })
    const b0 = bar(chart, 0, 0)

    g(chart).pathMouseDown(b0, evt)

    // no selection state written...
    expect(b0.node.getAttribute('selected')).toBeNull()
    expect(chart.w.interact.selectedDataPoints).toEqual([])
    // ...but the event still fires for the crossfilter engine / user handler
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect.mock.calls[0][2].dataPointIndex).toBe(0)
  })
})
