/**
 * Every shipped locale carries exactly the keys en.json has (#5376).
 *
 * A key added to en only falls back to English at runtime, so a translated
 * chart shows English text in the middle of its own language. This fails the
 * moment a new en key lands without its 48 translations, or a locale keeps a
 * key en has dropped.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const localesDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'src',
  'locales',
)
const load = (file) =>
  JSON.parse(readFileSync(resolve(localesDir, file), 'utf-8'))

// Dotted paths of every leaf; arrays are leaves (their length is checked below).
function keyPaths(obj, prefix = '') {
  return Object.keys(obj).flatMap((k) => {
    const v = obj[k]
    const p = prefix ? `${prefix}.${k}` : k
    return v && typeof v === 'object' && !Array.isArray(v)
      ? keyPaths(v, p)
      : [p]
  })
}

const get = (obj, path) => path.split('.').reduce((o, k) => o[k], obj)

const en = load('en.json')
const enKeys = keyPaths(en).sort()
const files = readdirSync(localesDir).filter(
  (f) => f.endsWith('.json') && f !== 'en.json',
)

describe('locale key parity with en.json', () => {
  it('finds the shipped locales', () => {
    expect(files.length).toBeGreaterThanOrEqual(48)
  })

  it.each(files)('%s has exactly the en key set', (file) => {
    const locale = load(file)
    expect(keyPaths(locale).sort()).toEqual(enKeys)
    expect(locale.name).toBe(file.replace(/\.json$/, ''))
  })

  it.each(files)('%s keeps the en placeholders and array lengths', (file) => {
    const locale = load(file)
    for (const path of enKeys) {
      const enVal = get(en, path)
      const val = get(locale, path)
      if (Array.isArray(enVal)) {
        expect(val, path).toHaveLength(enVal.length)
      } else if (typeof enVal === 'string') {
        for (const token of enVal.match(/\{\w+\}/g) || []) {
          expect(val, path).toContain(token)
        }
      }
    }
  })
})
