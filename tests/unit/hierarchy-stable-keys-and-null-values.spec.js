// Users saw every later cell of an icicle, sunburst or treemap blink out and
// regrow when one sibling was inserted or removed (node keys embedded the
// sibling index), a treemap whose series name held a '/' never paired with a
// sunburst in a type morph, and a branch authored with `value: null` drew as a
// zero-width cell with its children gone.
import { describe, it, expect, vi, afterEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/icicle.js'
import '../../src/entries/sunburst.js'
import {
  buildHierarchy,
  buildSeriesRoots,
  fillValues,
  morphKey,
  toNode,
} from '../../src/charts/common/Hierarchy.js'

const keys = (roots) => {
  const out = {}
  const walk = (n) => {
    out[n.name] = n._key
    ;(n.children || []).forEach(walk)
  }
  roots.forEach(walk)
  return out
}
const tree = (data) => buildHierarchy({ config: { series: [{ data }] } })

describe('hierarchy node keys', () => {
  const B = { x: 'B', children: [{ x: 'b1', y: 1 }] }

  it('an inserted or removed sibling re-keys nothing else', () => {
    const before = keys(tree([{ x: 'A', y: 1 }, B]))
    const inserted = keys(tree([{ x: 'Z', y: 1 }, { x: 'A', y: 1 }, B]))
    const removed = keys(tree([B]))
    for (const k of ['A', 'B', 'b1']) expect(inserted[k]).toBe(before[k])
    expect(removed.B).toBe(before.B)
    expect(removed.b1).toBe(before.b1)
  })

  it('same-named siblings stay distinct', () => {
    const [a, b] = tree([{ x: 'dup', y: 1 }, { x: 'dup', y: 2 }])
    expect(a._key).not.toBe(b._key)
  })

  it("a '/' in a series name still pairs treemap and sunburst keys", () => {
    const w = {
      config: {
        series: [
          { name: '2024/25', data: [{ x: 'Tech', children: [{ x: 'Software', y: 3 }] }] },
        ],
      },
    }
    const tm = buildSeriesRoots(w)[0].children[0]
    const sb = buildHierarchy(w)[0]
    expect(morphKey(tm._key)).toBe(morphKey(sb._key))
    expect(morphKey(tm.children[0]._key)).toBe(morphKey(sb.children[0]._key))
  })
})

describe('icicle update with an inserted sibling', () => {
  afterEach(() => vi.useRealTimers())

  it('later cells tween from where they were instead of regrowing', async () => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
    })
    const data = (pre) => [
      { data: [...pre, { x: 'A', y: 10 }, { x: 'B', children: [{ x: 'b1', y: 5 }] }] },
    ]
    document.body.innerHTML = '<div id="chart"></div>'
    const c = new ApexCharts(document.querySelector('#chart'), {
      chart: {
        type: 'icicle',
        width: 600,
        height: 400,
        animations: { enabled: true, speed: 100, dynamicAnimation: { enabled: true, speed: 1000 } },
      },
      series: data([]),
    })
    const p = c.render()
    await vi.advanceTimersByTimeAsync(2000)
    await p
    const width = (name) =>
      parseFloat(
        [...document.querySelectorAll('.apexcharts-icicle-cell')]
          .find((el) => el.getAttribute('data:name') === name)
          .getAttribute('width'),
      )
    const was = width('b1')
    const up = c.updateSeries(data([{ x: 'Z', y: 1 }]))
    await vi.advanceTimersByTimeAsync(20)
    await up
    // Paired by key: still close to its old width, not growing out of zero.
    expect(width('b1')).toBeGreaterThan(was * 0.8)
    c.destroy()
  })
})

describe('missing branch values', () => {
  it("null and '' roll up from the children instead of reading as 0", () => {
    for (const d of [{ value: null }, { y: null }, { y: '' }]) {
      const n = toNode({ config: {} }, { x: 'A', ...d, children: [{ x: 'a', y: 3 }, { x: 'b', y: 4 }] }, 0, null, '')
      fillValues(n)
      expect(n.value).toBe(7)
    }
  })

  it('an icicle branch with value:null keeps its span', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const c = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'icicle', width: 600, height: 400, animations: { enabled: false } },
      series: [
        {
          data: [
            { x: 'A', value: null, children: [{ x: 'a1', y: 30 }, { x: 'a2', y: 10 }] },
            { x: 'B', y: 40 },
          ],
        },
      ],
    })
    await c.render()
    const a = [...document.querySelectorAll('.apexcharts-icicle-cell')].find(
      (el) => el.getAttribute('data:name') === 'A',
    )
    const total = c.w.layout.gridWidth
    expect(parseFloat(a.getAttribute('width'))).toBeGreaterThan(total * 0.4)
    c.destroy()
  })

  // w.globals.series feeds the legend and totals, so it must roll up too.
  for (const type of ['icicle', 'sunburst']) {
    for (const v of [null, '']) {
      it(`${type} series totals roll up a branch with value:${JSON.stringify(v)}`, async () => {
        document.body.innerHTML = '<div id="chart"></div>'
        const kids = [{ x: 'a1', value: v, children: [{ x: 'a11', y: 3 }] }, { x: 'a2', y: 7 }]
        const c = new ApexCharts(document.querySelector('#chart'), {
          chart: { type, width: 600, height: 400, animations: { enabled: false } },
          series: [{ data: [{ x: 'A', value: v, children: kids }, { x: 'B', y: 5 }] }],
        })
        await c.render()
        expect(c.w.globals.series).toEqual([10, 5])
        c.destroy()
      })
    }
  }
})
