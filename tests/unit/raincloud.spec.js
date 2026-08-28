import { createChartWithOptions } from './utils/utils.js'
import { fiveNumberSummary } from '../../src/charts/common/Stats'
import {
  registerSeriesTransform,
  unregisterSeriesTransform,
} from '../../src/modules/SeriesTransformRegistry'
import {
  crossSign,
  laneFrac,
  resolveLanes,
} from '../../src/charts/Violin'
// Side effect: registers the 'raincloud' series transform (the opt-in
// feature — deliberately NOT part of src/entries/full.js).
import { raincloudTransform } from '../../src/features/raincloud'

// ---------------------------------------------------------------------------
// Deterministic samples (no Math.random — assertions need stable statistics).
// ---------------------------------------------------------------------------

/** LCG sample in roughly 10..30 with two far outliers, so 'tukey' and
 *  'minmax' whiskers genuinely differ. */
function skewed(n = 40, seed = 11) {
  const out = []
  let s = seed
  for (let i = 0; i < n; i++) {
    s = (s * 16807) % 2147483647
    out.push(10 + (s % 200) / 10)
  }
  out.push(120, 140)
  return out
}

const density = [
  [0, 0.02],
  [1, 0.1],
  [2, 0.35],
  [3, 0.5],
  [4, 0.35],
  [5, 0.1],
  [6, 0.02],
]

function raincloudChart(opts = {}) {
  return createChartWithOptions({
    chart: { type: 'raincloud', width: 600, height: 400, ...opts.chart },
    series: opts.series || [
      {
        name: 'A',
        data: [
          { x: 'G1', points: skewed(40, 11) },
          { x: 'G2', points: skewed(40, 29) },
        ],
      },
    ],
    plotOptions: opts.plotOptions || {},
    ...opts.extra,
  })
}

// Path helpers. Body and box paths are absolute M/L/C commands, so their
// numbers strictly alternate x,y. Jitter paths pack circle sub-paths whose
// arc commands break that, so their centers are read off the M+radius form.

function coordsOf(d, axis /* 0 = x, 1 = y */) {
  const nums = (d.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi) || []).map(Number)
  return nums.filter((_, i) => i % 2 === axis)
}

function circleCenters(d) {
  const out = []
  const re = /M ([-\d.eE+]+) ([-\d.eE+]+) a ([-\d.eE+]+)/g
  let m
  while ((m = re.exec(d))) {
    out.push({ x: Number(m[1]) + Number(m[3]), y: Number(m[2]) })
  }
  return out
}

function layerPaths() {
  const all = [...document.querySelectorAll('.apexcharts-violin-area')]
  return {
    bodies: all.filter(
      (p) => !p.classList.contains('apexcharts-raincloud-box'),
    ),
    boxes: all.filter((p) => p.classList.contains('apexcharts-raincloud-box')),
    rains: [...document.querySelectorAll('.apexcharts-violin-points')],
  }
}

// ---------------------------------------------------------------------------

describe('raincloud — alias plumbing and preset', () => {
  test('chart.type raincloud renders through violin and keeps the request', () => {
    const chart = raincloudChart()
    expect(chart.w.config.chart.type).toBe('violin')
    expect(chart.w.config.chart.requestedType).toBe('raincloud')
  })

  test('vertical preset: cloud right, rain left, tukey box shown', () => {
    const chart = raincloudChart()
    const v = chart.w.config.plotOptions.violin
    expect(v.side).toBe('right')
    expect(v.points.position).toBe('left')
    expect(v.box.show).toBe(true)
    expect(v.box.whiskers).toBe('tukey')
  })

  test('horizontal preset mirrors: cloud top, rain bottom', () => {
    const chart = raincloudChart({
      plotOptions: { bar: { horizontal: true } },
    })
    const v = chart.w.config.plotOptions.violin
    expect(v.side).toBe('top')
    expect(v.points.position).toBe('bottom')
  })

  test('every preset stays user-overridable', () => {
    const chart = raincloudChart({
      plotOptions: {
        violin: { side: 'left', box: { show: false, whiskers: 'minmax' } },
      },
    })
    const v = chart.w.config.plotOptions.violin
    expect(v.side).toBe('left')
    expect(v.box.show).toBe(false)
    expect(v.box.whiskers).toBe('minmax')
  })
})

