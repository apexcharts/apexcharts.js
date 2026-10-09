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
  refsOf,
  line,
  section,
  bundleLine,
  tidy,
  unwrap,
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
    expect(creditFor(commit(), AUTHORS, 'junedchhipa')).toBe(' Thanks @lazerg.')
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

  // Someone wrote that line on purpose, usually for a contributor whose PR was
  // squashed under the maintainer's name. The body is not published, so the
  // line has to carry the credit instead.
  it('credits the person a body thanks, over the commit author', () => {
    const c = commit({ body: 'Fixes #5283, thanks @octocat (#5284).' })
    expect(creditFor(c, AUTHORS, 'junedchhipa')).toBe(' Thanks @octocat.')
  })

  it('says nothing when the author could not be resolved', () => {
    expect(creditFor(commit(), {}, 'junedchhipa')).toBe('')
  })
})

/*
 * The release commit's body opens the notes and may carry a code sample, such
 * as the option that restores a changed default, as a fenced block. That makes
 * the fence load-bearing: anything this script does to the prose it must not do
 * inside one, or it is rewriting an example it does not understand.
 */
describe('a code sample carried in the release commit body', () => {
  const sample = ['```js', 'const a = 1', '', '', 'const b = 2', '```'].join('\n')

  it('keeps the author spacing inside a fence', () => {
    expect(tidy(`Prose.\n\n${sample}\n\nMore.`)).toContain('const a = 1\n\n\nconst b = 2')
  })

  it('still evens out the blank lines around it', () => {
    expect(tidy(`Prose.\n\n\n\n${sample}`)).toContain('Prose.\n\n```js')
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

  // The tooltip fix in 7.9.0 wrote "Also fixed:" straight above its items, and
  // the whole list was joined into that one line.
  it('keeps a list introduced by a line of prose', () => {
    const md = 'Also fixed\nalong the way:\n- first item\n  wrapped\n- second item'
    expect(unwrap(md)).toBe('Also fixed along the way:\n- first item\n  wrapped\n- second item')
  })

  it('keeps a numbered list introduced by a line of prose', () => {
    expect(unwrap('Fix:\n1. one\n2. two')).toBe('Fix:\n1. one\n2. two')
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

describe('one line per commit', () => {
  // A squash merge names its PR in the subject and the issue it closes in the
  // body. Both are links a reader follows; the rest of the body stays in git.
  it('collects the PR from the subject and the issues a body closes', () => {
    const c = commit({ title: 'map seriesName axes early (#5338)', body: 'Why.\n\nFixes #3836. Closes #12' })
    expect(refsOf(c)).toEqual(['5338', '3836', '12'])
  })

  it('names each reference once', () => {
    expect(refsOf(commit({ title: 'a fix (#7)', body: 'Fixes #7' }))).toEqual(['7'])
  })

  it('ignores a number that is only mentioned', () => {
    expect(refsOf(commit({ body: 'The #5036 guard had two defects.' }))).toEqual([])
  })

  it('is the subject, its references and its credit, and nothing from the body', () => {
    const c = commit({ title: 'map seriesName axes early (#5338)', body: 'A long explanation.\n\nFixes #3836.' })
    expect(line(c, { ['a'.repeat(40)]: 'octocat' }, 'junedchhipa')).toBe(
      '- Map seriesName axes early (#5338, #3836). Thanks @octocat.'
    )
  })
})

describe('grouping commits into sections', () => {
  const commits = [
    commit({ hash: '1'.repeat(40), type: 'feat', title: 'add a thing', body: 'Why the thing.' }),
    commit({ hash: '2'.repeat(40), type: 'fix', title: 'stop a crash', body: 'Why it crashed.' }),
    commit({ hash: '3'.repeat(40), type: 'chore', title: 'bump a dep', body: '' }),
  ]

  // 7.9.0 printed every fix's full body under a heading of its own and came
  // out at 6,200 words. A section is a list of one-liners.
  it('takes only the types it was asked for, one line each, without the bodies', () => {
    const out = section(commits, ['feat'], '✨ New', {}, undefined)
    expect(out).toBe('## ✨ New\n\n- Add a thing.\n\n')
    expect(out).not.toContain('Why the thing.')
  })

  // An empty heading over nothing is worse than no heading: it reads as though
  // something was meant to be there.
  it('emits nothing at all for a type with no commits', () => {
    expect(section(commits, ['refactor'], '🧹 Housekeeping', {}, undefined)).toBe('')
  })

  it('keeps commits in the order they landed', () => {
    const out = section(commits, ['feat', 'fix'], '✨ New', {}, undefined)
    expect(out.indexOf('Add a thing')).toBeLessThan(out.indexOf('Stop a crash'))
  })
})

describe('the bundle size', () => {
  it('is one sentence when it moved by 1% or more', () => {
    expect(bundleLine('7.8.0', 273832, 298123)).toBe(
      'The default bundle is 298,123 B gzipped, up 24,291 B (8.9%) from 7.8.0.'
    )
  })

  it('says down for a smaller bundle, without a double negative', () => {
    expect(bundleLine('7.8.0', 300000, 290000)).toBe(
      'The default bundle is 290,000 B gzipped, down 10,000 B (3.3%) from 7.8.0.'
    )
  })

  // Two sizes a few hundred bytes apart told most readers that nothing happened.
  it('says nothing when it barely moved', () => {
    expect(bundleLine('7.8.0', 273832, 274500)).toBe('')
  })

  // 8.0 shrank the default bundle by moving code into the full one; the first
  // sentence alone would read as that much less code.
  it('introduces the full bundle the release it first ships', () => {
    expect(
      bundleLine('7.9.1', 291763, 262431, { prevSize: null, size: 380201 }),
    ).toBe(
      'The default bundle is 262,431 B gzipped, down 29,332 B (10.1%) from 7.9.1. ' +
        'The new full bundle, apexcharts.full.min.js, has every chart type and feature in one file: 380,201 B.',
    )
  })

  it('reports the full bundle only when it moved, like the default one', () => {
    expect(
      bundleLine('8.0.0', 262431, 263000, { prevSize: 380201, size: 381000 }),
    ).toBe('')
    expect(
      bundleLine('8.0.0', 262431, 263000, { prevSize: 380201, size: 390000 }),
    ).toBe('The full bundle is 390,000 B, up 9,799 B (2.6%) from 8.0.0.')
  })

  it('says nothing about a full bundle that does not exist at either ref', () => {
    expect(
      bundleLine('7.8.0', 300000, 290000, { prevSize: null, size: null }),
    ).toBe(
      'The default bundle is 290,000 B gzipped, down 10,000 B (3.3%) from 7.8.0.'
    )
  })
})
