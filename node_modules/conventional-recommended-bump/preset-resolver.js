'use strict'

const { promisify } = require('util')

module.exports = presetResolver

async function presetResolver (presetPackage) {
  // handle traditional node-style callbacks
  if (typeof presetPackage === 'function') {
    return await promisify(presetPackage)()
  }

  // handle object literal or Promise instance
  if (typeof presetPackage === 'object') {
    return await presetPackage
  }

  throw new Error('preset package must be a promise, function, or object')
}
