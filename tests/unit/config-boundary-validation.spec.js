/**
 * The config/data boundary: what ApexCharts does with a value that is
 * syntactically plausible and semantically wrong.
 *
 * One reporter filed #5323-#5328 in half an hour, all of them the same shape:
 * a value the library neither coerced nor complained about, and the reader left
 * to work out from a blank chart or a stray tooltip row that it had been
 * dropped. These are the six, kept together because the fixes share a seam.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import DateTime from '../../src/utils/DateTime.js'
import './__mocks__/ResizeObserver.js'

/** @type {any} */
let warn

beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  warn.mockRestore()
})

/** Build (but do not render) a chart on a fresh host element. */
function build(options) {
  document.body.innerHTML = '<div id="chart" />'
  options.chart = { ...(options.chart || {}), animations: { enabled: false } }
  return new ApexCharts(document.querySelector('#chart'), options)
}

async function render(options) {
  const chart = build(options)
  await chart.render()
  return chart
}

/** Everything console.warn was called with, joined. */
const warnings = () => warn.mock.calls.map((c) => c.join(' '))

describe('#5323: a non-numeric z does not make the chart three-dimensional', () => {
  const xyWithZ = (z) => ({
    chart: { type: 'line' },
    series: [
      {
        name: 'Sales',
        data: [
          { x: 'Mon', y: 1, z },
          { x: 'Tue', y: 2, z },
        ],
      },
    ],
  })

  it.each([
    ['null', null],
    ['NaN', NaN],
    ['an empty string', ''],
  ])('%s leaves isDataXYZ false', async (_label, z) => {
    const chart = await render(xyWithZ(z))
    expect(chart.w.axisFlags.isDataXYZ).toBe(false)
    chart.destroy()
  })

  it('keeps the Size row off the tooltip even with a z formatter set', async () => {
    // The null case was invisible by default and appeared the moment a
    // tooltip.z.formatter was added, which is the form the report hit.
    const chart = await render({
      ...xyWithZ(null),
      tooltip: { z: { formatter: () => 'SHOULD NOT APPEAR' } },
    })
    const tooltip = chart.ctx.tooltip
    const values = tooltip.tooltipLabels.getValuesToPrint({ i: 0, j: 0 })
    expect(values.zVal).toBe(null)
    chart.destroy()
  })

  it('reports each point its own z when only some points carry one', async () => {
    // seriesZ is read by data-point index. Pushing only the z values that
    // exist shifted every later point's size onto an earlier point: Mon
    // reported Tue's 99.
    const chart = await render({
      chart: { type: 'bubble' },
      series: [
        {
          name: 'Sales',
          data: [
            { x: 1, y: 1 },
            { x: 2, y: 2, z: 99 },
          ],
        },
      ],
    })
    expect(chart.w.seriesData.seriesZ[0]).toEqual([null, 99])
    chart.destroy()
  })

  it('allocates nothing for a series that carries no z at all', async () => {
    const chart = await render({
      chart: { type: 'line' },
      series: [
        {
          name: 'S',
          data: [
            { x: 1, y: 1 },
            { x: 2, y: 2 },
          ],
        },
      ],
    })
    expect(chart.w.seriesData.seriesZ[0]).toEqual([])
    chart.destroy()
  })

  it('still sizes a real bubble chart, including a numeric string z', async () => {
    const chart = await render({
      chart: { type: 'bubble' },
      series: [
        {
          name: 'B',
          data: [
            { x: 1, y: 1, z: 10 },
            { x: 2, y: 2, z: '20' },
          ],
        },
      ],
    })
    expect(chart.w.axisFlags.isDataXYZ).toBe(true)
    expect(chart.w.seriesData.seriesZ[0]).toEqual([10, 20])
    expect(chart.w.globals.minZ).toBe(10)
    expect(chart.w.globals.maxZ).toBe(20)
    chart.destroy()
  })

  it('aligns z in the [x, y, z] array form too', async () => {
    const chart = await render({
      chart: { type: 'bubble' },
      series: [
        {
          name: 'B',
          data: [
            [1, 1],
            [2, 2, 20],
            [3, 3],
          ],
        },
      ],
    })
    expect(chart.w.seriesData.seriesZ[0]).toEqual([null, 20, null])
    chart.destroy()
  })
})

