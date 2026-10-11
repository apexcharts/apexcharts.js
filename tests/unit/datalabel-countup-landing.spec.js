import { describe, it, expect, vi, afterEach } from 'vitest'
import { countUpText } from '../../src/modules/animations/DataLabelTransition.js'
import { BrowserAPIs } from '../../src/ssr/BrowserAPIs.js'

const SVGNS = 'http://www.w3.org/2000/svg'

// A count-up label, as the renderer left it, and a frame pump: each pump()
// runs the next animation frame at `t` ms after the tween started.
function setup(tspans) {
  document.body.innerHTML = `<svg xmlns="${SVGNS}"><text>${tspans
    .map((s) => `<tspan>${s}</tspan>`)
    .join('')}</text></svg>`
  const frames = []
  vi.spyOn(BrowserAPIs, 'requestAnimationFrame').mockImplementation((cb) => {
    frames.push(cb)
    return frames.length
  })
  vi.spyOn(performance, 'now').mockReturnValue(1000)
  const el = document.querySelector('text')
  const w = { globals: {} }
  const texts = () => [...el.querySelectorAll('tspan')].map((t) => t.textContent)
  const pump = (t) => frames.shift()?.(1000 + t)
  return { el, w, texts, pump }
}

describe('countUp landing', () => {
  afterEach(() => vi.restoreAllMocks())

  it('lands on the renderer text, not a re-formatted rounded value', () => {
    const fmt = (v) => Number(v).toFixed(8)
    const { el, w, texts, pump } = setup([fmt(0.98765432)])
    countUpText(w, {
      el,
      from: 0.5,
      to: 0.98765432,
      formatter: fmt,
      fmtOpts: {},
      duration: 100,
      ease: (t) => t,
    })
    pump(50)
    pump(100)
    expect(texts()).toEqual(['0.98765432'])
  })

  it('writes an array formatter one line per tspan', () => {
    const fmt = (v) => ['Apples', String(Math.round(v))]
    const { el, w, texts, pump } = setup(['Apples', '42'])
    countUpText(w, {
      el,
      from: 10,
      to: 42,
      formatter: fmt,
      fmtOpts: {},
      duration: 100,
      ease: (t) => t,
    })
    pump(50)
    expect(texts()).toEqual(['Apples', '26'])
    pump(100)
    expect(texts()).toEqual(['Apples', '42'])
  })
})
