/**
 * Deterministic IntersectionObserver mock for jsdom.
 *
 * The real observer fires entries from layout; jsdom has none, so tests
 * declare which observed elements intersect via `trigger(intersecting)`.
 * Instances are recorded so a test can reach the observer a module created
 * internally (`IntersectionObserver.instances.at(-1)`).
 */
class IntersectionObserver {
  static instances = []

  constructor(cb, options = {}) {
    this.cb = cb
    this.options = options
    this.elements = new Set()
    IntersectionObserver.instances.push(this)
  }

  observe(el) {
    this.elements.add(el)
  }

  unobserve(el) {
    this.elements.delete(el)
  }

  disconnect() {
    this.elements.clear()
  }

  /**
   * Fire one entry per observed element; those in `intersecting` report
   * isIntersecting true, the rest false.
   * @param {Iterable<Element>} intersecting
   */
  trigger(intersecting = []) {
    const set = new Set(intersecting)
    const entries = Array.from(this.elements, (el) => ({
      target: el,
      isIntersecting: set.has(el),
    }))
    this.cb(entries, this)
  }
}

window.IntersectionObserver = IntersectionObserver
export default IntersectionObserver
