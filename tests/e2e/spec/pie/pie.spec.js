import { chartVisualTest } from '../utils'

chartVisualTest('pie', 'simple-pie', 'simple-pie', async (page) => {
  const paths = await page.$('.apexcharts-pie-series')

  const attrD = await paths.$$eval('path', (nodes) =>
    nodes.map((n) => n.getAttribute('d'))
  )

  attrD.forEach((d) => {
    expect(d).toEqual(expect.not.stringContaining('NaN'))
  })
})
