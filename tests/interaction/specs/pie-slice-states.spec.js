/**
 * Pie / donut hover + click states (#1862).
 *
 * The two state visuals a slice used to get were both recolourings: hover
 * lightened the fill, click darkened it and re-drew the slice at a 4px larger
 * radius. Both are gone:
 *
 *   - click slides the slice OUT of the pie along its own mid-angle. It is
 *     translated, never re-drawn, so `d` is untouched and the slice still
 *     encodes the quantity it did before (a bigger radius quietly inflates it).
 *     Its labels ride along.
 *   - hover traces a translucent band just outside the slice rim, so a hovered
 *     slice keeps the colour the legend claims it has.
 *
 * Each visual claims its state, so the corresponding states.* filter is
 * suppressed for slice charts (Filters.hoverOutlineOwnsHoverState /
 * sliceOffsetOwnsActiveState) and comes back when the visual is turned off.
 * `states.hover.filter.type: 'none'` still means "no hover feedback at all".
 *
 * Everything here is measured off real geometry in Chromium, because that is
 * the only place the CSS transition on the `transform` presentation attribute
 * actually runs.
 */

import { test as base, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const distPath = resolve(rootDir, 'dist', 'apexcharts.js')

const DEFAULT_OFFSET = 10 // plotOptions.pie.expandOffset default
const DEFAULT_OPACITY = 0.3 // plotOptions.pie.hoverOutline.opacity default

const test = base.extend({
  consoleErrors: async ({ page: _page }, use) => {
    await use([])
  },
  boot: async ({ page, consoleErrors }, use) => {
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    /**
     * @param {object} [cfg] merged over the base pie config
     */
    const boot = async (cfg = {}) => {
      await page.goto('about:blank')
      await page.setContent(
        '<div id="chart" style="width:800px;height:520px"></div>',
      )
      await page.addScriptTag({ path: distPath })
      await page.evaluate(async (c) => {
        window.chart = new ApexCharts(document.querySelector('#chart'), {
          chart: {
            type: 'pie',
            width: 800,
            height: 520,
            animations: { enabled: true, speed: 200 },
          },
          series: [44, 55, 13, 33],
          labels: ['A', 'B', 'C', 'D'],
          dataLabels: { enabled: true },
          ...c,
        })
        await window.chart.render()
      }, cfg)
      await page.waitForSelector('.apexcharts-pie-area')
      await page.waitForTimeout(400)
    }

    await use(boot)

    expect(
      consoleErrors,
      `Unexpected JS errors on page:\n${consoleErrors.join('\n')}`,
    ).toHaveLength(0)
  },
})

/**
 * Client coords of a point on the body of slice `j`: its mid-angle at a
 * fraction of the radius. A bounding-box centre is not usable here, since for a
 * donut (and for a wide pie slice) it can land off the slice entirely.
 */
async function pointOnSlice(page, j) {
  return page.evaluate((jj) => {
    const el = document.querySelector(`.apexcharts-pie-area[j="${jj}"]`)
    const pie = window.chart.ctx.pie
    const start = parseFloat(el.getAttribute('data:startAngle'))
    const ang = parseFloat(el.getAttribute('data:angle'))
    const mid = ((start + ang / 2 - 90) * Math.PI) / 180
    const r =
      pie.chartType === 'donut'
        ? (pie.sliceSizes[jj] + pie.donutSize) / 2
        : pie.sliceSizes[jj] * 0.6
    const inner = document.querySelector('.apexcharts-inner').getBoundingClientRect()
    return {
      x: inner.x + pie.centerX + r * Math.cos(mid),
      y: inner.y + pie.centerY + r * Math.sin(mid),
    }
  }, j)
}

async function sliceState(page, j) {
  return page.evaluate((jj) => {
    const el = document.querySelector(`.apexcharts-pie-area[j="${jj}"]`)
    return {
      transform: el.getAttribute('transform'),
      d: el.getAttribute('d'),
      filter: el.getAttribute('filter'),
      selected: el.getAttribute('selected'),
      clicked: el.getAttribute('data:pieClicked'),
    }
  }, j)
}

async function bandState(page) {
  return page.evaluate(() => {
    const g = document.querySelector('.apexcharts-pie-hover-outline')
    const p = g && g.firstElementChild
    return {
      exists: !!g,
      opacity: g ? Number(getComputedStyle(g).opacity) : null,
      pointerEvents: g ? getComputedStyle(g).pointerEvents : null,
      fill: p ? p.getAttribute('fill') : null,
      fillOpacity: p ? p.getAttribute('fill-opacity') : null,
    }
  })
}

/** Parse a `translate(dx dy)` attribute into a vector. */
function translation(transform) {
  if (!transform) return null
  const m = transform.match(/translate\(\s*(-?[\d.e-]+)[ ,]+(-?[\d.e-]+)\s*\)/)
  return m ? { dx: parseFloat(m[1]), dy: parseFloat(m[2]) } : null
}

/**
 * Record every CSS transition that starts on `selector` from now on. Call
 * before the interaction, then read with `transitionedProps`.
 */
async function watchTransitions(page, selector) {
  await page.evaluate((sel) => {
    window.__transitions = []
    document
      .querySelector(sel)
      .addEventListener('transitionrun', (e) =>
        window.__transitions.push(e.propertyName),
      )
  }, selector)
}

/** The properties that began transitioning, waiting briefly for the first. */
async function transitionedProps(page, timeout = 3_000) {
  await page
    .waitForFunction(() => window.__transitions.length > 0, { timeout })
    .catch(() => {})
  return page.evaluate(() => window.__transitions)
}

/** The mid-angle unit vector of slice `j`, from the angles cached on its path. */
async function midAngleUnit(page, j) {
  return page.evaluate((jj) => {
    const el = document.querySelector(`.apexcharts-pie-area[j="${jj}"]`)
    const start = parseFloat(el.getAttribute('data:startAngle'))
    const ang = parseFloat(el.getAttribute('data:angle'))
    const mid = ((start + ang / 2 - 90) * Math.PI) / 180
    return { x: Math.cos(mid), y: Math.sin(mid) }
  }, j)
}

test.describe('Pie slice click: slides out, keeps its shape', () => {
  test('translates by expandOffset along the mid-angle, leaving `d` alone', async ({
    page,
    boot,
  }) => {
    await boot()
    const before = await sliceState(page, 1)
    const p = await pointOnSlice(page, 1)
    await page.mouse.click(p.x, p.y)
    await page.waitForTimeout(500)

    const after = await sliceState(page, 1)
    // The shape is untouched: this is a move, not a re-draw at a bigger radius.
    expect(after.d).toBe(before.d)

    const t = translation(after.transform)
    expect(t, `no translate on the clicked slice: ${after.transform}`).toBeTruthy()
    const dist = Math.hypot(t.dx, t.dy)
    expect(dist).toBeCloseTo(DEFAULT_OFFSET, 1)

    // ...and it moves outward along its own mid-angle, not in some other
    // direction that happens to have the right length.
    const u = await midAngleUnit(page, 1)
    expect(t.dx / dist).toBeCloseTo(u.x, 2)
    expect(t.dy / dist).toBeCloseTo(u.y, 2)
  })

  test('does not darken the slice, but still marks it selected', async ({
    page,
    boot,
  }) => {
    await boot()
    const p = await pointOnSlice(page, 1)
    await page.mouse.click(p.x, p.y)
    await page.waitForTimeout(400)

    const s = await sliceState(page, 1)
    expect(s.filter, 'the states.active darken filter is still applied').toBe(null)
    // The selection bookkeeping the API and the events depend on is unchanged.
    expect(s.selected).toBe('true')
    expect(s.clicked).toBe('true')
    expect(
      await page.evaluate(() =>
        JSON.parse(JSON.stringify(window.chart.w.interact.selectedDataPoints)),
      ),
    ).toEqual([[1]])
  })

  test('the slice label rides along', async ({ page, boot }) => {
    await boot()
    const p = await pointOnSlice(page, 1)
    await page.mouse.click(p.x, p.y)
    await page.waitForTimeout(500)

    const slice = translation((await sliceState(page, 1)).transform)
    const label = await page.evaluate(
      () =>
        document.querySelectorAll('.apexcharts-datalabels')[1]?.getAttribute(
          'transform',
        ) ?? null,
    )
    const lt = translation(label)
    expect(lt, `the % label stayed behind: ${label}`).toBeTruthy()
    expect(lt.dx).toBeCloseTo(slice.dx, 3)
    expect(lt.dy).toBeCloseTo(slice.dy, 3)
  })

  test('animates the slide rather than jumping', async ({ page, boot }) => {
    await boot()
    // Asserted by the transition event, not by sampling the computed transform
    // mid-flight: a loaded machine can go a whole 320ms without painting, so
    // "is it part-way there yet" is a coin flip while "did the transition run"
    // is not. It also proves the `transform` *attribute* change is what the
    // engine transitions, which is the part that is not obvious.
    await watchTransitions(page, '.apexcharts-pie-area[j="1"]')
    const p = await pointOnSlice(page, 1)
    await page.mouse.click(p.x, p.y)

    expect(await transitionedProps(page)).toContain('transform')

    await page.waitForTimeout(500)
    const settled = await page.evaluate(
      () => getComputedStyle(document.querySelector('.apexcharts-pie-area[j="1"]')).transform,
    )
    const endDist = Math.hypot(
      ...settled.replace(/matrix\(|\)/g, '').split(',').slice(4).map(Number),
    )
    expect(endDist).toBeCloseTo(DEFAULT_OFFSET, 1)
  })

  test('only one slice sits outside at a time', async ({ page, boot }) => {
    await boot()
    const p1 = await pointOnSlice(page, 1)
    await page.mouse.click(p1.x, p1.y)
    await page.waitForTimeout(400)

    const p2 = await pointOnSlice(page, 2)
    await page.mouse.click(p2.x, p2.y)
    await page.waitForTimeout(500)

    const s1 = await sliceState(page, 1)
    const s2 = await sliceState(page, 2)
    expect(Math.hypot(...Object.values(translation(s1.transform)))).toBeCloseTo(0, 5)
    expect(Math.hypot(...Object.values(translation(s2.transform)))).toBeCloseTo(
      DEFAULT_OFFSET,
      1,
    )
    expect(s1.clicked).toBe('false')
    expect(s2.clicked).toBe('true')
  })

  test('clicking the same slice again pulls it back in', async ({ page, boot }) => {
    await boot()
    const p = await pointOnSlice(page, 1)
    await page.mouse.click(p.x, p.y)
    await page.waitForTimeout(400)
    await page.mouse.click(p.x, p.y)
    await page.waitForTimeout(500)

    const s = await sliceState(page, 1)
    expect(Math.hypot(...Object.values(translation(s.transform)))).toBeCloseTo(0, 5)
    expect(s.clicked).toBe('false')
  })

  test('expandOffset drives the distance', async ({ page, boot }) => {
    await boot({ plotOptions: { pie: { expandOffset: 28 } } })
    const p = await pointOnSlice(page, 1)
    await page.mouse.click(p.x, p.y)
    await page.waitForTimeout(600)
    const t = translation((await sliceState(page, 1)).transform)
    expect(Math.hypot(t.dx, t.dy)).toBeCloseTo(28, 1)
  })

  test('a single slice filling the pie does not move', async ({ page, boot }) => {
    // Nothing to move it away from, and sliding it would just shift the chart.
    await boot({ series: [44], labels: ['only'] })
    const p = await pointOnSlice(page, 0)
    await page.mouse.click(p.x, p.y)
    await page.waitForTimeout(500)
    const t = translation((await sliceState(page, 0)).transform)
    expect(Math.hypot(t.dx, t.dy)).toBeCloseTo(0, 5)
  })

  test('GUARD expandOnClick:false keeps the slice put and restores the darken', async ({
    page,
    boot,
  }) => {
    await boot({ plotOptions: { pie: { expandOnClick: false } } })
    const p = await pointOnSlice(page, 1)
    await page.mouse.click(p.x, p.y)
    await page.waitForTimeout(400)

    const s = await sliceState(page, 1)
    expect(s.transform).toBe(null)
    expect(s.filter, 'the only remaining click feedback went missing').toMatch(
      /^url\(#/,
    )
  })
})

test.describe('Pie slice hover: outline band, not a recolour', () => {
  test('fades a band in on hover and out on leave', async ({ page, boot }) => {
    await boot()
    expect((await bandState(page)).opacity).toBe(0)

    // The fade is asserted as a transition on opacity (see watchTransitions)
    // rather than by catching an intermediate value, which is a race.
    await watchTransitions(page, '.apexcharts-pie-hover-outline')
    const p = await pointOnSlice(page, 1)
    await page.mouse.move(p.x, p.y)
    expect(await transitionedProps(page)).toContain('opacity')

    await page.waitForTimeout(350)
    expect((await bandState(page)).opacity).toBe(1)

    await page.mouse.move(4, 4)
    await page.waitForTimeout(350)
    expect((await bandState(page)).opacity).toBe(0)
  })

  test('the band takes the slice colour and does not filter the slice', async ({
    page,
    boot,
  }) => {
    await boot()
    const colors = await page.evaluate(() => window.chart.w.globals.colors)
    const p = await pointOnSlice(page, 1)
    await page.mouse.move(p.x, p.y)
    await page.waitForTimeout(350)

    const band = await bandState(page)
    expect(band.fill.toLowerCase()).toBe(colors[1].toLowerCase())
    expect(Number(band.fillOpacity)).toBe(DEFAULT_OPACITY)
    // The whole point: the slice itself is left alone.
    expect((await sliceState(page, 1)).filter).toBe(null)
  })

  test('sits outside the rim by the configured gap, over the slice extent', async ({
    page,
    boot,
  }) => {
    await boot({ plotOptions: { pie: { spacing: 6, hoverOutline: { size: 9, gap: 2 } } } })
    const p = await pointOnSlice(page, 1)
    await page.mouse.move(p.x, p.y)
    await page.waitForTimeout(350)

    const geo = await page.evaluate(() => {
      const pie = window.chart.ctx.pie
      const c = { x: pie.centerX, y: pie.centerY }
      const slice = document.querySelector('.apexcharts-pie-area[j="1"]')
      const band = document.querySelector('.apexcharts-pie-hover-outline path')
      // Sample both paths: radial extent of the band, angular extent of each.
      const sample = (el) => {
        const len = el.getTotalLength()
        let rMin = Infinity, rMax = -Infinity, aMin = Infinity, aMax = -Infinity
        for (let t = 0; t <= len; t += len / 400) {
          const pt = el.getPointAtLength(t)
          const r = Math.hypot(pt.x - c.x, pt.y - c.y)
          let a = (Math.atan2(pt.y - c.y, pt.x - c.x) * 180) / Math.PI + 90
          if (a < 0) a += 360
          rMin = Math.min(rMin, r); rMax = Math.max(rMax, r)
          aMin = Math.min(aMin, a); aMax = Math.max(aMax, a)
        }
        return { rMin, rMax, aMin, aMax }
      }
      return {
        slice: sample(slice),
        band: sample(band),
        sliceRadius: pie.sliceSizes[1],
        strokeWidth: pie.strokeWidth,
      }
    })

    // Inner edge = rim + half the slice stroke (it straddles the rim) + gap.
    expect(geo.band.rMin).toBeCloseTo(geo.sliceRadius + geo.strokeWidth / 2 + 2, 1)
    expect(geo.band.rMax - geo.band.rMin).toBeCloseTo(9, 1)
    // Angular extent matches the slice AS DRAWN, i.e. inset by `spacing` — not
    // the raw angles cached on the path node.
    expect(geo.band.aMin).toBeCloseTo(geo.slice.aMin, 0)
    expect(geo.band.aMax).toBeCloseTo(geo.slice.aMax, 0)
  })

  test('the band cannot take the pointer', async ({ page, boot }) => {
    await boot()
    const p = await pointOnSlice(page, 1)
    await page.mouse.move(p.x, p.y)
    await page.waitForTimeout(350)
    expect((await bandState(page)).pointerEvents).toBe('none')
  })

  test('the band goes with the slice when it is clicked out', async ({
    page,
    boot,
  }) => {
    await boot()
    const p = await pointOnSlice(page, 1)
    await page.mouse.move(p.x, p.y)
    await page.waitForTimeout(300)
    await page.mouse.click(p.x, p.y)
    await page.waitForTimeout(500)

    const slice = translation((await sliceState(page, 1)).transform)
    const band = translation(
      await page.evaluate(() =>
        document
          .querySelector('.apexcharts-pie-hover-outline path')
          .getAttribute('transform'),
      ),
    )
    expect(band, 'the band was left behind in the gap').toBeTruthy()
    expect(band.dx).toBeCloseTo(slice.dx, 3)
    expect(band.dy).toBeCloseTo(slice.dy, 3)
  })

  test('GUARD hoverOutline.show:false restores the lighten filter', async ({
    page,
    boot,
  }) => {
    await boot({ plotOptions: { pie: { hoverOutline: { show: false } } } })
    const p = await pointOnSlice(page, 1)
    await page.mouse.move(p.x, p.y)
    await page.waitForTimeout(350)

    expect((await bandState(page)).opacity).toBe(0)
    expect(
      (await sliceState(page, 1)).filter,
      'no hover feedback at all once the band is off',
    ).toMatch(/^url\(#/)
  })

  test('GUARD states.hover.filter none means no hover visual at all', async ({
    page,
    boot,
  }) => {
    await boot({ states: { hover: { filter: { type: 'none' } } } })
    const p = await pointOnSlice(page, 1)
    await page.mouse.move(p.x, p.y)
    await page.waitForTimeout(350)

    expect((await bandState(page)).opacity).toBe(0)
    expect((await sliceState(page, 1)).filter).toBe(null)
  })
})

test.describe('Donut and polarArea', () => {
  test('donut slices slide and get a band too', async ({ page, boot }) => {
    await boot({
      chart: {
        type: 'donut',
        width: 800,
        height: 520,
        animations: { enabled: true, speed: 200 },
      },
    })
    const p = await pointOnSlice(page, 1)
    await page.mouse.move(p.x, p.y)
    await page.waitForTimeout(350)
    expect((await bandState(page)).opacity).toBe(1)

    await page.mouse.click(p.x, p.y)
    await page.waitForTimeout(500)
    const t = translation((await sliceState(page, 1)).transform)
    expect(Math.hypot(t.dx, t.dy)).toBeCloseTo(DEFAULT_OFFSET, 1)
  })

  test('polarArea keeps the darken filter and never slides', async ({
    page,
    boot,
  }) => {
    // The radius IS the value there, so moving a slice outward would read as a
    // bigger number: polarArea keeps the filter as its click feedback.
    await boot({
      chart: {
        type: 'polarArea',
        width: 800,
        height: 520,
        animations: { enabled: true, speed: 200 },
      },
    })
    const p = await pointOnSlice(page, 1)
    await page.mouse.click(p.x, p.y)
    await page.waitForTimeout(400)

    const s = await sliceState(page, 1)
    expect(s.transform).toBe(null)
    expect(s.filter).toMatch(/^url\(#/)
  })
})

test.describe('Drilldown pie', () => {
  /** A donut whose slices drill, i.e. where a click is navigation. */
  const drilldownCfg = {
    chart: {
      type: 'donut',
      width: 800,
      height: 520,
      animations: { enabled: true, speed: 200 },
    },
    series: [{ data: [{ x: 'Mobile', y: 55, drilldown: 'mobile' }, { x: 'Desktop', y: 33 }] }],
    drilldown: {
      enabled: true,
      series: [{ id: 'mobile', data: [{ x: 'iOS', y: 30 }, { x: 'Android', y: 25 }] }],
    },
  }

  test('does not slide the slice out, and says why once', async ({ page, boot }) => {
    // The slice used to pull out and then be thrown away by the drill it had
    // just triggered, which reads as a glitch rather than as motion.
    const warnings = []
    page.on('console', (m) => {
      if (m.type() === 'warning') warnings.push(m.text())
    })

    await boot(drilldownCfg)
    const p = await pointOnSlice(page, 0)
    await page.mouse.click(p.x, p.y)
    await page.waitForTimeout(600)

    // The drill happened...
    expect(await page.evaluate(() => window.chart.drilldown.depth)).toBe(1)
    // ...and nothing was translated on the way there. (The slice nodes belong to
    // the new level by now, so assert across all of them.)
    const transforms = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.apexcharts-pie-area')).map((el) =>
        el.getAttribute('transform'),
      ),
    )
    expect(transforms.every((t) => t === null || /translate\(\s*0[ ,]+0\s*\)/.test(t))).toBe(
      true,
    )

    const notice = warnings.filter((t) => t.includes('expandOnClick'))
    expect(notice).toHaveLength(1)
    expect(notice[0]).toContain('drilldown pie/donut')
  })

  test('the warning does not repeat on every navigation', async ({ page, boot }) => {
    const warnings = []
    page.on('console', (m) => {
      if (m.type() === 'warning' && m.text().includes('expandOnClick')) {
        warnings.push(m.text())
      }
    })

    await boot(drilldownCfg)
    const p = await pointOnSlice(page, 0)
    await page.mouse.click(p.x, p.y)
    await page.waitForTimeout(600)
    await page.evaluate(() => window.chart.drillToRoot())
    await page.waitForTimeout(600)
    await page.mouse.click(p.x, p.y)
    await page.waitForTimeout(600)

    expect(warnings).toHaveLength(1)
  })

  test('the states.active filter comes back as the click feedback', async ({
    page,
    boot,
  }) => {
    // A non-drillable slice still has to acknowledge a click somehow, and with
    // the slide gone the darken is the only thing left.
    await boot(drilldownCfg)
    const p = await pointOnSlice(page, 1) // Desktop: no `drilldown` field
    await page.mouse.click(p.x, p.y)
    await page.waitForTimeout(400)

    const s = await sliceState(page, 1)
    expect(await page.evaluate(() => window.chart.drilldown.depth)).toBe(0)
    expect(s.filter).toMatch(/^url\(#/)
  })

  test('hover still gets its outline band', async ({ page, boot }) => {
    // Only the click visual is off. The band is if anything more useful here,
    // since it marks the slice the pointer would navigate into.
    await boot(drilldownCfg)
    const p = await pointOnSlice(page, 0)
    await page.mouse.move(p.x, p.y)
    await page.waitForTimeout(350)
    expect((await bandState(page)).opacity).toBe(1)
  })
})

test.describe('Animations disabled', () => {
  test('parks the slice with no transition', async ({ page, boot }) => {
    await boot({
      chart: {
        type: 'pie',
        width: 800,
        height: 520,
        animations: { enabled: false },
      },
    })
    await watchTransitions(page, '.apexcharts-pie-area[j="1"]')
    const p = await pointOnSlice(page, 1)
    await page.mouse.click(p.x, p.y)
    await page.waitForTimeout(400)

    const s = await page.evaluate(() => {
      const el = document.querySelector('.apexcharts-pie-area[j="1"]')
      return {
        transition: el.style.transition,
        matrix: getComputedStyle(el).transform,
        transitions: window.__transitions,
      }
    })
    expect(s.transition).toBe('')
    expect(s.transitions, 'a transition ran with animations off').toEqual([])
    // Already all the way out well inside the 320ms the transition would take.
    const dist = Math.hypot(
      ...s.matrix.replace(/matrix\(|\)/g, '').split(',').slice(4).map(Number),
    )
    expect(dist).toBeCloseTo(DEFAULT_OFFSET, 1)
  })
})
