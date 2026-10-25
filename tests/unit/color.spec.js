// The one colour blend every tween shares (src/utils/Color.js): the core attr
// runner, the unit chart's flow regroup and the morph pieces. Alpha rides the
// blend, so an rgba() or #rrggbbaa fill no longer crossfades at full opacity
// and drops on the last frame, and a named colour blends instead of snapping.
import { describe, it, expect, vi } from 'vitest'
import { lerpRGBA, resolveRGBA } from '../../src/utils/Color'
import Utils from '../../src/utils/Utils'

describe('resolveRGBA', () => {
  it('reads hex (3, 4, 6, 8 digits) and rgb()/rgba() with their alpha', () => {
    const memo = new Map()
    expect(resolveRGBA('#abc', memo)).toEqual([170, 187, 204, 1])
    expect(resolveRGBA('#336699', memo)).toEqual([51, 102, 153, 1])
    // #rrggbbaa keeps its colour and its alpha (it used to read as blue).
    expect(resolveRGBA('#FF000080', memo)).toEqual([255, 0, 0, 128 / 255])
    expect(resolveRGBA('rgb(10, 20, 30)', memo)).toEqual([10, 20, 30, 1])
    expect(resolveRGBA(' rgba(10,20,30,0.6) ', memo)).toEqual([10, 20, 30, 0.6])
  })

  it('has no colour for a gradient, none or a non-string', () => {
    const memo = new Map()
    expect(resolveRGBA('url(#gradient1)', memo)).toBe(null)
    expect(resolveRGBA('none', memo)).toBe(null)
    expect(resolveRGBA(null, memo)).toBe(null)
    expect(resolveRGBA(undefined, memo)).toBe(null)
  })

  it('asks the browser about a colour it cannot parse once per colour', () => {
    const spy = vi
      .spyOn(Utils, 'resolveColor')
      .mockImplementation((c) => (c === 'tomato' ? 'rgb(255, 99, 71)' : c))
    try {
      const memo = new Map()
      for (let k = 0; k < 50; k++) {
        expect(resolveRGBA('tomato', memo)).toEqual([255, 99, 71, 1])
      }
      expect(resolveRGBA('#fff', memo)).toEqual([255, 255, 255, 1])
      expect(spy).toHaveBeenCalledTimes(1)
    } finally {
      spy.mockRestore()
    }
  })
})

describe('lerpRGBA', () => {
  it('lands on both ends and rounds the channels', () => {
    expect(lerpRGBA([0, 0, 0, 1], [255, 255, 255, 1], 0)).toBe('rgb(0,0,0)')
    expect(lerpRGBA([0, 0, 0, 1], [255, 255, 255, 1], 1)).toBe('rgb(255,255,255)')
    expect(lerpRGBA([0, 0, 0, 1], [255, 255, 255, 1], 0.5)).toBe('rgb(128,128,128)')
  })

  it('blends alpha along with the colour', () => {
    expect(lerpRGBA([0, 0, 0, 0.6], [0, 0, 0, 0.6], 0.5)).toBe('rgba(0,0,0,0.6)')
    expect(lerpRGBA([0, 0, 0, 0], [0, 0, 0, 1], 0.5)).toBe('rgba(0,0,0,0.5)')
    expect(lerpRGBA([0, 0, 0, 0], [0, 0, 0, 1], 1)).toBe('rgb(0,0,0)')
  })
})
