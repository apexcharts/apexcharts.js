/**
 * Circle charts the chrome re-centres or resizes, every frame.
 *
 * Pie, donut, polarArea, radialBar and radar size their circle from the room
 * the plot has. An update that changes that room (a title appears, the legend
 * moves) gives the circle a new centre and radius. It used to jump there on
 * the first frame while only its angles and values tweened, and the types
 * without axes jumped their plot origin and clip rects too. CircleTransition
 * now eases the circle (and that plot rect) on the morph clock.
 *
 * Checked on the virtual clock with the shared rules (helpers/frames.js):
 * frame 0 is what was on screen (noJump), the plot origin and clips only ease
 * (noLayoutShift, chromeSteady), the last frame is a fresh render (settles).
 * The probe below adds the circle's own box, and the text inside it, to what
 * chromeSteady watches: each edge starts where it was and never jumps.
 */

import { test, expect } from '@playwright/test'
import {
  mountChart,
  recordTransition,
  toggleLegend,
  finite,
  noJump,
  noFlash,
  noLayoutShift,
  chromeSteady,
  animates,
  settles,
  expectNoViolations,
} from '../helpers/frames.js'
import { advance } from '../helpers/virtual-time.js'

const NAMES = ['Alpha', 'Beta', 'Gamma']
const CATS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6']
const TITLE = { text: 'Quarterly results', style: { fontSize: '18px' } }

/**
 * Self-contained, runs in the page every frame: the plot's clip box and the
 * box of the circle (`circle` selects what draws it), in chart (svg) space,
 * plus the centre of the text `text` selects. Feeds chromeSteady.
 * @param {{ circle: string, text?: string }} arg
 */
function circleProbe({ circle, text }) {
  const out = {}
  const box = (els) => {
    let l = Infinity
    let t = Infinity
    let r = -Infinity
    let b = -Infinity
    els.forEach((el) => {
      const bb = el.getBBox()
      const m = el.getCTM()
      if (!m || !(bb.width > 0 || bb.height > 0)) return
      ;[
        [bb.x, bb.y],
        [bb.x + bb.width, bb.y],
        [bb.x, bb.y + bb.height],
        [bb.x + bb.width, bb.y + bb.height],
      ].forEach(([x, y]) => {
        const px = m.a * x + m.c * y + m.e
        const py = m.b * x + m.d * y + m.f
        l = Math.min(l, px)
        t = Math.min(t, py)
        r = Math.max(r, px)
        b = Math.max(b, py)
      })
    })
    return isFinite(l) ? [l, t, r, b] : null
  }
  const g = document.querySelector('.apexcharts-graphical')
  const clip = document.querySelector('clipPath[id^="gridRectMask"] rect')
  if (g && clip) {
    const m = g.getCTM()
    const n = (a) => parseFloat(clip.getAttribute(a))
    out.clipLeft = m.e + n('x')
    out.clipTop = m.f + n('y')
    out.clipRight = m.e + n('x') + n('width')
    out.clipBottom = m.f + n('y') + n('height')
  }
  const c = box([...document.querySelectorAll(circle)])
  if (c) [out.circleLeft, out.circleTop, out.circleRight, out.circleBottom] = c
  if (text) {
    const tb = box([...document.querySelectorAll(text)])
    if (tb) [out.textX, out.textY] = [(tb[0] + tb[2]) / 2, (tb[1] + tb[3]) / 2]
  }
  return out
}

/**
 * The chart types, each with what draws its circle (a shape whose box is the
 * whole circle, whatever the values: the slices of a pie whose values stay,
 * the donut's hole, the polar rings, the radialBar tracks, the radar web).
 */
const TYPES = {
  pie: { o: { chart: { type: 'pie' }, labels: NAMES, series: [44, 55, 41] }, circle: '.apexcharts-pie-area' },
  donut: { o: { chart: { type: 'donut' }, labels: NAMES, series: [44, 55, 41] }, circle: '.apexcharts-pie circle' },
  polarArea: {
    o: { chart: { type: 'polarArea' }, labels: NAMES, series: [44, 55, 41] },
    circle: '.apexcharts-pie > g > circle',
  },
  radialBar: {
    o: { chart: { type: 'radialBar' }, labels: NAMES, series: [52, 67, 45] },
    circle: '.apexcharts-radialbar-track path',
  },
  radar: {
    o: {
      chart: { type: 'radar' },
      xaxis: { categories: CATS },
      series: NAMES.map((name, c) => ({ name, data: CATS.map((_, i) => 30 + ((i * 17 + c * 23) % 50)) })),
    },
    circle: '.apexcharts-radar-series > polygon',
  },
}

