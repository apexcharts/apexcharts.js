/**
 * Series and leaf names are data, and tooltips write them as HTML. A
 * formatter result that hands the name back unchanged (or in the default
 * title shape, name + ': ') is escaped so the name shows as text; markup a
 * formatter adds stays markup, as those options document HTML.
 * @param {any} name
 * @param {any} [out] the formatter's result; the name itself when omitted
 * @returns {string}
 */
export function nameAsHtml(name, out = name) {
  const s = String(name ?? '')
  const tail = out === s ? '' : out === s + ': ' ? ': ' : null
  return tail === null
    ? out
    : s.replace(/&/g, '&amp;').replace(/</g, '&lt;') + tail
}
