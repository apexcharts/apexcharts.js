/**
 * Virtual time for animation tests: step a chart's animation frame by frame,
 * deterministically, with no wall-clock waits.
 *
 * Why not Playwright's `page.clock`: it schedules every requestAnimationFrame
 * callback as its own timer and pays a few milliseconds of real time for each
 * one. A chart with data labels runs ~200 rAF callbacks per frame (one reveal
 * loop per label and marker, one morph loop per path), so a 1 s animation took
 * minutes. This shim batches a frame's callbacks the way a browser does: every
 * callback queued before the frame runs once, in order, with the same
 * timestamp.
 *
 * What it virtualises, in the page's main world only:
 *   - requestAnimationFrame / cancelAnimationFrame (batched per frame)
 *   - setTimeout / clearTimeout / setInterval / clearInterval
 *   - performance.now and Date.now (`new Date(...)` is left alone, since chart
 *     data is built from it)
 *   - CSS transitions and keyframe animations, which are paused and seeked to
 *     the virtual time after each frame via the Web Animations API
 *
 * Playwright's own actionability checks run in an isolated world, so
 * `locator.click()` keeps working on real time.
 *
 * Usage:
 *   await installVirtualTime(page)          // before any chart script runs
 *   ...load the chart...
 *   await advance(page, 3000)               // run the mount animation out
 *   await clickLegend(...)
 *   const frames = await recordFrames(page, 600, sampleFn)
 */

/** Frame length in ms, a 60 Hz display. */
export const FRAME_MS = 16

/**
 * Runs in the page. Kept self-contained: it is serialised into the page with
 * addInitScript, so it cannot close over anything in this module.
 */
function shim(frameMs) {
  if (window.__vt) return
  // Playwright's `pageerror` does not report unhandled promise rejections, and
  // a chart whose render() rejected otherwise just looks blank and error-free.
  // Forward them to the console, where the frame helpers collect them.
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason
    console.error(`[unhandledrejection] ${r && r.stack ? r.stack.split('\n').slice(0, 3).join(' <- ') : r}`)
  })
  const realPerfNow = performance.now.bind(performance)
  const realDateNow = Date.now
  const origin = realDateNow()
  const perfOrigin = realPerfNow()

  let now = 0 // virtual ms since install
  let nextId = 1
  /** @type {Map<number, {at: number, fn: Function, args: any[], every: number}>} */
  const timers = new Map()
  /** @type {Map<number, Function>} */
  let rafQueue = new Map()

  window.setTimeout = (fn, delay = 0, ...args) => {
    const id = nextId++
    timers.set(id, { at: now + Math.max(0, +delay || 0), fn, args, every: 0 })
    return id
  }
  window.setInterval = (fn, delay = 0, ...args) => {
    const id = nextId++
    const every = Math.max(1, +delay || 0)
    timers.set(id, { at: now + every, fn, args, every })
    return id
  }
  window.clearTimeout = window.clearInterval = (id) => timers.delete(id)
  window.requestAnimationFrame = (fn) => {
    const id = nextId++
    rafQueue.set(id, fn)
    return id
  }
  window.cancelAnimationFrame = (id) => rafQueue.delete(id)
  performance.now = () => perfOrigin + now
  Date.now = () => origin + now

  const call = (fn, args) => {
    try {
      typeof fn === 'function' ? fn(...args) : (0, eval)(String(fn))
    } catch (e) {
      // Surface page errors the way a real callback would (pageerror).
      Promise.reject(e)
    }
  }

  /** Fire every timer due at or before `t`, earliest first. */
  const runTimers = (t) => {
    for (;;) {
      let nextIdDue = -1
      let nextAt = Infinity
      for (const [id, tm] of timers) {
        if (tm.at <= t && (tm.at < nextAt || (tm.at === nextAt && id < nextIdDue))) {
          nextAt = tm.at
          nextIdDue = id
        }
      }
      if (nextIdDue === -1) return
      const tm = timers.get(nextIdDue)
      const prevNow = now
      now = Math.max(prevNow, tm.at)
      if (tm.every) tm.at += tm.every
      else timers.delete(nextIdDue)
      call(tm.fn, tm.args)
    }
  }

  // CSS animations: pause each one when first seen and drive its currentTime
  // from virtual time, so a transition advances exactly as far as the frames do.
  const cssStart = new WeakMap()
  const syncCss = () => {
    for (const a of document.getAnimations()) {
      if (!cssStart.has(a)) {
        cssStart.set(a, now - (a.currentTime || 0))
        a.pause()
      }
      a.currentTime = now - cssStart.get(a)
    }
  }

  // A real macrotask between frames lets promise chains and observers settle,
  // without the 4 ms clamp nested setTimeout(0) would add.
  const channel = new MessageChannel()
  const yieldTask = () =>
    new Promise((resolve) => {
      channel.port1.onmessage = () => resolve()
      channel.port2.postMessage(0)
    })

  /** Advance one frame: timers due in it, then the rAF batch. */
  const frame = (dt) => {
    const t = now + dt
    runTimers(t)
    now = t
    const batch = rafQueue
    rafQueue = new Map()
    const ts = perfOrigin + now
    for (const fn of batch.values()) call(fn, [ts])
    syncCss()
  }

  window.__vt = {
    frameMs,
    get now() {
      return now
    },
    /** Advance `ms` of virtual time in whole frames. */
    async advance(ms) {
      let left = ms
      while (left > 0) {
        const dt = Math.min(frameMs, left)
        frame(dt)
        left -= dt
        await yieldTask()
      }
    },
    /** True when nothing is scheduled: no timers and no pending frame. */
    get idle() {
      return timers.size === 0 && rafQueue.size === 0
    },
    realNow: realPerfNow,
  }
}

/**
 * Install virtual time. Call BEFORE the chart bundle loads: for a sample page
 * (page.goto) it is registered as an init script; for a bare page built with
 * page.setContent, call it after setContent and before addScriptTag.
 * @param {import('@playwright/test').Page} page
 * @param {{ bare?: boolean }} [opts] bare: install into the current document now
 */
export async function installVirtualTime(page, { bare = false } = {}) {
  if (bare) {
    await page.evaluate(shim, FRAME_MS)
  } else {
    await page.addInitScript(shim, FRAME_MS)
  }
}

/** Advance virtual time by `ms`, in frames. */
export async function advance(page, ms) {
  await page.evaluate((ms) => window.__vt.advance(ms), ms)
}

/**
 * Advance frame by frame for up to `ms`, calling `sample` (a function that
 * runs in the page) after every frame. Returns one sample per frame, the
 * first taken BEFORE any time passes (frame 0 is the state the action left).
 * @template T
 * @param {import('@playwright/test').Page} page
 * @param {number} ms
 * @param {(arg: any) => T} sample  serialised into the page; must be self-contained
 * @param {any} [arg] passed to `sample`
 * @returns {Promise<T[]>}
 */
export async function recordFrames(page, ms, sample, arg) {
  return page.evaluate(
    async ({ ms, src, arg }) => {
      const fn = (0, eval)(`(${src})`)
      const out = [fn(arg)]
      const frames = Math.ceil(ms / window.__vt.frameMs)
      for (let i = 0; i < frames; i++) {
        await window.__vt.advance(window.__vt.frameMs)
        out.push(fn(arg))
      }
      return out
    },
    { ms, src: sample.toString(), arg },
  )
}
