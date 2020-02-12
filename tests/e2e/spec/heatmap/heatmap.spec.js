import { chartVisualTest } from '../utils'

chartVisualTest('heatmap', 'basic', 'basic-heatmap', async (page) => {
  const paths = await page.$('.apexcharts-heatmap-series')

  const attrX = await paths.$$eval('rect', (nodes) =>
    nodes.map((n) => n.getAttribute('x'))
  )

  attrX.forEach((x) => {
    expect(x).toEqual(expect.not.stringContaining('NaN'))
  })

  const attrY = await paths.$$eval('rect', (nodes) =>
    nodes.map((n) => n.getAttribute('y'))
  )

  attrY.forEach((y) => {
    expect(y).toEqual(expect.not.stringContaining('NaN'))
  })
})
