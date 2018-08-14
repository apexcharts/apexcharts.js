import puppeteer from "puppeteer";
import { root } from '../../../../config.js';

const APP = root + '/samples/bar/basic-bar.html';
const screenshotPath = root + '/tests/e2e/snapshots/basic-bar.png'

describe("Rendering Bar Charts", () => {
  it('should render basic bar chart', async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('file://' + APP);

    await page.waitFor(2000);
  
    await page.screenshot({ path: screenshotPath });
    await browser.close();
  })
  
}, 10000);
