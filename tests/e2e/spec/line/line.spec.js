import puppeteer from "puppeteer";
import { root } from '../../../../config.js';

const APP = root + '/samples/line/basic-line.html';
const screenshotPath = root + '/tests/e2e/snapshots/basic-line.png'

describe("Rendering Line Charts", () => {
  it('should render basic line chart', async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('file://' + APP);

    await page.waitFor(2000);
  
    await page.screenshot({ path: screenshotPath });
    await browser.close();
  })
  
}, 10000);
