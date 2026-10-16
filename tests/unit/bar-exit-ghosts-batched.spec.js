import { describe, it, expect, afterEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

// A bar whose datum left the data exits as a ghost that shrinks to its
// baseline (LengthTransition.renderBarExitGhosts). Each ghost was inserted
// on its own and then measured twice, the second box the same as the first:
// one forced layout per read, two per ghost (4,400 when a 600-category
// filter cut to 50). The ghosts are now inserted in one write and measured
// once each in a single read pass. Same DOM, same order, same frames.

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

const cats = ['a', 'b', 'c', 'd', 'e', 'f']

async function columns(horizontal) {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    chart: {
      type: 'bar',
      width: 600,
      height: 300,
      animations: {
        enabled: true,
        speed: 1,
        dynamicAnimation: { enabled: true, speed: 320 },
      },
    },
    plotOptions: { bar: { horizontal } },
    dataLabels: { enabled: false },
    xaxis: { categories: cats },
    series: [{ name: 'A', data: [3, 5, 2, 6, 4, 7] }],
  })
  await chart.render()
  return chart
}

const isGhost = (n) => n?.classList?.contains('apexcharts-bar-ghost')

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('bar exit ghosts are built in one write and one read pass', () => {
  for (const horizontal of [false, true]) {
    it(`${horizontal ? 'horizontal' : 'vertical'}: one box per ghost, one insert`, async () => {
      const chart = await columns(horizontal)
      const clock = fakeClock()
      let boxes = 0
      let inserts = 0
      const bbox = SVGElement.prototype.getBBox
      vi.spyOn(SVGElement.prototype, 'getBBox').mockImplementation(
        function () {
          if (isGhost(this)) boxes++
          return bbox.call(this)
        },
      )
      const insert = Node.prototype.insertBefore
      vi.spyOn(Node.prototype, 'insertBefore').mockImplementation(
        function (node, ref) {
          if (
            this.nodeType === 1 &&
            (isGhost(node) || (node.nodeType === 11 && isGhost(node.firstChild)))
          ) {
            inserts++
          }
          return insert.call(this, node, ref)
        },
      )
      await chart.updateSeries([{ data: [3, 5, 2] }])

      // Before: 6 boxes and 3 inserts. After: 3 and 1.
      expect.soft(boxes).toBe(3)
      expect.soft(inserts).toBe(1)

      const ghosts = [
        ...chart.w.dom.baseEl.querySelectorAll('.apexcharts-bar-ghost'),
      ]
      // The last exit is painted first, every ghost under the live bars.
      expect(ghosts.map((g) => g.getAttribute('data:ghostKey'))).toEqual([
        '0::c:f',
        '0::c:e',
        '0::c:d',
      ])
      expect(ghosts[0].parentNode.firstChild).toBe(ghosts[0])
      expect(ghosts.map((g) => g.getAttribute('data:ghostEdge'))).toEqual(
        horizontal ? ['0', '0', '0'] : ['10', '10', '10'],
      )
      expect(ghosts[0].style.transformOrigin).toBe(
        horizontal ? 'left center' : 'center bottom',
      )

      // Half way: the same cubic ease out as before, then they are removed.
      for (let i = 0; i < 10; i++) clock.frame()
      const axis = horizontal ? 'scaleX' : 'scaleY'
      expect(ghosts.map((g) => g.style.transform)).toEqual(
        Array(3).fill(`${axis}(0.125)`),
      )
      expect(ghosts.map((g) => g.style.opacity)).toEqual(Array(3).fill('0.125'))
      for (let i = 0; i < 10; i++) clock.frame()
      expect(ghosts.some((g) => g.isConnected)).toBe(false)
      chart.destroy()
    })
  }
})