describe('#5324: formatters get the opts their declaration promises', () => {
  it("passes a pie's dataLabels formatter a dataPointIndex and w", async () => {
    let seen = null
    const chart = await render({
      chart: { type: 'pie' },
      labels: ['a', 'b'],
      series: [30, 70],
      dataLabels: {
        formatter: (val, opts) => {
          seen = opts
          return String(val)
        },
      },
    })
    expect(seen).not.toBe(null)
    expect(typeof seen.dataPointIndex).toBe('number')
    expect(seen.w).toBe(chart.w)
    chart.destroy()
  })

  it("passes a pie's tooltip.y formatter a nested w, keeping the spread", async () => {
    const chart = await render({
      chart: { type: 'pie' },
      labels: ['a', 'b'],
      series: [30, 70],
      tooltip: { y: { formatter: (val) => String(val) } },
    })
    let seen = null
    const formatters = chart.ctx.tooltip.tooltipLabels.getFormatters(0)
    const original = formatters.yLbFormatter
    chart.ctx.tooltip.tooltipLabels.getFormatters = () => ({
      ...formatters,
      yLbFormatter: (val, opts) => {
        seen = opts
        return original(val, opts)
      },
    })
    chart.ctx.tooltip.tooltipLabels.computeSeriesRow({
      i: 0,
      j: null,
      tIndex: 0,
      shared: false,
      e: null,
      basePColor: '#000',
    })
    expect(seen.w).toBe(chart.w)
    // the long-standing spread stays, so opts.config keeps working
    expect(seen.config).toBe(chart.w.config)
    expect(seen.dataPointIndex).toBe(0)
    chart.destroy()
  })

  it('never hands the x-label formatter a value outside its declared type', async () => {
    // A category axis converted to numeric can put a tick where no category
    // sits; the formatter used to be called with the resulting undefined.
    const seen = []
    const chart = await render({
      chart: { type: 'line', zoom: { enabled: true } },
      series: [{ name: 'revenue', data: [1, 2, 3] }],
      xaxis: {
        categories: ['a', 'b', 'c'],
        labels: {
          formatter: (value) => {
            seen.push(value)
            // exactly what a consumer writes against (value: string | number)
            return value.toString()
          },
        },
      },
    })
    expect(seen.length).toBeGreaterThan(0)
    expect(seen.every((v) => v !== undefined && v !== null)).toBe(true)
    chart.destroy()
  })

  it('keeps a numeric series name a number', async () => {
    const chart = await render({
      chart: { type: 'line' },
      series: [{ name: 2024, data: [1, 2, 3] }],
    })
    expect(chart.w.seriesData.seriesNames[0]).toBe(2024)
    chart.destroy()
  })

  it('reports the merged config from getState()', async () => {
    const chart = await render({
      chart: { type: 'line' },
      series: [{ name: 'S', data: [1, 2, 3] }],
      stroke: { width: 7 },
    })
    expect(chart.getState().config.stroke.width).toBe(7)
    expect(chart.getState().config).toBe(chart.w.config)
    chart.destroy()
  })
})