/** Mount options: a fixed height, the legend on top, a short morph. */
function config(t, extra = {}) {
  const o = TYPES[t].o
  return {
    dataLabels: { enabled: false },
    legend: { show: true, position: 'top' },
    ...o,
    ...extra,
    chart: {
      height: 320,
      toolbar: { show: false },
      animations: { dynamicAnimation: { speed: 350 } },
      ...o.chart,
      ...(extra.chart || {}),
    },
  }
}

const UPDATES = {
  'a title added': {
    act: (page) => page.evaluate((t) => window.chart.updateOptions({ title: t }), TITLE),
    target: `() => ({ title: ${JSON.stringify(TITLE)} })`,
  },
  'the legend moved from top to bottom': {
    act: (page) => page.evaluate(() => window.chart.updateOptions({ legend: { position: 'bottom' } })),
    target: `(o) => ({ legend: { ...o.legend, position: 'bottom' } })`,
  },
}

/** Largest move of any circle edge between two probe readings. */
function circleTravel(a, b) {
  const keys = ['circleLeft', 'circleTop', 'circleRight', 'circleBottom']
  return Math.max(...keys.map((k) => Math.abs((a?.[k] ?? NaN) - (b?.[k] ?? NaN))))
}

/** The rules every eased move here must satisfy, with what it settles at. */
async function expectEased(page, rec, target, label) {
  expectNoViolations(
    [...finite(rec), ...noJump(rec), ...noFlash(rec), ...noLayoutShift(rec), ...chromeSteady(rec)],
    label,
  )
  if (target) expectNoViolations(await settles(page, rec, { transform: target }), `${label}: settles`)
}

for (const [type, spec] of Object.entries(TYPES)) {
  test.describe(`Circle resize: ${type}`, () => {
    for (const [what, u] of Object.entries(UPDATES)) {
      test(`${what}: the circle eases to its new centre and radius`, async ({ page }) => {
        const errors = await mountChart(page, config(type))
        const rec = await recordTransition(page, () => u.act(page), {
          probe: circleProbe,
          probeArg: { circle: spec.circle },
        })
        // The update has to move the circle for the test to mean anything.
        expect(circleTravel(rec.probeBefore, rec.probes[rec.probes.length - 1])).toBeGreaterThan(3)
        await expectEased(page, rec, u.target, `${type}, ${what}`)
        expect(errors).toEqual([])
      })
    }
  })
}

// A second update while the first is still moving the circle starts from
// where the circle is on screen, not from where the first was taking it.
for (const type of ['donut', 'radar']) {
  test(`${type}: a second update mid-flight continues from the circle on screen`, async ({ page }) => {
    const errors = await mountChart(page, config(type))
    const probe = { probe: circleProbe, probeArg: { circle: TYPES[type].circle } }
    const first = await recordTransition(page, () => UPDATES['a title added'].act(page), { ...probe, ms: 128 })
    await expectEased(page, first, null, `${type}, first update`)
    const second = await recordTransition(page, () => UPDATES['the legend moved from top to bottom'].act(page), probe)
    await expectEased(
      page,
      second,
      `(o) => ({ title: ${JSON.stringify(TITLE)}, legend: { ...o.legend, position: 'bottom' } })`,
      `${type}, second update`,
    )
    expect(errors).toEqual([])
  })
}

