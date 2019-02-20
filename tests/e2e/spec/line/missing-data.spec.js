import puppeteer from 'puppeteer'
import { root } from '../../../../config.js'

const APP = root + '/samples/vanilla-js/line/line-with-missing-data.html'
const screenshotPath = root + '/tests/e2e/snapshots/line-with-missing-data.png'

describe('Rendering Charts containing null data', () => {
  it('should render missing values in a line chart', async () => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto('file://' + APP)

    await page.waitFor(2000)

    const paths = await page.$('.apexcharts-line-series')

    const attrD = await paths.$$eval('path', (nodes) =>
      nodes.map((n) => n.getAttribute('d'))
    )

    attrD.forEach((d) => {
      expect(d).toEqual(expect.not.stringContaining('NaN'))
    })

    await browser.close()
  })
}, 10000)
