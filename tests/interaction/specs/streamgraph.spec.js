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

test.describe('Streamgraph: hover dim', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('streamgraph', 'basic-streamgraph')
  })

  /** Move to a fraction of the plot box and let the fade settle. */
  const hover = async (page, fx, fy) => {
    const box = await page.locator('.apexcharts-inner').first().boundingBox()
    await page.mouse.move(box.x + box.width * fx, box.y + box.height * fy)
    await page.waitForTimeout(200)
  }

  /** Every band's name -> the opacity it is currently painted at. */
  const bandOpacities = (page) =>
    page.evaluate(() => {
      const out = {}
      document.querySelectorAll('.apexcharts-series').forEach((s) => {
        const k = Number(s.getAttribute('data:realIndex'))
        out[window.chart.w.streamgraphData.names[k]] = s.style.opacity || '1'
      })
      return out
    })

  test('fades every band except the one under the cursor', async ({ page }) => {
    await hover(page, 0.5, 0.5)
    const bands = await bandOpacities(page)
    const full = Object.keys(bands).filter((n) => bands[n] === '1')
    const faded = Object.keys(bands).filter((n) => bands[n] === '0.35')

    expect(full).toHaveLength(1)
    expect(faded).toHaveLength(5)
  })

  test('recolours the faded names instead of fading them into the band', async ({
    page,
  }) => {
    // Each label takes black or white by the contrast of the band it sits on at
    // FULL strength. Fade the band alone and a white name is left on a band
    // that has gone pale, which does not read as de-emphasised, it reads as
    // broken. The regression this guards is a label whose fill never moved.
    await hover(page, 0.5, 0.5)

    const labels = await page.evaluate(() => {
      const fore = window.chart.w.config.chart.foreColor
      return [
        ...document.querySelectorAll('.apexcharts-streamgraph-label'),
      ].map((n) => ({
        text: n.textContent,
        fill: n.getAttribute('fill'),
        stashed: n.getAttribute('data:fill'),
        isFore: n.getAttribute('fill') === fore,
        opacity: n.style.opacity || '1',
      }))
    })

    const focused = labels.filter((l) => l.opacity === '1')
    const dimmed = labels.filter((l) => l.opacity !== '1')

    expect(focused.length).toBeGreaterThanOrEqual(1)
    expect(dimmed.length).toBeGreaterThanOrEqual(1)
    // A dimmed name drops to the chart foreColor, and its own colour is kept so
    // it can be handed back.
    dimmed.forEach((l) => {
      expect(l.isFore).toBe(true)
      expect(l.stashed).toBeTruthy()
    })
  })

  test('never disagrees with the tooltip about which band that is', async ({
    page,
  }) => {
    // The two resolve the band independently (the dim hit-tests the geometry,
    // the tooltip runs its own capture), so they can drift apart. A tooltip
    // naming a band while a different one is lit is the failure this guards —
    // and it caught a real one: the generic capture picks the series whose
    // stored y is nearest, and for a range area that stored y is the band's
    // LOWER EDGE, so hovering inside Drama used to bold News.
    const disagreements = []
    for (const fx of [0.2, 0.4, 0.6, 0.8]) {
      for (const fy of [0.2, 0.4, 0.6, 0.8]) {
        await hover(page, fx, fy)
        const r = await page.evaluate(() => {
          const w = window.chart.w
          let lit = null
          document.querySelectorAll('.apexcharts-series').forEach((s) => {
            if ((s.style.opacity || '1') === '1') {
              lit =
                w.streamgraphData.names[
                  Number(s.getAttribute('data:realIndex'))
                ]
            }
          })
          const tip = document.querySelector(
            '.apexcharts-tooltip-stream-band.apexcharts-active .series-name',
          )
          return { lit, tooltip: tip && tip.textContent }
        })
        if (!r.lit || r.lit !== r.tooltip) disagreements.push({ fx, fy, ...r })
      }
    }
    expect(disagreements).toEqual([])
  })

  test('a sweep leaves exactly one band lit, never two', async ({ page }) => {
    for (let i = 1; i <= 10; i++) await hover(page, i / 11, 0.5)
    const bands = await bandOpacities(page)
    expect(Object.values(bands).filter((o) => o === '1')).toHaveLength(1)
  })

  test('restores every band when the cursor leaves the chart', async ({
    page,
  }) => {
    await hover(page, 0.5, 0.5)
    expect(
      Object.values(await bandOpacities(page)).filter((o) => o !== '1'),
    ).toHaveLength(5)

    await page.mouse.move(2, 2)
    await page.waitForTimeout(300)

    const back = await page.evaluate(() => {
      const bands = [...document.querySelectorAll('.apexcharts-series')].map(
        (s) => s.style.opacity || '1',
      )
      // The names get their own colours back too, not just their opacity.
      const labels = [
        ...document.querySelectorAll('.apexcharts-streamgraph-label'),
      ].map((n) => ({
        fill: n.getAttribute('fill'),
        stashed: n.getAttribute('data:fill'),
        opacity: n.style.opacity || '1',
      }))
      return { bands, labels }
    })

    expect(back.bands.every((o) => o === '1')).toBe(true)
    back.labels.forEach((l) => {
      expect(l.opacity).toBe('1')
      if (l.stashed) expect(l.fill).toBe(l.stashed)
    })
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

test.describe('Streamgraph: many bands', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('streamgraph', 'streamgraph-many-series')
  })

  test('sizes each name to the band it sits on', async ({ page }) => {
    // A streamgraph's whole claim is that thickness is quantity. One fixed
    // label size states that claim in the same voice for a band carrying the
    // chart and a band carrying a rounding error.
    const labels = await page.evaluate(() => {
      const d = window.chart.w.streamgraphData
      const byName = {}
      d.names.forEach((n, k) => {
        const lo = d.lows[k]
        const hi = d.highs[k]
        if (!lo) return
        let peak = 0
        for (let j = 0; j < lo.length; j++) {
          peak = Math.max(peak, hi[j] - lo[j])
        }
        byName[n] = peak
      })
      return [
        ...document.querySelectorAll('.apexcharts-streamgraph-label'),
      ].map((n) => ({
        name: n.textContent,
        size: parseFloat(n.getAttribute('font-size')),
        peak: byName[n.textContent],
      }))
    })

    expect(labels.length).toBeGreaterThan(4)
    const sizes = labels.map((l) => l.size)
    expect(new Set(sizes).size).toBeGreaterThan(1)
    sizes.forEach((s) => {
      expect(s).toBeGreaterThanOrEqual(9)
      expect(s).toBeLessThanOrEqual(30)
    })

    // NOT asserted as strictly monotonic in thickness, because it isn't: a
    // band can be thick and short (a tall narrow spike), and a name sized on
    // thickness alone would then be too wide for the stretch it has to sit in,
    // so it is stepped down to fit. What must hold is the reading: the band
    // that dominates the chart carries a bigger name than the slivers.
    const ranked = labels.filter((l) => l.peak).sort((a, b) => b.peak - a.peak)
    expect(ranked[0].size).toBeGreaterThan(ranked[ranked.length - 1].size)
  })

  test('never lets two names overlap', async ({ page }) => {
    // Each band picks its own widest stretch knowing nothing about its
    // neighbours, so on a dense chart two of them routinely want the same
    // patch. Two names on top of each other is worse than one name missing:
    // the reader can no longer tell which band either belongs to.
    const overlaps = await page.evaluate(() => {
      const boxes = [
        ...document.querySelectorAll('.apexcharts-streamgraph-label'),
      ].map((n) => ({ t: n.textContent, r: n.getBoundingClientRect() }))
      const hits = []
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i].r
          const b = boxes[j].r
          if (
            a.left < b.right &&
            a.right > b.left &&
            a.top < b.bottom &&
            a.bottom > b.top
          ) {
            hits.push([boxes[i].t, boxes[j].t])
          }
        }
      }
      return hits
    })
    expect(overlaps).toEqual([])
  })

  test('every drawn name stays inside the band it names', async ({ page }) => {
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
          let j = 0
          let best = Infinity
          xs.forEach((x, idx) => {
            const dx = Math.abs(x - lx)
            if (dx < best) {
              best = dx
              j = idx
            }
          })
          if (ly < yPx(d.highs[k][j]) || ly > yPx(d.lows[k][j])) {
            out.push(d.names[k])
          }
        })
      return out
    })
    expect(stray).toEqual([])
  })

  test('a literal fontSize opts out of the scaling', async ({ page }) => {
    const sizes = await page.evaluate(async () => {
      window.chart.updateOptions({
        plotOptions: {
          streamgraph: { labels: { style: { fontSize: '11px' } } },
        },
      })
      await new Promise((r) => setTimeout(r, 900))
      return [
        ...document.querySelectorAll('.apexcharts-streamgraph-label'),
      ].map((n) => n.getAttribute('font-size'))
    })
    expect(sizes.length).toBeGreaterThan(3)
    expect(new Set(sizes)).toEqual(new Set(['11px']))
  })
})

