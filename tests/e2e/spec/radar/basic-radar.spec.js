import { chartVisualTest } from '../utils'

chartVisualTest('radar', 'basic-radar', 'basic-radar', async (page) => {
  const paths = await page.$('.apexcharts-radar-series')

  const attrD = await paths.$$eval('path', (nodes) =>
    nodes.map((n) => n.getAttribute('d'))
  )

  attrD.forEach((d) => {
    expect(d).toEqual(expect.not.stringContaining('NaN'))
  })
})
