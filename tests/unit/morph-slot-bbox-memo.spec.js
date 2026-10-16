/**
 * A morph into a unit chart asks for the start slot of every dot, and each
 * slot comes from its cluster's outgoing mark's bounding box. That box is
 * measured once per mark, not once per dot, and the slots are unchanged.
 */
import { describe, it, expect, vi } from 'vitest'
import MorphTypeChange from '../../src/modules/MorphTypeChange.js'

const BAR = 'M 20 300 L 20 100 L 60 100 L 60 300 Z'
const WEDGE = 'M 100 200 A 100 100 0 0 1 300 200 L 200 200 Z'

function morphWith(mapping) {
  const w = {
    config: { chart: { animations: {} } },
    globals: { previousPaths: [] },
    layout: { translateX: 30, translateY: 10 },
  }
  const morph = new MorphTypeChange(w, {})
  morph._snapshot = {
    fromType: 'bar',
    toType: 'unit',
    mapping: new Map(Object.entries(mapping).map(([k, d]) => [k, { d }])),
    oldLayout: { translateX: 50, translateY: 20, scale: 1.5 },
  }
  return morph
}

const slots = (morph, n) =>
  [0, 1].flatMap((i) =>
    Array.from({ length: n }, (_, j) => morph.getInitialSlotFor(i, j, n)),
  )

describe('morph slot boxes are measured once per mark', () => {
  it('measures each cluster mark once however many dots it releases', () => {
    const marks = { '0:0': BAR, '1:0': WEDGE }
    const expected = slots(morphWith(marks), 40)
    const morph = morphWith(marks)
    const measure = vi.spyOn(morph, '_pathBBox')
    expect(slots(morph, 40)).toEqual(expected)
    expect(measure).toHaveBeenCalledTimes(2)
  })

  it('a new snapshot mapping is measured afresh', () => {
    const morph = morphWith({ '0:0': BAR, '1:0': BAR })
    slots(morph, 3)
    // retire() hands the next render a new mapping on the same snapshot.
    morph._snapshot.mapping = new Map([
      ['0:0', { d: WEDGE }],
      ['1:0', { d: WEDGE }],
    ])
    expect(slots(morph, 3)).toEqual(
      slots(morphWith({ '0:0': WEDGE, '1:0': WEDGE }), 3),
    )
  })

  it('a layout that moves between calls still moves the slots', () => {
    const morph = morphWith({ '0:0': BAR, '1:0': BAR })
    const before = morph.getInitialSlotFor(0, 0, 4)
    morph.w.layout.translateX += 7
    const after = morph.getInitialSlotFor(0, 0, 4)
    expect(after.x).toBeCloseTo(before.x - 7, 9)
    expect(after.y).toBe(before.y)
  })
})
