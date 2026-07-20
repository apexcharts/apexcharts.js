/**
 * Bar chart race — axis labels ride the reorder.
 *
 * On a horizontal bar update that reorders categories (a "bar chart race"),
 * the bars already slide to their new slots via the keyed path morph. This
 * verifies the matching behaviour for the LEFT category labels: a surviving
 * label whose slot changed must TWEEN its y from the old slot to the new one
 * on the same clock as the morph, not snap instantly. Regression guard for the
 * reorder-tolerant axis-chrome gate (seriesJoin allowReorder).
 */

import { test, expect } from '../fixtures/base.js'

/** Trigger an update and sample the DOM every ~40ms, all inside the page. */
function sampleDuringUpdate(page, updateArg, sampler, durationMs = 700) {
  return page.evaluate(
    async ({ updateArg, samplerSrc, durationMs }) => {
      const sample = new Function('return (' + samplerSrc + ')')()
      const samples = []
      const t0 = performance.now()
      const timer = setInterval(() => {
        try {
          samples.push({ t: Math.round(performance.now() - t0), ...sample() })
        } catch (e) {
          samples.push({ t: Math.round(performance.now() - t0), error: String(e) })
        }
      }, 40)
      window.chart.updateOptions(updateArg, false, true)
      await new Promise((r) => setTimeout(r, durationMs))
      clearInterval(timer)
      await new Promise((r) => setTimeout(r, 300))
      return samples
    },
    { updateArg, samplerSrc: sampler.toString(), durationMs },
  )
}

// basic-bar.html: horizontal bars, categories ascending by value.
// data:       [400, 430, 448, 470, 540, 580, 690, 1100, 1200, 1380]
// categories: South Korea, Canada, United Kingdom, Netherlands, Italy,
//             France, Japan, United States, China, Germany
const CATS = [
  'South Korea', 'Canada', 'United Kingdom', 'Netherlands', 'Italy',
  'France', 'Japan', 'United States', 'China', 'Germany',
]
const DATA = [400, 430, 448, 470, 540, 580, 690, 1100, 1200, 1380]

// A self-contained sampler-source string that reads the y attribute of the
// category label whose text matches `label` (inlined so it serializes cleanly
// across page.evaluate).
const labelYSampler = (label) => `() => {
  const nodes = [...document.querySelectorAll('.apexcharts-yaxis-texts-g text')]
  const el = nodes.find(
    (n) => (n.querySelector('tspan')?.textContent || '').trim() === ${JSON.stringify(label)}
  )
  return { y: el ? parseFloat(el.getAttribute('y')) : null }
}`

test.describe('Bar chart race — category labels ride the reorder', () => {
  test('a surviving label tweens to its new slot instead of snapping', async ({
    page,
    loadChart,
  }) => {
    await loadChart('bar', 'basic-bar')

    // Old y of the label we will track ("Germany", currently the top bar).
    const tracked = 'Germany'
    const startY = await page.evaluate((sampler) => {
      const fn = new Function('return (' + sampler + ')')()
      return fn().y
    }, labelYSampler(tracked).toString())
    expect(startY).not.toBeNull()

    // Reverse both categories and data: every label moves to the opposite
    // slot, so "Germany" travels the full height of the plot.
    const samples = await sampleDuringUpdate(
      page,
      {
        series: [{ data: [...DATA].reverse() }],
        xaxis: { categories: [...CATS].reverse() },
      },
      labelYSampler(tracked),
      700,
    )

    const clean = samples.filter((s) => !s.error && s.y != null)
    expect(clean.length).toBeGreaterThan(3)

    const endY = clean[clean.length - 1].y
    // The label actually moved to a new slot.
    expect(Math.abs(endY - startY)).toBeGreaterThan(20)

    // Mid-flight it sits strictly BETWEEN the old and new slot: proof it
    // tweened rather than jumping. Without the fix the first sample already
    // equals endY (instant snap), so no mid value exists.
    const lo = Math.min(startY, endY)
    const hi = Math.max(startY, endY)
    const mid = clean.filter(
      (s) => s.y > lo + (hi - lo) * 0.1 && s.y < hi - (hi - lo) * 0.1,
    )
    expect(mid.length).toBeGreaterThan(0)
  })
})

// dlKey stamped by the bar renderer for the tracked datum (single series 0).
const DL_KEY = '0::c:Germany'

