import { describe, it, expect, vi, afterEach } from 'vitest'
import { wrapAddon, PENDING_ADDONS } from '../../build/shared-modules.mjs'
import drainPendingAddons from '../../src/utils/PendingAddons.js'

// A script-tag add-on used to read globalThis.ApexCharts.__internals the
// moment it ran, so one loaded before the ApexCharts script died with
// "Cannot read properties of undefined (reading '__internals')". It now waits
// for a baseline to load. The real files are driven in a browser by
// tests/interaction/specs/addon-load-order.spec.js; this pins the contract.

/** Run a wrapped add-on as a classic script would: `this` is the global. */
const load = (body, file = 'violin.js') =>
  new Function(wrapAddon(body, file)).call(globalThis)

const ADDON = 'this.__addonRuns = (this.__addonRuns || 0) + 1'
/** A stand-in for the class a baseline passes to its drain. */
const baseline = () => function ApexCharts() {}
const microtask = () => new Promise((r) => queueMicrotask(r))

/** `load` listeners the add-ons under test put on this shared window. */
const listeners = []

afterEach(() => {
  delete globalThis.ApexCharts
  delete globalThis.__addonRuns
  delete globalThis[PENDING_ADDONS]
  // Taken off again, or one test's add-on runs its page-load check in the
  // next test's dispatch.
  for (const fn of listeners.splice(0)) window.removeEventListener('load', fn)
  vi.restoreAllMocks()
})