// A values update (updateSeries) mid-flight redraws the web: it has to carry
// on the move it interrupts, with its polygons restated at the new radius.
test('radar: a values update mid-flight continues the move', async ({ page }) => {
  const errors = await mountChart(page, config('radar'))
  const probe = { probe: circleProbe, probeArg: { circle: TYPES.radar.circle } }
  const first = await recordTransition(page, () => UPDATES['a title added'].act(page), { ...probe, ms: 128 })
  await expectEased(page, first, null, 'radar, title')
  const values = NAMES.map((name, c) => ({ name, data: CATS.map((_, i) => 35 + ((i * 13 + c * 29) % 45)) }))
  const second = await recordTransition(
    page,
    () => page.evaluate((s) => window.chart.updateSeries(s), values),
    probe,
  )
  await expectEased(
    page,
    second,
    `() => ({ title: ${JSON.stringify(TITLE)}, series: ${JSON.stringify(values)} })`,
    'radar, values mid-flight',
  )
  expect(errors).toEqual([])
})

// polarArea's slice radii are its values: a values change and a resize in the
// same update must compose, each starting where it was.
test('polarArea: new values and a title in one update', async ({ page }) => {
  const errors = await mountChart(page, config('polarArea'))
  const series = [30, 61, 22]
  const rec = await recordTransition(
    page,
    () => page.evaluate(([s, t]) => window.chart.updateOptions({ series: s, title: t }), [series, TITLE]),
    { probe: circleProbe, probeArg: { circle: TYPES.polarArea.circle } },
  )
  expect(circleTravel(rec.probeBefore, rec.probes[rec.probes.length - 1])).toBeGreaterThan(3)
  expectNoViolations(animates(rec), 'polarArea, values + title: animates')
  await expectEased(
    page,
    rec,
    `() => ({ series: ${JSON.stringify(series)}, title: ${JSON.stringify(TITLE)} })`,
    'polarArea, values + title',
  )
  expect(errors).toEqual([])
})

// customScale draws the circle inside a scaled group, and outer name labels
// shrink and re-centre it: the move has to start from the circle as drawn.
const DONUT_VARIANTS = {
  'plotOptions.pie.customScale': { plotOptions: { pie: { customScale: 0.8 } } },
  'plotOptions.pie.dataLabels.external.show': { plotOptions: { pie: { dataLabels: { external: { show: true } } } } },
}
for (const [variant, extra] of Object.entries(DONUT_VARIANTS)) {
  test(`donut with ${variant}: a title added eases the circle`, async ({ page }) => {
    const errors = await mountChart(page, config('donut', extra))
    const u = UPDATES['a title added']
    const rec = await recordTransition(page, () => u.act(page), {
      probe: circleProbe,
      probeArg: { circle: TYPES.donut.circle },
    })
    expect(circleTravel(rec.probeBefore, rec.probes[rec.probes.length - 1])).toBeGreaterThan(3)
    await expectEased(page, rec, u.target, `donut, ${variant}`)
    expect(errors).toEqual([])
  })
}

// The text in the middle of a donut or a radialBar is drawn with the circle:
// it rides with it instead of jumping to the new centre.
const CENTRE_TEXT = {
  donut: { plotOptions: { pie: { donut: { labels: { show: true, total: { show: true, showAlways: true } } } } } },
  radialBar: { plotOptions: { radialBar: { dataLabels: { total: { show: true } } } } },
}
for (const [type, extra] of Object.entries(CENTRE_TEXT)) {
  test(`${type}: the centre text rides with the circle`, async ({ page }) => {
    const errors = await mountChart(page, config(type, extra))
    const u = UPDATES['a title added']
    const rec = await recordTransition(page, () => u.act(page), {
      probe: circleProbe,
      probeArg: { circle: TYPES[type].circle, text: '.apexcharts-datalabel-value' },
    })
    expect(rec.probeBefore.textY, 'the centre text is drawn').toBeGreaterThan(0)
    await expectEased(page, rec, u.target, `${type}, centre text`)
    expect(errors).toEqual([])
  })
}

/** Screen point of slice `i`'s middle, from the arc centre it records. */
async function slicePoint(page, root, i) {
  return page.evaluate(
    ([root, i]) => {
      const p = document.querySelector(`${root} .apexcharts-pie-slice-${i}`)
      const m = p.getScreenCTM()
      const x = parseFloat(p.getAttribute('data:cx'))
      const y = parseFloat(p.getAttribute('data:cy'))
      return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f }
    },
    [root, i],
  )
}

