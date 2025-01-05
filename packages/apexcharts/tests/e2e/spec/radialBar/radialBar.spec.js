import { chartVisualTest } from '../utils'

chartVisualTest('radialBar', 'circle-chart', 'circle-chart', async (page) => {
  const paths = await page.$('.apexcharts-radial-series')

  const attrD = await paths.$$eval('path', (nodes) =>
    nodes.map((n) => n.getAttribute('d'))
  )

  attrD.forEach((d) => {
    expect(d).toEqual(expect.not.stringContaining('NaN'))
  })
})
