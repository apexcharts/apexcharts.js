import puppeteer from 'puppeteer'
import { root } from '../../../../config.js'

const APP = root + '/samples/vanilla-js/mixed/multiple-yaxes.html'
const screenshotPath = root + '/tests/e2e/snapshots/multiple-yaxes.png'

describe('Rendering Mixed Charts', () => {
  it('should render mixed line-column chart', async () => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto('file://' + APP)

    await page.waitFor(2000)

    await page.screenshot({ path: screenshotPath })
    await browser.close()
  })
}, 10000)