/** Slice `i`'s box relative to its chart's <svg>. */
async function sliceBox(page, root, i) {
  return page.evaluate(
    ([root, i]) => {
      const p = document.querySelector(`${root} .apexcharts-pie-slice-${i}`).getBoundingClientRect()
      const s = document.querySelector(`${root} .apexcharts-svg`).getBoundingClientRect()
      return [p.left - s.left, p.top - s.top, p.width, p.height]
    },
    [root, i],
  )
}

// Once the move is over nothing of it is left on the circle: a slice clicked
// out (expandOnClick) lands where it lands on a fresh render.
test('pie: after the move settles, a slice click lands where a fresh render puts it', async ({ page }) => {
  const errors = await mountChart(page, config('pie'))
  const u = UPDATES['a title added']
  const rec = await recordTransition(page, () => u.act(page), {
    probe: circleProbe,
    probeArg: { circle: TYPES.pie.circle },
  })
  await expectEased(page, rec, u.target, 'pie, title')

  const at = await slicePoint(page, '#chart', 0)
  await page.mouse.click(at.x, at.y)
  await advance(page, 1000)
  const clicked = await sliceBox(page, '#chart', 0)

  // The same chart rendered fresh with the title, animations off, same click.
  await page.evaluate(
    (title) => {
      const host = document.createElement('div')
      host.id = 'fresh'
      host.style.width = '720px'
      document.body.appendChild(host)
      const o = window.__frameLib.clone(window.__opts0)
      o.title = title
      o.chart = { ...o.chart, animations: { enabled: false } }
      window.fresh = new window.ApexCharts(host, o)
      window.fresh.render()
    },
    TITLE,
  )
  await advance(page, 1000)
  const at2 = await slicePoint(page, '#fresh', 0)
  await page.mouse.click(at2.x, at2.y)
  await advance(page, 1000)
  const fresh = await sliceBox(page, '#fresh', 0)

  clicked.forEach((v, k) => expect(Math.abs(v - fresh[k]), `slice box [${k}]`).toBeLessThan(1.5))
  expect(errors).toEqual([])
})

// A gesture that acts on a position lands the move at once (hit-testing maps
// through the final layout); a legend click does not, and the update it makes
// carries the move on from where the circle is.
test('donut: a pointerdown mid-flight lands the move, a legend click carries it on', async ({ page }) => {
  const errors = await mountChart(page, config('donut'))
  const probe = { probe: circleProbe, probeArg: { circle: TYPES.donut.circle } }
  const read = () => page.evaluate(circleProbe, probe.probeArg)

  // Legend click mid-flight: the hiding update starts from the circle on screen.
  const first = await recordTransition(page, () => UPDATES['a title added'].act(page), { ...probe, ms: 128 })
  await expectEased(page, first, null, 'donut, title')
  const toggle = await recordTransition(page, () => toggleLegend(page, 'Beta'), probe)
  expectNoViolations([...noJump(toggle), ...noLayoutShift(toggle), ...chromeSteady(toggle)], 'donut, legend click mid-flight')

  // Pointerdown mid-flight on the plot: the circle is at rest on the next frame.
  await page.evaluate(() => window.chart.updateOptions({ legend: { position: 'bottom' } }))
  await advance(page, 128)
  const moving = await read()
  const box = await page.evaluate(() => {
    const r = document.querySelector('#chart .apexcharts-svg').getBoundingClientRect()
    return { x: r.left + 4, y: r.top + r.height / 2 }
  })
  await page.mouse.move(box.x, box.y)
  await page.mouse.down()
  await advance(page, 16)
  const landed = await read()
  await page.mouse.up()
  await advance(page, 2000)
  const rest = await read()
  expect(circleTravel(moving, rest), 'still moving when the pointer went down').toBeGreaterThan(1.5)
  expect(circleTravel(landed, rest), 'landed on the pointerdown').toBeLessThan(0.5)
  expect(errors).toEqual([])
})

/**
 * Every text inside the circle by `${class}#${ordinal}`, flattened into one
 * key per measure (centre and size, in svg space) so chromeSteady checks each:
 * where it was at frame 0, and no jump after.
 */
