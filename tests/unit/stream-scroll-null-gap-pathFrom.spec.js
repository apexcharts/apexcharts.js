// @ts-nocheck
/**
 * Regression for #5316: when a streaming line/area has a null gap, segments
 * are merged into one path for drawing (`linePaths.join(' ')`), but stream
 * scroll used to project pathFrom from `paths.linePaths[0]` only. The segment
 * after the gap then had no previous-frame geometry and replayed its entry
 * animation on every update.
 *
 * `projectPathToPrevFrame` already walks every M command, so projecting the
 * joined path keeps both segments sliding together.
 */
import { describe, it, expect } from 'vitest'
import { projectPathToPrevFrame } from '../../src/modules/animations/StreamScroll.js'

/** Identity-ish scroll: shift left by 10 on x, leave y alone. */
const scroll = { ax: 1, bx: -10, ay: 1, by: 0 }

describe('stream scroll pathFrom across a null gap (#5316)', () => {
  const segBefore = 'M 10 20 C 15 20 20 30 30 40'
  const segAfter = 'M 50 40 C 55 40 60 30 70 20'
  const joined = `${segBefore} ${segAfter}`

  it('projects every M command in a joined multi-segment path', () => {
    const fromJoined = projectPathToPrevFrame(joined, scroll)
    // Both segment starts shift left by 10.
    expect(fromJoined).toMatch(/M 0 20/)
    expect(fromJoined).toMatch(/M 40 40/)
    // Two movetos: before-gap and after-gap segments both present in pathFrom.
    expect(fromJoined.match(/M /g)?.length).toBe(2)
  })

  it('projecting only the first segment omits the after-gap geometry (the bug)', () => {
    const fromFirstOnly = projectPathToPrevFrame(segBefore, scroll)
    expect(fromFirstOnly.match(/M /g)?.length).toBe(1)
    expect(fromFirstOnly).not.toMatch(/M 40 40/)
  })

  it('joined pathFrom length matches projecting each segment then joining', () => {
    const fromJoined = projectPathToPrevFrame(joined, scroll)
    const fromParts = [segBefore, segAfter]
      .map((d) => projectPathToPrevFrame(d, scroll))
      .join(' ')
    expect(fromJoined).toBe(fromParts)
  })
})
