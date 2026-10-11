import { describe, it, expect } from 'vitest'
import { SSRRenderer } from '../../../src/ssr/SSRRenderer.js'
import { Hydration } from '../../../src/ssr/Hydration.js'

// The hydration config is base64 of UTF-8 JSON. The browser decoded it with a
// bare atob, which yields one Latin-1 char per byte, so "Café" hydrated as
// "CafÃ©"; and a browser-side encode with a bare btoa threw on anything above
// U+00FF.
describe('SSR hydration config encoding', () => {
  const config = {
    title: { text: 'Café € 東京 🚀' },
    labels: ['Zürich', 'São Paulo'],
    series: [{ name: 'Ünïcödé', data: [1, 2] }],
  }

  it('round-trips non-ASCII text from renderer to hydration', () => {
    const encoded = SSRRenderer._encodeConfig(config)
    expect(Hydration._decodeConfig(encoded)).toEqual(config)
    expect(SSRRenderer._decodeConfig(encoded)).toEqual(config)
  })

  it('stays byte-compatible with UTF-8 base64 from older servers', () => {
    const legacy = Buffer.from(JSON.stringify(config)).toString('base64')
    expect(SSRRenderer._encodeConfig(config)).toBe(legacy)
    expect(Hydration._decodeConfig(legacy)).toEqual(config)
  })

  it('encodes and decodes without Buffer, as a browser does', () => {
    const savedBuffer = global.Buffer
    try {
      global.Buffer = undefined
      const encoded = SSRRenderer._encodeConfig(config)
      expect(Hydration._decodeConfig(encoded)).toEqual(config)
    } finally {
      global.Buffer = savedBuffer
    }
  })
})