function textProbe(root) {
  const out = {}
  const seen = {}
  document.querySelectorAll(`${root} text`).forEach((t) => {
    const cls = t.getAttribute('class') || ''
    seen[cls] = (seen[cls] ?? -1) + 1
    const b = t.getBoundingClientRect()
    if (!b.width) return
    const k = `${cls.trim().replace(/\s+/g, '.')}#${seen[cls]}`
    out[`${k} x`] = b.x + b.width / 2
    out[`${k} y`] = b.y + b.height / 2
    out[`${k} w`] = b.width
    out[`${k} h`] = b.height
  })
  return out
}

// Text is set a fixed number of px off the circle in a fixed font, so it does
// not scale with it: each label rides from where it was, at its own size.
const TEXT_CASES = {
  'pie slice labels': { type: 'pie', root: '.apexcharts-pie', extra: { dataLabels: { enabled: true } } },
  'pie slice labels set 40px out': {
    type: 'pie',
    root: '.apexcharts-pie',
    extra: { dataLabels: { enabled: true }, plotOptions: { pie: { dataLabels: { offset: 40 } } } },
  },
  'radar category names': { type: 'radar', root: '.apexcharts-radar-series' },
  'polarArea ring labels': { type: 'polarArea', root: '.apexcharts-pie' },
}
for (const [what, c] of Object.entries(TEXT_CASES)) {
  test(`${what} ride with the circle at their own size`, async ({ page }) => {
    const errors = await mountChart(page, config(c.type, c.extra))
    const rec = await recordTransition(page, () => UPDATES['a title added'].act(page), { probe: textProbe, probeArg: c.root })
    expect(Object.keys(rec.probeBefore).length, 'texts inside the circle').toBeGreaterThan(3)
    expectNoViolations(chromeSteady(rec), what)
    // They do move with it.
    const last = rec.probes[rec.probes.length - 1]
    const moved = Object.keys(last).filter((k) => k.endsWith(' y') && Math.abs(last[k] - rec.probeBefore[k]) > 3)
    expect(moved.length, 'texts that moved').toBeGreaterThan(0)
    expect(errors).toEqual([])
  })
}

// customScale scales the circle and the text in its middle: both ease.
test('donut: a customScale change eases the circle and its centre text', async ({ page }) => {
  const errors = await mountChart(page, config('donut', CENTRE_TEXT.donut))
  const rec = await recordTransition(
    page,
    () => page.evaluate(() => window.chart.updateOptions({ plotOptions: { pie: { customScale: 0.7 } } })),
    { probe: textProbe, probeArg: '.apexcharts-pie' },
  )
  expectNoViolations([...noJump(rec), ...chromeSteady(rec)], 'donut, customScale')
  const last = rec.probes[rec.probes.length - 1]
  const k = Object.keys(last).find((key) => key.includes('apexcharts-datalabel-value') && key.endsWith(' h'))
  expect(k, 'the centre value').toBeTruthy()
  expect(last[k]).toBeLessThan(rec.probeBefore[k] - 2)
  expect(errors).toEqual([])
})

// A chart made smaller shrinks its svg at once. Started at its old size the
// circle would be cut off by the new edge, so it lands with the svg instead.
const SHRINKS = {
  'pie 520px to 320px': { o: config('pie', { chart: { height: 520 } }), height: 320, circle: TYPES.pie.circle },
  'semi-circle gauge 420px to 260px': {
    // No legend (radialBar's default), so the svg hugs the arc.
    o: config('radialBar', {
      chart: { height: 420 },
      legend: { show: false },
      plotOptions: { radialBar: { startAngle: -90, endAngle: 90 } },
    }),
    height: 260,
    circle: TYPES.radialBar.circle,
  },
}
for (const [what, c] of Object.entries(SHRINKS)) {
  test(`${what}: never drawn past the chart's new edge`, async ({ page }) => {
    const errors = await mountChart(page, c.o)
    const overflow = (sel) => {
      const svg = document.querySelector('#chart .apexcharts-svg').getBoundingClientRect()
      let worst = 0
      document.querySelectorAll(sel).forEach((el) => {
        const b = el.getBoundingClientRect()
        if (!b.width) return
        worst = Math.max(worst, b.bottom - svg.bottom, svg.top - b.top, b.right - svg.right, svg.left - b.left)
      })
      return worst
    }
    const rec = await recordTransition(
      page,
      () => page.evaluate((h) => window.chart.updateOptions({ chart: { height: h } }), c.height),
      { probe: overflow, probeArg: c.circle },
    )
    expect(Math.max(...rec.probes), 'px past the svg edge').toBeLessThan(2)
    expectNoViolations(finite(rec), what)
    expect(errors).toEqual([])
  })
}

