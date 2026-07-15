/**
 * Ink Layer (#7) interaction tests: dragging point annotations.
 *
 * Uses real browser events (getBoundingClientRect, transform, dispatch) that
 * jsdom cannot do. The base fixture auto-fails on any uncaught page error.
 *
 * Fixture: samples/vanilla-js/misc/ink-draggable-annotations.html
 *   numeric line chart, chart.ink.enabled, two draggable point annotations
 *   ('peak', 'dip'), animations disabled.
 */

import { test, expect } from '../fixtures/base.js'

// Drag an annotation (by its id) by a client-space delta; returns the
// before/after config x/y and the marker's drop error in pixels.
async function dragAnnotation(page, id, dx, dy) {
  return page.evaluate(
    ({ id, dx, dy }) => {
      const chart = window.chart
      const idx = chart.w.config.annotations.points.findIndex((p) => p.id === id)
      const marker = () =>
        chart.el.querySelector(`.apexcharts-point-annotation-marker.${id}`)
      const center = (el) => {
        const r = el.getBoundingClientRect()
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      }
      const before = {
        x: chart.w.config.annotations.points[idx].x,
        y: chart.w.config.annotations.points[idx].y,
      }
      const c0 = center(marker())
      const m0 = marker()
      m0.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, clientX: c0.x, clientY: c0.y, button: 0 }))
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, view: window, clientX: c0.x + dx, clientY: c0.y + dy, button: 0 }))
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, clientX: c0.x + dx, clientY: c0.y + dy, button: 0 }))

      const c1 = center(marker())
      return {
        before,
        after: {
          x: chart.w.config.annotations.points[idx].x,
          y: chart.w.config.annotations.points[idx].y,
        },
        dropErrorPx: Math.round(Math.hypot(c1.x - (c0.x + dx), c1.y - (c0.y + dy))),
        residualTransform: marker().getAttribute('transform'),
      }
    },
    { id, dx, dy },
  )
}

test.describe('Ink Layer: drag point annotations', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'ink-draggable-annotations')
  })

  test('dragging a callout updates its data x/y and drops where released', async ({ page }) => {
    // arm the annotationDragged event
    await page.evaluate(() => {
      window.__dragged = null
      window.chart.addEventListener('annotationDragged', (c, o) => { window.__dragged = o })
    })

    // drag 'peak' right and up: x increases, y increases (y axis inverted)
    const r = await dragAnnotation(page, 'peak', 70, -50)
    expect(r.after.x).toBeGreaterThan(r.before.x)
    expect(r.after.y).toBeGreaterThan(r.before.y)
    expect(r.dropErrorPx).toBeLessThanOrEqual(4) // pixel -> data -> pixel round-trip
    expect(r.residualTransform).toBeFalsy()

    const dragged = await page.evaluate(() => window.__dragged)
    expect(dragged.id).toBe('peak')
    expect(dragged.x).toBe(r.after.x)
  })

  test('a second drag of the same annotation continues from its new spot', async ({ page }) => {
    const first = await dragAnnotation(page, 'dip', 40, 30) // right + down
    expect(first.after.x).toBeGreaterThan(first.before.x)
    expect(first.after.y).toBeLessThan(first.before.y) // dragged down -> y down

    const second = await dragAnnotation(page, 'dip', -30, -20) // left + up
    expect(second.before.x).toBeCloseTo(first.after.x, 5) // starts where it landed
    expect(second.after.x).toBeLessThan(second.before.x)
    expect(second.after.y).toBeGreaterThan(second.before.y)
    expect(second.dropErrorPx).toBeLessThanOrEqual(4)
  })
})

