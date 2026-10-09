import { gzipSync } from 'zlib'

/**
 * The one way this repo measures a bundle's size.
 *
 * zlib at its default level over the file's raw bytes, in whole bytes. Every
 * size figure the project prints goes through here: the release-notes table
 * (`release-notes.mjs`), the build summary (`vite-build.mjs`) and the CI budget
 * (`check-size.mjs`). One definition is what keeps those three numbers equal.
 *
 * NOT a shell `gzip`, for three reasons, all learned the hard way. The two
 * disagree by a few hundred bytes at the same level, and `gzip -9` reads 1.1 to
 * 1.6 KB smaller, which is more than a typical minor release grows. `gzip`
 * output differs between macOS and Linux, so a figure computed on a laptop
 * cannot be reproduced by CI. And `gzip -c file` writes the source filename into
 * the header while piping the same bytes through stdin does not, so even one
 * machine gives two answers.
 *
 * Takes a Buffer, never a string: gzipping a decoded string only matches the
 * file because terser runs with `ascii_only`. Returns bytes, never KB or KiB; a
 * build log that printed KiB once had "258.61kb" transcribed as 258,611 B.
 *
 * @param {Buffer} buf
 * @returns {number}
 */
export const gzipSize = (buf) => gzipSync(buf).length