describe('raincloud — transform', () => {
  test('derives density + summary + keeps the sample on each datum', () => {
    const chart = raincloudChart()
    const vd = chart.w.violinData
    expect(vd.seriesViolinDensity[0][0].values.length).toBeGreaterThan(10)
    expect(vd.seriesViolinPoints[0][0]).toEqual(skewed(40, 11))
    const expected = fiveNumberSummary(skewed(40, 11), {
      whiskers: 'tukey',
    }).summary
    expect(vd.seriesViolinSummary[0][0]).toEqual(expected)
  })

  test('is idempotent: a second parse of its own output changes nothing', () => {
    const chart = raincloudChart()
    const first = chart.w.violinData.seriesViolinSummary[0].map((s) => [...s])
    const nodesBefore =
      chart.w.violinData.seriesViolinDensity[0][0].values.length
    chart.update() // re-parses config.series, which now holds transform output
    expect(chart.w.violinData.seriesViolinSummary[0]).toEqual(first)
    expect(chart.w.violinData.seriesViolinDensity[0][0].values.length).toBe(
      nodesBefore,
    )
    // the sample was not nested or re-wrapped
    expect(chart.w.violinData.seriesViolinPoints[0][0]).toEqual(skewed(40, 11))
  })

  test('updateOptions on box.whiskers re-derives the summary', async () => {
    const chart = raincloudChart()
    const tukeyHigh = chart.w.violinData.seriesViolinSummary[0][0][4]
    await chart.updateOptions({
      plotOptions: { violin: { box: { whiskers: 'minmax' } } },
    })
    const minmaxHigh = chart.w.violinData.seriesViolinSummary[0][0][4]
    expect(minmaxHigh).toBe(140) // the far outlier
    expect(minmaxHigh).not.toBe(tukeyHigh)
  })

  test('a hand-supplied summary and density pass through untouched', () => {
    const summary = [0, 1, 2, 3, 4]
    const chart = raincloudChart({
      series: [
        {
          name: 'A',
          data: [{ x: 'G1', y: { density, points: [1, 2, 5, 9], summary } }],
        },
      ],
    })
    // the sample says otherwise, but the supplied statistics win
    expect(chart.w.violinData.seriesViolinSummary[0][0]).toEqual(summary)
    expect(chart.w.violinData.seriesViolinDensity[0][0].values).toEqual([
      0, 1, 2, 3, 4, 5, 6,
    ])
  })

  test('a hand-supplied density gets only the missing summary derived', () => {
    const pts = skewed(30, 7)
    const chart = raincloudChart({
      series: [{ name: 'A', data: [{ x: 'G1', y: { density, points: pts } }] }],
    })
    // density preserved as given...
    expect(chart.w.violinData.seriesViolinDensity[0][0].values).toEqual([
      0, 1, 2, 3, 4, 5, 6,
    ])
    // ...summary derived from the sample
    const expected = fiveNumberSummary(pts, { whiskers: 'tukey' }).summary
    expect(chart.w.violinData.seriesViolinSummary[0][0]).toEqual(expected)
  })

  test('without the feature the chart warns (naming both routes) and blanks', () => {
    unregisterSeriesTransform('raincloud')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const chart = raincloudChart()
      const messages = warn.mock.calls.map((c) => c[0]).join('\n')
      expect(messages).toContain('features/raincloud')
      expect(messages).toContain('dist/features/raincloud.js')
      expect(chart.w.config.series[0].data).toEqual([])
    } finally {
      warn.mockRestore()
      registerSeriesTransform('raincloud', raincloudTransform)
    }
  })
})

describe('raincloud — lane partitioning (resolveLanes)', () => {
  test('crossSign maps side tokens to screen signs', () => {
    expect(crossSign('right')).toBe(1)
    expect(crossSign('bottom')).toBe(1)
    expect(crossSign('left')).toBe(-1)
    expect(crossSign('top')).toBe(-1)
    expect(crossSign('both')).toBe(0)
    expect(crossSign(undefined)).toBe(0)
  })

  test('laneFrac parses percent strings and clamps to [0, 0.5]', () => {
    expect(laneFrac('40%', 0.1)).toBe(0.4)
    expect(laneFrac(0.15, 0.1)).toBe(0.15)
    expect(laneFrac('90%', 0.1)).toBe(0.5)
    expect(laneFrac('nope', 0.1)).toBe(0.1)
    expect(laneFrac(undefined, 0.1)).toBe(0.1)
  })

  test('default raincloud split: rain 40 / box 15 / cloud 45, edge to edge', () => {
    const H = 100
    const l = resolveLanes({
      halfExtent: H,
      cloudSign: 1,
      rainSign: -1,
      boxFrac: 0.15,
      rainFrac: 0.4,
    })
    expect(l.cloudMaxPx).toBeCloseTo(90) // 2 * 0.45 * H
    expect(l.cloudBaseOff).toBeCloseTo(10) // baseline just right of center
    // box adjacent to the baseline: [-20, +10]
    expect(l.boxCenterOff).toBeCloseTo(-5)
    expect(l.boxHalfPx).toBeCloseTo(15)
    // rain adjacent to the box: [-100, -20]
    expect(l.rainCenterOff).toBeCloseTo(-60)
    expect(l.rainHalfPx).toBeCloseTo(40)
  })

  test('a hidden box hands its lane back to the cloud', () => {
    const l = resolveLanes({
      halfExtent: 100,
      cloudSign: 1,
      rainSign: -1,
      boxFrac: 0,
      rainFrac: 0.4,
    })
    expect(l.cloudMaxPx).toBeCloseTo(120)
    expect(l.cloudBaseOff).toBeCloseTo(-20)
    expect(l.rainCenterOff).toBeCloseTo(-60)
  })

  test('symmetric side keeps the classic violin geometry', () => {
    const l = resolveLanes({
      halfExtent: 100,
      cloudSign: 0,
      rainSign: 0,
      boxFrac: 0.15,
      rainFrac: 0.4,
    })
    expect(l.cloudBaseOff).toBe(0)
    expect(l.cloudMaxPx).toBe(100)
    expect(l.boxCenterOff).toBe(0)
    expect(l.rainCenterOff).toBe(0)
    expect(l.rainHalfPx).toBe(100)
  })
})