// Turn on the opt-in data-label features, without animating this render, so
// the current labels get stamped (data:dlKey / data:dlVal) for the next update
// to capture.
async function enableDataLabelMotion(page) {
  await page.evaluate(async () => {
    await window.chart.updateOptions(
      {
        dataLabels: {
          enabled: true, // basic-bar ships with labels off
          animate: { enabled: true },
          countUp: { enabled: true },
        },
      },
      false,
      false,
    )
  })
}

test.describe('Bar chart race — data labels (opt-in)', () => {
  test('count-up: the value label passes through intermediate numbers', async ({
    page,
    loadChart,
  }) => {
    await loadChart('bar', 'basic-bar')
    await enableDataLabelMotion(page)

    // Germany starts at 1380 (same category order, only the value changes).
    const sampler = `() => {
      const el = document.querySelector(
        '.apexcharts-data-labels[data\\\\:dlKey="${DL_KEY}"] .apexcharts-datalabel'
      )
      const t = el ? (el.textContent || '').trim() : null
      return { v: t == null || t === '' ? null : parseFloat(t) }
    }`

    const samples = await sampleDuringUpdate(
      page,
      { series: [{ data: [400, 430, 448, 470, 540, 580, 690, 1100, 1200, 500] }] },
      sampler,
      700,
    )

    const clean = samples.filter((s) => !s.error && s.v != null && !isNaN(s.v))
    expect(clean.length).toBeGreaterThan(3)

    const endV = clean[clean.length - 1].v
    expect(endV).toBe(500) // lands exactly on the new value

    // Mid-flight it sits strictly between 500 and 1380: proof of the count-up.
    const mid = clean.filter((s) => s.v > 520 && s.v < 1360)
    expect(mid.length).toBeGreaterThan(0)
    // And the values are integers (default formatter + integer data).
    mid.forEach((s) => expect(Number.isInteger(s.v)).toBe(true))
  })

  test('ride: the value label group carries a non-zero translate mid-flight', async ({
    page,
    loadChart,
  }) => {
    await loadChart('bar', 'basic-bar')
    await enableDataLabelMotion(page)

    // Reverse categories + data so Germany's bar (and its label) moves slot.
    const sampler = `() => {
      const g = document.querySelector(
        '.apexcharts-data-labels[data\\\\:dlKey="${DL_KEY}"]'
      )
      const tf = g ? g.getAttribute('transform') : null
      let dy = 0
      if (tf) {
        const m = tf.match(/translate\\(\\s*(-?[0-9.]+)\\s+(-?[0-9.]+)/)
        if (m) dy = Math.abs(parseFloat(m[2]))
      }
      return { tf, dy }
    }`

    const samples = await sampleDuringUpdate(
      page,
      {
        series: [{ data: [...DATA].reverse() }],
        xaxis: { categories: [...CATS].reverse() },
      },
      sampler,
      700,
    )

    const clean = samples.filter((s) => !s.error)
    expect(clean.length).toBeGreaterThan(3)

    // At some point mid-transition the group is translated away from its final
    // position (riding); by the end the translate has collapsed back to ~0.
    const rode = clean.filter((s) => s.dy > 5)
    expect(rode.length).toBeGreaterThan(0)
    expect(clean[clean.length - 1].dy).toBeLessThan(2)
  })
})

test.describe('Bar chart race — bars stay in sync with the axis labels', () => {
  test('a bar and its category label move together (no per-bar stagger on reorder)', async ({
    page,
    loadChart,
  }) => {
    await loadChart('bar', 'basic-bar')

    // "South Korea" starts at slot 0 (top) and, after the reverse, lands at the
    // last slot — the worst case for stagger, since its bar draws with the
    // largest per-index delay. With the stagger disabled on a reorder, the bar
    // and its label ride the same clock, so their gap stays ~constant.
    const sampler = `() => {
      const lbls = [...document.querySelectorAll('.apexcharts-yaxis-texts-g text')]
      const lab = lbls.find(
        (n) => (n.querySelector('tspan')?.textContent || '').trim() === 'South Korea'
      )
      const bar = [...document.querySelectorAll('.apexcharts-bar-area')].find(
        (b) => b.getAttribute('data:pathKey') === 'c:South Korea'
      )
      let labY = lab ? parseFloat(lab.getAttribute('y')) : null
      let barY = null
      if (bar) { try { const b = bar.getBBox(); barY = b.y + b.height / 2 } catch (e) {} }
      return { delta: labY != null && barY != null ? labY - barY : null }
    }`

    const samples = await sampleDuringUpdate(
      page,
      {
        series: [{ data: [...DATA].reverse() }],
        xaxis: { categories: [...CATS].reverse() },
      },
      sampler,
      600,
    )

    const deltas = samples.filter((s) => !s.error && s.delta != null).map((s) => s.delta)
    expect(deltas.length).toBeGreaterThan(5)

    // The bar-to-label gap barely varies over the whole transition. Without the
    // fix the staggered bar lags its label by well over 200px mid-flight.
    const spread = Math.max(...deltas) - Math.min(...deltas)
    expect(spread).toBeLessThan(30)
  })
})

