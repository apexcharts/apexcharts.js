import { chartVisualTest } from '../utils'

chartVisualTest('timelines', 'advanced', 'advanced-timeline', async (page) => {
  const paths = await page.$('.apexcharts-rangebar-series')

  const attrD = await paths.$$eval('path', (nodes) =>
    nodes.map((n) => n.getAttribute('d'))
  )

  attrD.forEach((d) => {
    expect(d).toEqual(expect.not.stringContaining('NaN'))
  })
})
