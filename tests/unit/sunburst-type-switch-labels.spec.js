/**
 * Defaults.sunburst() sets the top-level dataLabels.style.colors and
 * dataLabels.dropShadow. The sunburst renderer never reads them, but they
 * are not dead: type defaults are laid over the config only by Config.init,
 * and updateOptions({ chart: { type } }) hands over only the TYPE_OWNED_PATHS
 * leaves, so these two are what the NEXT type draws its labels with. Without
 * them a sunburst switched to a treemap drew theme-blue labels on blue tiles,
 * and one switched to a pie lost the pie's label shadow.
 */

import ApexCharts from '../../src/entries/full.js'

const TREE = [
  {
    data: [
      {
        x: 'Engineering',
        y: 50,
        children: [
          { x: 'Web', y: 30 },
          { x: 'Mobile', y: 20 },
        ],
      },
      {
        x: 'Design',
        y: 25,
        children: [
          { x: 'Product', y: 15 },
          { x: 'Brand', y: 10 },
        ],
      },
    ],
  },
]

function mountSunburst() {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    chart: {
      type: 'sunburst',
      width: 500,
      height: 400,
      animations: { enabled: false },
    },
    series: TREE,
  })
  return chart.render().then(() => chart)
}

describe('a sunburst switched to another type keeps its label defaults', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('treemap leaf labels stay white, as on a fresh treemap', async () => {
    const chart = await mountSunburst()
    await chart.updateOptions({ chart: { type: 'treemap' }, series: TREE })

    const fills = [
      ...document.querySelectorAll(
        '.apexcharts-treemap-series .apexcharts-data-labels text',
      ),
    ].map((t) => t.getAttribute('fill'))
    expect(fills.length).toBeGreaterThan(0)
    for (const fill of fills) expect(fill).toBe('#fff')
    chart.destroy()
  })

  it.each(['pie', 'donut'])(
    '%s labels keep their drop shadow',
    async (type) => {
      const chart = await mountSunburst()
      await chart.updateOptions({
        chart: { type },
        series: [30, 20, 15],
        labels: ['A', 'B', 'C'],
      })

      const texts = [
        ...document.querySelectorAll('.apexcharts-datalabels text'),
      ]
      expect(texts.length).toBeGreaterThan(0)
      for (const t of texts) {
        expect(t.getAttribute('filter')).toMatch(/^url\(#/)
        expect(t.getAttribute('fill')).toBe('#fff')
      }
      chart.destroy()
    },
  )
})