test.describe('Streamgraph: a dense burst', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('streamgraph', 'streamgraph-conversation')
  })

  test('keeps most names when every band peaks in the same burst', async ({
    page,
  }) => {
    // 22 bands that all swell at the end. Each one picks its spot from its own
    // shape alone, so without alternatives to fall back on they all want the
    // same strip and the de-overlap pass throws nearly all of them away — this
    // chart drew 3 names out of 22 before each band could offer more than one
    // position.
    const r = await page.evaluate(() => ({
      series: window.chart.w.streamgraphData.names.length,
      labelled: document.querySelectorAll('.apexcharts-streamgraph-label')
        .length,
    }))
    expect(r.series).toBe(22)
    expect(r.labelled).toBeGreaterThanOrEqual(10)
  })

  test('still lets none of them overlap', async ({ page }) => {
    const overlaps = await page.evaluate(() => {
      const boxes = [
        ...document.querySelectorAll('.apexcharts-streamgraph-label'),
      ].map((n) => ({ t: n.textContent, r: n.getBoundingClientRect() }))
      const hits = []
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i].r
          const b = boxes[j].r
          if (
            a.left < b.right &&
            a.right > b.left &&
            a.top < b.bottom &&
            a.bottom > b.top
          ) {
            hits.push([boxes[i].t, boxes[j].t])
          }
        }
      }
      return hits
    })
    expect(overlaps).toEqual([])
  })

  test('every name that moved is still inside its own band', async ({
    page,
  }) => {
    // The alternatives a name can slide to are all on its OWN band, so moving
    // to avoid a collision must never move it onto a neighbour.
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
          let j = 0
          let best = Infinity
          xs.forEach((x, idx) => {
            const dx = Math.abs(x - lx)
            if (dx < best) {
              best = dx
              j = idx
            }
          })
          if (ly < yPx(d.highs[k][j]) || ly > yPx(d.lows[k][j])) {
            out.push(d.names[k])
          }
        })
      return out
    })
    expect(stray).toEqual([])
  })
})