describe('#5325: an unknown chart.type is named, not crashed on', () => {
  it.each(['banana', 'Line', 'donut ', 'Bar'])(
    'rejects %j with a message naming the option and the value',
    (type) => {
      expect(() =>
        build({ chart: { type }, series: [{ data: [1, 2, 3] }] }),
      ).toThrow(/unknown chart\.type/)
      expect(() =>
        build({ chart: { type }, series: [{ data: [1, 2, 3] }] }),
      ).toThrow(new RegExp(`"${type}"`))
    },
  )

  it('suggests the intended type for a near miss', () => {
    expect(() => build({ chart: { type: 'Line' }, series: [] })).toThrow(
      /Did you mean "line"\?/,
    )
    expect(() => build({ chart: { type: 'donut ' }, series: [] })).toThrow(
      /Did you mean "donut"\?/,
    )
  })

  it('lists the known types when there is nothing close', () => {
    let message = ''
    try {
      build({ chart: { type: 'banana' }, series: [] })
    } catch (e) {
      message = e.message
    }
    expect(message).not.toMatch(/Did you mean/)
    expect(message).toMatch(/Known types:/)
    expect(message).toContain('treemap')
  })

  it.each([
    ['an absent type', undefined],
    ['an empty string', ''],
    ['null', null],
  ])('renders %s as a line chart', async (_label, type) => {
    const chart = await render({
      chart: type === undefined ? {} : { type },
      series: [{ name: 'S', data: [10, 41, 35] }],
    })
    expect(chart.w.config.chart.type).toBe('line')
    expect(
      document.querySelectorAll('.apexcharts-series path').length,
    ).toBeGreaterThan(0)
    chart.destroy()
  })

  it("renders chart.type 'column' as a vertical bar", async () => {
    const chart = await render({
      chart: { type: 'column' },
      series: [{ name: 'S', data: [10, 41, 35] }],
      xaxis: { categories: ['A', 'B', 'C'] },
    })
    expect(chart.w.config.chart.type).toBe('bar')
    // a plain synonym, so it leaves no alias trace behind
    expect(chart.w.config.chart.requestedType).toBeUndefined()
    expect(chart.w.config.plotOptions.bar.horizontal).toBe(false)
    expect(document.querySelectorAll('.apexcharts-series path').length).toBe(3)
    chart.destroy()
  })

  it('rejects an unknown type on updateOptions too', async () => {
    const chart = await render({
      chart: { type: 'line' },
      series: [{ name: 'S', data: [1, 2, 3] }],
    })
    await expect(chart.updateOptions({ chart: { type: 'banana' } })).rejects
      .toThrow(/unknown chart\.type/)
    chart.destroy()
  })

  it('leaves the type alone when an update does not mention it', async () => {
    const chart = await render({
      chart: { type: 'bar' },
      series: [{ name: 'S', data: [1, 2, 3] }],
    })
    await chart.updateOptions({ chart: { height: 300 } })
    expect(chart.w.config.chart.type).toBe('bar')
    chart.destroy()
  })
})

describe('#5326: unknown top-level option keys are reported', () => {
  it('names every unrecognized key once', async () => {
    const chart = await render({
      chart: { type: 'bar' },
      series: [{ name: 'S', data: [10, 41, 35] }],
      zaxis: { title: { text: 'not an ApexCharts option' } },
      totallyMadeUpKey: 42,
    })
    const unknownWarnings = warnings().filter((m) =>
      m.includes('unrecognized top-level'),
    )
    expect(unknownWarnings).toHaveLength(1)
    expect(unknownWarnings[0]).toContain('zaxis')
    expect(unknownWarnings[0]).toContain('totallyMadeUpKey')
    chart.destroy()
  })

  it('suggests the real option a typo was reaching for', async () => {
    const chart = await render({
      chart: { type: 'bar' },
      series: [{ name: 'S', data: [1] }],
      xaxsi: { title: { text: 'a typo of xaxis' } },
    })
    expect(warnings().join('\n')).toMatch(/xaxsi \(did you mean "xaxis"\?\)/)
    chart.destroy()
  })

  it('keeps the key, so a chart that shipped with one still renders', async () => {
    const chart = await render({
      chart: { type: 'bar' },
      series: [{ name: 'S', data: [10, 41, 35] }],
      zaxis: { title: { text: 'kept' } },
    })
    expect(chart.w.config.zaxis.title.text).toBe('kept')
    expect(document.querySelectorAll('.apexcharts-series path').length).toBe(3)
    chart.destroy()
  })

  it('says nothing about a config that uses only real options', async () => {
    const chart = await render({
      chart: { type: 'bar' },
      series: [{ name: 'S', data: [10, 41, 35] }],
      xaxis: { categories: ['A', 'B', 'C'], title: { text: 'real' } },
      yaxis: { min: 0 },
      dataLabels: { enabled: false },
      theme: { mode: 'light' },
    })
    expect(
      warnings().filter((m) => m.includes('unrecognized top-level')),
    ).toHaveLength(0)
    chart.destroy()
  })
})

