/**
 * Under Node's default conditions `apexcharts` resolves to the server build
 * while every feature sub-entry imports `apexcharts/core`: two classes. Chart
 * types and features reach both through the globalThis registry, but the link
 * and perspectives features hung plain statics on the core class only, so
 * `ApexCharts.crossfilter()` said the link feature was missing and
 * `ApexCharts.perspectives` was null on the class the page imported.
 *
 * Re-evaluating the core module gives a second class over the same registry,
 * which is exactly that split.
 */
import { describe, it, expect, vi } from 'vitest'

describe('link and perspectives statics on a second core class', () => {
  it('both reach the class the page imported', async () => {
    const { default: First } = await import('../../src/apexcharts.js')
    await import('../../src/features/link.js')
    await import('../../src/features/perspectives.js')
    expect(First.crossfilter({ id: 'split-a', records: [{ a: 1 }] })).not.toBeNull()

    vi.resetModules()
    const { default: Second } = await import('../../src/apexcharts.js')
    expect(Second).not.toBe(First)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const cf = Second.crossfilter({ id: 'split-b', records: [{ a: 1 }] })
    expect(cf).not.toBeNull()
    expect(Second.getCrossfilter('split-b')).toBe(cf)
    expect(warn).not.toHaveBeenCalled()
    expect(typeof Second.perspectives?.decode).toBe('function')
    expect(typeof Second.perspectives?.fromURL).toBe('function')
    warn.mockRestore()
  })
})
