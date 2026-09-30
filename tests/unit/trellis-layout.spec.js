import { describe, it, expect } from 'vitest'
import {
  compute,
  resolveColumns,
  lastRowFor,
} from '../../src/modules/trellis/TrellisLayout'

describe('TrellisLayout.resolveColumns', () => {
  it('fits minPanelWidth columns into the container (the one-number responsive story)', () => {
    const cfg = { minPanelWidth: 220, gap: 12 }
    expect(resolveColumns(1200, 20, cfg)).toBe(5)
    expect(resolveColumns(700, 20, cfg)).toBe(3)
    expect(resolveColumns(460, 20, cfg)).toBe(2)
    expect(resolveColumns(240, 20, cfg)).toBe(1)
    expect(resolveColumns(10, 20, cfg)).toBe(1) // never zero
  })

  it('clamps an explicit column count to the panel count', () => {
    expect(resolveColumns(1200, 2, { columns: 6 })).toBe(2)
    expect(resolveColumns(1200, 20, { columns: 4 })).toBe(4)
  })

  it('never exceeds the panel count in auto mode', () => {
    expect(resolveColumns(5000, 3, { minPanelWidth: 200 })).toBe(3)
  })
})

describe('TrellisLayout.lastRowFor (ragged last row)', () => {
  // 7 panels in 3 columns:
  //   r0: 0 1 2
  //   r1: 3 4 5
  //   r2: 6
  it('bottom panel of column 0 is row 2; columns 1-2 bottom out at row 1', () => {
    expect(lastRowFor(0, 7, 3, 3)).toBe(2)
    expect(lastRowFor(1, 7, 3, 3)).toBe(1)
    expect(lastRowFor(2, 7, 3, 3)).toBe(1)
  })

  it('full last row: every column bottoms out at rows - 1', () => {
    expect(lastRowFor(0, 6, 3, 2)).toBe(1)
    expect(lastRowFor(2, 6, 3, 2)).toBe(1)
  })
})

describe('TrellisLayout.compute', () => {
  const base = { minPanelWidth: 220, gap: 12 }

  it('edge policy: y labels on column 0, x labels on each column bottom (ragged aware)', () => {
    const ly = compute({
      panelCount: 7,
      containerWidth: 700, // 3 columns
      cfg: base,
    })
    expect(ly.cols).toBe(3)
    const flags = ly.cells.map((c) => [c.showYLabels, c.showXLabels])
    // y labels: cells 0, 3, 6 (column 0)
    expect(ly.cells.filter((c) => c.showYLabels).map((c) => c.i)).toEqual([
      0, 3, 6,
    ])
    // x labels: bottom of col0 is panel 6 (row 2); cols 1-2 bottom at row 1
    // (panels 4, 5). Panel 3 (row 1, col 0) has a panel below it: no labels.
    expect(ly.cells.filter((c) => c.showXLabels).map((c) => c.i)).toEqual([
      4, 5, 6,
    ])
    expect(flags[3]).toEqual([true, false])
  })

  it("'all' and 'none' override the edge policy", () => {
    const all = compute({
      panelCount: 4,
      containerWidth: 700,
      cfg: { ...base, axes: { labels: 'all' } },
    })
    expect(all.cells.every((c) => c.showXLabels && c.showYLabels)).toBe(true)
    const none = compute({
      panelCount: 4,
      containerWidth: 700,
      cfg: { ...base, axes: { labels: 'none' } },
    })
    expect(none.cells.every((c) => !c.showXLabels && !c.showYLabels)).toBe(true)
  })

  it('a single column degenerates to labels everywhere', () => {
    const ly = compute({ panelCount: 3, containerWidth: 240, cfg: base })
    expect(ly.cols).toBe(1)
    expect(ly.cells.every((c) => c.showXLabels && c.showYLabels)).toBe(true)
  })

  it('an independent scale forces its own labels on every panel', () => {
    const ly = compute({
      panelCount: 6,
      containerWidth: 700,
      cfg: { ...base, scales: { y: 'independent' } },
    })
    expect(ly.cells.every((c) => c.showYLabels)).toBe(true)
    // x stays on the edge policy
    expect(ly.cells.filter((c) => c.showXLabels).length).toBe(3)
  })

  it('panel height: explicit > host height split > aspect ratio, floored at 80', () => {
    expect(
      compute({
        panelCount: 4,
        containerWidth: 700,
        cfg: { ...base, panelHeight: 150 },
      }).panelH,
    ).toBe(150)
    const hostDriven = compute({
      panelCount: 4,
      containerWidth: 700,
      cfg: base,
      hostHeight: 600,
    })
    // 2 rows: (600 - 2*22 - 12) / 2 = 272
    expect(hostDriven.panelH).toBe(272)
    const aspect = compute({
      panelCount: 4,
      containerWidth: 700,
      cfg: { ...base, aspectRatio: 2 },
    })
    // 3 cols at width 700: panelW = (700 - 2*12)/3 = 225.33 -> h 112.67 -> 113
    expect(aspect.panelH).toBe(113)
    expect(
      compute({
        panelCount: 4,
        containerWidth: 700,
        cfg: { ...base, panelHeight: 10 },
      }).panelH,
    ).toBe(80)
  })

  it('headers reserve height only when shown', () => {
    expect(
      compute({ panelCount: 2, containerWidth: 700, cfg: base }).headerH,
    ).toBe(22)
    expect(
      compute({
        panelCount: 2,
        containerWidth: 700,
        cfg: { ...base, header: { show: false } },
      }).headerH,
    ).toBe(0)
  })
})

