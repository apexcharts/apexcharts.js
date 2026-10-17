// lighten() returned an invalid five-digit hex for a negative tint (every
// second-level cell lost its fill) and shifted the hue past 1. validateStrict
// used an absolute 0.5 tolerance (children summing to half of a parent of 1
// passed) and warned again on every render, so once per resize.
import { describe, it, expect, vi, afterEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/sunburst.js'
import { lighten } from '../../src/charts/common/partition/Tint.js'
import { validateStrict } from '../../src/charts/common/partition/Partition.js'

const HEX = /^#[0-9a-f]{6}$/

afterEach(() => vi.restoreAllMocks())

describe('lighten clamps the tint', () => {
  it('a negative or non-numeric tint keeps the colour', () => {
    expect(lighten('#d79fa0', -0.2)).toBe('#d79fa0')
    expect(lighten('#008ffb', -1)).toBe('#008ffb')
    expect(lighten('#008ffb', undefined)).toBe('#008ffb')
  })

  it('a tint past 1 is white, never a shifted hue', () => {
    expect(lighten('#008ffb', 1.5)).toBe('#ffffff')
    for (const t of [-5, -0.2, 0, 0.3, 1, 2, 10]) {
      expect(lighten('#3a7', t)).toMatch(HEX)
    }
  })
})

describe('strict partition warning', () => {
  const tree = (v, kids) => [
    {
      name: `p${v}-${kids.join('+')}`,
      value: v,
      children: kids.map((k, i) => ({ name: `c${i}`, value: k })),
    },
  ]
  const opts = { type: 'test', remedy: '' }

  it('uses a relative tolerance', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    validateStrict(tree(1, [0.25, 0.25]), opts)
    expect(warn).toHaveBeenCalledTimes(1)
    // Float noise at a large scale is not a mismatch.
    validateStrict(tree(1e9, [0.7e9, 0.3e9 + 0.1]), opts)
    validateStrict(tree(0.3, [0.1, 0.2]), opts)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('warns once per distinct problem, not on every render', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    document.body.innerHTML = '<div id="chart"></div>'
    const c = new ApexCharts(document.querySelector('#chart'), {
      series: [
        {
          data: [
            {
              x: 'strictRoot',
              y: 100,
              children: [
                { x: 'a', y: 10 },
                { x: 'b', y: 20 },
              ],
            },
          ],
        },
      ],
      chart: {
        type: 'sunburst',
        width: 400,
        height: 400,
        animations: { enabled: false },
      },
      plotOptions: { sunburst: { partition: 'strict' } },
    })
    await c.render()
    await c.updateOptions({ chart: { width: 420 } })
    await c.updateOptions({ chart: { width: 440 } })
    const strict = () => warn.mock.calls.filter((a) => /strict/.test(a[0]))
    expect(strict().length).toBe(1)
    // A new mismatch is a new problem, and is reported.
    await c.updateSeries([
      {
        data: [
          {
            x: 'strictRoot',
            y: 100,
            children: [
              { x: 'a', y: 10 },
              { x: 'b', y: 30 },
            ],
          },
        ],
      },
    ])
    expect(strict().length).toBe(2)
    c.destroy()
  })
})
