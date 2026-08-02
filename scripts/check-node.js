#!/usr/bin/env node
'use strict'

// Fail fast, with a clear message, when the running Node is too old to
// `require()` an ES module. jsdom 28 (used by the unit-test environment) pulls
// in html-encoding-sniffer -> @exodus/bytes, and @exodus/bytes is pure ESM.
// The unflagged require(esm) support it needs landed in Node 20.19 and 22.12.
// On an older Node every jsdom test worker dies with ERR_REQUIRE_ESM and the
// real cause (wrong Node) is buried under ~90 near-identical stack traces.
//
// This guard is intentionally plain CommonJS with zero dependencies so it runs
// on the very Node versions it is meant to reject.
//
// Supported range mirrors those dependencies' own `engines` field:
//   ^20.19.0 || ^22.12.0 || >=24.0.0   (23.x is excluded on purpose: non-LTS)

const [major, minor] = process.versions.node.split('.').map(Number)

const supported =
  (major === 20 && minor >= 19) ||
  (major === 22 && minor >= 12) ||
  major >= 24

if (!supported) {
  const tty = process.stderr.isTTY
  const red = (s) => (tty ? `\x1b[31m${s}\x1b[0m` : s)
  const bold = (s) => (tty ? `\x1b[1m${s}\x1b[0m` : s)

  process.stderr.write(
    '\n' +
      red(bold('The unit tests need a newer Node.')) +
      `\n  Running: Node ${process.versions.node}` +
      '\n  Required: ^20.19.0 || ^22.12.0 || >=24.0.0' +
      '\n  (that is the require(esm) support jsdom 28 depends on; without it every' +
      '\n  test worker fails to start with ERR_REQUIRE_ESM).' +
      '\n\n  This repo pins ' +
      bold('22.14.0') +
      ' in .nvmrc, so:' +
      '\n\n    nvm use            # or: nvm install 22.14.0' +
      '\n\n  If a standalone node still shadows nvm (check with `which node`), make' +
      " nvm's bin win in PATH or replace that binary.\n\n",
  )
  process.exit(1)
}