describe('#5327: datetime bounds accept the forms an x value accepts', () => {
  const data = [
    '2021-12-20',
    '2021-12-27',
    '2022-01-03',
    '2022-01-10',
    '2022-01-17',
  ].map((x, i) => ({ x, y: [10, 40, 25, 60, 35][i] }))

  const windowed = async (bounds) => {
    const chart = await render({
      chart: { type: 'line' },
      series: [{ name: 'value', data }],
      xaxis: { type: 'datetime', ...bounds },
    })
    const got = { minX: chart.w.globals.minX, maxX: chart.w.globals.maxX }
    chart.destroy()
    return got
  }

  it('narrows the axis the same way for timestamps, strings and Dates', async () => {
    const byTimestamp = await windowed({
      min: Date.parse('2021-12-28'),
      max: Date.parse('2022-01-04'),
    })
    expect(await windowed({ min: '2021-12-28', max: '2022-01-04' })).toEqual(
      byTimestamp,
    )
    expect(
      await windowed({
        min: new Date('2021-12-28'),
        max: new Date('2022-01-04'),
      }),
    ).toEqual(byTimestamp)

    // and that window really is narrower than the data's own extent
    const full = await windowed({})
    expect(byTimestamp.minX).toBeGreaterThan(full.minX)
    expect(byTimestamp.maxX).toBeLessThan(full.maxX)
  })

  it('reports a bound it cannot read and scales to the data instead', async () => {
    const full = await windowed({})
    expect(await windowed({ min: 'not a date' })).toEqual(full)
    expect(warnings().join('\n')).toMatch(/xaxis\.min cannot be read/)
  })

  it('normalizes a bound arriving through updateOptions', async () => {
    const chart = await render({
      chart: { type: 'line' },
      series: [{ name: 'value', data }],
      xaxis: { type: 'datetime' },
    })
    await chart.updateOptions({ xaxis: { min: '2021-12-28' } })
    expect(chart.w.config.xaxis.min).toBe(
      new DateTime(chart.w).parseDate('2021-12-28'),
    )
    expect(chart.w.globals.minX).toBe(chart.w.config.xaxis.min)
    chart.destroy()
  })
})

describe('#5328: a numeric string bound does not collapse the axis', () => {
  const scaleWith = async (yaxis) => {
    const chart = await render({
      chart: { type: 'line' },
      series: [{ name: 'value', data: [55, 70, 62, 88, 75] }],
      xaxis: { categories: ['a', 'b', 'c', 'd', 'e'] },
      yaxis,
    })
    const scale = chart.w.globals.yAxisScale[0]
    chart.destroy()
    return scale
  }

  it("reads yaxis.min: '50' as yaxis.min: 50", async () => {
    expect(await scaleWith({ min: '50' })).toEqual(await scaleWith({ min: 50 }))
  })

  it("reads yaxis.max: '100' as yaxis.max: 100", async () => {
    expect(await scaleWith({ max: '100' })).toEqual(
      await scaleWith({ max: 100 }),
    )
  })

  it('keeps the automatic axis for a bound it cannot read', async () => {
    // The failure this replaces was silent AND total: the axis became the
    // 0 … tickAmount scale a chart with no data gets, and the series was drawn
    // above the plot, so the chart looked blank.
    const automatic = await scaleWith({})
    expect(await scaleWith({ min: 'abc' })).toEqual(automatic)
    expect(warnings().join('\n')).toMatch(/yaxis\.min cannot be read/)
  })

  it('still plots the data when a min function returns nothing usable', async () => {
    // The axis stays tight to the data rather than padded, because niceScale
    // reads `yaxis.min !== undefined` to decide whether the floor is the
    // user's, and a function IS set. What matters is that the series is
    // inside the plot instead of drawn above a 0 … tickAmount scale.
    const scale = await scaleWith({ min: () => undefined })
    expect(scale.niceMin).toBeLessThanOrEqual(55)
    expect(scale.niceMax).toBeGreaterThanOrEqual(88)
  })

  it('still honours a min function that returns a number', async () => {
    expect(await scaleWith({ min: () => 50 })).toEqual(
      await scaleWith({ min: 50 }),
    )
  })
})

