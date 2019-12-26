import { chartVisualTest } from '../utils'

chartVisualTest('scatter', 'scatter-basic', 'scatter-basic', async (page) => {
  const paths = await page.$('.apexcharts-scatter-series')

  const attrCX = await paths.$$eval('circle', (nodes) =>
    nodes.map((n) => n.getAttribute('cx'))
  )

  attrCX.forEach((cx) => {
    expect(cx).toEqual(expect.not.stringContaining('NaN'))
  })

  const attrCY = await paths.$$eval('circle', (nodes) =>
    nodes.map((n) => n.getAttribute('cy'))
  )

  attrCY.forEach((cy) => {
    expect(cy).toEqual(expect.not.stringContaining('NaN'))
  })
})
