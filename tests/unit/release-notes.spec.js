/**
 * The release notes generator.
 *
 * The notes are the artifact most readers of a release ever see, and they are
 * now assembled rather than written, so the assembly is worth pinning. The
 * assertions that matter most are the two about crediting: that a contributor
 * is named, and that the maintainer cutting the release is not thanked in
 * their own notes, which is how a credit list stops meaning anything.
 *
 * The git-reading half is deliberately not tested here. A test that stubbed
 * `git log` would be asserting against its own stub; that half is exercised
 * for real by running the script against past tags.
 */

import { describe, it, expect } from 'vitest'
import {
  heading,
  creditFor,
  section,
  tidy,
  unwrap,
  stripTrailers,
} from '../../build/release-notes.mjs'

/** A commit in the shape the generator parses them into. */
const commit = (over = {}) => ({
  hash: 'a'.repeat(40),
  type: 'fix',
  scope: '',
  title: 'stop the axis throwing when it is hidden',
  body: 'The group is created but the texts group is not.',
  ...over,
})

describe('headings', () => {
  // Commit subjects are imperative and lowercase by this repo's commitlint
  // rules, and a run of lowercase H3s reads like a changelog rather than notes.
  it('sentence-cases an imperative subject', () => {
    expect(heading('let a plugin claim an option')).toBe('Let a plugin claim an option')
  })

  it('leaves a subject that already starts capitalised', () => {
    expect(heading('SSR measured every label as 0x0')).toBe('SSR measured every label as 0x0')
  })

  it('does not choke on an empty subject', () => {
    expect(heading('')).toBe('')
  })
})

describe('crediting the people who did the work', () => {
  const AUTHORS = { ['a'.repeat(40)]: 'lazerg' }

  it('names the contributor', () => {
    expect(creditFor(commit(), AUTHORS, 'junedchhipa')).toBe('\n\nThanks @lazerg.')
  })

  // The assertion that keeps the credits meaning something: a maintainer
  // thanking themselves on every commit buries the ones that are real.
  it('does not thank whoever cut the release', () => {
    expect(creditFor(commit(), AUTHORS, 'lazerg')).toBe('')
  })

  it('never thanks a bot', () => {
    const bots = { ['a'.repeat(40)]: 'dependabot[bot]' }
    expect(creditFor(commit(), bots, 'junedchhipa')).toBe('')
  })

  // Someone wrote that line on purpose, usually with a PR number the API call
  // does not carry. Adding a second thanks underneath it reads as a mistake.
  it('leaves a body that already credits someone alone', () => {
    const c = commit({ body: 'Fixes #5283, thanks @lazerg (#5284).' })
    expect(creditFor(c, AUTHORS, 'junedchhipa')).toBe('')
  })

  it('says nothing when the author could not be resolved', () => {
    expect(creditFor(commit(), {}, 'junedchhipa')).toBe('')
  })
})

/*
 * A `feat` that wants a code sample in the notes puts it in the commit body as
 * a fenced block, and the body is passed through verbatim. That makes the
 * fence load-bearing: anything this script does to the prose it must not do
 * inside one, or it is rewriting an example it does not understand.
 */
