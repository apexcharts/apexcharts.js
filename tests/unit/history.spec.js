import { describe, it, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// ---------------------------------------------------------------------------
// Helpers. History capture is coalesced + settled on timers, so tests use a
// small coalesceMs and await a margin after each mutation.
// ---------------------------------------------------------------------------

const COALESCE = 20
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const settle = () => sleep(COALESCE + 50)

function historyChart(historyOverrides = {}) {
  return createChartWithOptions({
    chart: {
      type: 'line',
      animations: { enabled: false },
      history: { enabled: true, coalesceMs: COALESCE, ...historyOverrides },
    },
    series: [
      { name: 'A', data: [10, 20, 30, 40, 50] },
      { name: 'B', data: [5, 15, 25, 35, 45] },
    ],
    xaxis: { type: 'numeric' },
  })
}

// ---------------------------------------------------------------------------

describe('History — feature + baseline', () => {
  it('exposes chart.history when the feature is bundled and enabled', async () => {
    const chart = historyChart()
    await settle()
    expect(chart.history).toBeTruthy()
    expect(typeof chart.history.undo).toBe('function')
    chart.destroy()
  })

  it('captures a baseline checkpoint on mount', async () => {
    const chart = historyChart()
    await settle()
    expect(chart.history.entries()).toHaveLength(1)
    expect(chart.history.canUndo()).toBe(false)
    expect(chart.history.canRedo()).toBe(false)
    chart.destroy()
  })

  it('does not capture when history is disabled', async () => {
    const chart = historyChart({ enabled: false })
    await settle()
    await chart.updateOptions({ xaxis: { min: 1, max: 5 } }, false, false)
    await settle()
    expect(chart.history.entries()).toHaveLength(0)
    chart.destroy()
  })
})

describe('History — capture / undo / redo', () => {
  it('adds a checkpoint on a committed change', async () => {
    const chart = historyChart()
    await settle()
    await chart.updateOptions({ xaxis: { min: 2, max: 4 } }, false, false)
    await settle()
    expect(chart.history.entries()).toHaveLength(2)
    expect(chart.history.canUndo()).toBe(true)
    chart.destroy()
  })

  it('undo reverts and redo re-applies, with no spurious checkpoint', async () => {
    const chart = historyChart()
    await settle()
    await chart.updateOptions({ xaxis: { min: 2, max: 4 } }, false, false)
    await settle()

    chart.history.undo(false)
    await settle()
    expect(chart.w.config.xaxis.min).toBeUndefined()
    expect(chart.history.canUndo()).toBe(false)
    expect(chart.history.canRedo()).toBe(true)
    // the restore's own re-render must NOT create a checkpoint
    expect(chart.history.entries()).toHaveLength(2)

    chart.history.redo(false)
    await settle()
    expect(chart.w.config.xaxis.min).toBe(2)
    expect(chart.history.canRedo()).toBe(false)
    chart.destroy()
  })

  it('reverses multiple changes in order', async () => {
    const chart = historyChart()
    await settle()
    await chart.updateOptions({ xaxis: { min: 1, max: 5 } }, false, false)
    await settle()
    await chart.updateOptions({ xaxis: { min: 2, max: 4 } }, false, false)
    await settle()
    expect(chart.history.entries()).toHaveLength(3)

    chart.history.undo(false)
    await settle()
    expect(chart.w.config.xaxis.min).toBe(1)
    chart.history.undo(false)
    await settle()
    expect(chart.w.config.xaxis.min).toBeUndefined()
    chart.destroy()
  })

  it('a new change after undo truncates the redo tail', async () => {
    const chart = historyChart()
    await settle()
    await chart.updateOptions({ xaxis: { min: 1, max: 5 } }, false, false)
    await settle()
    chart.history.undo(false)
    await settle()

    await chart.updateOptions({ xaxis: { min: 3, max: 4 } }, false, false)
    await settle()
    expect(chart.history.canRedo()).toBe(false)
    expect(chart.history.entries()).toHaveLength(2)
    chart.destroy()
  })

  it('undo restores a hidden series (collapse restore, no spurious checkpoint)', async () => {
    const chart = historyChart()
    await settle()
    chart.hideSeries('B')
    await settle()
    expect(chart.w.globals.collapsedSeriesIndices).toContain(1)

    chart.history.undo(false)
    await settle()
    expect(chart.w.globals.collapsedSeriesIndices).not.toContain(1)
    expect(chart.history.entries()).toHaveLength(2)
    chart.destroy()
  })
})

describe('History — coalesce / transaction / ring buffer', () => {
  it('collapses a rapid burst into a single checkpoint', async () => {
    const chart = historyChart()
    await settle()
    const before = chart.history.entries().length
    chart.w.config.xaxis.min = 1
    chart.history._onUpdated()
    chart.history._onUpdated()
    chart.history._onUpdated()
    await settle()
    expect(chart.history.entries()).toHaveLength(before + 1)
    chart.destroy()
  })

  it('transaction records multiple awaited edits as one checkpoint', async () => {
    const chart = historyChart()
    await settle()
    const before = chart.history.entries().length
    await chart.history.transaction(async () => {
      await chart.updateOptions({ xaxis: { min: 1, max: 5 } }, false, false)
      await chart.updateOptions({ title: { text: 'Tx' } }, false, false)
    }, { label: 'preset' })
    await settle()
    expect(chart.history.entries()).toHaveLength(before + 1)
    expect(chart.history.entries().slice(-1)[0].label).toBe('preset')
    chart.destroy()
  })

  it('caps the stack at maxDepth', async () => {
    const chart = historyChart({ maxDepth: 3 })
    await settle()
    for (let i = 1; i <= 5; i++) {
      await chart.updateOptions({ xaxis: { min: i, max: 10 } }, false, false)
      await settle()
    }
    expect(chart.history.entries()).toHaveLength(3)
    chart.destroy()
  })
})

describe('History — jump / clear / event / lifetime', () => {
  it('jump(id) restores that checkpoint', async () => {
    const chart = historyChart()
    await settle()
    const baseId = chart.history.entries()[0].id
    await chart.updateOptions({ xaxis: { min: 2, max: 4 } }, false, false)
    await settle()
    chart.history.jump(baseId, false)
    await settle()
    expect(chart.w.config.xaxis.min).toBeUndefined()
    chart.destroy()
  })

  it('clear() keeps the current state as the sole baseline', async () => {
    const chart = historyChart()
    await settle()
    await chart.updateOptions({ xaxis: { min: 2, max: 4 } }, false, false)
    await settle()
    chart.history.clear()
    expect(chart.history.entries()).toHaveLength(1)
    expect(chart.history.canUndo()).toBe(false)
    chart.destroy()
  })

  it('fires historyChange on capture', async () => {
    const chart = historyChart()
    await settle()
    const spy = vi.fn()
    chart.addEventListener('historyChange', spy)
    await chart.updateOptions({ xaxis: { min: 1, max: 5 } }, false, false)
    await settle()
    expect(spy).toHaveBeenCalled()
    chart.destroy()
  })

  it('survives updateSeries and clears on destroy', async () => {
    const chart = historyChart()
    await settle()
    await chart.updateSeries(
      [
        { name: 'A', data: [1, 2, 3, 4, 5] },
        { name: 'B', data: [5, 4, 3, 2, 1] },
      ],
      false,
    )
    await settle()
    expect(chart.history.entries().length).toBeGreaterThanOrEqual(2)

    const spy = vi.spyOn(chart.history, 'teardown')
    chart.destroy()
    expect(spy).toHaveBeenCalled()
  })
})
