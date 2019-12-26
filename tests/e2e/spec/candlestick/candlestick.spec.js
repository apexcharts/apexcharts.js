import { chartVisualTest } from '../utils'

chartVisualTest('candlestick', 'basic', 'basic-candlestick', async (page) => {
  const paths = await page.$('.apexcharts-candlestick-series')

  const attrD = await paths.$$eval('path', (nodes) =>
    nodes.map((n) => n.getAttribute('d'))
  )

  attrD.forEach((d) => {
    expect(d).toEqual(expect.not.stringContaining('NaN'))
  })
})