test.describe('Ink Layer: inline label editing', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'ink-draggable-annotations')
  })

  test('double-clicking a callout edits its label text', async ({ page }) => {
    await page.evaluate(() => {
      window.__edited = null
      window.chart.addEventListener('annotationEdited', (c, o) => { window.__edited = o })
    })

    const before = await page.evaluate(
      () => window.chart.w.config.annotations.points.find((p) => p.id === 'peak').label.text,
    )
    expect(before).toBe('Peak')

    // dblclick the label -> an editor input appears prefilled
    await page.evaluate(() => {
      window.chart.el
        .querySelector('.apexcharts-point-annotation-label.peak')
        .dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }))
    })
    const editorVal = await page.evaluate(() => {
      const i = window.chart.el.querySelector('input.apexcharts-ink-editor')
      return i ? i.value : null
    })
    expect(editorVal).toBe('Peak')

    // type a new label and commit with Enter
    await page.evaluate(() => {
      const i = window.chart.el.querySelector('input.apexcharts-ink-editor')
      i.value = 'Launch'
      i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })
    await page.waitForFunction(
      () => window.chart.w.config.annotations.points.find((p) => p.id === 'peak').label.text === 'Launch',
    )

    const after = await page.evaluate(() => ({
      text: window.chart.w.config.annotations.points.find((p) => p.id === 'peak').label.text,
      labelText: window.chart.el.querySelector('.apexcharts-point-annotation-label.peak').textContent,
      editorGone: !window.chart.el.querySelector('input.apexcharts-ink-editor'),
      bgCount: window.chart.el.querySelectorAll('rect.peak').length,
      edited: window.__edited,
    }))
    expect(after.text).toBe('Launch')
    expect(after.labelText).toBe('Launch')
    expect(after.editorGone).toBe(true)
    expect(after.bgCount).toBe(1) // background re-added once (no stale/dup)
    expect(after.edited.id).toBe('peak')
    expect(after.edited.text).toBe('Launch')
  })
})

test.describe('Ink Layer: click-to-create', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'ink-draggable-annotations')
  })

  test('the palette arms create mode and a plot click drops a note', async ({ page }) => {
    await page.evaluate(() => {
      window.__created = null
      window.chart.addEventListener('annotationCreated', (c, o) => { window.__created = o })
    })

    const before = await page.evaluate(() => window.chart.w.config.annotations.points.length)

    // click "+ Note" to arm, then click the middle of the grid
    await page.evaluate(() => {
      window.chart.el
        .querySelector('.apexcharts-ink-add')
        .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
    })
    expect(await page.evaluate(() => window.chart.ink._creating)).toBe(true)

    const created = await page.evaluate(() => {
      const g = window.chart.el.querySelector('.apexcharts-grid').getBoundingClientRect()
      const svg = window.chart.el.querySelector('.apexcharts-svg')
      svg.dispatchEvent(new MouseEvent('click', {
        bubbles: true, cancelable: true, view: window,
        clientX: g.left + g.width * 0.5, clientY: g.top + g.height * 0.5,
      }))
      const pts = window.chart.w.config.annotations.points
      const anno = pts[pts.length - 1]
      return {
        count: pts.length,
        draggable: anno.draggable,
        text: anno.label.text,
        markerDrawn: !!window.chart.el.querySelector('.apexcharts-point-annotation-marker.' + anno.id),
        editorOpen: !!window.chart.el.querySelector('input.apexcharts-ink-editor'),
        creating: window.chart.ink._creating,
        event: window.__created,
      }
    })

    expect(created.count).toBe(before + 1)
    expect(created.draggable).toBe(true)
    expect(created.text).toBe('Note')
    expect(created.markerDrawn).toBe(true)
    expect(created.editorOpen).toBe(true) // opens the label editor immediately
    expect(created.creating).toBe(false) // single-shot
    expect(created.event).toBeTruthy()
  })
})

test.describe('Ink Layer: axis annotations', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'ink-draggable-annotations')
  })

  // Drag an element (by CSS selector) from a start point by a client delta.
  async function dragEl(page, selector, startAt, dx, dy) {
    return page.evaluate(
      ({ selector, startAt, dx, dy }) => {
        const el = window.chart.el.querySelector(selector)
        const r = el.getBoundingClientRect()
        const sx = startAt === 'left' ? r.left + 2 : r.left + r.width / 2
        const sy = r.top + r.height / 2
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, clientX: sx, clientY: sy, button: 0 }))
        document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, view: window, clientX: sx + dx, clientY: sy + dy, button: 0 }))
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, clientX: sx + dx, clientY: sy + dy, button: 0 }))
      },
      { selector, startAt, dx, dy },
    )
  }

  test('a yaxis line annotation drags vertically', async ({ page }) => {
    const before = await page.evaluate(() => window.chart.w.config.annotations.yaxis[0].y)
    await dragEl(page, 'line.target', 'center', 0, -40) // up -> y increases
    const after = await page.evaluate(() => window.chart.w.config.annotations.yaxis[0].y)
    expect(after).toBeGreaterThan(before)
  })

  test('an xaxis range moves as a whole and resizes from an edge', async ({ page }) => {
    const before = await page.evaluate(() => ({ ...window.chart.w.config.annotations.xaxis[0] }))
    // move: drag the middle right -> both edges shift, span preserved
    await dragEl(page, 'rect.window', 'center', 40, 0)
    const moved = await page.evaluate(() => ({ x: window.chart.w.config.annotations.xaxis[0].x, x2: window.chart.w.config.annotations.xaxis[0].x2 }))
    expect(moved.x).toBeGreaterThan(before.x)
    expect(moved.x2).toBeGreaterThan(before.x2)
    expect(moved.x2 - moved.x).toBeCloseTo(before.x2 - before.x, 5)

    // resize: grab the left edge -> x changes, x2 fixed
    await dragEl(page, 'rect.window', 'left', 22, 0)
    const resized = await page.evaluate(() => ({ x: window.chart.w.config.annotations.xaxis[0].x, x2: window.chart.w.config.annotations.xaxis[0].x2 }))
    expect(resized.x).toBeGreaterThan(moved.x)
    expect(resized.x2).toBeCloseTo(moved.x2, 5)
  })
})