describe('raincloud — rendered geometry', () => {
  test('vertical: rain left of box, box adjacent to the cloud baseline', () => {
    raincloudChart({
      series: [{ name: 'A', data: [{ x: 'G1', points: skewed(40, 11) }] }],
    })
    const { bodies, boxes, rains } = layerPaths()
    expect(bodies.length).toBe(1)
    expect(boxes.length).toBe(2) // whiskers + box per category
    expect(rains.length).toBe(1)

    const bodyXs = coordsOf(bodies[0].getAttribute('d'), 0)
    const boxXs = boxes.flatMap((b) => coordsOf(b.getAttribute('d'), 0))
    const rainXs = circleCenters(rains[0].getAttribute('d')).map((c) => c.x)
    expect(rainXs.length).toBeGreaterThan(10)

    const bodyMin = Math.min(...bodyXs)
    const boxMax = Math.max(...boxXs)
    const boxMin = Math.min(...boxXs)

    // one-sided body: the flat baseline is its left edge, shared with the
    // box lane's right edge
    expect(bodyMin).toBeCloseTo(boxMax, 4)
    // every rain dot stays left of the box lane
    expect(Math.max(...rainXs)).toBeLessThan(boxMin + 0.001)
  })

  test('horizontal: cloud above the box, rain below it', () => {
    raincloudChart({
      series: [{ name: 'A', data: [{ x: 'G1', points: skewed(40, 11) }] }],
      plotOptions: { bar: { horizontal: true } },
    })
    const { bodies, boxes, rains } = layerPaths()
    const bodyYs = coordsOf(bodies[0].getAttribute('d'), 1)
    const boxYs = boxes.flatMap((b) => coordsOf(b.getAttribute('d'), 1))
    const rainYs = circleCenters(rains[0].getAttribute('d')).map((c) => c.y)

    // screen y grows downward: cloud (top) ends where the box begins
    expect(Math.max(...bodyYs)).toBeCloseTo(Math.min(...boxYs), 4)
    expect(Math.min(...rainYs)).toBeGreaterThan(Math.max(...boxYs) - 0.001)
  })

  test('box paths carry the raincloud class and same j as their body', () => {
    raincloudChart()
    const { boxes } = layerPaths()
    expect(boxes.length).toBe(4) // 2 categories x (whiskers + box)
    boxes.forEach((b) => {
      expect(['0', '1']).toContain(b.getAttribute('j'))
    })
  })

  test('hiding a layer hands its lane back: no box widens the cloud, no rain leaves no dead strip', () => {
    // cloud + rain only (the half-violin + jitter strip variant)
    raincloudChart({
      series: [{ name: 'A', data: [{ x: 'G1', points: skewed(40, 11) }] }],
      plotOptions: { violin: { box: { show: false } } },
    })
    let layers = layerPaths()
    expect(layers.boxes.length).toBe(0)
    expect(layers.rains.length).toBe(1)
    const noBoxRainXs = circleCenters(
      layers.rains[0].getAttribute('d'),
    ).map((c) => c.x)
    const noBoxBodyMin = Math.min(
      ...coordsOf(layers.bodies[0].getAttribute('d'), 0),
    )
    // rain lane now touches the cloud baseline directly
    expect(Math.max(...noBoxRainXs)).toBeLessThan(noBoxBodyMin + 0.001)

    // cloud + box only (no rain): the rain lane must not survive as a gap
    raincloudChart({
      series: [{ name: 'A', data: [{ x: 'G1', points: skewed(40, 11) }] }],
      plotOptions: { violin: { points: { show: false } } },
    })
    layers = layerPaths()
    expect(layers.rains.length).toBe(0)
    expect(layers.boxes.length).toBe(2)
    const boxXs = layers.boxes.flatMap((b) => coordsOf(b.getAttribute('d'), 0))
    const bodyXs = coordsOf(layers.bodies[0].getAttribute('d'), 0)
    // adjacency preserved after the reflow...
    expect(Math.min(...bodyXs)).toBeCloseTo(Math.max(...boxXs), 4)
    // ...and the cloud is WIDER than the default three-lane layout (it
    // absorbed the 40% rain lane: 2 * 0.85 vs 2 * 0.45 of the half slot)
    const cloudW = Math.max(...bodyXs) - Math.min(...bodyXs)
    const boxW = Math.max(...boxXs) - Math.min(...boxXs)
    expect(cloudW).toBeGreaterThan(boxW * 4)
  })

  test('two series render side by side and hideSeries collapses cleanly', () => {
    const chart = raincloudChart({
      series: [
        { name: 'A', data: [{ x: 'G1', points: skewed(40, 11) }] },
        { name: 'B', data: [{ x: 'G1', points: skewed(40, 29) }] },
      ],
    })
    const { bodies } = layerPaths()
    expect(bodies.length).toBe(2)
    const aXs = coordsOf(bodies[0].getAttribute('d'), 0)
    const bXs = coordsOf(bodies[1].getAttribute('d'), 0)
    // disjoint slots: series A's cloud ends before series B's begins
    expect(Math.max(...aXs)).toBeLessThanOrEqual(Math.min(...bXs) + 0.001)

    expect(() => chart.hideSeries('B')).not.toThrow()
    expect(chart.w.globals.collapsedSeriesIndices).toContain(1)
  })
})

