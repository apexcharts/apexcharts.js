/**
 * Assemble a release's notes from the commits it contains.
 *
 * A release note answers three questions: what changed, does it affect me, and
 * how do I upgrade. Readers scan it. So the notes are short: the release
 * commit's own body as the opening (where the behaviour changes and the
 * headline feature are explained), then one line per `feat` and `fix`, then the
 * install command and a link to the full changelog.
 *
 * Commit bodies are NOT published. They used to be, under a heading each, and
 * 7.9.0 came out at 6,200 words that nobody would read. A body explains what
 * was wrong and why the fix takes its shape, which is what a reader of
 * `git log` wants, and the changelog link takes anyone who wants that detail
 * straight to it.
 *
 * That makes the commit SUBJECT the published line, so write it for someone
 * deciding whether the change affects them. Anything a reader must act on (a
 * changed default, a new throw, an option to restore the old behaviour) goes
 * in the release commit's body, because a one-line subject cannot carry it.
 *
 * The output is meant to be published as-is. It is not a draft gate: a release
 * nobody remembers to publish is the failure this exists to prevent.
 *
 * Usage: node build/release-notes.mjs <previousTag> <ref> [authors.json]
 *   node build/release-notes.mjs v7.4.0 v7.5.0
 *   node build/release-notes.mjs v7.4.0 HEAD /tmp/authors.json
 *
 * `authors.json` is an optional `{ "<full sha>": "<github login>" }` map, which
 * the workflow gets from one compare-API call. Git only knows a name and an
 * email, and the notes credit people by the handle they are reachable at. It
 * stays optional so this runs offline and unauthenticated, just without the
 * credits.
 */

import { execFileSync } from 'child_process'
import { readFileSync } from 'fs'
import { gzipSize } from './gzip-size.mjs'

const git = (args, opts = {}) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, ...opts })

/**
 * The gzipped size of the default bundle at a ref.
 *
 * Measured by `gzip-size.mjs`, which says why it is zlib and not a shell
 * `gzip`. The same function prints the `npm run build` summary and enforces
 * the CI budget (`check-size.mjs`), so the number in the notes is one
 * maintainers already recognise.
 */
function bundleSize(ref) {
  const buf = execFileSync('git', ['show', `${ref}:dist/apexcharts.min.js`], {
    maxBuffer: 256 * 1024 * 1024,
  })
  return gzipSize(buf)
}

/** One commit, split into the parts the notes need. */
function commitsIn(range) {
  // \x1e between records and \x1f between fields: a commit body contains blank
  // lines, backticks and every punctuation mark, so a printable separator would
  // eventually appear inside one and split a record in half.
  const raw = git(['log', range, '--no-merges', '--reverse', '--format=%H\x1f%s\x1f%b\x1e'])
  return raw
    .split('\x1e')
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => {
      const [hash, subject, body = ''] = r.split('\x1f')
      const m = /^(\w+)(?:\(([^)]*)\))?!?:\s*(.+)$/.exec(subject)
      return {
        hash,
        type: m ? m[1] : '',
        scope: m ? m[2] || '' : '',
        title: m ? m[3] : subject,
        body: body.trim(),
      }
    })
}

/** Sentence case, because commit subjects are imperative and lowercase. */
export const heading = (s) => s.charAt(0).toUpperCase() + s.slice(1)

/**
 * Whose work to name.
 *
 * Only people who are not whoever cut the release: a maintainer thanking
 * themselves in their own notes is noise, and it buries the credits that mean
 * something. Bots are never credited. A body that thanks someone by handle
 * names who to credit, since someone wrote that deliberately (usually for a
 * contributor whose PR was squashed under the maintainer's name), and the
 * body itself is not published.
 */
export function creditHandle(commit, authors, releasedBy) {
  const thanked = /thanks @([\w-]+)/i.exec(commit.body)?.[1]
  const login = thanked || authors[commit.hash]
  if (!login || login.endsWith('[bot]') || login === releasedBy) return ''
  return login
}

