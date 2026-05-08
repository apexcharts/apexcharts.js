import { describe, it, expect } from 'vitest'
import Utils from '../../src/utils/Utils'
import { getThemePalettes } from '../../src/utils/ThemePalettes'

/**
 * WCAG contrast tests for the `highContrast` palette.
 *
 * The `highContrast` palette is selected via
 * `theme.accessibility.colorBlindMode = 'highContrast'` and is the palette we
 * promise meets WCAG 1.4.11 Non-text Contrast (≥ 3.0 : 1) against the default
 * light-theme background.
 *
 * The CVD palettes (`cvdDeuteranopia`, `cvdProtanopia`, `cvdTritanopia`) are
 * tuned for inter-colour distinguishability *under a simulated CVD transform*,
 * which is not the same as raw luminance contrast. Validating those properly
 * requires a Brettel/Machado simulation step, which is out of scope here — so
 * we don't assert on them. They remain selectable via colorBlindMode.
 */

const LIGHT_BG = '#FFFFFF'
const MIN_BG_RATIO = 3.0

describe('Utils.getContrastRatio', () => {
  it('returns 21 for #000 vs #fff', () => {
    expect(Utils.getContrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0)
  })

  it('returns 1 for identical colours', () => {
    expect(Utils.getContrastRatio('#888888', '#888888')).toBeCloseTo(1, 5)
  })

  it('returns 0 for invalid input', () => {
    expect(Utils.getContrastRatio('not-a-colour', '#fff')).toBe(0)
    expect(Utils.getContrastRatio('#fff', null)).toBe(0)
  })

  it('accepts shorthand #abc form', () => {
    const long = Utils.getContrastRatio('#aabbcc', '#000')
    const short = Utils.getContrastRatio('#abc', '#000')
    expect(short).toBeCloseTo(long, 5)
  })
})

describe('highContrast palette meets WCAG 1.4.11 against light bg', () => {
  const palettes = getThemePalettes()
  palettes.highContrast.forEach((colour, idx) => {
    it(`#${idx} ${colour} ≥ ${MIN_BG_RATIO}:1 vs #fff`, () => {
      expect(
        Utils.getContrastRatio(colour, LIGHT_BG),
      ).toBeGreaterThanOrEqual(MIN_BG_RATIO)
    })
  })
})

describe('CVD palettes are present and selectable', () => {
  const palettes = getThemePalettes()
  for (const name of ['cvdDeuteranopia', 'cvdProtanopia', 'cvdTritanopia']) {
    it(`${name} has at least 5 colours`, () => {
      expect(Array.isArray(palettes[name])).toBe(true)
      expect(palettes[name].length).toBeGreaterThanOrEqual(5)
    })
  }
})
