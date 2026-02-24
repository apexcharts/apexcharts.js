import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Destroy from '../../../src/modules/helpers/Destroy.js'

/**
 * Builds a minimal chart context that satisfies Destroy's needs.
 * In SSR the Paper shim may not have a real .node property.
 */
function makeCtx({ paperNode = null } = {}) {
  const Paper = {
    node: paperNode,
    each: vi.fn(),
    clear: vi.fn(),
    remove: vi.fn(),
  }

  return {
    el: null,
    eventList: ['click', 'mousemove'],
    events: { documentEvent: vi.fn() },
    zoomPanSelection: null,
    toolbar: null,
    w: {
      globals: {
        resizeObserver: null,
        tooltip: null,
        dom: {
          Paper,
          baseEl: null,
          elWrap: {},
          elGraphical: {},
          elLegendWrap: {},
          elLegendForeign: {},
          elGridRect: {},
          elGridRectMask: {},
          elGridRectBarMask: {},
          elGridRectMarkerMask: {},
          elForecastMask: {},
          elNonForecastMask: {},
          elDefs: {},
        },
      },
    },
  }
}

describe('Destroy.clearDomElements() SSR safety', () => {
  let originalWindow
  let originalDocument

  beforeEach(() => {
    originalWindow = global.window
    originalDocument = global.document
  })

  afterEach(() => {
    global.window = originalWindow
    global.document = originalDocument
  })

  it('should not throw in SSR when Paper.node is undefined', () => {
    global.window = undefined
    global.document = undefined

    const ctx = makeCtx({ paperNode: undefined })
    const destroy = new Destroy(ctx)

    expect(() => destroy.clearDomElements({ isUpdating: false })).not.toThrow()
  })

  it('should not throw in SSR when Paper.node is null', () => {
    global.window = undefined
    global.document = undefined

    const ctx = makeCtx({ paperNode: null })
    const destroy = new Destroy(ctx)

    expect(() => destroy.clearDomElements({ isUpdating: false })).not.toThrow()
  })

  it('should still null out all domEls refs in SSR', () => {
    global.window = undefined
    global.document = undefined

    const ctx = makeCtx()
    const destroy = new Destroy(ctx)
    destroy.clearDomElements({ isUpdating: false })

    const dom = ctx.w.globals.dom
    expect(dom.elWrap).toBeNull()
    expect(dom.elGraphical).toBeNull()
    expect(dom.elLegendWrap).toBeNull()
    expect(dom.elLegendForeign).toBeNull()
    expect(dom.baseEl).toBeNull()
    expect(dom.elGridRect).toBeNull()
    expect(dom.elGridRectMask).toBeNull()
    expect(dom.elGridRectBarMask).toBeNull()
    expect(dom.elGridRectMarkerMask).toBeNull()
    expect(dom.elForecastMask).toBeNull()
    expect(dom.elNonForecastMask).toBeNull()
    expect(dom.elDefs).toBeNull()
  })

  it('should skip Paper.remove() and killSVG() in SSR', () => {
    global.window = undefined
    global.document = undefined

    const ctx = makeCtx()
    const destroy = new Destroy(ctx)
    destroy.clearDomElements({ isUpdating: false })

    // These are browser-only operations — should not be called in SSR
    expect(ctx.w.globals.dom.Paper.remove).not.toHaveBeenCalled()
    expect(ctx.w.globals.dom.Paper.each).not.toHaveBeenCalled()
  })

  it('should call Paper.remove() and killSVG() in browser environment', () => {
    // window and document are available in jsdom (browser-like)
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const ctx = makeCtx({ paperNode: node })

    // Give el a real DOM parent so firstChild loop works
    ctx.el = document.createElement('div')

    // baseEl with a real element so removeEventListener can be called
    ctx.w.globals.dom.baseEl = document.createElement('div')

    const destroy = new Destroy(ctx)
    destroy.clearDomElements({ isUpdating: false })

    expect(ctx.w.globals.dom.Paper.remove).toHaveBeenCalledOnce()
    expect(ctx.w.globals.dom.Paper.each).toHaveBeenCalledOnce()
  })
})
