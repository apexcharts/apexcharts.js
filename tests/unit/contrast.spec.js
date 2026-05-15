import { describe, it, expect } from 'vitest'
import Utils from '../../src/utils/Utils'
import { getThemePalettes } from '../../src/utils/ThemePalettes'

/**
 * WCAG 1.4.11 Non-text Contrast tests.
 *
 * All built-in palettes (palette1–10 and highContrast) must meet ≥ 3:1
 * against both default backgrounds:
 *   - Light theme: #FFFFFF
 *   - Dark theme:  #293450
 *
 * The CVD palettes (cvdDeuteranopia/Protanopia/Tritanopia) are tuned for
 * inter-colour distinguishability under a simulated CVD transform, which is
 * not the same as raw luminance contrast — we only assert their presence.
 */

const LIGHT_BG = '#FFFFFF'
const DARK_BG = '#293450'
const MIN_RATIO = 3.0

// palette1–10 are theme-neutral and must pass both backgrounds.
const THEME_PALETTES = [
  'palette1',
  'palette2',
  'palette3',
  'palette4',
  'palette5',
  'palette6',
  'palette7',
  'palette8',
  'palette9',
  'palette10',
]

// highContrast is explicitly for light themes — only validated against light bg.
const HIGH_CONTRAST_PALETTES = ['highContrast']

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

describe('palette1–10 meet WCAG 1.4.11 (≥ 3:1) against both theme backgrounds', () => {
  const palettes = getThemePalettes()
  for (const name of THEME_PALETTES) {
    palettes[name].forEach((colour, idx) => {
      it(`${name}[${idx}] ${colour} vs light bg (#fff)`, () => {
        expect(Utils.getContrastRatio(colour, LIGHT_BG)).toBeGreaterThanOrEqual(
          MIN_RATIO,
        )
      })
      it(`${name}[${idx}] ${colour} vs dark bg (#293450)`, () => {
        expect(Utils.getContrastRatio(colour, DARK_BG)).toBeGreaterThanOrEqual(
          MIN_RATIO,
        )
      })
    })
  }
})

describe('highContrast palette meets WCAG 1.4.11 (≥ 3:1) against light bg', () => {
  const palettes = getThemePalettes()
  for (const name of HIGH_CONTRAST_PALETTES) {
    palettes[name].forEach((colour, idx) => {
      it(`${name}[${idx}] ${colour} vs light bg (#fff)`, () => {
        expect(Utils.getContrastRatio(colour, LIGHT_BG)).toBeGreaterThanOrEqual(
          MIN_RATIO,
        )
      })
    })
  }
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
