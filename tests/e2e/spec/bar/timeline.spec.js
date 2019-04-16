import puppeteer from 'puppeteer'
import { root } from '../../../../config.js'

const APP = root + '/samples/vanilla-js/bar/timeline.html'
const screenshotPath = root + '/tests/e2e/snapshots/bar-timeline.png'

describe('Rendering Timeline / Rangebar Charts', () => {
  it('should render basic timeline chart', async () => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto('file://' + APP)

    await page.waitFor(2000)

    const paths = await page.$('.apexcharts-rangebar-series')

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
