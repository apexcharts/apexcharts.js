import { describe, it, expect } from 'vitest'
import TooltipUtils from '../../src/modules/tooltip/Utils.js'

/**
 * #3237: the tooltip reads which element the pointer is over from a ~20ms timer,
 * i.e. after the event has finished propagating. For a chart inside a shadow
 * root the browser has retargeted `e.target` to the host element by then, so the
 * element has to be noted down while dispatch is still running.
 *
 * `eventPhase` is what tells the two moments apart: non-zero while dispatching,
 * 0 (Event.NONE) once done. Real retargeting is covered end to end in
 * tests/interaction/specs/shadow-dom-tooltip.spec.js; these cases pin the
 * contract of the helper itself, including the shapes it must not choke on.
 */
describe('TooltipUtils.hoverTarget', () => {
  const bar = { tag: 'the bar' }
  const host = { tag: 'the shadow host' }

  it('remembers the target while the event is dispatching', () => {
    const e = { eventPhase: 2, target: bar }
    expect(TooltipUtils.hoverTarget(e)).toBe(bar)

    // dispatch is over: the browser has retargeted, but the note stands
    e.eventPhase = 0
    e.target = host
    expect(TooltipUtils.hoverTarget(e)).toBe(bar)
  })

  it('does not overwrite the note with a retargeted value', () => {
    const e = { eventPhase: 3, target: bar }
    TooltipUtils.hoverTarget(e)
    e.eventPhase = 0
    e.target = host
    // repeated reads keep answering the same thing, however many there are
    expect(TooltipUtils.hoverTarget(e)).toBe(bar)
    expect(TooltipUtils.hoverTarget(e)).toBe(bar)
  })

  it('falls back to the live target when it was never noted down', () => {
    // any handler that reads without a capture first, plus every synthetic
    // event-like object the internals pass around
    expect(TooltipUtils.hoverTarget({ target: bar })).toBe(bar)
    expect(TooltipUtils.hoverTarget({ eventPhase: 0, target: bar })).toBe(bar)
  })

  it('is the plain target outside a shadow root, both during and after', () => {
    const e = { eventPhase: 2, target: bar }
    expect(TooltipUtils.hoverTarget(e)).toBe(bar)
    e.eventPhase = 0 // nothing is retargeted in the light DOM
    expect(TooltipUtils.hoverTarget(e)).toBe(bar)
  })

  it('tolerates a missing event or target', () => {
    expect(TooltipUtils.hoverTarget(null)).toBe(null)
    expect(TooltipUtils.hoverTarget(undefined)).toBe(null)
    expect(TooltipUtils.hoverTarget({ eventPhase: 2 })).toBe(undefined)
  })
})