describe('an option given as undefined or null reads as not given', () => {
  // Framework wrappers pass optional props straight through, so a chart is
  // routinely built from `{ stroke: props.stroke }` with the prop unset. The
  // merge used to copy the undefined over the whole stroke section, and the
  // first read of `stroke.colors` threw: every type, at any depth.
  const SECTIONS = [
    'stroke',
    'dataLabels',
    'legend',
    'tooltip',
    'fill',
    'grid',
    'markers',
    'plotOptions',
    'title',
    'theme',
    'annotations',
    'responsive',
    'chart.animations',
    'chart.toolbar',
    'chart.events',
    'xaxis.labels',
    'yaxis.labels',
    'legend.markers',
    'dataLabels.style',
  ]
  const base = (type) =>
    type === 'pie'
      ? { chart: { type }, series: [44, 33, 23], labels: ['A', 'B', 'C'] }
      : { chart: { type }, series: [{ name: 'A', data: [3, 5, 2] }], xaxis: { categories: ['x', 'y', 'z'] } }
  /** `{ a: { b: value } }` for the path 'a.b'. */
  const at = (path, value) =>
    path
      .split('.')
      .reverse()
      .reduce((inner, key) => ({ [key]: inner }), value)
  /** Merge one level deep, so `chart.toolbar` keeps the base's chart.type. */
  const withAt = (o, path, value) => {
    const [head, ...rest] = path.split('.')
    return { ...o, [head]: rest.length ? { ...(o[head] || {}), ...at(rest.join('.'), value) } : value }
  }

  describe.each(['line', 'bar', 'pie'])('%s', (type) => {
    it.each(SECTIONS.flatMap((p) => [[p, undefined], [p, null]]))(
      '%s: %s renders, and updates',
      async (path, value) => {
        document.body.innerHTML = '<div id="chart" />'
        const chart = new ApexCharts(document.querySelector('#chart'), withAt(base(type), path, value))
        await chart.render()
        await chart.updateOptions(at(path, value))
        chart.destroy()
      },
    )
  })

  it('keeps the defaults on a new chart', async () => {
    const plain = await render(base('line'))
    const given = await render({ ...base('line'), stroke: undefined, tooltip: null })
    expect(given.w.config.stroke).toEqual(plain.w.config.stroke)
    expect(given.w.config.tooltip.enabled).toBe(true)
  })

  it('keeps the current settings on an update', async () => {
    const chart = await render({ ...base('line'), tooltip: { enabled: false } })
    await chart.updateOptions({ tooltip: undefined })
    expect(chart.w.config.tooltip.enabled).toBe(false)
  })

  it('empties a list', async () => {
    const chart = await render({
      ...base('line'),
      annotations: { points: [{ x: 'y', y: 5, label: { text: 'peak' } }] },
    })
    await chart.updateOptions({ annotations: { points: undefined }, responsive: null })
    expect(chart.w.config.annotations.points).toEqual([])
    expect(chart.w.config.responsive).toEqual([])
  })

  it('still resets a bound, and still falls back to the theme colours', async () => {
    const chart = await render({ ...base('line'), yaxis: { min: 0 }, colors: ['#e53935'] })
    await chart.updateOptions({ yaxis: { min: undefined }, colors: undefined })
    expect(chart.w.config.yaxis[0].min).toBeUndefined()
    expect(chart.w.config.colors).toBeUndefined()
  })

  it("never modifies the caller's options", async () => {
    const opts = { ...base('line'), stroke: undefined, xaxis: { categories: ['x', 'y', 'z'], labels: null } }
    await render(opts)
    expect('stroke' in opts).toBe(true)
    expect(opts.xaxis.labels).toBeNull()
  })
})
