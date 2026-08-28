/**
 * `chart.type: 'streamgraph'` render + interaction.
 *
 * Uses the basic-streamgraph fixture (samples/vanilla-js/streamgraph/
 * basic-streamgraph.html): six categories over a datetime axis, stacked on a
 * wiggle baseline. Covers what jsdom cannot see, which for a streamgraph is
 * everything that matters:
 *   - the bands meeting with no hairline gap (the whole reason the type routes
 *     through rangeArea rather than stacked area)
 *   - each band's name placed INSIDE its own band, in a colour that reads on it
 *   - a legend click dropping a band and re-solving the baseline under it
 *   - the tooltip reporting the reader's values rather than the stacking offsets
 */

import { test, expect } from '../fixtures/base.js'

test.describe('Streamgraph: bands', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('streamgraph', 'basic-streamgraph')
  })

  test('draws one band per series', async ({ page }) => {
    const bands = await page.$$eval('.apexcharts-series', (ns) => ns.length)
    expect(bands).toBe(6)
  })

  test('adjacent bands share an edge exactly, so the surface cannot tear', async ({
    page,
  }) => {
    // The invariant the form rests on. Recomputing either edge from the values
    // rounds differently at some columns and not others, which opens a hairline
    // gap that only shows on screen.
    const gaps = await page.evaluate(() => {
      const d = window.chart.w.streamgraphData
      const out = []
      for (let j = 0; j < d.xs.length; j++) {
        for (let i = 0; i < d.order.length - 1; i++) {
          const top = d.highs[d.order[i]][j]
          const bottom = d.lows[d.order[i + 1]][j]
          if (top !== bottom) out.push({ j, i, top, bottom })
        }
      }
      return out
    })
    expect(gaps).toEqual([])
  })

  test('every band is exactly its own value thick', async ({ page }) => {
    const worst = await page.evaluate(() => {
      const d = window.chart.w.streamgraphData
      let worst = 0
      d.order.forEach((k) => {
        for (let j = 0; j < d.xs.length; j++) {
          const err = Math.abs(d.highs[k][j] - d.lows[k][j] - d.values[k][j])
          if (err > worst) worst = err
        }
      })
      return worst
    })
    expect(worst).toBeLessThan(1e-9)
  })
})

test.describe('Streamgraph: band labels', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('streamgraph', 'basic-streamgraph')
  })

  test('writes each name on its own band', async ({ page }) => {
    const names = await page.$$eval('.apexcharts-streamgraph-label', (ns) =>
      ns.map((n) => n.textContent),
    )
    expect(names.sort()).toEqual([
      'Comedy',
      'Documentary',
      'Drama',
      'Kids',
      'News',
      'Sport',
    ])
  })

  test('each label sits inside the band it names, not over a neighbour', async ({
    page,
  }) => {
    // The only check that actually proves the placement: take each label's
    // anchor back through the geometry and confirm it lands between that band's
    // own two edges at that column.
    const stray = await page.evaluate(() => {
      const w = window.chart.w
      const d = w.streamgraphData
      const h = w.layout.gridHeight
      const span = w.globals.maxY - w.globals.minY
      const yPx = (v) => h - ((v - w.globals.minY) / span) * h
      const out = []

      document
        .querySelectorAll('.apexcharts-streamgraph-label')
        .forEach((el) => {
          const k = Number(el.getAttribute('data:realIndex'))
          const lx = Number(el.getAttribute('x'))
          const ly = Number(el.getAttribute('y'))
          const xs = w.globals.seriesXvalues[k]

          // the column the label is anchored over
          let j = 0
          let best = Infinity
          xs.forEach((x, idx) => {
            const dx = Math.abs(x - lx)
            if (dx < best) {
              best = dx
              j = idx
            }
          })

          const top = yPx(d.highs[k][j])
          const bottom = yPx(d.lows[k][j])
          if (ly < top || ly > bottom) {
            out.push({ name: d.names[k], ly, top, bottom })
          }
        })
      return out
    })
    expect(stray).toEqual([])
  })

  test('takes a label colour that reads on its own band', async ({ page }) => {
    // The palette runs from pale yellow to saturated blue in one chart, so a
    // single fixed label colour is unreadable on some band every time.
    const labels = await page.$$eval('.apexcharts-streamgraph-label', (ns) =>
      ns.map((n) => ({
        name: n.textContent,
        fill: n.getAttribute('fill'),
      })),
    )
    const kids = labels.find((l) => l.name === 'Kids')
    const drama = labels.find((l) => l.name === 'Drama')
    // #FACC15 is light, #2E93fA is not.
    expect(kids.fill).toBe('#000000')
    expect(drama.fill).toBe('#ffffff')
  })

  test('leaves a band too thin to hold its name unlabelled', async ({
    page,
  }) => {
    const labelled = await page.evaluate(async () => {
      // Squeeze every band but one down to nothing.
      window.chart.updateSeries([
        { name: 'Drama', data: [40, 45, 50] },
        { name: 'Comedy', data: [0.2, 0.2, 0.2] },
        { name: 'Documentary', data: [0.2, 0.2, 0.2] },
        { name: 'Sport', data: [0.2, 0.2, 0.2] },
        { name: 'Kids', data: [0.2, 0.2, 0.2] },
        { name: 'News', data: [0.2, 0.2, 0.2] },
      ])
      await new Promise((r) => setTimeout(r, 900))
      return [
        ...document.querySelectorAll('.apexcharts-streamgraph-label'),
      ].map((n) => n.textContent)
    })
    expect(labelled).toEqual(['Drama'])
  })
})

