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
import { heading, creditFor, section, tidy, firstParagraph } from '../../build/release-notes.mjs'

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
 * Housekeeping summarises where the sections above it explain.
 *
 * A build script or a dependency move gets a line, not a heading and five
 * paragraphs of reasoning: this section sits under the features, and letting it
 * run to full bodies buries them under the part nobody opened the release to
 * read. Which is what the first generated release did, before anyone saw it.
 */
describe('the housekeeping section', () => {
  const chores = [
    commit({
      hash: '9'.repeat(40),
      type: 'chore',
      title: 'move the pin',
      body: 'Commons moves to ^0.8.0.\n\nA caret on a 0.x pins the minor, so\nevery build resolved an older one.',
    }),
  ]
  const terse = () => section(chores, ['chore'], '🧹 Housekeeping', {}, undefined, true)

  it('gives each entry a bullet and its opening paragraph', () => {
    expect(terse()).toContain('- Commons moves to ^0.8.0.')
  })

  it('leaves out the reasoning that belongs in the log', () => {
    expect(terse()).not.toContain('A caret on a 0.x')
  })

  it('uses no headings, so it cannot outrank the sections above it', () => {
    expect(terse()).not.toContain('###')
  })

  it('falls back to the subject where a chore has no body', () => {
    const bare = [commit({ hash: '8'.repeat(40), type: 'chore', title: 'bump a dep', body: '' })]
    expect(section(bare, ['chore'], '🧹 Housekeeping', {}, undefined, true)).toContain('- Bump a dep')
  })

  // The features above are the opposite case and keep their full bodies: the
  // whole point of assembling notes from commits is that the reasoning travels
  // with the change.
  it('does not make features terse', () => {
    const feat = [commit({ hash: '7'.repeat(40), type: 'feat', title: 'add a thing', body: 'What.\n\nWhy, at length.' })]
    const out = section(feat, ['feat'], '✨ New', {}, undefined)
    expect(out).toContain('### Add a thing')
    expect(out).toContain('Why, at length.')
  })
})

describe('unwrapping a paragraph', () => {
  // Commit bodies are hard-wrapped at about 72 characters. A bullet is one
  // line, so the wrapping has to come out or the list renders ragged.
  it('joins the lines a commit body wrapped', () => {
    expect(firstParagraph('one line\nand its continuation\n\nnext para')).toBe('one line and its continuation')
  })

  it('is empty for a body that has none', () => {
    expect(firstParagraph('')).toBe('')
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

  it('says so rather than printing a blank section for a body-less commit', () => {
    const out = section(commits, ['chore'], '🧹 Housekeeping', {}, undefined)
    expect(out).toContain('### Bump a dep')
    expect(out).toContain('_No detail was written on this commit._')
  })

  it('keeps commits in the order they landed', () => {
    const out = section(commits, ['feat', 'fix'], '✨ New', {}, undefined)
    expect(out.indexOf('Add a thing')).toBeLessThan(out.indexOf('Stop a crash'))
  })
})
