'use strict'

const reNomatch = /(?!.*)/

function join (array, joiner) {
  return array
    .map(function (val) {
      return val.trim()
    })
    .filter(function (val) {
      return val.length
    })
    .join(joiner)
}

function getNotesRegex (noteKeywords, notesPattern) {
  if (!noteKeywords) {
    return reNomatch
  }

  const noteKeywordsSelection = join(noteKeywords, '|')

  if (!notesPattern) {
    return new RegExp('^[\\s|*]*(' + noteKeywordsSelection + ')[:\\s]+(.*)', 'i')
  }

  return notesPattern(noteKeywordsSelection)
}

function getReferencePartsRegex (issuePrefixes, issuePrefixesCaseSensitive) {
  if (!issuePrefixes) {
    return reNomatch
  }

  const flags = issuePrefixesCaseSensitive ? 'g' : 'gi'
  return new RegExp('(?:.*?)??\\s*([\\w-\\.\\/]*?)??(' + join(issuePrefixes, '|') + ')([\\w-]*\\d+)', flags)
}

function getReferencesRegex (referenceActions) {
  if (!referenceActions) {
    // matches everything
    return /()(.+)/gi
  }

  const joinedKeywords = join(referenceActions, '|')
  return new RegExp('(' + joinedKeywords + ')(?:\\s+(.*?))(?=(?:' + joinedKeywords + ')|$)', 'gi')
}

module.exports = function (options) {
  options = options || {}
  const reNotes = getNotesRegex(options.noteKeywords, options.notesPattern)
  const reReferenceParts = getReferencePartsRegex(options.issuePrefixes, options.issuePrefixesCaseSensitive)
  const reReferences = getReferencesRegex(options.referenceActions)

  return {
    notes: reNotes,
    referenceParts: reReferenceParts,
    references: reReferences,
    mentions: /@([\w-]+)/g
  }
}
