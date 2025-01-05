import { chartVisualTest } from '../utils'

chartVisualTest('line', 'line-with-missing-data', null, async (page) => {
  const paths = await page.$('.apexcharts-line-series')

  const attrD = await paths.$$eval('path', (nodes) =>
    nodes.map((n) => n.getAttribute('d'))
  )

  attrD.forEach((d) => {
    expect(d).toEqual(expect.not.stringContaining('NaN'))
  })
})
