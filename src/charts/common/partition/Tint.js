// @ts-check
/**
 * Depth colouring for the partition charts.
 *
 * One hue per top-level branch, lightened a little at each level below it, so
 * the reader sees which branch a deep node belongs to without a legend entry
 * per node. An explicit per-node `color` always wins, and the pass runs once
 * per draw rather than per layout, so a zoom never recolours anything.
 *
 * Not registered in `sharedModules` on purpose; see the note in
 * `charts/common/partition/Partition.js`.
 *
 * @module charts/common/partition/Tint
 */

/**
 * Blend a hex colour toward white by `amount` (0..1). Anything that is not a
 * hex string is returned untouched, so named colours, rgb() and gradients pass
 * through rather than being mangled.
 *
 * @param {string} color
 * @param {number} amount
 * @returns {string}
 */
export function lighten(color, amount) {
  if (typeof color !== 'string' || color[0] !== '#') return color
  let hex = color.slice(1)
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (hex.length !== 6) return color
  const num = parseInt(hex, 16)
  if (isNaN(num)) return color
  let rC = (num >> 16) & 255
  let gC = (num >> 8) & 255
  let bC = num & 255
  rC = Math.round(rC + (255 - rC) * amount)
  gC = Math.round(gC + (255 - gC) * amount)
  bC = Math.round(bC + (255 - bC) * amount)
  return '#' + ((1 << 24) + (rC << 16) + (gC << 8) + bC).toString(16).slice(1)
}

/**
 * Give every node in a branch its colour, and collect the nodes flat.
 *
 * The flat list is what the renderers iterate: a partition chart draws by node,
 * not by series, and it needs the hidden ones too so a zoom can animate them
 * away.
 *
 * @param {any} node
 * @param {string} color  the colour this node takes unless it declares its own
 * @param {number} tint  0 keeps the parent's colour, 1 goes to white
 * @param {any[]} out  collects every node walked, in draw order
 */
export function colorPass(node, color, tint, out) {
  node._color = node.color || color
  out.push(node)
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      const c = node.children[i]
      colorPass(c, c.color || lighten(node._color, tint), tint, out)
    }
  }
}
