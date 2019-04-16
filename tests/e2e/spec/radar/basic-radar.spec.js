import puppeteer from 'puppeteer'
import { root } from '../../../../config.js'

const APP = root + '/samples/vanilla-js/radar/basic-radar.html'
const screenshotPath = root + '/tests/e2e/snapshots/basic-radar.png'

describe('Rendering Radar Charts', () => {
  it('should render basic radar chart', async () => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto('file://' + APP)

    await page.waitFor(2000)

    const paths = await page.$('.apexcharts-radar-series')

    const attrD = await paths.$$eval('path', (nodes) =>
      nodes.map((n) => n.getAttribute('d'))
    )

    attrD.forEach((d) => {
      expect(d).toEqual(expect.not.stringContaining('NaN'))
    })

    await page.screenshot({ path: screenshotPath })
    await browser.close()
  })
}, 10000)