export function creditFor(commit, authors, releasedBy) {
  const login = creditHandle(commit, authors, releasedBy)
  return login ? ` Thanks @${login}.` : ''
}

/**
 * The issues and pull requests a commit names, for the reader to follow.
 *
 * A squash merge puts its PR in the subject, `(#5338)`, and a body says which
 * issue it closes, `Fixes #3836.`. Both are worth a link; the rest of the body
 * is not.
 */
export function refsOf(commit) {
  const refs = [...commit.title.matchAll(/\(#(\d+)\)/g)].map((m) => m[1])
  for (const m of commit.body.matchAll(/\b(?:fix|fixes|fixed|close|closes|closed|resolve|resolves|resolved)\s+#(\d+)/gi)) {
    refs.push(m[1])
  }
  return [...new Set(refs)]
}

/** One line for one commit: its subject, what it references, who to thank. */
export function line(commit, authors, releasedBy) {
  const refs = refsOf(commit)
  const title = heading(commit.title.replace(/\s*\(#\d+\)/g, '').trim())
  const ref = refs.length ? ` (${refs.map((r) => `#${r}`).join(', ')})` : ''
  return `- ${title}${ref}.${creditFor(commit, authors, releasedBy)}`
}

/**
 * Even out the blank lines the section joins leave behind, without touching
 * what is inside a fenced block.
 *
 * Collapsing runs of blank lines is what keeps the joins between sections
 * regular. Doing it blind edits people's code: two blank lines inside a fence
 * are something the author typed, and closing them up silently is this script
 * rewriting an example it does not understand. The split captures the fences,
 * so the odd indices ARE the fences and are passed through untouched.
 */
export function tidy(md) {
  return md
    .split(/(```[\s\S]*?```)/g)
    .map((part, i) => (i % 2 ? part : part.replace(/\n{3,}/g, '\n\n')))
    .join('')
}

/**
 * Lines in a block that must be left exactly as written.
 *
 * A list, a table, a quote, a heading or an indented code block all mean
 * something by where their line ends. Joining those lines would turn a list
 * into one long sentence with stray hyphens in it.
 */
const STRUCTURAL = /^\s*(?:[-*+]\s|\d+[.)]\s|[|>#]|\s{4})/

/**
 * A list item starting a line of its own. A body often introduces a list with
 * a line of prose and no blank line ("Also fixed:" and then the items), and
 * the block then starts as prose, so STRUCTURAL alone joins the whole list
 * into that sentence. 7.9.0's tooltip notes came out that way.
 */
const LIST_ITEM = /^(?:[-*+]\s|\d+[.)]\s)/

/** Join a prose block into one line, keeping any list that follows its lead-in. */
function unwrapBlock(block) {
  if (STRUCTURAL.test(block)) return block
  const lines = block.split('\n')
  const at = lines.findIndex((line, i) => i > 0 && LIST_ITEM.test(line))
  const prose = (at > 0 ? lines.slice(0, at) : lines).join('\n')
  const joined = prose.replace(/\s*\n\s*/g, ' ').trim()
  return at > 0 ? `${joined}\n${lines.slice(at).join('\n')}` : joined
}

/**
 * Undo the hard wrapping in a commit body.
 *
 * Commit messages are wrapped at about 72 characters, because that is what a
 * terminal and `git log` want. GitHub renders a release body with hard line
 * breaks ON, unlike ordinary Markdown, so every one of those wraps comes out
 * as a visible break and the prose arrives in a narrow ragged column.
 *
 * So each paragraph is joined back into one line and the blank lines between
 * paragraphs are kept, which is how the hand-written notes were always
 * written. Fenced blocks are passed through untouched, since a line break in
 * code is the code, and so is any paragraph holding a list, table, quote,
 * heading or indented block.
 */
export function unwrap(md) {
  return md
    .split(/(```[\s\S]*?```)/g)
    .map((part, i) => {
      if (i % 2) return part // inside a fence
      return part
        .split(/\n\s*\n/)
        .map(unwrapBlock)
        .join('\n\n')
    })
    .join('')
}

/** A heading over one line per commit of the given types, in the order they landed. */
export function section(commits, types, title, authors, releasedBy) {
  const mine = commits.filter((c) => types.includes(c.type))
  if (!mine.length) return ''
  return `## ${title}\n\n${mine.map((c) => line(c, authors, releasedBy)).join('\n')}\n\n`
}

/**
 * One sentence on the default bundle, or nothing.
 *
 * Only when it moved by 1% or more. A table of two sizes under every release
 * told most readers that nothing happened; a sentence when something did is
 * the part worth reading.
 */
export function bundleLine(prevVersion, prevSize, size) {
  const delta = size - prevSize
  const pct = (delta / prevSize) * 100
  if (Math.abs(pct) < 1) return ''
  const n = (v) => v.toLocaleString('en-US')
  return (
    `The default bundle is ${n(size)} B gzipped, ${delta > 0 ? 'up' : 'down'} ` +
    `${n(Math.abs(delta))} B (${Math.abs(pct).toFixed(1)}%) from ${prevVersion}.`
  )
}

function main() {
  const [prev, ref = 'HEAD', authorsFile] = process.argv.slice(2)
  if (!prev) {
    console.error('usage: node build/release-notes.mjs <previousTag> [ref] [authors.json]')
    process.exit(1)
  }

  /** @type {Record<string, string>} full sha -> github login */
  let authors = {}
  if (authorsFile) {
    try {
      authors = JSON.parse(readFileSync(authorsFile, 'utf8'))
    } catch (e) {
      // Never fatal. Losing the credits is worth saying out loud; losing the
      // release because the API was unreachable is not.
      console.error(`[release-notes] could not read ${authorsFile}, continuing without credits: ${e.message}`)
    }
  }

  const version = git(['show', `${ref}:package.json`]).match(/"version":\s*"([^"]+)"/)?.[1]
  if (!version) throw new Error(`no version in package.json at ${ref}`)

  const commits = commitsIn(`${prev}..${ref}`)

  // The lede is the release commit's own opening. That commit already sums the
  // release up for the log, and saying it twice in two voices is how the two
  // drift apart. Its own listing of the commits is dropped: the sections below
  // list them, one line each.
  const release = commits.find((c) => c.type === 'release')
  const releasedBy = release ? authors[release.hash] : undefined
  const lede = []
  for (const text of (release?.body ?? '').split('\n')) {
    if (/^(Features|Fixes|Dependencies|Bundle|Housekeeping)\s*$/.test(text)) break
    lede.push(text)
  }

  const prevVersion = prev.replace(/^v/, '')
  const repo = process.env.GITHUB_REPOSITORY || 'apexcharts/apexcharts.js'

  const out = [
    unwrap(lede.join('\n')).trim(),
    '',
    // Features and fixes only. A release note answers "what changed for me",
    // and a build script, a test or a dependency pin has no answer to that.
    section(commits, ['feat'], '✨ New', authors, releasedBy),
    section(commits, ['fix'], '🐛 Fixes', authors, releasedBy),
    bundleLine(prevVersion, bundleSize(prev), bundleSize(ref)),
    '',
    `Upgrading is \`npm install apexcharts@${version}\`.`,
    '',
    `Full changelog, with the detail behind each change: https://github.com/${repo}/compare/${prev}...v${version}`,
  ].join('\n')

  process.stdout.write(tidy(out).trimEnd() + '\n')
}

// Only when run as a script: importing this for a test must not shell out
// to git, and a test that had to stub git would be testing the stub.
if (process.argv[1] && process.argv[1].endsWith('release-notes.mjs')) main()
