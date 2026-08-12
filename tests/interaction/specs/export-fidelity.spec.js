/**
 * Export fidelity: what the downloaded SVG/PNG must still contain.
 *
 * An exported SVG is a standalone document. When it is rasterized for the PNG
 * it goes through `<img src="data:image/svg+xml,...">`, and an SVG loaded as an
 * image may not fetch external resources at all, nor reach the page's
 * stylesheets or loaded fonts. Anything left as a URL therefore silently
 * disappears from the download. Three consequences are guarded here.
 *
 * #3617 — a custom webfont was replaced by a generic fallback, because nothing
 * carried the `@font-face` into the export. Matching rules are now inlined with
 * the font file as a base64 data URI.
 *
 * #3170 — `<image>` annotations vanished. Conversion existed but only read the
 * namespaced `xlink:href`, missing the plain `href` that `customSVG` and
 * hand-authored markup use, and it went through `<img>`+canvas, which taints
 * and throws for any response without CORS headers.
 *
 * #2920 — `theme.mode: 'dark'` moves `chart.foreColor` to a near-white
 * `#f6f7f8` but leaves the background alone. `Core.setupElements` covers the
 * default case by painting the paper `#343A3F`, but `background: 'transparent'`
 * makes that paper style transparent too, so the PNG's opaque `#fff` base was
 * left showing through under near-white text: a chart that looked like it had
 * lost every label.
 */

import { test as base, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const distPath = resolve(rootDir, 'dist', 'apexcharts.js')

// Routed rather than served: the assets only have to come back over the network
// with CORS allowed, and interception keeps the spec hermetic.
const FONT_URL = 'https://assets.test/verify.woff2'
const IMAGE_URL = 'https://assets.test/dot.png'
const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0BFwDiqcVQjAAyGA5W0kJ6IAAAAAElFTkSuQmCC',
  'base64',
)

const test = base.extend({
  consoleErrors: async ({ page: _page }, use) => {
    await use([])
  },
  boot: async ({ page, consoleErrors }, use) => {
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    await page.route(FONT_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'font/woff2',
        headers: { 'access-control-allow-origin': '*' },
        // Not a real typeface: the export only fetches and base64s the bytes.
        body: Buffer.alloc(512, 7),
      }),
    )
    await page.route(IMAGE_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'image/png',
        headers: { 'access-control-allow-origin': '*' },
        body: PNG_BYTES,
      }),
    )

    /**
     * @param {object} options chart config
     * @param {string} [css] extra stylesheet, e.g. an @font-face declaration
     */
    const boot = async (options, css = '') => {
      await page.goto('about:blank')
      await page.setContent(
        `<style>${css}</style><div id="chart" style="width:800px;height:400px"></div>`,
      )
      await page.addScriptTag({ path: distPath })
      await page.evaluate(async (opts) => {
        window.chart = new ApexCharts(document.querySelector('#chart'), opts)
        await window.chart.render()
      }, options)
      await page.waitForFunction(
        () => window.chart?.w?.globals?.animationEnded === true,
        { timeout: 8000 },
      )
    }

    await use(boot)

    expect(
      consoleErrors,
      `Unexpected JS errors on page:\n${consoleErrors.join('\n')}`,
    ).toHaveLength(0)
  },
})

const lineOptions = (chart = {}, extra = {}) => ({
  chart: { type: 'line', height: 400, animations: { enabled: false }, ...chart },
  series: [{ name: 'S', data: [10, 40, 25, 50] }],
  xaxis: { categories: ['a', 'b', 'c', 'd'] },
  ...extra,
})

