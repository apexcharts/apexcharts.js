import { describe, it, expect, afterEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

// On an update the slow line loop (any curved line, so a default area chart)
// hides the series' marker wrap until the morph lands. It did so once per
// point, the same class on the same group: 20k points meant 20k classList
// calls per update. It is hidden once per series now, with the same result.

const pts = (n, seed = 0) =>
  Array.from({ length: n }, (_, i) => [i, ((i + seed) * 7) % 23])

async function chart(markers, animate = false) {
  document.body.innerHTML = '<div id="chart"></div>'
  const c = new ApexCharts(document.querySelector('#chart'), {
    chart: {
      type: 'area',
      width: 600,
      height: 300,
      animations: { enabled: animate, speed: 1 },
    },
    dataLabels: { enabled: false },
    markers: { size: markers },
    xaxis: { type: 'numeric' },
    series: [
      { name: 'A', data: pts(30) },
      { name: 'B', data: pts(30, 4) },
    ],
  })
  await c.render()
  return c
}

/** Hides of a marker wrap while `fn` runs, and the wraps' classes after. */
async function hides(c, fn) {
  let n = 0
  const orig = DOMTokenList.prototype.add
  vi.spyOn(DOMTokenList.prototype, 'add').mockImplementation(function (
    ...tokens
  ) {
    if (
      this.contains('apexcharts-series-markers-wrap') &&
      tokens.includes('apexcharts-element-hidden')
    ) {
      n++
    }
    return orig.apply(this, tokens)
  })
  await fn()
  vi.restoreAllMocks()
  const classes = [
    ...c.w.dom.baseEl.querySelectorAll('.apexcharts-series-markers-wrap'),
  ].map((el) => el.getAttribute('class'))
  return { n, classes }
}

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('the slow line loop hides the marker wrap once per series', () => {
  for (const size of [0, 4]) {
    it(`markers.size ${size}: one hide per series, same classes`, async () => {
      const c = await chart(size)
      const { n, classes } = await hides(c, () =>
        c.updateSeries([{ data: pts(30, 1) }, { data: pts(30, 5) }]),
      )
      // Before: 58 (29 segments x 2 series). After: 2.
      expect.soft(n).toBe(2)
      // Nothing animates, so the wraps are shown again at once.
      expect(classes).toEqual([
        'apexcharts-series-markers-wrap apexcharts-hidden-element-shown',
        'apexcharts-series-markers-wrap apexcharts-hidden-element-shown',
      ])
      c.destroy()
    })
  }

  it('an animated update keeps the wraps hidden until the morph lands', async () => {
    const c = await chart(0, true)
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1)
    const { n, classes } = await hides(c, () =>
      c.updateSeries([{ data: pts(30, 1) }, { data: pts(30, 5) }]),
    )
    expect.soft(n).toBe(2)
    expect(classes).toEqual([
      'apexcharts-series-markers-wrap apexcharts-element-hidden',
      'apexcharts-series-markers-wrap apexcharts-element-hidden',
    ])
    c.destroy()
  })
})
