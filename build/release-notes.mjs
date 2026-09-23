/**
 * Assemble a release's notes from the commits it contains.
 *
 * Not a changelog of commit subjects. This repo writes real bodies on its
 * commits, explaining what was wrong before the change and why the fix takes
 * the shape it does, which is the same thing the notes have to say. So the
 * bodies ARE the notes: this groups them under the headings the published
 * releases use, and computes the one part that is a measurement rather than a
 * piece of writing.
 *
 * The output is meant to be published as-is. It is not a draft gate: a release
 * nobody remembers to publish is the failure this exists to prevent.
 *
 * Which puts a `feat` commit under an obligation it did not have before. If an
 * addition wants a code sample in the notes, the sample goes in the COMMIT
 * BODY, as an ordinary fenced block:
 *
 *     feat(weave): report the chart title to a plugin
 *
 *     A plugin naming this chart to somebody otherwise has only the
 *     container id, which is a string written for a stylesheet.
 *
 *     ```js
 *     api.info.title // 'Revenue by region', or ''
 *     ```
 *
 * Bodies are passed through verbatim, fences and all, so nothing here has to
 * know about it. The commit is the right place for the example regardless: it
 * is the first thing a reader of `git log -p` wants, and it cannot drift from
 * the change the way a sample written weeks later at release time can.
 *
 * One constraint comes from git rather than from here: its default commit
 * cleanup collapses consecutive blank lines, so a sample cannot carry a double
 * blank line unless the commit is made with `--cleanup=verbatim`. Single blank
 * lines are untouched, which is all a short example needs.
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
import { gzipSync } from 'zlib'

const git = (args, opts = {}) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, ...opts })

/**
 * The gzipped size of the default bundle at a ref.
 *
 * zlib at its default level, NOT a shell `gzip`. Three reasons, all learned the
 * hard way: the two disagree by a few hundred bytes; `gzip` output differs
 * between macOS and Linux, so a figure computed on a laptop cannot be
 * reproduced by CI; and `gzip -c file` writes the source filename into the
 * header while piping the same bytes through stdin does not, so even one
 * machine gives two answers. This is also exactly the figure `npm run build`
 * prints, so the number in the notes is one maintainers already recognise.
 */
function bundleSize(ref) {
  const buf = execFileSync('git', ['show', `${ref}:dist/apexcharts.min.js`], {
    maxBuffer: 256 * 1024 * 1024,
  })
  return gzipSync(buf).length
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
 * something. Bots are never credited. A commit body that already says "thanks"
 * is left alone, because someone wrote that deliberately.
 */
export function creditFor(commit, authors, releasedBy) {
  const login = authors[commit.hash]
  if (!login || login.endsWith('[bot]') || login === releasedBy) return ''
  if (/thanks @/i.test(commit.body)) return ''
  return `\n\nThanks @${login}.`
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
        .map((block) => (STRUCTURAL.test(block) ? block : block.replace(/\s*\n\s*/g, ' ').trim()))
        .join('\n\n')
    })
    .join('')
}

export function section(commits, types, title, authors, releasedBy) {
  const mine = commits.filter((c) => types.includes(c.type))
  if (!mine.length) return ''
  const blocks = mine.map(
    (c) =>
      `### ${heading(c.title)}\n\n${unwrap(c.body) || '_No detail was written on this commit._'}` +
      creditFor(c, authors, releasedBy)
  )
  return `## ${title}\n\n${blocks.join('\n\n')}\n\n`
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
  // drift apart. Its own listing of the commits is dropped: they are expanded
  // in full below.
  const release = commits.find((c) => c.type === 'release')
  const releasedBy = release ? authors[release.hash] : undefined
  const lede = []
  for (const line of (release?.body ?? '').split('\n')) {
    if (/^(Features|Fixes|Dependencies|Bundle|Housekeeping)\s*$/.test(line)) break
    lede.push(line)
  }

  const prevSize = bundleSize(prev)
  const size = bundleSize(ref)
  const n = (v) => v.toLocaleString('en-US')

  const out = [
    unwrap(lede.join('\n')).trim(),
    '',
    '| | gzip |',
    '|---|---|',
    `| ${prev.replace(/^v/, '')} default bundle | ${n(prevSize)} B |`,
    `| ${version} default bundle | ${n(size)} B |`,
    '',
    `Both are \`dist/apexcharts.min.js\` gzipped at the default level, which is the figure \`npm run build\` prints.`,
    '',
    `Upgrading is \`npm install apexcharts@${version}\`.`,
    '',
    // Features and fixes only. A release note answers "what changed for me",
    // and a build script, a test or a dependency pin has no answer to that: it
    // ran to several paragraphs of internal reasoning underneath the thing the
    // reader actually opened the release for. The log is where that belongs.
    section(commits, ['feat'], '✨ New', authors, releasedBy),
    section(commits, ['fix'], '🐛 Fixes', authors, releasedBy),
  ].join('\n')

  process.stdout.write(tidy(out).trimEnd() + '\n')
}

// Only when run as a script: importing this for a test must not shell out
// to git, and a test that had to stub git would be testing the stub.
if (process.argv[1] && process.argv[1].endsWith('release-notes.mjs')) main()
