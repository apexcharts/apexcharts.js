/**
 * Combo chart hover — crosshair position on numeric/datetime/converted xaxis.
 *
 * Regression for the bug where, on a combo chart (bar + line) with a numeric
 * or convertedCatToNumeric xaxis, hovering over a bar would draw the line
 * marker / crosshair one xDivision to the right of the actual data point.
 *
 * Root cause: `apexcharts-grid`'s getBoundingClientRect extends
 * `barPadForNumericAxis` pixels LEFT of the data area (the
 * apexcharts-gridlines-horizontal group is widened by that pad on each side
 * so corner bars don't clip). `tooltip/Utils.getNearestValues` already
 * compensates for the pad when converting clientX → data-area-local hoverX,
 * but `tooltip/Position._datapointCenterXFromBars` did not — so the bar's
 * union-rect center it returned was shifted right by the pad, and the
 * crosshair landed at (data position + xDivision) instead of on the bar.
 *
 * Fix: subtract `barPadForNumericAxis` from the result in
 * `_datapointCenterXFromBars`, matching the convention used elsewhere
 * (Utils.getNearestValues, ZoomPanSelection, Crosshairs, XAxis, annotations).
 */

import { test, expect } from '../fixtures/base.js'

test.describe('Combo chart (bars + line) on converted-numeric xaxis', () => {
  test('crosshair lands on the hovered bar group, not one xDivision right', async ({
    page,
    loadChart,
  }) => {
    await loadChart('mixed', 'multiple-yaxes-aligned-zero')

    const setup = await page.evaluate(() => {
      const w = window.chart.w
      return {
        isXNumeric: w.axisFlags.isXNumeric,
        convertedCatToNumeric: w.config.xaxis.convertedCatToNumeric,
        comboCharts: w.globals.comboCharts,
        barPadForNumericAxis: w.globals.barPadForNumericAxis,
      }
    })
    expect(setup.isXNumeric).toBe(true)
    expect(setup.convertedCatToNumeric).toBe(true)
    expect(setup.comboCharts).toBe(true)
    // The pre-condition for the bug: numeric-axis bars get a non-zero pad.
    expect(setup.barPadForNumericAxis).toBeGreaterThan(0)

    const meta = await page.evaluate(() => {
      const w = window.chart.w
      const svg = document.querySelector('.apexcharts-svg')
      const r = svg.getBoundingClientRect()
      return {
        svgLeft: r.left,
        svgTop: r.top,
        translateX: w.globals.translateX,
        translateY: w.globals.translateY,
        gridHeight: w.layout.gridHeight,
        // Grid-local x of each line marker (= category center, since the
        // line series stores exact category positions).
        lineXvalues: w.globals.seriesXvalues[2],
      }
    })

    // Hover a few grid-local x positions and read crosshair x + tooltip title.
    const sample = async (gridX) => {
      const clientX = meta.svgLeft + meta.translateX + gridX
      const clientY = meta.svgTop + meta.translateY + meta.gridHeight - 60
      await page.evaluate(
        ({ clientX, clientY }) => {
          document.querySelector('.apexcharts-svg').dispatchEvent(
            new MouseEvent('mousemove', { bubbles: true, clientX, clientY }),
          )
        },
        { clientX, clientY },
      )
      await page.waitForTimeout(30)
      return page.evaluate(() => {
        const xc = document.querySelector('.apexcharts-xcrosshairs')
        return {
          crosshairX: xc ? parseFloat(xc.getAttribute('x') ?? '0') : null,
          tooltipTitle: document.querySelector('.apexcharts-tooltip-title')
            ?.textContent,
          capturedJ: window.chart.w.interact.capturedDataPointIndex,
        }
      })
    }

    // Hover at Q2 (cursor at gridX 45 — between Q2 Profit bar and the line
    // marker at 49.13). Tooltip should say Q2, crosshair should land on Q2.
    const q2 = await sample(45)
    expect(q2.capturedJ).toBe(1)
    expect(q2.tooltipTitle).toBe('Q2')
    // crosshair `x` attr = cx − xcrosshairsWidth/2, so allow ~1px slop.
    expect(Math.abs(q2.crosshairX - meta.lineXvalues[1])).toBeLessThan(1)

    // Hover at Q4 (cursor at gridX 140 — near Q4 center at 147.39).
    const q4 = await sample(140)
    expect(q4.capturedJ).toBe(3)
    expect(q4.tooltipTitle).toBe('Q4')
    expect(Math.abs(q4.crosshairX - meta.lineXvalues[3])).toBeLessThan(1)
  })
})