test.describe('Streamgraph: legend collapse', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('streamgraph', 'basic-streamgraph')
  })

  test('a collapsed band leaves the stack and the rest close up over it', async ({
    page,
  }) => {
    const before = await page.evaluate(
      () => window.chart.w.streamgraphData.order.length,
    )

    const after = await page.evaluate(async () => {
      window.chart.toggleSeries('Sport')
      await new Promise((r) => setTimeout(r, 900))
      const d = window.chart.w.streamgraphData
      // No hole: the surface is now exactly the surviving values thick.
      let worst = 0
      for (let j = 0; j < d.xs.length; j++) {
        const thickness =
          d.highs[d.order[d.order.length - 1]][j] - d.lows[d.order[0]][j]
        const expected = d.order.reduce((a, k) => a + d.values[k][j], 0)
        worst = Math.max(worst, Math.abs(thickness - expected))
      }
      return {
        order: d.order,
        hidden: d.hidden,
        worst,
        labels: [
          ...document.querySelectorAll('.apexcharts-streamgraph-label'),
        ].map((n) => n.textContent),
      }
    })

    expect(before).toBe(6)
    expect(after.order).toHaveLength(5)
    expect(after.hidden).toEqual([3])
    expect(after.worst).toBeLessThan(1e-9)
    expect(after.labels).not.toContain('Sport')
  })
})

test.describe('Streamgraph: tooltip', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('streamgraph', 'basic-streamgraph')
  })

  test('reads out every band at the hovered column, plus the total', async ({
    page,
  }) => {
    const box = await page.locator('.apexcharts-inner').first().boundingBox()
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5)
    await page.waitForTimeout(300)

    const tip = await page.evaluate(() => {
      const rows = [
        ...document.querySelectorAll('.apexcharts-tooltip-stream-band'),
      ].map((n) => n.innerText.trim())
      const total = document.querySelector(
        '.apexcharts-tooltip-stream-total .value',
      )
      return { rows, total: total && total.textContent.trim() }
    })

    expect(tip.rows).toHaveLength(6)
    expect(tip.total).toBeTruthy()
  })

  test('quotes the numbers the reader gave, not the stacking offsets', async ({
    page,
  }) => {
    // Regression: the inherited y formatter takes its decimal count from the
    // values the chart DREW, and a streamgraph draws wiggle offsets whose
    // fractions run to the full width of a double. A band worth 26 printed as
    // "26.0000000000000000".
    const box = await page.locator('.apexcharts-inner').first().boundingBox()
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5)
    await page.waitForTimeout(300)

    const values = await page.$$eval(
      '.apexcharts-tooltip-stream-band .value',
      (ns) => ns.map((n) => n.textContent.trim()),
    )

    expect(values.length).toBeGreaterThan(0)
    values.forEach((v) => {
      expect(v).toMatch(/^-?\d+(\.\d{1,6})?$/)
    })
  })
})