/** Read the first @font-face block out of the exported SVG. */
const exportedFontFace = (page) =>
  page.evaluate(async () => {
    const svg = await window.chart.getSvgString()
    const m = svg.match(/@font-face\s*\{[^}]*\}/i)
    return {
      block: m ? m[0] : null,
      hasFontFace: !!m,
      inlined: !!m && /url\(\s*['"]?data:/i.test(m[0]),
      leavesRemoteUrl: !!m && /verify\.woff2/.test(m[0]),
    }
  })

test.describe('Export font embedding (#3617)', () => {
  const FONT_CSS = `@font-face { font-family: 'VerifyFont'; src: url('${FONT_URL}') format('woff2'); }`

  test('embeds the @font-face the chart paints with, as base64', async ({
    page,
    boot,
  }) => {
    await boot(lineOptions({ fontFamily: 'VerifyFont, sans-serif' }), FONT_CSS)
    const face = await exportedFontFace(page)

    expect(face.hasFontFace).toBe(true)
    expect(face.inlined).toBe(true)
    // The original URL must be gone: an SVG-as-image could never fetch it.
    expect(face.leavesRemoteUrl).toBe(false)
    expect(face.block).toMatch(/VerifyFont/)
  })

  test('does not embed a font the chart never uses', async ({ page, boot }) => {
    // Declared but not referenced by any chart element.
    await boot(
      lineOptions({ fontFamily: 'sans-serif' }),
      `@font-face { font-family: 'UnusedFont'; src: url('${FONT_URL}') format('woff2'); }`,
    )
    const svg = await page.evaluate(() => window.chart.getSvgString())
    expect(svg).not.toMatch(/UnusedFont/)
  })

  test('embedFonts:false opts out', async ({ page, boot }) => {
    await boot(
      lineOptions({
        fontFamily: 'VerifyFont, sans-serif',
        toolbar: { export: { embedFonts: false } },
      }),
      FONT_CSS,
    )
    const svg = await page.evaluate(() => window.chart.getSvgString())
    expect(svg).not.toMatch(/@font-face/i)
  })

  test('an unreachable font file does not break the export', async ({
    page,
    boot,
  }) => {
    await page.route('https://assets.test/missing.woff2', (route) =>
      route.fulfill({ status: 404, body: '' }),
    )
    await boot(
      lineOptions({ fontFamily: 'GoneFont, sans-serif' }),
      `@font-face { font-family: 'GoneFont'; src: url('https://assets.test/missing.woff2') format('woff2'); }`,
    )

    // Best-effort: the export still resolves, just without the font.
    const svg = await page.evaluate(() => window.chart.getSvgString())
    expect(svg.length).toBeGreaterThan(1000)
    expect(svg).not.toMatch(/missing\.woff2/)
  })
})

test.describe('Export image inlining (#3170)', () => {
  test('inlines an image annotation (xlink:href) as a data URI', async ({
    page,
    boot,
  }) => {
    await boot(
      lineOptions(
        {},
        {
          annotations: {
            points: [
              {
                x: 'b',
                y: 40,
                image: { path: IMAGE_URL, width: 20, height: 20 },
              },
            ],
          },
        },
      ),
    )

    const res = await page.evaluate(async () => {
      const svg = await window.chart.getSvgString()
      return {
        inlined: /(?:xlink:)?href="data:image/.test(svg),
        remoteLeft: (svg.match(/dot\.png/g) || []).length,
      }
    })
    expect(res.inlined).toBe(true)
    expect(res.remoteLeft).toBe(0)
  })

  test('inlines an <image> that carries only a plain href', async ({
    page,
    boot,
  }) => {
    await boot(lineOptions())

    const res = await page.evaluate(async (url) => {
      // The form customSVG / hand-authored markup produces: no xlink namespace.
      const im = document.createElementNS('http://www.w3.org/2000/svg', 'image')
      im.setAttribute('href', url)
      im.setAttribute('width', '20')
      im.setAttribute('height', '20')
      document.querySelector('.apexcharts-svg').appendChild(im)

      const svg = await window.chart.getSvgString()
      return {
        inlined: /href="data:image/.test(svg),
        remoteLeft: (svg.match(/dot\.png/g) || []).length,
      }
    }, IMAGE_URL)

    expect(res.inlined).toBe(true)
    expect(res.remoteLeft).toBe(0)
  })
})

test.describe('Export background (#2920)', () => {
  /** Top-left pixel of the rasterized PNG. */
  const pngCorner = (page) =>
    page.evaluate(async () => {
      const { imgURI } = await window.chart.dataURI()
      return await new Promise((res) => {
        const img = new Image()
        img.onload = () => {
          const c = document.createElement('canvas')
          c.width = img.width
          c.height = img.height
          const cx = c.getContext('2d')
          cx.drawImage(img, 0, 0)
          res(Array.from(cx.getImageData(3, 3, 1, 1).data).slice(0, 3))
        }
        img.onerror = () => res(null)
        img.src = imgURI
      })
    })

  test('a transparent dark chart rasterizes onto the dark surface, not white', async ({
    page,
    boot,
  }) => {
    await boot(
      lineOptions({ background: 'transparent' }, { theme: { mode: 'dark' } }),
    )

    const corner = await pngCorner(page)
    expect(corner).not.toBeNull()
    // #343A3F. Was [255, 255, 255], i.e. near-white labels on white.
    expect(corner).toEqual([52, 58, 63])
  })

  test('GUARD default dark and light backgrounds are unchanged', async ({
    page,
    boot,
  }) => {
    // Default dark was already correct: Core.setupElements paints the paper and
    // the clone carries that inline style into the export.
    await boot(lineOptions({}, { theme: { mode: 'dark' } }))
    expect(await pngCorner(page)).toEqual([52, 58, 63])

    await boot(lineOptions())
    expect(await pngCorner(page)).toEqual([255, 255, 255])
  })

  test('GUARD an explicit background still wins', async ({ page, boot }) => {
    await boot(lineOptions({ background: '#ff0000' }))
    expect(await pngCorner(page)).toEqual([255, 0, 0])
  })
})