describe('a script-tag add-on and the ApexCharts script', () => {
  it('runs at once when ApexCharts is already on the page', () => {
    globalThis.ApexCharts = { __internals: {} }
    load(ADDON)
    expect(globalThis.__addonRuns).toBe(1)
    expect(globalThis[PENDING_ADDONS]).toBeUndefined()
  })

  it('waits when it loads first, and runs once ApexCharts drains the queue', async () => {
    load(ADDON)
    load(ADDON, 'features/trellis.js')
    expect(globalThis.__addonRuns).toBeUndefined()
    expect(globalThis[PENDING_ADDONS].map((e) => e.file)).toEqual([
      'dist/violin.js',
      'dist/features/trellis.js',
    ])

    // What a baseline does: the class goes on the global after its bundle
    // returns, which is why the drain waits a microtask.
    drainPendingAddons(baseline())
    globalThis.ApexCharts = { __internals: {} }
    await microtask()

    expect(globalThis.__addonRuns).toBe(2)
    expect(globalThis[PENDING_ADDONS]).toEqual([])
  })

  it('reports a queued add-on that fails by its file, and runs the rest', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    load('throw new Error("boom")', 'features/ink.js')
    load(ADDON)
    globalThis.ApexCharts = { __internals: {} }
    drainPendingAddons(baseline())
    await microtask()
    expect(globalThis.__addonRuns).toBe(1)
    expect(error.mock.calls.flat().join(' ')).toContain(
      'dist/features/ink.js, loaded before the ApexCharts script, failed to register: boom',
    )
  })

  // Loaded while the page is still loading, so the add-on adds its check at
  // window `load`; the listener is recorded and removed after the test.
  const pageLoad = (body, file) => {
    const state = vi
      .spyOn(document, 'readyState', 'get')
      .mockReturnValue('loading')
    const add = window.addEventListener.bind(window)
    const spy = vi
      .spyOn(window, 'addEventListener')
      .mockImplementation((type, fn, opts) => {
        if (type === 'load') listeners.push(fn)
        return add(type, fn, opts)
      })
    load(body, file)
    spy.mockRestore()
    state.mockRestore()
  }
  const said = (spy) => spy.mock.calls.flat().join(' ')

  it('says it is still waiting when ApexCharts has not loaded by then', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    pageLoad(ADDON, 'features/link.js')
    window.dispatchEvent(new Event('load'))
    expect(said(warn)).toContain(
      'dist/features/link.js is waiting for the ApexCharts script, which had not loaded when the page finished loading',
    )
    // Not "the page has none": a loader can still inject it after `load`.
    expect(said(error)).not.toContain('dist/features/link.js')
  })

  it('still registers when ApexCharts arrives after the page loaded', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    pageLoad('this.__lateCore = true', 'features/history.js')
    window.dispatchEvent(new Event('load'))
    globalThis.ApexCharts = { __internals: {} }
    drainPendingAddons(baseline())
    await microtask()
    expect(globalThis.__lateCore).toBe(true)
    delete globalThis.__lateCore
  })

  // An 8.0 class that reached the global after its own drain ran (an ES
  // module assigning window.ApexCharts) is not "older than 8.0".
  it('registers late on an 8.0 class put on the global late, without calling it old', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    pageLoad('this.__lateEsm = true', 'features/ink.js')
    const A = function ApexCharts() {}
    A.__internals = {}
    drainPendingAddons(A) // what the 8.0 bundle ran, before A reached window
    globalThis.ApexCharts = A
    window.dispatchEvent(new Event('load'))
    expect(globalThis.__lateEsm).toBe(true)
    expect(said(warn)).not.toContain('older than 8.0')
    delete globalThis.__lateEsm
  })

  it('reports a 7.x ApexCharts it could not register with, by its file', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    pageLoad('throw new Error("mismatch")', 'features/perspectives.js')
    globalThis.ApexCharts = { __internals: {} }
    window.dispatchEvent(new Event('load'))
    expect(said(error)).toContain(
      'dist/features/perspectives.js could not register with the ApexCharts script on this page: mismatch',
    )
  })

  it('says an ApexCharts older than 7.0 that loaded after it is too old', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    pageLoad(ADDON, 'features/storyboard.js')
    globalThis.ApexCharts = function OldApexCharts() {}
    window.dispatchEvent(new Event('load'))
    expect(said(error)).toContain(
      'dist/features/storyboard.js cannot register: the ApexCharts on this page has no add-on surface',
    )
    expect(said(error)).not.toContain('waiting for the ApexCharts script')
  })

  // A 7.x core has the surface but no drain: the add-on runs at `load`, late,
  // and says where its tag belongs.
  it('registers late on a 7.x ApexCharts that loaded after it, and says so', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    pageLoad('this.__on7x = true', 'features/context-menu.js')
    globalThis.ApexCharts = { __internals: {} } // a 7.x core: no drain ran
    window.dispatchEvent(new Event('load'))
    expect(globalThis.__on7x).toBe(true)
    expect(said(warn)).toContain(
      'dist/features/context-menu.js loaded before the ApexCharts script, which is older than 8.0',
    )
    expect(
      globalThis[PENDING_ADDONS].some(
        (e) => e.file === 'dist/features/context-menu.js',
      ),
    ).toBe(false)
    delete globalThis.__on7x
  })

  it('says nothing at load for an add-on that was drained', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    pageLoad(ADDON, 'features/measure.js')
    globalThis.ApexCharts = { __internals: {} }
    drainPendingAddons(baseline())
    await microtask()
    window.dispatchEvent(new Event('load'))
    expect(said(warn) + said(error)).not.toContain('dist/features/measure.js')
  })

  it('says the ApexCharts on the page has no add-on surface, rather than failing inside', () => {
    globalThis.ApexCharts = function OldApexCharts() {}
    expect(() => load(ADDON)).toThrow(
      'dist/violin.js cannot register: the ApexCharts on this page has no add-on surface',
    )
  })

  // Under AMD the UMD hands itself to define() and reads the global only when
  // required, as before: it must run at once, not wait in the queue.
  it('runs at once under an AMD loader, which defers the global read itself', () => {
    const define = Object.assign(() => {}, { amd: {} })
    new Function('define', wrapAddon(ADDON, 'violin.js')).call(
      globalThis,
      define,
    )
    expect(globalThis.__addonRuns).toBe(1)
    expect(globalThis[PENDING_ADDONS]).toBeUndefined()
  })

  it('throws at once under CommonJS, which nothing would ever drain', () => {
    expect(() =>
      new Function('module', 'exports', wrapAddon(ADDON, 'violin.js')).call(
        globalThis,
        {},
        {},
      ),
    ).toThrow('dist/violin.js is a script-tag add-on')
  })

  // No page at all (CommonJS, a worker): nothing would ever drain the queue,
  // so it says so at once instead of waiting forever.
  it('throws at once where there is no page to wait on', () => {
    expect(() =>
      new Function('window', 'document', wrapAddon(ADDON, 'violin.js')).call(
        globalThis,
        undefined,
        undefined,
      ),
    ).toThrow('dist/violin.js is a script-tag add-on')
    expect(globalThis[PENDING_ADDONS]).toBeUndefined()
  })

  // A drain that runs before the class is on the global (another bundle's,
  // say) must leave the queue for the next one, not empty it into nothing.
  it('keeps the queue when a drain finds no ApexCharts yet', async () => {
    load(ADDON)
    drainPendingAddons(baseline())
    await microtask()
    expect(globalThis[PENDING_ADDONS]).toHaveLength(1)
    expect(globalThis.__addonRuns).toBeUndefined()

    globalThis.ApexCharts = { __internals: {} }
    drainPendingAddons(baseline())
    await microtask()
    expect(globalThis.__addonRuns).toBe(1)
  })
})