test.describe('Bar chart race — vertical column x-axis labels', () => {
  // basic-column.html: vertical columns, short (unrotated) category labels.
  const COL_CATS = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
  const COL_DATA = [44, 55, 57, 56, 61, 58, 63, 60, 66]

  test('a category label rides its x position on a reorder', async ({
    page,
    loadChart,
  }) => {
    await loadChart('column', 'basic-column')

    // "Feb" starts at the leftmost slot and, after the reverse, lands at the
    // rightmost — the x-axis analogue of the horizontal-bar y ride.
    const sampler = `() => {
      const nodes = [...document.querySelectorAll('.apexcharts-xaxis-texts-g text')]
      const el = nodes.find(
        (n) => (n.querySelector('tspan')?.textContent || '').trim() === 'Feb'
      )
      return { x: el ? parseFloat(el.getAttribute('x')) : null }
    }`

    const startX = await page.evaluate((s) => {
      const fn = new Function('return (' + s + ')')()
      return fn().x
    }, sampler)
    expect(startX).not.toBeNull()

    const samples = await sampleDuringUpdate(
      page,
      {
        series: [{ data: [...COL_DATA].reverse() }],
        xaxis: { categories: [...COL_CATS].reverse() },
      },
      sampler,
      600,
    )

    const clean = samples.filter((s) => !s.error && s.x != null)
    expect(clean.length).toBeGreaterThan(3)

    const endX = clean[clean.length - 1].x
    expect(Math.abs(endX - startX)).toBeGreaterThan(50) // actually moved slots

    // Strictly between old and new x mid-flight → it tweened, not snapped.
    const lo = Math.min(startX, endX)
    const hi = Math.max(startX, endX)
    const mid = clean.filter(
      (s) => s.x > lo + (hi - lo) * 0.15 && s.x < hi - (hi - lo) * 0.15,
    )
    expect(mid.length).toBeGreaterThan(0)
  })

  test('a ROTATED category label rides via a composed translate on a reorder', async ({
    page,
    loadChart,
  }) => {
    await loadChart('column', 'basic-column')

    // Long names force the x-axis labels to rotate (transform bakes in the
    // position), the case that used to snap. Set them un-animated first.
    const names = [
      'United States', 'China', 'Germany', 'Japan', 'France',
      'United Kingdom', 'India', 'Brazil', 'Canada', 'Italy',
    ]
    const vals = [400, 430, 448, 470, 540, 580, 690, 1100, 1200, 1380]
    await page.evaluate(
      async ({ names, vals }) => {
        await window.chart.updateOptions(
          { xaxis: { categories: names }, series: [{ data: vals }] },
          false,
          false,
        )
      },
      { names, vals },
    )

    // Confirm the tracked label really is rotated (else the test proves nothing).
    const isRotated = await page.evaluate(() => {
      const el = [...document.querySelectorAll('.apexcharts-xaxis-texts-g text')].find(
        (n) => (n.querySelector('tspan')?.textContent || '').trim() === 'United States',
      )
      return !!el && /rotate\(/.test(el.getAttribute('transform') || '')
    })
    expect(isRotated).toBe(true)

    // Read the leading translate offset out of the label's transform each frame.
    const sampler = `() => {
      const el = [...document.querySelectorAll('.apexcharts-xaxis-texts-g text')].find(
        (n) => (n.querySelector('tspan')?.textContent || '').trim() === 'United States'
      )
      const tf = el ? el.getAttribute('transform') : null
      let tx = 0
      if (tf) { const m = tf.match(/translate\\(\\s*(-?[0-9.]+)/); if (m) tx = Math.abs(parseFloat(m[1])) }
      return { tx }
    }`

    const samples = await sampleDuringUpdate(
      page,
      {
        series: [{ data: [...vals].reverse() }],
        xaxis: { categories: [...names].reverse() },
      },
      sampler,
      600,
    )

    const clean = samples.filter((s) => !s.error)
    // Mid-flight the label is translated away from its final slot (riding)...
    expect(clean.filter((s) => s.tx > 5).length).toBeGreaterThan(0)
    // ...and by the end the translate has collapsed back to the bare rotate.
    expect(clean[clean.length - 1].tx).toBeLessThan(1)
  })
})
