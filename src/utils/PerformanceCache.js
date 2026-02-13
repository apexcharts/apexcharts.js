/**
 * Performance cache utils
 * Centralized cache management for DOM queries and dimensions
 */

export default class PerformanceCache {
  /**
   * Invalidate all caches
   * @param {Object} w - ApexCharts globals object
   */
  static invalidateAll(w) {
    if (!w || !w.globals) return

    // Clear DOM selector cache
    if (w.globals.cachedSelectors) {
      w.globals.cachedSelectors = {}
    }

    // Clear DOM element cache
    if (w.globals.domCache) {
      w.globals.domCache.clear()
    }

    // Clear dimension cache
    w.globals.dimensionCache = {}
  }

  /**
   * Invalidate dimension cache only
   * @param {Object} w - ApexCharts globals object
   */
  static invalidateDimensions(w) {
    if (!w || !w.globals) return
    w.globals.dimensionCache = {}
  }

  /**
   * Invalidate selector cache only
   * @param {Object} w - ApexCharts globals object
   */
  static invalidateSelectors(w) {
    if (!w || !w.globals) return
    if (w.globals.cachedSelectors) {
      w.globals.cachedSelectors = {}
    }
  }

  /**
   * Get cached selector result or compute and cache it
   * @param {Object} w - ApexCharts globals object
   * @param {string} key - Cache key
   * @param {Function} queryFn - Function to execute if not cached
   * @returns {*} Cached or newly computed result
   */
  static getCachedSelector(w, key, queryFn) {
    if (!w || !w.globals) return queryFn()

    if (!w.globals.cachedSelectors) {
      w.globals.cachedSelectors = {}
    }

    if (!w.globals.cachedSelectors[key]) {
      w.globals.cachedSelectors[key] = queryFn()
    }

    return w.globals.cachedSelectors[key]
  }

  /**
   * Get cached dimension or compute and cache it
   * @param {Object} w - ApexCharts globals object
   * @param {string} key - Cache key
   * @param {Function} computeFn - Function to compute dimensions
   * @param {number} maxAge - Maximum cache age in milliseconds (default: 1000ms)
   * @returns {*} Cached or newly computed dimensions
   */
  static getCachedDimension(w, key, computeFn, maxAge = 1000) {
    if (!w || !w.globals) return computeFn()

    if (!w.globals.dimensionCache) {
      w.globals.dimensionCache = {}
    }

    const cache = w.globals.dimensionCache[key]
    const now = Date.now()

    if (cache && cache.lastUpdate && now - cache.lastUpdate < maxAge) {
      return cache.value
    }

    const value = computeFn()
    w.globals.dimensionCache[key] = {
      value,
      lastUpdate: now,
    }

    return value
  }

  /**
   * Cache a DOM element reference
   * @param {Object} w - ApexCharts globals object
   * @param {string} key - Cache key
   * @param {Element} element - DOM element to cache
   */
  static cacheDOMElement(w, key, element) {
    if (!w || !w.globals) return

    if (!w.globals.domCache) {
      w.globals.domCache = new Map()
    }

    w.globals.domCache.set(key, element)
  }

  /**
   * Get cached DOM element
   * @param {Object} w - ApexCharts globals object
   * @param {string} key - Cache key
   * @returns {Element|null} Cached element or null
   */
  static getCachedDOMElement(w, key) {
    if (!w || !w.globals || !w.globals.domCache) return null
    return w.globals.domCache.get(key) || null
  }
}
