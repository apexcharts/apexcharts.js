/**
 * Custom vitest jsdom environment that silences noisy jsdom warnings:
 * - "Could not parse CSS stylesheet" (SVG.js injects styles jsdom can't parse)
 * - "Not implemented: navigation to another Document" (jsdom limitation)
 */
import { builtinEnvironments } from 'vitest/environments'

export default {
  name: 'jsdom-quiet',
  transformMode: 'web',
  async setup(global, options) {
    const jsdomEnv = builtinEnvironments.jsdom
    const env = await jsdomEnv.setup(global, options)

    // After setup, patch the virtualConsole on the window
    const vc = global.window?._virtualConsole
    if (vc) {
      const originalEmit = vc.emit.bind(vc)
      vc.emit = (type, error, ...rest) => {
        if (
          type === 'jsdomError' &&
          error?.message &&
          (error.message.includes('Could not parse CSS stylesheet') ||
            error.message.includes('Not implemented'))
        ) {
          return
        }
        return originalEmit(type, error, ...rest)
      }
    }

    return env
  },
}
