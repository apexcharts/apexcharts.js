import { chartVisualTest } from '../utils'

chartVisualTest('area', 'basic-area', 'basic-area', async (page) => {
  const paths = await page.$('.apexcharts-area-series')

  const attrD = await paths.$$eval('path', (nodes) =>
    nodes.map((n) => n.getAttribute('d'))
  )

  attrD.forEach((d) => {
    expect(d).toEqual(expect.not.stringContaining('NaN'))
  })
})