test.describe('Ink Layer: undo/redo + snap', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'ink-draggable-annotations')
  })

  async function dragPoint(page, id, dx, dy) {
    return page.evaluate(
      ({ id, dx, dy }) => {
        const m = window.chart.el.querySelector('.apexcharts-point-annotation-marker.' + id)
        const r = m.getBoundingClientRect()
        const sx = r.left + r.width / 2, sy = r.top + r.height / 2
        m.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, clientX: sx, clientY: sy, button: 0 }))
        document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, view: window, clientX: sx + dx, clientY: sy + dy, button: 0 }))
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, clientX: sx + dx, clientY: sy + dy, button: 0 }))
        return window.chart.w.config.annotations.points.find((p) => p.id === id).x
      },
      { id, dx, dy },
    )
  }
  const peakX = (page) =>
    page.evaluate(() => window.chart.w.config.annotations.points.find((p) => p.id === 'peak').x)

  test('a drag is undoable and redoable (Rewind)', async ({ page }) => {
    const before = await peakX(page)
    const afterDrag = await dragPoint(page, 'peak', 60, -30)
    expect(afterDrag).toBeGreaterThan(before)
    expect(await page.evaluate(() => window.chart.history.canUndo())).toBe(true)

    await page.evaluate(() => window.chart.history.undo(false))
    await page.waitForFunction(
      (b) => window.chart.w.config.annotations.points.find((p) => p.id === 'peak').x === b,
      before,
    )
    expect(await peakX(page)).toBe(before)
    // the annotation is still there and draggable after the restore re-render
    expect(await page.evaluate(() => !!window.chart.el.querySelector('.apexcharts-point-annotation-marker.peak'))).toBe(true)

    await page.evaluate(() => window.chart.history.redo(false))
    await page.waitForTimeout(60)
    expect(await peakX(page)).toBeCloseTo(afterDrag, 5)
  })

  test('a drag is undoable via the keyboard (Ctrl+Z) after the gesture', async ({
    page,
  }) => {
    const before = await peakX(page)
    const afterDrag = await dragPoint(page, 'peak', 60, -30)
    expect(afterDrag).toBeGreaterThan(before)

    // A pointer gesture preventDefaults focus, so document.activeElement stays
    // on <body>; the shortcut must still reach the chart the pointer engaged.
    await page.evaluate(() => {
      document.body.focus()
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true }),
      )
    })
    await page.waitForFunction(
      (b) => window.chart.w.config.annotations.points.find((p) => p.id === 'peak').x === b,
      before,
    )
    expect(await peakX(page)).toBe(before)

    // Shift+Ctrl+Z redoes.
    await page.evaluate(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true, bubbles: true, cancelable: true }),
      )
    })
    await page.waitForTimeout(60)
    expect(await peakX(page)).toBeCloseTo(afterDrag, 5)
  })

  test('the chart shortcut defers to a focused text field', async ({ page }) => {
    const before = await peakX(page)
    const afterDrag = await dragPoint(page, 'peak', 60, -30)
    expect(afterDrag).toBeGreaterThan(before)

    // An external input owns Ctrl+Z while focused; the chart must not steal it.
    await page.evaluate(() => {
      const inp = document.createElement('input')
      inp.id = 'ext-input'
      document.body.appendChild(inp)
      inp.focus()
      inp.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true }),
      )
    })
    await page.waitForTimeout(60)
    expect(await peakX(page)).toBeCloseTo(afterDrag, 5) // unchanged
  })

  test('repeated drag+undo cycles keep every annotation (no vanishing)', async ({
    page,
  }) => {
    // Regression: clearAnnotations() must invalidate the updateOptions memo, or
    // the 2nd restore to the same checkpoint no-ops the re-render and leaves the
    // annotations cleared-but-not-redrawn (they all disappear).
    const markers = () =>
      page.evaluate(() => window.chart.el.querySelectorAll('.apexcharts-point-annotation-marker').length)
    const start = await markers()
    expect(start).toBe(2)

    for (let i = 0; i < 3; i++) {
      await dragPoint(page, 'peak', 40, -20)
      await page.evaluate(() => window.chart.history.undo(false))
      await page.waitForTimeout(120)
      expect(await markers()).toBe(start) // all annotations still present
    }
    expect(await peakX(page)).toBe(6) // and back at the original data x
  })

  test('snap pulls a dragged annotation onto a gridline', async ({ page }) => {
    // enable snap at runtime (read live from config on each drag)
    await page.evaluate(() => { window.chart.w.config.chart.ink.snap = true })
    const ticks = await page.evaluate(() => window.chart.w.globals.xAxisScale.result)
    const snapped = await dragPoint(page, 'dip', 18, 0)
    expect(ticks.indexOf(snapped)).toBeGreaterThan(-1) // exactly on a gridline
  })
})

