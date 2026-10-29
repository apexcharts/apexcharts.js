// @ts-check
// Helpers to react to element resizes, regardless of what caused them
// TODO Currently this creates a new ResizeObserver every time we want to observe an element for resizes
// Ideally, we should be able to use a single observer for all elements

import { Environment } from './Environment.js'

const ros = new WeakMap() // Map callbacks to ResizeObserver instances for easy removal

/**
 * @param {HTMLElement} el
 * @param {Function} fn
 */
export function addResizeListener(el, fn) {
  // No-op in SSR environment
  if (Environment.isSSR()) return

  // Every callback is delivered, the first one included. An observer reports
  // its first size at the next layout after observe(), not at observe() itself
  // (https://drafts.csswg.org/resize-observer/#ref-for-element%E2%91%A3). The
  // chart observes, then draws, and anything that moves the container before
  // that layout (the page gaining a scrollbar because the chart made it taller,
  // a sidebar or grid settling in the same frame) is reported only in that
  // first callback. Discarding it left the chart at its first width until the
  // window was resized (react-apexcharts#187). Both listeners compare against
  // the size they last drew at, so a first callback that changes nothing costs
  // a check, never a redraw. A hidden (0-wide) element needs no special case: it
  // used to be the one place the first callback was kept (#2825, #2991, #2992).
  const ro = new ResizeObserver((r) => {
    fn.call(el, r)
  })

  if (el.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    // Document fragment, observe children instead (needed for Shadow DOM, see #1332)
    Array.from(el.children).forEach((c) => ro.observe(c))
  } else {
    ro.observe(el)
  }

  // One observer per callback: a second add (a retried render) would
  // otherwise orphan the first, which nothing could disconnect again.
  const old = ros.get(fn)
  if (old) old.disconnect()
  ros.set(fn, ro)
}

/**
 * @param {Element} el
 * @param {Function} fn
 */
export function removeResizeListener(el, fn) {
  // No-op in SSR environment
  if (Environment.isSSR()) return

  const ro = ros.get(fn)
  if (ro) {
    ro.disconnect()
    ros.delete(fn)
  }
}