// A slice pulled out keeps its px offset: scaled with the circle it would sit
// nearer the centre on the first frame.
test('pie: a slice already pulled out keeps its offset while the circle grows', async ({ page }) => {
  const errors = await mountChart(page, config('pie'))
  await page.evaluate(() => window.chart.toggleDataPointSelection(0))
  await advance(page, 2000)
  const rec = await recordTransition(
    page,
    () => page.evaluate(() => window.chart.updateOptions({ chart: { height: 520 } })),
    { probe: circleProbe, probeArg: { circle: TYPES.pie.circle } },
  )
  expectNoViolations([...noJump(rec), ...finite(rec)], 'pie, slice out, taller')
  expect(errors).toEqual([])
})

// A type change while the circle is still moving starts from the circle on
// screen, not from where the move was taking it. (Measured on screen: a type
// change puts the plot at its new origin at once and offsets its start
// shapes to match, so plot-relative marks would read as a jump.)
test('donut: a chart type change mid-move starts from the circle on screen', async ({ page }) => {
  const errors = await mountChart(page, config('donut'))
  await recordTransition(page, () => UPDATES['a title added'].act(page), { ms: 128 })
  const slices = () =>
    [...document.querySelectorAll('#chart .apexcharts-pie-area')].map((e) => {
      const b = e.getBoundingClientRect()
      return [b.x, b.y, b.right, b.bottom]
    })
  const rec = await recordTransition(
    page,
    () => page.evaluate(() => window.chart.updateOptions({ chart: { type: 'pie' } })),
    { probe: slices },
  )
  expect(rec.probeBefore.length).toBe(3)
  rec.probeBefore.forEach((b, i) =>
    b.forEach((v, k) => expect(Math.abs(rec.probes[0][i][k] - v), `slice ${i} edge ${k} at frame 0`).toBeLessThan(1.5)),
  )
  expect(errors).toEqual([])
})

// The add-a-title-then-export pattern: the promise resolves on the move's
// first frame, and the export is of the chart as laid out, not that frame.
test('pie: an export right after the update resolves is of the final layout', async ({ page }) => {
  const errors = await mountChart(page, config('pie'))
  const got = await page.evaluate(async (t) => {
    await window.chart.updateOptions({ title: t })
    const svg = await window.chart.getSvgString()
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
    return {
      pie: doc.querySelector('.apexcharts-pie')?.getAttribute('transform') ?? null,
      plot: doc.querySelector('.apexcharts-graphical')?.getAttribute('transform'),
      rest: window.chart.w.layout.translateY,
    }
  }, TITLE)
  expect(got.pie).toBeNull()
  expect(got.plot).toBe(`translate(0, ${got.rest})`)
  expect(errors).toEqual([])
})

// A capture its update never used (an identical updateOptions is skipped) is
// not replayed by a later render: by then it no longer shows the screen.
test('donut: a skipped update leaves nothing for a later render to replay', async ({ page }) => {
  const errors = await mountChart(page, config('donut'))
  await recordTransition(page, () => UPDATES['a title added'].act(page), { ms: 128 })
  await page.evaluate((t) => window.chart.updateOptions({ title: t }), TITLE)
  await advance(page, 2000)
  const rec = await recordTransition(page, () => page.evaluate(() => window.chart.update()), {
    probe: circleProbe,
    probeArg: { circle: TYPES.donut.circle },
  })
  expectNoViolations([...noJump(rec), ...noLayoutShift(rec), ...chromeSteady(rec)], 'donut, refresh after a skipped update')
  expect(errors).toEqual([])
})

/** Each slice label's middle and opacity, keyed by the slice it labels. */
function sliceLabels() {
  const out = {}
  document.querySelectorAll('#chart [data\\:slice] text').forEach((t) => {
    const slice = t.closest('[data\\:slice]').getAttribute('data:slice')
    const b = t.getBoundingClientRect()
    let o = 1
    for (let n = t; n && n.tagName !== 'svg'; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity)
    out[slice] = { x: b.x + b.width / 2, y: b.y + b.height / 2, w: b.width, o, text: t.textContent }
  })
  return out
}

