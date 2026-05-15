import { describe, it } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

describe('gauge layout diagnostic', () => {
  it('prints layout values for -135/135 gauge', () => {
    const chart = createChartWithOptions({
      chart: { type: 'radialBar', height: 350, width: 420 },
      series: [58],
      labels: ['CPU Usage'],
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 135,
          hollow: { margin: 0, size: '60%' },
          dataLabels: { name: { show: false }, value: { show: true } },
        }
      },
      legend: { show: false },
    })
    const w = chart.w
    console.log('=== Gauge Layout ===')
    console.log('gridWidth:', w.layout.gridWidth)
    console.log('gridHeight:', w.layout.gridHeight)
    console.log('translateX:', w.layout.translateX)
    console.log('translateY:', w.layout.translateY)
    console.log('svgWidth:', w.globals.svgWidth)
    console.log('svgHeight:', w.globals.svgHeight)
    console.log('radialSize:', w.globals.radialSize)
    const el = document.querySelector('.apexcharts-inner')
    console.log('elGraphical transform:', el?.getAttribute('transform'))
    const arcs = document.querySelectorAll('.apexcharts-radialbar-area')
    console.log('arc count:', arcs.length)
    for (const arc of arcs) {
      console.log('arc d:', arc.getAttribute('d')?.substring(0, 100))
    }
    const tracks = document.querySelectorAll('.apexcharts-radialbar-track path')
    for (const t of tracks) {
      console.log('track d:', t.getAttribute('d')?.substring(0, 100))
    }
  })
})
