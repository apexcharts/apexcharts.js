import puppeteer from 'puppeteer'
import { root } from '../../../../config.js'

const APP = root + '/samples/vanilla-js/area/basic-area.html'
const screenshotPath = root + '/tests/e2e/snapshots/basic-area.png'

describe('Rendering Area Charts', () => {
  it('should render basic area chart', async () => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto('file://' + APP)

    await page.waitFor(2000)

    await page.screenshot({ path: screenshotPath })
    await browser.close()
  })
}, 10000)
