/**
 * Environment detection utility for SSR support
 * Detects whether code is running in browser or Node.js environment
 */
export class Environment {
  /**
   * Check if running in server-side rendering environment (Node.js)
   * @returns {boolean} True if in SSR/Node.js, false if in browser
   */
  static isSSR() {
    return typeof window === 'undefined' || typeof document === 'undefined'
  }

  /**
   * Check if running in browser environment
   * @returns {boolean} True if in browser, false if in SSR/Node.js
   */
  static isBrowser() {
    return !this.isSSR()
  }

  /**
   * Check if a specific browser API is available
   * @param {string} api - Name of the API to check (e.g., 'ResizeObserver')
   * @returns {boolean} True if API is available
   */
  static hasAPI(api) {
    if (this.isSSR()) return false
    return typeof window[api] !== 'undefined'
  }
}
