import puppeteer from "puppeteer";
import { root } from '../../../../config.js';

const APP = root + '/samples/mixed/line-column-area.html';
const screenshotPath = root + '/tests/e2e/snapshots/line-column-area.png'

describe("Rendering Mixed Charts", () => {
  it('should render mixed line-column-area chart', async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('file://' + APP);

    await page.waitFor(2000);
  
    await page.screenshot({ path: screenshotPath });
    await browser.close();
  })
  
}, 10000);