describe('a code sample carried in a commit body', () => {
  const sample = ['```js', 'const a = 1', '', '', 'const b = 2', '```'].join('\n')

  it('keeps the author spacing inside a fence', () => {
    expect(tidy(`Prose.\n\n${sample}\n\nMore.`)).toContain('const a = 1\n\n\nconst b = 2')
  })

  it('still evens out the blank lines around it', () => {
    expect(tidy(`Prose.\n\n\n\n${sample}`)).toContain('Prose.\n\n```js')
  })

  it('survives a whole section unchanged', () => {
    const c = commit({ type: 'feat', title: 'report the chart title', body: `Why.\n\n${sample}` })
    expect(tidy(section([c], ['feat'], '✨ New', {}, undefined))).toContain(sample)
  })

  // Two samples in one body. The fence match has to be lazy: a greedy one
  // treats everything from the first fence to the last as one block, so the
  // prose BETWEEN them silently stops being tidied. Asserting only that both
  // samples survive cannot tell the two apart, because greedy preserves them
  // too. The blank lines between the fences are what separates the cases.
  it('tidies between two fences, rather than swallowing the gap', () => {
    const out = tidy(`Prose.\n\n${sample}\n\n\n\nAnd:\n\n\n\n${sample}`)
    expect(out.match(/```js/g)).toHaveLength(2)
    expect(out).toContain('const a = 1\n\n\nconst b = 2')
    expect(out).toContain('```\n\nAnd:\n\n```js')
  })
})

/*
 * Undoing the hard wrapping, which is what a commit body arrives with.
 *
 * GitHub renders a release body with hard line breaks ON, unlike ordinary
 * Markdown, so a body wrapped at 72 characters for the terminal comes out as a
 * narrow ragged column with a break after every line. 7.5.1 shipped looking
 * exactly like that.
 */
describe('unwrapping a commit body', () => {
  it('joins the lines of a paragraph into one', () => {
    expect(unwrap('one line\nand its continuation')).toBe('one line and its continuation')
  })

  it('keeps the break between two paragraphs', () => {
    expect(unwrap('first para\nwrapped\n\nsecond para')).toBe('first para wrapped\n\nsecond para')
  })

  // A line break in code IS the code. This is the same fence rule `tidy` has,
  // and getting it wrong here would reformat an example into one long line.
  it('leaves a fenced block exactly as written', () => {
    const md = 'Prose\nwrapped.\n\n```js\nconst a = 1\nconst b = 2\n```'
    expect(unwrap(md)).toBe('Prose wrapped.\n\n```js\nconst a = 1\nconst b = 2\n```')
  })

  // A list means something by where its lines end: joined, it becomes one
  // sentence with stray hyphens through the middle of it.
  it('leaves a list alone', () => {
    const md = '- first item\n- second item'
    expect(unwrap(md)).toBe(md)
  })

  it('leaves a table, a quote and an indented block alone', () => {
    for (const md of ['| a | b |\n|---|---|', '> quoted line\n> and more', '    indented code\n    second line']) {
      expect(unwrap(md)).toBe(md)
    }
  })

  it('unwraps the prose around a fence in the same body', () => {
    const md = 'Before\nwrapped.\n\n```js\nx()\n```\n\nAfter\nwrapped.'
    const out = unwrap(md)
    expect(out).toContain('Before wrapped.')
    expect(out).toContain('After wrapped.')
    expect(out).toContain('```js\nx()\n```')
  })
})

describe('grouping commits into sections', () => {
  const commits = [
    commit({ hash: '1'.repeat(40), type: 'feat', title: 'add a thing', body: 'Why the thing.' }),
    commit({ hash: '2'.repeat(40), type: 'fix', title: 'stop a crash', body: 'Why it crashed.' }),
    commit({ hash: '3'.repeat(40), type: 'chore', title: 'bump a dep', body: '' }),
  ]

  it('takes only the types it was asked for, with the body as the prose', () => {
    const out = section(commits, ['feat'], '✨ New', {}, undefined)
    expect(out).toContain('## ✨ New')
    expect(out).toContain('### Add a thing')
    expect(out).toContain('Why the thing.')
    expect(out).not.toContain('stop a crash')
  })

  // An empty heading over nothing is worse than no heading: it reads as though
  // something was meant to be there.
  it('emits nothing at all for a type with no commits', () => {
    expect(section(commits, ['refactor'], '🧹 Housekeeping', {}, undefined)).toBe('')
  })

  // 7.6.0 published three headings with `_No detail was written on this
  // commit._` under them, one of them over "fix: address comments". A heading
  // is a promise of detail, so a commit that has none does not get one.
  it('collapses a body-less commit to a line instead of an empty heading', () => {
    const out = section(commits, ['chore'], '🧹 Housekeeping', {}, undefined)
    expect(out).not.toContain('### Bump a dep')
    expect(out).not.toContain('No detail was written')
    expect(out).toContain('**Also:**')
    expect(out).toContain('- Bump a dep')
  })

  it('still credits the author of a body-less commit, inline', () => {
    const authors = { ['3'.repeat(40)]: 'octocat' }
    const out = section(commits, ['chore'], '🧹 Housekeeping', authors, undefined)
    expect(out).toContain('- Bump a dep (@octocat)')
  })

  it('keeps described commits as headings above the collapsed ones', () => {
    const mixed = [
      commit({ hash: '4'.repeat(40), type: 'fix', title: 'told', body: 'The reason.' }),
      commit({ hash: '5'.repeat(40), type: 'fix', title: 'untold', body: '' }),
    ]
    const out = section(mixed, ['fix'], '🐛 Fixes', {}, undefined)
    expect(out).toContain('### Told')
    expect(out.indexOf('### Told')).toBeLessThan(out.indexOf('**Also:**'))
    expect(out).toContain('- Untold')
  })

  // A body whose only content was a trailer is a body-less commit.
  it('treats a body of nothing but trailers as no body at all', () => {
    const trailerOnly = [
      commit({
        hash: '6'.repeat(40),
        type: 'fix',
        title: 'quiet one',
        body: 'Co-Authored-By: Someone <nobody@example.com>',
      }),
    ]
    const out = section(trailerOnly, ['fix'], '🐛 Fixes', {}, undefined)
    expect(out).not.toContain('Co-Authored-By')
    expect(out).toContain('- Quiet one')
  })

  it('strips a trailer from a commit that does have prose', () => {
    const withTrailer = [
      commit({
        hash: '7'.repeat(40),
        type: 'fix',
        title: 'real one',
        body: 'Why it broke.\n\nCo-Authored-By: Someone <nobody@example.com>',
      }),
    ]
    const out = section(withTrailer, ['fix'], '🐛 Fixes', {}, undefined)
    expect(out).toContain('### Real one')
    expect(out).toContain('Why it broke.')
    expect(out).not.toContain('Co-Authored-By')
  })

  it('keeps commits in the order they landed', () => {
    const out = section(commits, ['feat', 'fix'], '✨ New', {}, undefined)
    expect(out.indexOf('Add a thing')).toBeLessThan(out.indexOf('Stop a crash'))
  })
})

// 7.6.0 published two `Co-Authored-By:` lines as prose in the middle of its
// notes. The people a trailer names are credited from the compare API instead.
describe('stripping the trailers off a commit body', () => {
  it('drops a trailing person trailer', () => {
    expect(stripTrailers('Prose.\n\nCo-Authored-By: A <a@b.c>')).toBe('Prose.')
  })

  it('drops a run of them', () => {
    const body = 'Prose.\n\nSigned-off-by: A <a@b.c>\nReviewed-by: B <b@b.c>'
    expect(stripTrailers(body)).toBe('Prose.')
  })

  it('keeps Closes and Fixes, which a reader follows', () => {
    expect(stripTrailers('Prose.\n\nCloses #4999')).toBe('Prose.\n\nCloses #4999')
  })

  it('leaves prose that merely contains a colon alone', () => {
    const body = 'Note: the axis is hidden here.\n\nAnd then this.'
    expect(stripTrailers(body)).toBe(body)
  })

  it('only strips from the end, never mid-body', () => {
    const body = 'Co-Authored-By: A <a@b.c>\n\nThis paragraph is the real body.'
    expect(stripTrailers(body)).toBe(body)
  })

  it('returns an empty string for a body that is only a trailer', () => {
    expect(stripTrailers('Co-Authored-By: A <a@b.c>')).toBe('')
  })
})