test.describe('Streamgraph: hover outline', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('streamgraph', 'basic-streamgraph')
  })

  /** Move to a fraction of the plot box and settle. */
  const hover = async (page, fx, fy) => {
    const box = await page.locator('.apexcharts-inner').first().boundingBox()
    await page.mouse.move(box.x + box.width * fx, box.y + box.height * fy)
    await page.waitForTimeout(120)
  }

  test('traces the band under the cursor, and only that band', async ({
    page,
  }) => {
    await hover(page, 0.5, 0.5)
    const o = await page.evaluate(() => {
      const groups = document.querySelectorAll('.apexcharts-streamgraph-hover')
      const stroke = groups[0] && groups[0].querySelector('path[stroke]')
      return {
        groups: groups.length,
        // Clipped to the band's OWN shape, which is what keeps the stroke
        // inset instead of spending half its width on the neighbour above.
        clipped: !!(stroke && stroke.getAttribute('clip-path')),
        width: stroke && stroke.getAttribute('stroke-width'),
        fill: stroke && stroke.getAttribute('fill'),
      }
    })
    expect(o.groups).toBe(1)
    expect(o.clipped).toBe(true)
    // Drawn at 2x the configured width; the clip cuts it back to 2px.
    expect(o.width).toBe('4')
    expect(o.fill).toBe('none')
  })

  test('never disagrees with the tooltip about which band that is', async ({
    page,
  }) => {
    // The two resolve the band independently (the outline hit-tests the
    // geometry, the tooltip runs its own capture), so they can drift apart.
    // A tooltip naming a band with nothing on the chart pointing at it is the
    // failure this guards.
    const disagreements = []
    for (const fx of [0.2, 0.4, 0.6, 0.8]) {
      for (const fy of [0.2, 0.4, 0.6, 0.8]) {
        await hover(page, fx, fy)
        const r = await page.evaluate(() => {
          const w = window.chart.w
          const outline = document.querySelector(
            '.apexcharts-streamgraph-hover path[stroke]',
          )
          let outlined = null
          document.querySelectorAll('.apexcharts-series').forEach((s) => {
            const band = s.querySelector('path.apexcharts-rangeArea')
            if (
              band &&
              outline &&
              band.getAttribute('d') === outline.getAttribute('d')
            ) {
              outlined =
                w.streamgraphData.names[
                  Number(s.getAttribute('data:realIndex'))
                ]
            }
          })
          const tip = document.querySelector(
            '.apexcharts-tooltip-stream-band.apexcharts-active .series-name',
          )
          return { outlined, tooltip: tip && tip.textContent }
        })
        if (!r.outlined || r.outlined !== r.tooltip) {
          disagreements.push({ fx, fy, ...r })
        }
      }
    }
    expect(disagreements).toEqual([])
  })

  test('a sweep leaves one outline behind, not one per mousemove', async ({
    page,
  }) => {
    for (let i = 1; i <= 10; i++) await hover(page, i / 11, 0.5)
    const groups = await page.$$eval(
      '.apexcharts-streamgraph-hover',
      (ns) => ns.length,
    )
    expect(groups).toBe(1)
  })

  test('clears when the cursor leaves the chart', async ({ page }) => {
    await hover(page, 0.5, 0.5)
    expect(
      await page.$$eval('.apexcharts-streamgraph-hover', (ns) => ns.length),
    ).toBe(1)

    await page.mouse.move(2, 2)
    await page.waitForTimeout(250)
    expect(
      await page.$$eval('.apexcharts-streamgraph-hover', (ns) => ns.length),
    ).toBe(0)
  })
})

test.describe('Streamgraph: the legend is the control', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('streamgraph', 'basic-streamgraph')
  })

  test('renders a legend by default, with every band on it', async ({
    page,
  }) => {
    // Not decoration: it is the only thing on a streamgraph you can click, and
    // pulling a band out to watch the baseline re-solve is most of what there
    // is to do here.
    const items = await page.$$eval('.apexcharts-legend-series', (ns) =>
      ns.map((n) => n.textContent.trim()),
    )
    expect(items.sort()).toEqual([
      'Comedy',
      'Documentary',
      'Drama',
      'Kids',
      'News',
      'Sport',
    ])
  })

  test('clicking a legend item collapses that band and re-solves the rest', async ({
    page,
  }) => {
    await page.click('.apexcharts-legend-series[rel="4"]')
    await page.waitForTimeout(900)

    const after = await page.evaluate(() => {
      const d = window.chart.w.streamgraphData
      let worst = 0
      for (let j = 0; j < d.xs.length; j++) {
        const thickness =
          d.highs[d.order[d.order.length - 1]][j] - d.lows[d.order[0]][j]
        const expected = d.order.reduce((a, k) => a + d.values[k][j], 0)
        worst = Math.max(worst, Math.abs(thickness - expected))
      }
      return { order: d.order, hidden: d.hidden, worst }
    })

    expect(after.order).toHaveLength(5)
    expect(after.hidden).toHaveLength(1)
    expect(after.worst).toBeLessThan(1e-9)
  })
})
