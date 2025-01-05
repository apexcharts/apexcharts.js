'use strict'
const conventionalCommitsFilter = require('conventional-commits-filter')
const Handlebars = require('handlebars')
const semver = require('semver')
const stringify = require('json-stringify-safe')

function compileTemplates (templates) {
  const main = templates.mainTemplate
  const headerPartial = templates.headerPartial
  const commitPartial = templates.commitPartial
  const footerPartial = templates.footerPartial
  const partials = templates.partials

  if (typeof headerPartial === 'string') {
    Handlebars.registerPartial('header', headerPartial)
  }

  if (typeof commitPartial === 'string') {
    Handlebars.registerPartial('commit', commitPartial)
  }

  if (typeof footerPartial === 'string') {
    Handlebars.registerPartial('footer', footerPartial)
  }

  if (partials) {
    Object.entries(partials).forEach(function ([name, partial]) {
      if (typeof partial === 'string') {
        Handlebars.registerPartial(name, partial)
      }
    })
  }

  return Handlebars.compile(main, {
    noEscape: true
  })
}

function functionify (strOrArr) {
  if (strOrArr && typeof strOrArr !== 'function') {
    return (a, b) => {
      let str1 = ''
      let str2 = ''
      if (Array.isArray(strOrArr)) {
        for (const key of strOrArr) {
          str1 += a[key] || ''
          str2 += b[key] || ''
        }
      } else {
        str1 += a[strOrArr]
        str2 += b[strOrArr]
      }
      return str1.localeCompare(str2)
    }
  } else {
    return strOrArr
  }
}

function getCommitGroups (groupBy, commits, groupsSort, commitsSort) {
  const commitGroups = []
  const commitGroupsObj = commits.reduce(function (groups, commit) {
    const key = commit[groupBy] || ''

    if (groups[key]) {
      groups[key].push(commit)
    } else {
      groups[key] = [commit]
    }

    return groups
  }, {})

  Object.entries(commitGroupsObj).forEach(function ([title, commits]) {
    if (title === '') {
      title = false
    }

    if (commitsSort) {
      commits.sort(commitsSort)
    }

    commitGroups.push({
      title: title,
      commits: commits
    })
  })

  if (groupsSort) {
    commitGroups.sort(groupsSort)
  }

  return commitGroups
}

function getNoteGroups (notes, noteGroupsSort, notesSort) {
  const retGroups = []

  notes.forEach(function (note) {
    const title = note.title
    let titleExists = false

    retGroups.forEach(function (group) {
      if (group.title === title) {
        titleExists = true
        group.notes.push(note)
        return false
      }
    })

    if (!titleExists) {
      retGroups.push({
        title: title,
        notes: [note]
      })
    }
  })

  if (noteGroupsSort) {
    retGroups.sort(noteGroupsSort)
  }

  if (notesSort) {
    retGroups.forEach(function (group) {
      group.notes.sort(notesSort)
    })
  }

  return retGroups
}

function get (context, path) {
  const parts = path.split('.')

  return parts.reduce((context, key) =>
    context ? context[key] : context
  , context)
}

function immutableSet (context, path, value) {
  const parts = Array.isArray(path) ? path.slice() : path.split('.')
  const key = parts.shift()

  if (!key) {
    return context
  }

  return {
    ...context,
    [key]: parts.length ? immutableSet(context[key], parts, value) : value
  }
}

function cloneCommit (commit) {
  if (!commit || typeof commit !== 'object') {
    return commit
  } else
  if (Array.isArray(commit)) {
    return commit.map(cloneCommit)
  }

  const commitClone = {}
  let value

  for (const key in commit) {
    value = commit[key]

    if (typeof value === 'object') {
      commitClone[key] = cloneCommit(value)
    } else {
      commitClone[key] = value
    }
  }

  return commitClone
}

function processCommit (chunk, transform, context) {
  let commit

  try {
    chunk = JSON.parse(chunk)
  } catch (e) {}

  commit = cloneCommit(chunk)

  if (typeof transform === 'function') {
    commit = transform(commit, context)

    if (commit) {
      commit.raw = chunk
    }

    return commit
  }

  if (transform) {
    Object.entries(transform).forEach(function ([path, el]) {
      let value = get(commit, path)

      if (typeof el === 'function') {
        value = el(value, path)
      } else {
        value = el
      }

      commit = immutableSet(commit, path, value)
    })
  }

  commit.raw = chunk

  return commit
}

function getExtraContext (commits, notes, options) {
  const context = {}

  // group `commits` by `options.groupBy`
  context.commitGroups = getCommitGroups(options.groupBy, commits, options.commitGroupsSort, options.commitsSort)

  // group `notes` for footer
  context.noteGroups = getNoteGroups(notes, options.noteGroupsSort, options.notesSort)

  return context
}

function generate (options, commits, context, keyCommit) {
  const notes = []
  let filteredCommits
  const compiled = compileTemplates(options)

  if (options.ignoreReverted) {
    filteredCommits = conventionalCommitsFilter(commits)
  } else {
    filteredCommits = commits.slice()
  }

  filteredCommits = filteredCommits.map((commit) => ({
    ...commit,
    notes: commit.notes.map((note) => {
      const commitNote = {
        ...note,
        commit
      }

      notes.push(commitNote)

      return commitNote
    })
  }))

  context = {
    ...context,
    ...keyCommit,
    ...getExtraContext(filteredCommits, notes, options)
  }

  if (keyCommit && keyCommit.committerDate) {
    context.date = keyCommit.committerDate
  }

  if (context.version && semver.valid(context.version)) {
    context.isPatch = context.isPatch || semver.patch(context.version) !== 0
  }

  context = options.finalizeContext(context, options, filteredCommits, keyCommit, commits)
  options.debug('Your final context is:\n' + stringify(context, null, 2))

  return compiled(context)
}

module.exports = {
  compileTemplates: compileTemplates,
  functionify: functionify,
  getCommitGroups: getCommitGroups,
  getNoteGroups: getNoteGroups,
  processCommit: processCommit,
  getExtraContext: getExtraContext,
  generate: generate
}
