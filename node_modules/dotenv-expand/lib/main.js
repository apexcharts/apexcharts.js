'use strict'

// * /
// *   (\\)?            # is it escaped with a backslash?
// *   (\$)             # literal $
// *   (?!\()           # shouldnt be followed by parenthesis
// *   (\{?)            # first brace wrap opening
// *   ([\w.]+)         # key
// *   (?::-((?:\$\{(?:\$\{(?:\$\{[^}]*\}|[^}])*}|[^}])*}|[^}])+))? # optional default nested 3 times
// *   (\}?)            # last brace warp closing
// * /xi

const DOTENV_SUBSTITUTION_REGEX = /(\\)?(\$)(?!\()(\{?)([\w.]+)(?::?-((?:\$\{(?:\$\{(?:\$\{[^}]*\}|[^}])*}|[^}])*}|[^}])+))?(\}?)/gi

function _resolveEscapeSequences (value) {
  return value.replace(/\\\$/g, '$')
}

function interpolate (value, processEnv, parsed) {
  return value.replace(DOTENV_SUBSTITUTION_REGEX, (match, escaped, dollarSign, openBrace, key, defaultValue, closeBrace) => {
    if (escaped === '\\') {
      return match.slice(1)
    } else {
      if (processEnv[key]) {
        if (processEnv[key] === parsed[key]) {
          return processEnv[key]
        } else {
          // scenario: PASSWORD_EXPAND_NESTED=${PASSWORD_EXPAND}
          return interpolate(processEnv[key], processEnv, parsed)
        }
      }

      if (parsed[key]) {
        // avoid recursion from EXPAND_SELF=$EXPAND_SELF
        if (parsed[key] !== value) {
          return interpolate(parsed[key], processEnv, parsed)
        }
      }

      if (defaultValue) {
        if (defaultValue.startsWith('$')) {
          return interpolate(defaultValue, processEnv, parsed)
        } else {
          return defaultValue
        }
      }

      return ''
    }
  })
}

function expand (options) {
  let processEnv = process.env
  if (options && options.processEnv != null) {
    processEnv = options.processEnv
  }

  for (const key in options.parsed) {
    let value = options.parsed[key]

    const inProcessEnv = Object.prototype.hasOwnProperty.call(processEnv, key)
    if (inProcessEnv) {
      if (processEnv[key] === options.parsed[key]) {
        // assume was set to processEnv from the .env file if the values match and therefore interpolate
        value = interpolate(value, processEnv, options.parsed)
      } else {
        // do not interpolate - assume processEnv had the intended value even if containing a $.
        value = processEnv[key]
      }
    } else {
      // not inProcessEnv so assume interpolation for this .env key
      value = interpolate(value, processEnv, options.parsed)
    }

    options.parsed[key] = _resolveEscapeSequences(value)
  }

  for (const processKey in options.parsed) {
    processEnv[processKey] = options.parsed[processKey]
  }

  return options
}

module.exports.expand = expand
