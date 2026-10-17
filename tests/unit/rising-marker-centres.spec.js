import { describe, it, expect, afterEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import Graphics from '../../src/modules/Graphics.js'

// A scatter series shown again from the legend grows each point out of its
// centre (LengthTransition.growRisingMarkers). The centre came from getBBox,
// one forced layout per marker since every read followed the previous
// marker's transform write (900 on a 3x300 legend show). Every marker shape
// is drawn about its anchor, which the node carries as cx/cy, and that
// anchor is its box centre for every shape but the star. So the centre is
// read off the node, and only a star still measures, in one read pass.

/** The geometric box of a marker path (stroke never counts in getBBox). */
function pathBox(d) {
  const n = d.match(/-?\d+(\.\d+)?(e-?\d+)?/g).map(Number)
  if (/a/.test(d)) {
    // circle: M x, y m -r, 0 a r,r 0 1,0 2r,0 a r,r 0 1,0 -2r,0
    const [x, y, mr] = n
    return { x: x + mr, y: y + mr, width: -2 * mr, height: -2 * mr }
  }
  const xs = n.filter((_, i) => i % 2 === 0)
  const ys = n.filter((_, i) => i % 2 === 1)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y }
}

const SHAPES = [
  'circle',
  'square',
  'rect',
  'triangle',
  'diamond',
  'cross',
  'plus',
  'line',
  'sparkle',
  'star',
]

describe('a marker shape is drawn about its box centre', () => {
  const g = new Graphics({})
  for (const shape of SHAPES) {
    it(shape, () => {
      for (const [x, y, size] of [
        [123.456, 78.9, 6],
        [0.1, 250.75, 13.3],
      ]) {
        const b = pathBox(g.getMarkerPath(x, y, shape, size))
        const off = Math.hypot(b.x + b.width / 2 - x, b.y + b.height / 2 - y)
        if (shape === 'star') expect(off).toBeGreaterThan(0.5)
        else expect(off).toBeLessThan(1e-9)
      }
    })
  }
})

function fakeClock() {
  let queue = []
  let t = 1000
  vi.spyOn(performance, 'now').mockImplementation(() => t)
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    queue.push(cb)
    return queue.length
  })
  return {
    frame(dt = 16) {
      t += dt
      const q = queue
      queue = []
      q.forEach((cb) => cb(t))
    },
  }
}

const pts = (n, seed = 0) =>
  Array.from({ length: n }, (_, i) => [i, ((i + seed) * 7) % 23])

async function scatter(shape) {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    chart: {
      type: 'scatter',
      width: 600,
      height: 300,
      animations: {
        enabled: true,
        speed: 1,
        dynamicAnimation: { enabled: true, speed: 320 },
      },
    },
    markers: { shape, strokeWidth: 3 },
    dataLabels: { enabled: false },
    xaxis: { type: 'numeric' },
    series: [
      { name: 'A', data: pts(12) },
      { name: 'B', data: pts(12, 4) },
    ],
  })
  await chart.render()
  return chart
}

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('a legend show grows each point about the same centre', () => {
  for (const shape of ['circle', 'square', 'triangle', 'star']) {
    it(`${shape}: centres without measuring, same frames`, async () => {
      const chart = await scatter(shape)
      await chart.hideSeries('A')
      const clock = fakeClock()
      for (let i = 0; i < 30; i++) clock.frame()
      // Measure markers the way a browser would: their true geometric box.
      let measured = 0
      const bbox = SVGElement.prototype.getBBox
      vi.spyOn(SVGElement.prototype, 'getBBox').mockImplementation(
        function () {
          if (!this.classList.contains('apexcharts-marker')) {
            return bbox.call(this)
          }
          measured++
          return pathBox(this.getAttribute('d'))
        },
      )
      await chart.showSeries('A')
      // Before: 12 per shape. After: 0, and 12 for the star only.
      expect.soft(measured).toBe(shape === 'star' ? 12 : 0)

      const grown = [
        ...chart.w.dom.baseEl.querySelectorAll(
          ".apexcharts-marker[j][index='0']",
        ),
      ]
      expect(grown).toHaveLength(12)
      // Half way the scale is 0.5 about the box centre of each marker.
      for (let i = 0; i < 10; i++) clock.frame()
      for (const node of grown) {
        const b = pathBox(node.getAttribute('d'))
        const cx = b.x + b.width / 2
        const cy = b.y + b.height / 2
        const m = /translate\(([^,]+), ([^)]+)\) scale\(([^)]+)\)/.exec(
          node.getAttribute('transform'),
        )
        expect(+m[3]).toBeCloseTo(0.5, 9)
        expect(+m[1]).toBeCloseTo(cx * 0.5, 9)
        expect(+m[2]).toBeCloseTo(cy * 0.5, 9)
      }
      for (let i = 0; i < 12; i++) clock.frame()
      expect(grown.some((n) => n.hasAttribute('transform'))).toBe(false)
      chart.destroy()
    })
  }
})
