// @ts-check
/**
 * What is drawn on this chart, as one list a plugin can read.
 *
 * A plugin sees the chart through the facade, and the facade told it about the
 * chart's series and nothing else: not the caller's annotations, not another
 * feature's ink, not another plugin's overlay. So the panel everyone reaches
 * for first (list what is on this chart, so a viewer can see what is there)
 * could only ever enumerate the asking plugin's own tools, which its toolbar
 * already shows.
 *
 * The alternative to this file is one narrow member per question: a Layers API,
 * then an export that wants to list contents, then an a11y summary. Publishing
 * the inventory once answers all three.
 *
 * ## Read only, deliberately
 *
 * Nothing here removes or hides anything. A list you can act on means letting a
 * plugin change another feature's output, which is a much larger promise than
 * this platform makes today and is a decision of its own. See
 * `plans/26-weave-capabilities.md` §3.4.
 *
 * ## Partial by design, and it says so
 *
 * Every contributor is opt in. A feature that declares nothing is simply absent
 * rather than approximated, which is why each entry carries `owner`: a reader
 * can tell what the list covers instead of assuming it is exhaustive.
 *
 * @module weave/Drawn
 */

/**
 * @typedef {Object} DrawnItem
 * @property {string} id      stable within this chart, opaque to readers
 * @property {'series'|'annotation'|'overlay'} kind
 * @property {string} label   a human name where one exists
 * @property {string} owner   'core', or the plugin name that put it there
 * @property {boolean} visible
 */

/** Annotation buckets in config, in the order a reader meets them. */
const ANNOTATION_TYPES = ['xaxis', 'yaxis', 'points', 'texts', 'images']

/**
 * Whether the viewer has switched this series off in the legend.
 *
 * Both collapse lists, because a series on a secondary axis lands in the
 * ancillary one and is just as hidden to the person looking at the chart.
 *
 * @param {any} w @param {number} index
 */
function seriesVisible(w, index) {
  const gl = w.globals
  return (
    (gl.collapsedSeriesIndices || []).indexOf(index) < 0 &&
    (gl.ancillaryCollapsedSeriesIndices || []).indexOf(index) < 0
  )
}

/**
 * The chart's own series, including any a plugin added.
 *
 * Owner comes from the same `markDerived` bookkeeping that protects a caller's
 * reset, so a computed series is attributed to the plugin that computed it
 * rather than to the chart.
 *
 * @param {any} w @param {any} host @returns {DrawnItem[]}
 */
function seriesItems(w, host) {
  const derived = host && host._derived
  /** @param {string} name */
  const ownerOf = (name) => {
    if (!derived) return 'core'
    for (const [plugin, names] of derived) {
      if (names.indexOf(name) > -1) return plugin
    }
    return 'core'
  }

  return (w.config.series || []).map((/** @type {any} */ s, /** @type {number} */ i) => {
    const label = s && s.name ? String(s.name) : `Series ${i + 1}`
    return {
      id: `series:${i}`,
      kind: /** @type {const} */ ('series'),
      label,
      owner: ownerOf(label),
      visible: seriesVisible(w, i),
    }
  })
}

/**
 * The caller's annotations, and anything that draws by creating one.
 *
 * Ink strokes arrive here rather than through a contributor of their own: an
 * ink stroke IS an annotation, written into `config.annotations` with an id of
 * its own (`InkLayer.js`). Attribution is the `owner` an author set on the
 * record, so a feature that creates annotations says so rather than this file
 * pattern-matching ids.
 *
 * @param {any} w @returns {DrawnItem[]}
 */
function annotationItems(w) {
  const config = w.config.annotations || {}
  /** @type {DrawnItem[]} */
  const out = []

  for (const type of ANNOTATION_TYPES) {
    const list = Array.isArray(config[type]) ? config[type] : []
    list.forEach((/** @type {any} */ anno, /** @type {number} */ i) => {
      if (!anno) return
      out.push({
        // An annotation carries an id only when someone gave it one, so the
        // synthesised form is what most config-declared annotations get. It is
        // stable for as long as the list is, which is what a reader needs.
        id: anno.id ? String(anno.id) : `annotation:${type}:${i}`,
        kind: /** @type {const} */ ('annotation'),
        label: labelOfAnnotation(anno, type, i),
        owner: anno.owner ? String(anno.owner) : 'core',
        // An annotation is drawn whenever it is in the config: there is no
        // hidden state for one, unlike a series.
        visible: true,
      })
    })
  }
  return out
}

/**
 * The most useful name an annotation has: its label text, then its own id,
 * then what kind it is. A reader is choosing between rows, so a row that says
 * "Launch" beats one that says "xaxis annotation 2".
 *
 * @param {any} anno @param {string} type @param {number} i
 */
function labelOfAnnotation(anno, type, i) {
  const text = anno.label && anno.label.text
  if (text) return String(text)
  if (anno.text) return String(anno.text)
  if (anno.id) return String(anno.id)
  return `${type} annotation ${i + 1}`
}

/**
 * Everything on the chart, in reading order: series, then annotations, then
 * what plugins have declared.
 *
 * Rebuilt per call rather than cached. It is a projection of live state, and a
 * remembered inventory is a list of what WAS drawn.
 *
 * @param {any} w @param {any} host @returns {DrawnItem[]}
 */
export function collectDrawn(w, host) {
  const declared = []
  if (host && host._declared) {
    for (const [plugin, items] of host._declared) {
      for (const item of items) {
        declared.push({
          id: `overlay:${plugin}:${item.id}`,
          kind: /** @type {const} */ ('overlay'),
          label: item.label,
          owner: plugin,
          visible: item.visible !== false,
        })
      }
    }
  }
  return [...seriesItems(w, host), ...annotationItems(w), ...declared]
}
