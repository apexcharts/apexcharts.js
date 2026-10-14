import { afterEach, expect, it, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import '../../src/entries/unit.js'
import ApexCharts from '../../src/entries/standard.js'

// What users saw on unit marks:
// - an unresolvable pictogram with fallback:'square' drew every unit as a
//   circle piled in the top-left corner;
// - two inline pictogram paths of the same length drew as the same glyph;
// - tinted image icons in two colours that differ only in punctuation
//   (rgb(1,23,4) and rgb(12,3,4)) rendered in one colour;
// - exit ghosts were tagged as live units, so hover and a type-change morph
//   picked them up as series-1 dots.

let chart

async function mount(o, animate = false) {
  document.body.innerHTML = '<div id="chart"></div>'
  o.chart = { type: 'unit', width: 600, height: 400, animations: { enabled: animate } }
  chart = new ApexCharts(document.querySelector('#chart'), o)
  await chart.render()
  return chart
}

const q = (sel) => [...chart.w.dom.baseEl.querySelectorAll(sel)]
const groups = () => q('.apexcharts-unit .apexcharts-series')

afterEach(() => {
  chart?.destroy()
  chart = null
  vi.restoreAllMocks()
})

it("draws an unresolved pictogram's square fallback as rects on their own slots", async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  await mount({
    series: [6, 6],
    labels: ['A', 'B'],
    plotOptions: {
      unit: { shape: 'pictogram', pictogram: { mark: 'no-such-mark', fallback: 'square' } },
    },
  })
  const ds = q('.apexcharts-unit-area')
  expect(ds.length).toBe(12)
  expect(ds.every((d) => d.tagName === 'rect')).toBe(true)
  expect(new Set(ds.map((d) => d.getAttribute('x') + ',' + d.getAttribute('y'))).size).toBe(12)
})

it('draws two inline marks of equal path length as two glyphs', async () => {
  const up = 'M50 10 L90 90 L10 90 Z'
  const down = 'M50 90 L90 10 L10 10 Z'
  await mount({
    series: [3, 3],
    labels: ['A', 'B'],
    plotOptions: { unit: { shape: 'pictogram', pictogram: { mark: [up, down] } } },
  })
  const [a, b] = groups().map((g) => g.querySelector('.apexcharts-unit-area').getAttribute('d'))
  expect(a).toBe(up)
  expect(b).toBe(down)
})

it('gives every distinct tint colour its own filter, across updates too', async () => {
  const src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E'
  const flood = (g) => {
    const id = g.querySelector('image').getAttribute('filter').slice(5, -1)
    return chart.w.dom.Paper.node
      .querySelector(`[id="${id}"] feFlood`)
      .getAttribute('flood-color')
  }
  await mount({
    series: [3, 3],
    labels: ['A', 'B'],
    colors: ['rgb(1,23,4)', 'rgb(12,3,4)'],
    plotOptions: { unit: { shape: 'image', image: { src, width: 16, height: 16, tint: true } } },
  })
  expect(groups().map(flood)).toEqual(['rgb(1,23,4)', 'rgb(12,3,4)'])
  await chart.updateOptions({ colors: ['#ff0000', '#00ff00'] })
  expect(groups().map(flood)).toEqual(['#ff0000', '#00ff00'])
})

it('leaves exit ghosts untagged as units', async () => {
  await mount(
    { series: [10, 10], labels: ['A', 'B'], plotOptions: { unit: { clusterLabels: { show: false } } } },
    true,
  )
  await chart.updateSeries([10, 2])
  const ghosts = q('.apexcharts-unit-exit')
  expect(ghosts.length).toBe(8)
  ghosts.forEach((g) => {
    expect(g.classList.contains('apexcharts-unit-area')).toBe(false)
    expect(g.hasAttribute('i')).toBe(false)
  })
  expect(q('.apexcharts-unit-area').length).toBe(12)
})
