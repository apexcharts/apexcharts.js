/**
 * A tiny TrueType font built in memory, for specs that need a web font to
 * arrive after the first render without shipping a font file.
 *
 * Every printable ASCII character maps to one box glyph whose advance is
 * `advance` em units (1000 per em), so text set in it is far wider than in
 * any fallback font and a layout measured with the wrong font shows at once.
 */

const tag = (s) => Buffer.from(s, 'latin1')

function u16(n) {
  const b = Buffer.alloc(2)
  b.writeUInt16BE(n & 0xffff)
  return b
}
function i16(n) {
  const b = Buffer.alloc(2)
  b.writeInt16BE(n)
  return b
}
function u32(n) {
  const b = Buffer.alloc(4)
  b.writeUInt32BE(n >>> 0)
  return b
}
const cat = (...parts) => Buffer.concat(parts)
const pad4 = (b) =>
  b.length % 4 ? cat(b, Buffer.alloc(4 - (b.length % 4))) : b

function checksum(buf) {
  const b = pad4(buf)
  let sum = 0
  for (let i = 0; i < b.length; i += 4) sum = (sum + b.readUInt32BE(i)) >>> 0
  return sum
}

/**
 * @param {{ family?: string, advance?: number }} [opts]
 * @returns {Buffer} the font file
 */
export function wideFont({ family = 'ApexWideTest', advance = 1400 } = {}) {
  const em = 1000
  const ascent = 800
  const descent = 200
  const first = 32
  const last = 126
  const box = { x0: 100, y0: 0, x1: advance - 100, y1: 700 }

  // glyf: glyph 0 (.notdef) is empty, glyph 1 is the box (one contour, four
  // on-curve points, coordinates as int16 deltas).
  const glyph = cat(
    i16(1),
    i16(box.x0),
    i16(box.y0),
    i16(box.x1),
    i16(box.y1),
    u16(3), // endPtsOfContours
    u16(0), // instructionLength
    Buffer.from([1, 1, 1, 1]), // on curve, long x and y
    i16(box.x0),
    i16(0),
    i16(box.x1 - box.x0),
    i16(0),
    i16(box.y0),
    i16(box.y1 - box.y0),
    i16(0),
    i16(box.y0 - box.y1),
  )
  const glyf = glyph
  const loca = cat(u16(0), u16(0), u16(glyph.length / 2))

  const head = cat(
    u32(0x00010000),
    u32(0x00010000),
    u32(0), // checkSumAdjustment, set below
    u32(0x5f0f3cf5),
    u16(0x000b),
    u16(em),
    Buffer.alloc(8),
    Buffer.alloc(8),
    i16(0),
    i16(-descent),
    i16(advance),
    i16(ascent),
    u16(0),
    u16(8),
    i16(2),
    i16(0), // short loca offsets
    i16(0),
  )
  const hhea = cat(
    u32(0x00010000),
    i16(ascent),
    i16(-descent),
    i16(0),
    u16(advance),
    i16(0),
    i16(100),
    i16(advance - 100),
    i16(1),
    i16(0),
    i16(0),
    Buffer.alloc(8),
    i16(0),
    u16(2), // numberOfHMetrics
  )
  const hmtx = cat(u16(500), i16(0), u16(advance), i16(box.x0))
  const maxp = cat(
    u32(0x00010000),
    u16(2), // numGlyphs
    u16(4),
    u16(1),
    u16(0),
    u16(0),
    u16(2),
    Buffer.alloc(16),
  )
  // cmap: one format 4 subtable; [first, last] reads glyph 1 from a glyph id
  // array that follows the idRangeOffset entries.
  const segs = 2
  const ids = Buffer.concat(
    Array.from({ length: last - first + 1 }, () => u16(1)),
  )
  const cmap4 = cat(
    u16(4),
    u16(32 + ids.length),
    u16(0),
    u16(segs * 2),
    u16(4),
    u16(1),
    u16(0),
    u16(last),
    u16(0xffff),
    u16(0),
    u16(first),
    u16(0xffff),
    i16(0),
    i16(1),
    u16(segs * 2), // from this entry to the glyph id array
    u16(0),
    ids,
  )
  const cmap = cat(u16(0), u16(1), u16(3), u16(1), u32(12), cmap4)
  const names = [
    [1, family],
    [2, 'Regular'],
    [3, `${family} Regular`],
    [4, family],
    [6, family.replace(/[^A-Za-z0-9-]/g, '')],
  ]
  const strings = names.map(([, s]) => Buffer.from(s, 'utf16le').swap16())
  let off = 0
  const records = names.map(([id], i) => {
    const r = cat(
      u16(3),
      u16(1),
      u16(0x409),
      u16(id),
      u16(strings[i].length),
      u16(off),
    )
    off += strings[i].length
    return r
  })
  const name = cat(
    u16(0),
    u16(names.length),
    u16(6 + 12 * names.length),
    ...records,
    ...strings,
  )
  const post = cat(
    u32(0x00030000),
    u32(0),
    i16(-100),
    i16(50),
    u32(0),
    Buffer.alloc(16),
  )
  const os2 = cat(
    u16(3),
    i16(advance),
    u16(400),
    u16(5),
    u16(0),
    Buffer.alloc(16), // sub/superscript
    i16(50),
    i16(300),
    i16(0),
    Buffer.alloc(10), // panose
    u32(1), // Basic Latin
    u32(0),
    u32(0),
    u32(0),
    tag('APEX'),
    u16(0x40),
    u16(first),
    u16(last),
    i16(ascent),
    i16(-descent),
    i16(0),
    u16(ascent),
    u16(descent),
    u32(1),
    u32(0),
    i16(500),
    i16(700),
    u16(0),
    u16(32),
    u16(1),
  )

  const tables = [
    ['OS/2', os2],
    ['cmap', cmap],
    ['glyf', glyf],
    ['head', head],
    ['hhea', hhea],
    ['hmtx', hmtx],
    ['loca', loca],
    ['maxp', maxp],
    ['name', name],
    ['post', post],
  ]
  const n = tables.length
  const sr = 2 ** Math.floor(Math.log2(n)) * 16
  const dir = [
    u32(0x00010000),
    u16(n),
    u16(sr),
    u16(Math.log2(sr / 16)),
    u16(n * 16 - sr),
  ]
  let offset = 12 + 16 * n
  const body = []
  for (const [t, data] of tables) {
    dir.push(tag(t), u32(checksum(data)), u32(offset), u32(data.length))
    const padded = pad4(data)
    body.push(padded)
    offset += padded.length
  }
  const font = cat(...dir, ...body)
  // head.checkSumAdjustment: 0xB1B0AFBA minus the whole font's checksum.
  const headAt =
    12 + 16 * n + body.slice(0, 3).reduce((s, b) => s + b.length, 0)
  font.writeUInt32BE((0xb1b0afba - checksum(font)) >>> 0, headAt + 8)
  return font
}
