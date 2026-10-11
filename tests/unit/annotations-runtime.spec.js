import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/standard.js'

const qa = (chart, sel) => [...chart.w.dom.baseEl.querySelectorAll(sel)]

describe('runtime annotations', () => {
  it('removeAnnotation removes every annotation sharing the id', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: Array.from({ length: 20 }, (_, i) => i) }],
      xaxis: { type: 'numeric' },
    })
    chart.addXaxisAnnotation({ id: 'evt', x: 5 })
    chart.addXaxisAnnotation({ id: 'evt', x: 10 })
    chart.addXaxisAnnotation({ id: 'evt', x: 15 })
    chart.removeAnnotation('evt')
    expect(
      chart.w.globals.memory.methodsToExec.filter((m) => m.id === 'evt'),
    ).toHaveLength(0)

    await chart.updateOptions({ title: { text: 'x' } })
    expect(qa(chart, '.apexcharts-xaxis-annotations line')).toHaveLength(0)
  })

  it('gives a runtime label its own background, not a config label', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 350 },
      series: [{ data: Array.from({ length: 50 }, (_, i) => [i, i * 2]) }],
      xaxis: { type: 'numeric' },
      annotations: {
        points: [
          { x: -100, y: 60 },
          { x: -100, y: 60 },
          { x: -100, y: 60 },
          { x: -100, y: 60 },
          { x: 20, y: 60, label: { text: 'CFG' } },
        ],
      },
    })
    chart.addPointAnnotation({ x: 30, y: 60, label: { text: 'EXT' } })

    const labels = qa(chart, '.apexcharts-point-annotation-label')
    expect(labels.map((l) => l.textContent)).toEqual(['CFG', 'EXT'])
    labels.forEach((l) => {
      const prev = l.previousElementSibling
      expect(prev && prev.tagName.toLowerCase()).toBe('rect')
      const prevPrev = prev.previousElementSibling
      expect(prevPrev && prevPrev.tagName.toLowerCase()).not.toBe('rect')
    })
  })

  it('skips a text annotation whose appendTo matches nothing', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'line', animations: { enabled: false } },
      series: [{ data: [1, 2, 3] }],
      annotations: {
        texts: [
          { x: 10, y: 10, text: 'Note', appendTo: '.apexcharts-not-here' },
          { x: 10, y: 30, text: 'Kept' },
        ],
      },
    })
    await expect(chart.render()).resolves.toBeDefined()
    const texts = qa(chart, '.apexcharts-text').map((n) => n.textContent)
    expect(texts).toContain('Kept')
    expect(texts).not.toContain('Note')
  })

  it('does not add an "undefined" class to a text annotation', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [1, 2, 3] }],
      annotations: { texts: [{ x: 10, y: 10, text: 'Note' }] },
    })
    const t = qa(chart, '.apexcharts-text').find(
      (n) => n.textContent === 'Note',
    )
    expect(t).toBeTruthy()
    expect(t.getAttribute('class')).not.toContain('undefined')
  })
})
