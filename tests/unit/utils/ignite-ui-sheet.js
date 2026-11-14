import { vi } from 'vitest'
import { IGNITE_UI_SHEETS } from '../data/ignite-ui-tokens.js'

/**
 * A page with (or without) an Ignite UI stylesheet, as Chromium computes it,
 * for jsdom, which neither cascades custom properties nor parses relative
 * colours.
 *
 * Every `getComputedStyle` declaration serves `--ig-*` from the current sheet
 * and `--apx-*` from `apx`, and logs each name read. The colour probe the
 * design-system reader inserts computes the sheet's text (`hsl(from ...)`) to
 * the colour Chromium gave it. Both the sheet and `apx` can change between
 * renders: `use()` swaps the sheet, and `apx` is a live object.
 *
 * @param {{sheet?: string | null, apx?: Record<string, string>}} [opts]
 */
export function igniteSheet({ sheet = null, apx = {} } = {}) {
  const state = {
    /** @type {string[]} every custom property name read, in order */
    reads: [],
    apx,
    /** @type {string | null} */
    name: null,
    /** @type {Record<string, string>} */
    vars: {},
    /** @param {string | null} name a key of IGNITE_UI_SHEETS, or null for no sheet */
    use(name) {
      state.name = name
      state.vars = name ? { ...IGNITE_UI_SHEETS[name].vars } : {}
    },
    /** @param {string} token the hex the inventory recorded for it in the current sheet */
    hex(token) {
      const hex = state.name && IGNITE_UI_SHEETS[state.name].hex[token]
      if (!hex) throw new Error(`no hex for ${token}`)
      return hex
    },
    igReads() {
      return state.reads.filter((n) => n.startsWith('--ig-'))
    },
    restore() {},
  }
  state.use(sheet)

  // Every text any sheet hands the probe, and what it computes to.
  /** @type {Record<string, string>} */
  const computed = {}
  for (const s of Object.values(IGNITE_UI_SHEETS)) {
    Object.assign(computed, s.computed)
  }

  // jsdom's style parser drops relative colours, so the probe span keeps
  // the text it was given and computes it the way Chromium did.
  let proto = Object.getPrototypeOf(document.body.style)
  while (proto && !Object.getOwnPropertyDescriptor(proto, 'color')) {
    proto = Object.getPrototypeOf(proto)
  }
  const color = Object.getOwnPropertyDescriptor(proto, 'color')
  const setProperty = proto.setProperty
  const ownSetProperty = Object.prototype.hasOwnProperty.call(
    proto,
    'setProperty',
  )
  const kept = new WeakMap()
  /** @returns {boolean} whether `v` was kept as a probe text */
  const keep = (style, v) => {
    if (v in computed) {
      kept.set(style, v)
      return true
    }
    kept.delete(style)
    return false
  }
  Object.defineProperty(proto, 'color', {
    ...color,
    get() {
      return kept.get(this) ?? color.get.call(this)
    },
    set(v) {
      if (!keep(this, v)) color.set.call(this, v)
    },
  })
  proto.setProperty = function (name, v, priority) {
    if (name === 'color' && keep(this, v)) return
    return setProperty.call(this, name, v, priority)
  }

  const real = window.getComputedStyle.bind(window)
  const spy = vi
    .spyOn(window, 'getComputedStyle')
    .mockImplementation((el, pseudo) => {
      const text = el && el.style && kept.get(el.style)
      const cs = real(el, pseudo)
      return new Proxy(cs, {
        get(t, k) {
          if (k === 'color' && text !== undefined) return computed[text]
          if (k === 'getPropertyValue') {
            return (n) => {
              if (n.startsWith('--ig-')) {
                state.reads.push(n)
                return state.vars[n] ?? ''
              }
              if (n.startsWith('--apx-')) {
                state.reads.push(n)
                return state.apx[n] ?? ''
              }
              return t.getPropertyValue(n)
            }
          }
          const v = t[k]
          return typeof v === 'function' ? v.bind(t) : v
        },
      })
    })

  state.restore = () => {
    spy.mockRestore()
    Object.defineProperty(proto, 'color', color)
    if (ownSetProperty) proto.setProperty = setProperty
    else delete proto.setProperty
  }
  return state
}