describe('TrellisLayout.compute: the shared chrome and the panel floor', () => {
  const base = { minPanelWidth: 220, gap: 12 }

  it('subtracts the chrome height, so the grid fits the host instead of overflowing it', () => {
    // 4 panels, 2 cols, 2 rows in a 400px host with 60px of shared chrome
    // (title + legend). Available for panels: 400 - 60 - 2*22 - 12 = 284.
    const ly = compute({
      panelCount: 4,
      containerWidth: 700,
      cfg: base,
      hostHeight: 400,
      chromeHeight: 60,
    })
    expect(ly.rows).toBe(2)
    expect(ly.panelH).toBe(142)
    expect(ly.gridH).toBe(2 * (142 + 22) + 12)
    expect(ly.gridH + 60).toBeLessThanOrEqual(400)
    expect(ly.overflowH).toBe(0)
  })

  it('omitting the chrome height is what used to overflow by exactly that much', () => {
    const withChrome = compute({
      panelCount: 4,
      containerWidth: 700,
      cfg: base,
      hostHeight: 400,
      chromeHeight: 60,
    })
    const without = compute({
      panelCount: 4,
      containerWidth: 700,
      cfg: base,
      hostHeight: 400,
    })
    expect(without.gridH - withChrome.gridH).toBe(60)
  })

  it('reports the overflow the panel floor forces rather than absorbing it', () => {
    // 6 panels, 2 cols, 3 rows in 300px: the floor wins and the grid is taller
    // than the host. Silently overflowing is what gets reported as a bug.
    const ly = compute({
      panelCount: 6,
      containerWidth: 500,
      cfg: { ...base, columns: 2 },
      hostHeight: 300,
      chromeHeight: 24,
    })
    expect(ly.panelH).toBe(80)
    expect(ly.overflowH).toBe(ly.gridH + 24 - 300)
    expect(ly.overflowH).toBeGreaterThan(0)
  })

  it('minPanelHeight lets a short host fit', () => {
    const ly = compute({
      panelCount: 6,
      containerWidth: 500,
      cfg: { ...base, columns: 2, minPanelHeight: 40 },
      hostHeight: 300,
      chromeHeight: 24,
    })
    expect(ly.panelH).toBeLessThan(80)
    expect(ly.overflowH).toBe(0)
  })

  it('an aspect-ratio grid has no host to overflow', () => {
    const ly = compute({ panelCount: 4, containerWidth: 700, cfg: base })
    expect(ly.overflowH).toBe(0)
    expect(ly.gridH).toBeGreaterThan(0)
  })
})