// Labels pair by the slice they label: a slice that draws no label (a zero
// value here) must not hand its place to the next slice's label.
test('pie: each label rides from its own slice when another slice loses its label', async ({ page }) => {
  const errors = await mountChart(page, config('pie', { dataLabels: { enabled: true }, labels: ['A', 'B', 'C', 'D'], series: [44, 55, 13, 33] }))
  const rec = await recordTransition(
    page,
    () => page.evaluate((t) => window.chart.updateOptions({ title: t, series: [0, 55, 13, 33] }), TITLE),
    { probe: sliceLabels },
  )
  for (const k of ['1', '2', '3']) {
    const a = rec.probeBefore[k]
    const b = rec.probes[0][k]
    expect(Math.hypot(b.x - a.x, b.y - a.y), `slice ${k}'s label at frame 0`).toBeLessThan(1.5)
  }
  expect(errors).toEqual([])
})

// A label drawn empty (a formatter hiding small slices) has no place to ride
// from: when it gets text it fades in where it belongs, not from the corner.
test('pie: a label that was empty fades in instead of flying in', async ({ page }) => {
  const errors = await mountChart(
    page,
    config('pie', {
      dataLabels: { enabled: true },
      labels: ['A', 'B', 'C', 'D'],
      series: [44, 55, 6, 33],
    }),
  )
  await page.evaluate(() =>
    window.chart.updateOptions({ dataLabels: { formatter: (v) => (v > 5 ? v.toFixed(0) + '%' : '') } }, false, false),
  )
  await advance(page, 1000)
  const rec = await recordTransition(
    page,
    () => page.evaluate((t) => window.chart.updateOptions({ title: t, series: [44, 55, 30, 33] }), TITLE),
    { probe: sliceLabels },
  )
  const last = rec.probes[rec.probes.length - 1]['2']
  expect(last.text, 'the label has text at the end').not.toBe('')
  for (const f of rec.probes) {
    const l = f['2']
    if (!l || l.o < 0.05) continue
    // Wherever it is visible, it is on its way from its slice, not from 0,0.
    expect(Math.hypot(l.x - last.x, l.y - last.y), 'visible far from its slice').toBeLessThan(40)
  }
  expect(errors).toEqual([])
})

// A text an earlier move was still fading in keeps its strength: the next
// move fades it on from there, it does not pop to full.
test('donut: centre text still fading in keeps fading through a second move', async ({ page }) => {
  const errors = await mountChart(page, config('donut'))
  const centre = () => {
    const t = document.querySelector('#chart .apexcharts-datalabel-value')
    if (!t) return null
    let o = 1
    for (let n = t; n && n.tagName !== 'svg'; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity)
    return o
  }
  await recordTransition(
    page,
    () =>
      page.evaluate((t) =>
        window.chart.updateOptions({ title: t, plotOptions: { pie: { donut: { labels: { show: true, total: { show: true, showAlways: true } } } } } }),
      TITLE),
    { ms: 112 },
  )
  const rec = await recordTransition(page, () => page.evaluate(() => window.chart.updateOptions({ legend: { position: 'bottom' } })), {
    probe: centre,
  })
  expect(rec.probeBefore, 'part way through its fade').toBeLessThan(0.9)
  expect(Math.abs(rec.probes[0] - rec.probeBefore), 'strength at frame 0').toBeLessThan(0.1)
  expect(errors).toEqual([])
})

// Bar labels turned with the gauge carry a transform-origin, which applies to
// the whole transform: the ride has to be taken about it too.
test('radialBar: bar labels on a turned gauge ride with it', async ({ page }) => {
  const errors = await mountChart(
    page,
    config('radialBar', {
      plotOptions: { radialBar: { startAngle: -135, endAngle: 135, barLabels: { enabled: true } } },
      chart: { height: 360 },
    }),
  )
  const rec = await recordTransition(page, () => UPDATES['a title added'].act(page), { probe: textProbe, probeArg: '.apexcharts-radialbar' })
  expect(Object.keys(rec.probeBefore).length).toBeGreaterThan(3)
  expectNoViolations(chromeSteady(rec), 'radialBar bar labels')
  expect(errors).toEqual([])
})

