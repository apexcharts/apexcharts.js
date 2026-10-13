// @vitest-environment node
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { transformSync } from 'esbuild'

// The *.code.json manifests are the code a reader copies from a demo, and the
// website opens in CodeSandbox and StackBlitz. Nothing ran them, so 67 Vue
// manifests shipped with `},,` (code-manifests.js appended a comma after a
// <vue-script> section that already ended in one) and every one of those
// sandboxes failed to build. This parses the script of every displayed file.

const SAMPLES = path.resolve(__dirname, '../../samples')

function manifests(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return manifests(p)
    return e.name.endsWith('.code.json') ? [p] : []
  })
}

/** [loader, source] for each script a manifest displays. */
function scripts(file) {
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  const out = []
  for (const f of json.files || json) {
    if (/\.jsx$/.test(f.name)) out.push([f.name, 'jsx', f.code])
    else if (/\.js$/.test(f.name)) out.push([f.name, 'js', f.code])
    else if (/\.vue$/.test(f.name)) {
      const m = f.code.match(/<script>([\s\S]*?)<\/script>/)
      if (m) out.push([f.name, 'js', m[1]])
    }
  }
  return out
}

describe('sample code manifests', () => {
  for (const format of ['vanilla-js', 'react', 'vue']) {
    it(`every ${format} manifest's displayed script parses`, () => {
      const files = manifests(path.join(SAMPLES, format))
      expect(files.length).toBeGreaterThan(0)
      const failures = []
      for (const file of files) {
        for (const [name, loader, code] of scripts(file)) {
          try {
            transformSync(code, { loader, format: 'esm', jsx: 'automatic' })
          } catch (e) {
            const where = path.relative(SAMPLES, file)
            failures.push(`${where} ${name}: ${e.message.split('\n')[0]}`)
          }
        }
      }
      expect(failures).toEqual([])
    })
  }
})
