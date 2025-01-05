/*
* @Author: zoujie.wzj
* @Date:   2016-01-23 18:18:28
* @Last Modified by: Ayon Lee
* @Last Modified on: 2018-10-19
*/

'use strict'

const findPid = require('./find_pid')
const findProcess = require('./find_process')
const log = require('./logger')

const findBy = {
  port (port, config) {
    return findPid(port)
      .then(pid => {
        return findBy.pid(pid, config)
      }, () => {
        // return empty array when pid not found
        return []
      })
  },
  pid (pid, config) {
    return findProcess({
      pid,
      config
    })
  },
  name (name, config) {
    return findProcess({
      name,
      config,
      skipSelf: true
    })
  }
}

/**
 * find process by condition
 *
 * return Promise: [{
 *   pid: <process id>,
 *   ppid: <process parent id>,
 *   uid: <user id (*nix)>,
 *   gid: <user group id (*nix)>,
 *   name: <command name>,
 *   cmd: <process run args>
 * }, ...]
 *
 * If no process found, resolve process with empty array (only reject when error occured)
 *
 * @param {String} by condition: port/pid/name ...
 * @param {Mixed} condition value
 * @param {Boolean|Option}
 * @return {Promise}
 */
function find (by, value, options) {
  const config = Object.assign({
    logLevel: 'warn',
    strict: typeof options === 'boolean' ? options : false
  }, options)

  log.setLevel(config.logLevel)

  return new Promise((resolve, reject) => {
    if (!(by in findBy)) {
      reject(new Error(`do not support find by "${by}"`))
    } else {
      const isNumber = /^\d+$/.test(value)
      if (by === 'pid' && !isNumber) {
        reject(new Error('pid must be a number'))
      } else if (by === 'port' && !isNumber) {
        reject(new Error('port must be a number'))
      } else {
        findBy[by](value, config).then(resolve, reject)
      }
    }
  })
}

module.exports = find