test.describe('Ink Layer: floating note editor', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'ink-draggable-annotations')
  })

  // A press + release without movement on an annotation element = select.
  async function clickAnno(page, selector) {
    return page.evaluate((selector) => {
      const el = window.chart.el.querySelector(selector)
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy, button: 0 }))
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy, button: 0 }))
      return !!window.chart.el.querySelector('.apexcharts-ink-card')
    }, selector)
  }

  const clickCardBtn = (page, title) =>
    page.evaluate((title) => {
      const b = Array.from(window.chart.el.querySelectorAll('.apexcharts-ink-btn')).find(
        (x) => x.title === title,
      )
      if (b) b.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
      return !!b
    }, title)

  test('clicking a note opens the editor card with its text and controls', async ({ page }) => {
    expect(await clickAnno(page, '.apexcharts-point-annotation-marker.peak')).toBe(true)
    const c = await page.evaluate(() => {
      const card = window.chart.el.querySelector('.apexcharts-ink-card')
      return {
        input: card.querySelector('input.apexcharts-ink-editor').value,
        swatches: card.querySelectorAll('.apexcharts-ink-swatch').length,
        hasMarkerRow: !!card.querySelector('.apexcharts-ink-marker-size'),
        focused: document.activeElement === card.querySelector('input.apexcharts-ink-editor'),
      }
    })
    expect(c.input).toBe('Peak')
    expect(c.swatches).toBe(6)
    expect(c.hasMarkerRow).toBe(true)
    expect(c.focused).toBe(true)
  })

  test('an axis annotation opens the card too, without the marker row', async ({ page }) => {
    expect(await clickAnno(page, 'line.target')).toBe(true)
    const c = await page.evaluate(() => {
      const card = window.chart.el.querySelector('.apexcharts-ink-card')
      return {
        input: card.querySelector('input.apexcharts-ink-editor').value,
        hasMarkerRow: !!card.querySelector('.apexcharts-ink-marker-size'),
      }
    })
    expect(c.input).toBe('Target')
    expect(c.hasMarkerRow).toBe(false)
  })

  test('a swatch recolors the label chip and the marker together', async ({ page }) => {
    await clickAnno(page, '.apexcharts-point-annotation-marker.peak')
    await page.evaluate(() => {
      window.__styled = null
      window.chart.addEventListener('annotationStyled', (c, o) => { window.__styled = o })
      const sw = window.chart.el.querySelectorAll('.apexcharts-ink-swatch')[2] // #2563eb
      sw.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
    })
    const r = await page.evaluate(() => {
      const a = window.chart.w.config.annotations.points.find((p) => p.id === 'peak')
      return {
        bg: a.label.style.background,
        fg: a.label.style.color,
        markerStroke: a.marker.strokeColor,
        rectFill: window.chart.el.querySelector('rect.peak').getAttribute('fill'),
        cardOpen: !!window.chart.el.querySelector('.apexcharts-ink-card'),
        styledId: window.__styled && window.__styled.id,
      }
    })
    expect(r.bg).toBe('#2563eb')
    expect(r.fg).toBe('#ffffff')
    expect(r.markerStroke).toBe('#2563eb')
    expect(r.rectFill).toBe('#2563eb') // the drawn chip picked it up immediately
    expect(r.cardOpen).toBe(true) // restyling keeps the editor open
    expect(r.styledId).toBe('peak')
  })

  test('bold, font size and the marker controls restyle the note', async ({ page }) => {
    await clickAnno(page, '.apexcharts-point-annotation-marker.dip')
    expect(await clickCardBtn(page, 'Bold')).toBe(true)
    await clickCardBtn(page, 'Larger text')
    await clickCardBtn(page, 'Larger marker')
    await clickCardBtn(page, 'Marker shape')
    const a = await page.evaluate(() => {
      const p = window.chart.w.config.annotations.points.find((x) => x.id === 'dip')
      return {
        fw: p.label.style.fontWeight,
        fs: p.label.style.fontSize,
        markerSize: p.marker.size,
        shape: p.marker.shape,
        drawn: !!window.chart.el.querySelector('.apexcharts-point-annotation-marker.dip'),
      }
    })
    expect(a.fw).toBe(700)
    expect(a.fs).toBe('12px') // default 11px stepped up once
    expect(a.markerSize).toBe(8) // fixture size 7 stepped up once
    expect(a.shape).toBe('square') // circle cycled once
    expect(a.drawn).toBe(true)
  })

  test('delete removes the note; undo (Rewind) restores it', async ({ page }) => {
    const count = () =>
      page.evaluate(() => window.chart.w.config.annotations.points.length)
    const start = await count()
    await clickAnno(page, '.apexcharts-point-annotation-marker.peak')
    await page.evaluate(() => {
      window.__deleted = null
      window.chart.addEventListener('annotationDeleted', (c, o) => { window.__deleted = o })
    })
    await clickCardBtn(page, 'Delete note')
    const afterDelete = await page.evaluate(() => ({
      count: window.chart.w.config.annotations.points.length,
      markerGone: !window.chart.el.querySelector('.apexcharts-point-annotation-marker.peak'),
      cardGone: !window.chart.el.querySelector('.apexcharts-ink-card'),
      deletedId: window.__deleted && window.__deleted.id,
      othersAlive: !!window.chart.el.querySelector('.apexcharts-point-annotation-marker.dip'),
    }))
    expect(afterDelete.count).toBe(start - 1)
    expect(afterDelete.markerGone).toBe(true)
    expect(afterDelete.cardGone).toBe(true)
    expect(afterDelete.deletedId).toBe('peak')
    expect(afterDelete.othersAlive).toBe(true)

    await page.evaluate(() => window.chart.history.undo(false))
    await page.waitForFunction(
      () => !!window.chart.el.querySelector('.apexcharts-point-annotation-marker.peak'),
    )
    expect(await count()).toBe(start)
  })

  test('the surviving note still drags correctly after a delete', async ({ page }) => {
    // Regression: deleting points[0] shifts 'dip' to index 0; its handlers must
    // rebind to the new index or a drag would mutate the wrong slot.
    await clickAnno(page, '.apexcharts-point-annotation-marker.peak')
    await clickCardBtn(page, 'Delete note')
    const r = await dragAnnotation(page, 'dip', 50, 0)
    expect(r.after.x).toBeGreaterThan(r.before.x)
    expect(r.dropErrorPx).toBeLessThanOrEqual(4)
  })

  test('Escape closes the card without committing the pending text', async ({ page }) => {
    await clickAnno(page, '.apexcharts-point-annotation-marker.peak')
    await page.evaluate(() => {
      const i = window.chart.el.querySelector('input.apexcharts-ink-editor')
      i.value = 'Scrapped'
      i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    })
    const r = await page.evaluate(() => ({
      cardGone: !window.chart.el.querySelector('.apexcharts-ink-card'),
      text: window.chart.w.config.annotations.points.find((p) => p.id === 'peak').label.text,
    }))
    expect(r.cardGone).toBe(true)
    expect(r.text).toBe('Peak')
  })

  test('a click outside the card commits the typed text', async ({ page }) => {
    await clickAnno(page, '.apexcharts-point-annotation-marker.peak')
    await page.evaluate(() => {
      const i = window.chart.el.querySelector('input.apexcharts-ink-editor')
      i.value = 'Summit'
      document.body.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, clientX: 4, clientY: 4, button: 0 }),
      )
    })
    const r = await page.evaluate(() => ({
      cardGone: !window.chart.el.querySelector('.apexcharts-ink-card'),
      text: window.chart.w.config.annotations.points.find((p) => p.id === 'peak').label.text,
      labelText: window.chart.el.querySelector('.apexcharts-point-annotation-label.peak').textContent,
    }))
    expect(r.cardGone).toBe(true)
    expect(r.text).toBe('Summit')
    expect(r.labelText).toBe('Summit')
  })
})
