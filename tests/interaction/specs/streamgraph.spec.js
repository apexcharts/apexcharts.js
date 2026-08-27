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