describe('raincloud — type change handover', () => {
  test('raincloud -> violin drops the half-body, box and rain lane', async () => {
    const chart = raincloudChart()
    await chart.updateOptions({ chart: { type: 'violin' } })
    const v = chart.w.config.plotOptions.violin
    expect(chart.w.config.chart.type).toBe('violin')
    // the type-owned leaves hand back to the violin's own choices
    expect(v.side ?? 'both').toBe('both')
    expect(v.box?.show ?? false).toBe(false)
    expect(v.points?.position ?? 'center').toBe('center')
    expect(document.querySelector('.apexcharts-raincloud-box')).toBeNull()
    // the tooltip is the violin's again
    const html = chart.w.config.tooltip.custom({
      seriesIndex: 0,
      dataPointIndex: 0,
      w: chart.w,
    })
    expect(html).toContain('Min:')
    expect(html).not.toContain('Median')
  })

  test('violin -> raincloud acquires the three-layer preset', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'violin', width: 600, height: 400 },
      series: [{ name: 'A', data: [{ x: 'G1', points: skewed(40, 11) }] }],
    })
    await chart.updateOptions({ chart: { type: 'raincloud' } })
    const v = chart.w.config.plotOptions.violin
    expect(chart.w.config.chart.type).toBe('violin')
    expect(chart.w.config.chart.requestedType).toBe('raincloud')
    expect(v.side).toBe('right')
    expect(v.box.show).toBe(true)
    expect(
      document.querySelectorAll('.apexcharts-raincloud-box').length,
    ).toBe(2)
  })
})

describe('raincloud — tooltip', () => {
  test('shows the five-number summary and the observation count', () => {
    const chart = raincloudChart()
    const html = chart.w.config.tooltip.custom({
      seriesIndex: 0,
      dataPointIndex: 0,
      w: chart.w,
    })
    expect(html).toContain('Median')
    expect(html).toContain('Q1')
    expect(html).toContain('Q3')
    expect(html).toContain('Whisker')
    expect(html).toContain('Observations')
    expect(html).toContain('42') // n = 40 LCG values + 2 outliers
  })

  test('falls back to the violin tooltip when a datum has no summary', () => {
    const chart = raincloudChart({
      series: [
        // precomputed density, no sample, box has nothing to draw
        { name: 'A', data: [{ x: 'G1', y: { density } }] },
      ],
    })
    expect(chart.w.violinData.seriesViolinSummary[0][0]).toBeNull()
    const html = chart.w.config.tooltip.custom({
      seriesIndex: 0,
      dataPointIndex: 0,
      w: chart.w,
    })
    expect(html).toContain('Min:')
    expect(html).toContain('Max:')
    expect(html).not.toContain('Median')
  })
})
