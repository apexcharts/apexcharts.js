import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  tickKeys,
  spawnGhost,
  landChromeTweens,
  applyAxisTransition,
} from '../../src/modules/animations/AxisTransition.js'
import { BrowserAPIs } from '../../src/ssr/BrowserAPIs.js'

const SVGNS = 'http://www.w3.org/2000/svg'

function svg(markup) {
  document.body.innerHTML = `<svg xmlns="${SVGNS}">${markup}</svg>`
  return document.body.firstElementChild
}

describe('AxisTransition tick matching', () => {
  it('keys the same text on two y axes apart', () => {
    const root = svg(`
      <g class="apexcharts-yaxis" rel="0"><g class="apexcharts-yaxis-texts-g">
        <text>20</text><text>40</text></g></g>
      <g class="apexcharts-yaxis" rel="1"><g class="apexcharts-yaxis-texts-g">
        <text>20</text><text>40</text></g></g>`)
    const keys = tickKeys([...root.querySelectorAll('text')])
    expect(new Set(keys).size).toBe(4)
  })

  it('keys repeated categories by occurrence, in order', () => {
    const root = svg('<text>Jan</text><text>Feb</text><text>Jan</text>')
    const [a, , b] = tickKeys([...root.querySelectorAll('text')])
    expect(a).not.toBe(b)
    // The same labels in a later render pair label for label.
    const again = svg('<text>Jan</text><text>Feb</text><text>Jan</text>')
    expect(tickKeys([...again.querySelectorAll('text')])).toEqual(
      tickKeys([...root.querySelectorAll('text')]),
    )
  })
})

describe('AxisTransition exit ghosts', () => {
  afterEach(() => vi.restoreAllMocks())

  it('drops the rotate() of the label it is cloned from', () => {
    vi.spyOn(BrowserAPIs, 'requestAnimationFrame').mockImplementation(() => 0)
    const root = svg(
      '<g><text x="50" transform="rotate(-45 50 10)"><tspan>Mar</tspan></text></g>',
    )
    const template = root.querySelector('text')
    const w = { globals: {} }
    spawnGhost(w, {
      template,
      display: 'Jan',
      attrs: ['x'],
      from: 10,
      to: 0,
      duration: 300,
      ease: (t) => t,
    })
    const ghost = root.querySelector('.apexcharts-tick-ghost')
    expect(ghost.textContent).toBe('Jan')
    expect(ghost.hasAttribute('transform')).toBe(false)
  })
})

describe('landChromeTweens', () => {
  it('lands the layout tween and every chrome tween', () => {
    const order = []
    const chrome = vi.fn(() => order.push('chrome'))
    const w = {
      globals: {
        layoutTween: { finish: () => order.push('layout') },
        chromeTweens: new Set([chrome]),
      },
    }
    landChromeTweens(w)
    expect(order).toEqual(['layout', 'chrome'])
  })

  it('is a no-op with nothing in flight', () => {
    expect(() => landChromeTweens({ globals: {} })).not.toThrow()
  })
})

describe('applyAxisTransition landing', () => {
  const inFlight = (prevChromeFrame) => {
    const layout = vi.fn()
    const w = {
      globals: {
        prevChromeFrame,
        axisCharts: false,
        layoutTween: { finish: layout },
        chromeTweens: new Set(),
      },
    }
    return { w, layout }
  }

  it('lands earlier tweens even when this update does not ease', () => {
    // A render that draws its chrome at the final layout (here a gate
    // closes) must not leave the plot easing underneath it.
    const { w, layout } = inFlight({ pending: true })
    applyAxisTransition(w)
    expect(layout).toHaveBeenCalledOnce()
  })

  it('leaves the tweens of an update earlier in the same tick running', () => {
    // That update consumed the frame and has just started its tweens.
    const { w, layout } = inFlight(null)
    applyAxisTransition(w)
    expect(layout).not.toHaveBeenCalled()
  })
})