// Selecting or deselecting a slice while the circle moves wins: the move does
// not put the old offset back when it ends.
test('pie: a slice deselected during the move stays deselected', async ({ page }) => {
  const errors = await mountChart(page, config('pie'))
  await page.evaluate(() => window.chart.toggleDataPointSelection(0))
  await advance(page, 2000)
  await page.evaluate(async () => {
    await window.chart.updateOptions({ chart: { height: 520 } })
    window.chart.toggleDataPointSelection(0)
  })
  await advance(page, 2000)
  const t = await page.evaluate(() => {
    const p = document.querySelector('#chart .apexcharts-pie-slice-0')
    return { transform: p.getAttribute('transform'), clicked: p.getAttribute('data:pieClicked') }
  })
  expect(t.clicked).toBe('false')
  expect(t.transform === null || /^translate\(0[ ,]+0\)$/.test(t.transform), `transform ${t.transform}`).toBe(true)
  expect(errors).toEqual([])
})

// Half a gauge is drawn: the fit check goes by what is drawn, so a gauge
// whose svg hugs its arc still eases when a title pushes it down.
test('semi-circle gauge: a title added eases the arc', async ({ page }) => {
  const errors = await mountChart(
    page,
    config('radialBar', {
      chart: { height: 300 },
      legend: { show: false },
      plotOptions: { radialBar: { startAngle: -90, endAngle: 90 } },
    }),
  )
  const rec = await recordTransition(page, () => UPDATES['a title added'].act(page), {
    probe: circleProbe,
    probeArg: { circle: TYPES.radialBar.circle },
  })
  expect(circleTravel(rec.probeBefore, rec.probes[rec.probes.length - 1])).toBeGreaterThan(3)
  expectNoViolations([...noJump(rec), ...noLayoutShift(rec), ...chromeSteady(rec)], 'semi gauge, title')
  expect(errors).toEqual([])
})

// An update just after a type change starts from the screen, not again from
// the old chart's shapes (the morph's snapshot outlived the morph by 100ms).
test('pie: an update just after a morph from bars starts from the pie on screen', async ({ page }) => {
  const errors = await mountChart(page, {
    chart: {
      type: 'bar',
      height: 320,
      toolbar: { show: false },
      animations: { dynamicAnimation: { speed: 350 }, chartTypeMorph: { speed: 600 } },
    },
    series: [{ name: 'S', data: [44, 55, 41] }],
    xaxis: { categories: NAMES },
    dataLabels: { enabled: false },
  })
  await page.evaluate((names) =>
    window.chart.updateOptions({ chart: { type: 'pie' }, series: [44, 55, 41], labels: names }),
  NAMES)
  // Past the 600ms morph, inside the 100ms its snapshot used to outlive it.
  await advance(page, 660)
  const slices = () =>
    [...document.querySelectorAll('#chart .apexcharts-pie-area')].map((e) => {
      const b = e.getBoundingClientRect()
      return [b.x, b.y, b.right, b.bottom]
    })
  const rec = await recordTransition(page, () => page.evaluate(() => window.chart.updateSeries([30, 61, 22])), {
    probe: slices,
  })
  rec.probeBefore.forEach((b, i) =>
    b.forEach((v, k) => expect(Math.abs(rec.probes[0][i][k] - v), `slice ${i} edge ${k} at frame 0`).toBeLessThan(1.5)),
  )
  expect(errors).toEqual([])
})

test('a pie switched to a radar renders', async ({ page }) => {
  const errors = await mountChart(page, config('pie'))
  await page.evaluate((cats) =>
    window.chart.updateOptions({
      chart: { type: 'radar' },
      series: [{ name: 'S', data: [30, 50, 40, 60, 20, 45] }],
      xaxis: { categories: cats },
    }),
  CATS)
  await advance(page, 2000)
  expect(await page.locator('#chart .apexcharts-radar-series path').count()).toBeGreaterThan(0)
  expect(errors).toEqual([])
})
