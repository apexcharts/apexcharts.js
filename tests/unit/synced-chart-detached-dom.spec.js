import { describe, it, expect } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/full.js'

function createSyncedChartPair(groupId) {
  document.body.innerHTML = '<div id="chart-live" /><div id="chart-orphaned" />'

  const live = new ApexCharts(document.querySelector('#chart-live'), {
    chart: {
      type: 'line',
      id: 'liveChart',
      group: groupId,
      animations: { enabled: false },
    },
    series: [{ data: [1, 2, 3] }],
  })
  live.render()

  const orphaned = new ApexCharts(document.querySelector('#chart-orphaned'), {
    chart: {
      type: 'line',
      id: 'orphanedChart',
      group: groupId,
      animations: { enabled: false },
    },
    series: [{ data: [4, 5, 6] }],
  })
  orphaned.render()

  return { live, orphaned }
}

describe('a synced chart with no live DOM does not break the group', () => {
  it('should not throw when updating a chart whose synced sibling has lost its host element', async () => {
    const { live, orphaned } = createSyncedChartPair('orphan-group')

    // A wrapping component (e.g. a templating card that rebuilds its child
    // on every data-driven config change) can tear down a chart's host
    // element without going through chart.destroy() first - it stays
    // registered in Apex._chartInstances, still reachable via
    // getSyncedCharts(), but with no DOM left to operate on.
    orphaned.w.dom.baseEl = null

    await expect(
      live.updateOptions({ series: [{ data: [7, 8, 9] }] }),
    ).resolves.toBeDefined()

    expect(orphaned.w.globals.previousPaths).toEqual([])
  })

  it('should not throw when the sibling host element was removed from the document without calling destroy()', async () => {
    const { live, orphaned } = createSyncedChartPair('orphan-group-detached')

    orphaned.w.dom.baseEl.remove()

    await expect(
      live.updateOptions({ series: [{ data: [7, 8, 9] }] }),
    ).resolves.toBeDefined()

    expect(orphaned.w.globals.previousPaths).toEqual([])
  })
})
