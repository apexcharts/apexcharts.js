import { chartVisualTest } from '../utils'

chartVisualTest('mixed', 'multiple-yaxes', 'multiple-yaxes', async (page) => {
  const paths = await page.$('.apexcharts-bar-series, .apexcharts-line-series')

  const attrD = await paths.$$eval('path', (nodes) =>
    nodes.map((n) => n.getAttribute('d'))
  )

  attrD.forEach((d) => {
    expect(d).toEqual(expect.not.stringContaining('NaN'))
  })
})
