import { chartVisualTest } from '../utils'

chartVisualTest('bar', 'reversed-bar', 'reversed-bar', async (page) => {
  const paths = await page.$('.apexcharts-bar-series')

  const attrD = await paths.$$eval('path', (nodes) =>
    nodes.map((n) => n.getAttribute('d'))
  )

  attrD.forEach((d) => {
    expect(d).toEqual(expect.not.stringContaining('NaN'))
  })
})
