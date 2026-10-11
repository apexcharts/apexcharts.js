import { describe, it, expect, afterEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/full.js'

// Globals.initGlobalVars runs before every re-parse. A flag the parse only
// ever raises, or a value only one chart type writes, has to be reset there or
// it leaks into every later render. Timer handles are the opposite case: they
// must survive a re-render so a later debounce, or destroy(), can cancel them.

const xl = (ch) =>
  [...ch.w.dom.baseEl.querySelectorAll('.apexcharts-xaxis-label')].map(
    (t) => t.textContent,
  )
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

afterEach(() => {
  document.body.innerHTML = ''
})

describe('debounce timer handles', () => {
  it('a re-render keeps the pending resize handle, so destroy() cancels it', async () => {
    document.body.innerHTML = '<div id="r"></div>'
    const el = document.querySelector('#r')
    const r = new ApexCharts(el, {
      chart: {
        type: 'line',
        width: 500,
        height: 300,
        animations: { enabled: false },
      },
      series: [{ data: [1, 2, 3] }],
    })
    await r.render()
    r._windowResize()
    await r.updateSeries([{ data: [3, 2, 1] }], false)
    expect(r.w.globals.resizeTimer).not.toBe(null)
    r.destroy()
    await wait(200)
    // The orphaned timer used to run update() on the destroyed chart and draw
    // a fresh SVG into the element.
    expect(el.querySelector('svg')).toBe(null)
  })

  it('a re-render cancels the pending selection emit of the replaced rect', async () => {
    document.body.innerHTML = '<div id="b"></div>'
    const r = new ApexCharts(document.querySelector('#b'), {
      chart: {
        type: 'line',
        width: 500,
        height: 300,
        animations: { enabled: false },
      },
      series: [{ data: [1, 2, 3] }],
    })
    await r.render()
    let fired = false
    r.w.globals.selectionResizeTimer = window.setTimeout(
      () => (fired = true),
      30,
    )
    // A full re-render (the data-only fast path keeps the rect and its emit).
    await r.updateOptions({ title: { text: 'Rebuilt' } }, false, false)
    await wait(60)
    expect(fired).toBe(false)
    r.destroy()
  })
})
