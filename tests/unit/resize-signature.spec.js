import { it, expect, afterEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/line.js'

// A percentage-wide chart is sized from its own element, and the resize
// signature has to record the same measurement. It used to fall back to the
// parent's width when the element measured 0, while the render never did, so
// a hidden (v-show=false) chart that became visible at the parent's width
// looked unchanged and was never redrawn.

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const setWidth = (el, w) =>
  Object.defineProperty(el, 'clientWidth', { get: () => w, configurable: true })

afterEach(() => {
  document.body.innerHTML = ''
})

it('a hidden percentage-wide chart redraws when it becomes visible', async () => {
  document.body.innerHTML =
    '<div id="p" style="padding:0"><div id="c" style="padding:0"></div></div>'
  const parent = document.querySelector('#p')
  const el = document.querySelector('#c')
  setWidth(parent, 600)
  setWidth(el, 0)
  const chart = new ApexCharts(el, {
    chart: { type: 'line', height: 300, animations: { enabled: false } },
    series: [{ data: [1, 2, 3] }],
  })
  await chart.render()
  expect(chart.w.globals.svgWidth).toBe(0)
  expect(chart.w.globals.lastResizeSignature.w).toBe(0)

  setWidth(el, 600)
  chart._windowResize()
  await wait(200)
  expect(chart.w.globals.svgWidth).toBe(600)
  chart.destroy()
})
