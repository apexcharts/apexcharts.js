/*
* @Author: zoujie.wzj
* @Date:   2016-01-22 19:27:17
* @Last Modified by: Ayon Lee
* @Last Modified on: 2018-10-19
*/

'use strict'

// find pid by port

const os = require('os')
const fs = require('fs')
const utils = require('./utils')
const log = require('./logger')

const ensureDir = (path) => new Promise((resolve, reject) => {
  if (fs.existsSync(path)) {
    resolve()
  } else {
    fs.mkdir(path, err => {
      err ? reject(err) : resolve()
    })
  }
})

const finders = {
  darwin (port) {
    return new Promise((resolve, reject) => {
      utils.exec('netstat -anv -p TCP && netstat -anv -p UDP', function (err, stdout, stderr) {
        if (err) {
          reject(err)
        } else {
          err = stderr.toString().trim()
          if (err) {
            reject(err)
            return
          }

          // replace header
          const data = utils.stripLine(stdout.toString(), 2)
          const found = utils.extractColumns(data, [0, 3, 8], 10)
            .filter(row => {
              return !!String(row[0]).match(/^(udp|tcp)/)
            })
            .find(row => {
              const matches = String(row[1]).match(/\.(\d+)$/)
              if (matches && matches[1] === String(port)) {
                return true
              }
              return false
            })

          if (found && found[2].length) {
            resolve(parseInt(found[2], 10))
          } else {
            reject(new Error(`pid of port (${port}) not found`))
          }
        }
      })
    })
  },
  freebsd: 'darwin',
  sunos: 'darwin',
  linux (port) {
    return new Promise((resolve, reject) => {
      const cmd = 'netstat -tunlp'

      utils.exec(cmd, function (err, stdout, stderr) {
        if (err) {
          reject(err)
        } else {
          const warn = stderr.toString().trim()
          if (warn) {
            // netstat -p ouputs warning if user is no-root
            log.warn(warn)
          }

          // replace header
          const data = utils.stripLine(stdout.toString(), 2)
          const columns = utils.extractColumns(data, [3, 6], 7).find(column => {
            const matches = String(column[0]).match(/:(\d+)$/)
            if (matches && matches[1] === String(port)) {
              return true
            }
            return false
          })

          if (columns && columns[1]) {
            const pid = columns[1].split('/', 1)[0]

            if (pid.length) {
              resolve(parseInt(pid, 10))
            } else {
              reject(new Error(`pid of port (${port}) not found`))
            }
          } else {
            reject(new Error(`pid of port (${port}) not found`))
          }
        }
      })
    })
  },
  win32 (port) {
    return new Promise((resolve, reject) => {
      utils.exec('netstat -ano', function (err, stdout, stderr) {
        if (err) {
          reject(err)
        } else {
          err = stderr.toString().trim()
          if (err) {
            reject(err)
            return
          }

          // replace header
          const data = utils.stripLine(stdout.toString(), 4)
          const columns = utils.extractColumns(data, [1, 4], 5).find(column => {
            const matches = String(column[0]).match(/:(\d+)$/)
            if (matches && matches[1] === String(port)) {
              return true
            }
            return false
          })

          if (columns && columns[1].length && parseInt(columns[1], 10) > 0) {
            resolve(parseInt(columns[1], 10))
          } else {
            reject(new Error(`pid of port (${port}) not found`))
          }
        }
      })
    })
  },
  android (port) {
    return new Promise((resolve, reject) => {
      // on Android Termux, an warning will be emitted when executing `netstat`
      // with option `-p` says 'showing only processes with your user ID', but
      // it can still fetch the information we need. However, NodeJS treat this
      // warning as an error, `util.exec()` will get nothing but the error. To
      // get the true output of the command, we need to save it to a tmpfile and
      // read that file instead.
      const dir = os.tmpdir() + '/.find-process'
      const file = dir + '/' + process.pid
      const cmd = 'netstat -tunp >> "' + file + '"'

      ensureDir(dir).then(() => {
        utils.exec(cmd, () => {
          fs.readFile(file, 'utf8', (err, data) => {
            fs.unlink(file, () => { })
            if (err) {
              reject(err)
            } else {
              data = utils.stripLine(data, 2)
              const columns = utils.extractColumns(data, [3, 6], 7).find(column => {
                const matches = String(column[0]).match(/:(\d+)$/)
                if (matches && matches[1] === String(port)) {
                  return true
                }
                return false
              })

              if (columns && columns[1]) {
                const pid = columns[1].split('/', 1)[0]

                if (pid.length) {
                  resolve(parseInt(pid, 10))
                } else {
                  reject(new Error(`pid of port (${port}) not found`))
                }
              } else {
                reject(new Error(`pid of port (${port}) not found`))
              }
            }
          })
        })
      })
    })
  }
}

function findPidByPort (port) {
  const platform = process.platform

  return new Promise((resolve, reject) => {
    if (!(platform in finders)) {
      return reject(new Error(`platform ${platform} is unsupported`))
    }

    let findPid = finders[platform]
    if (typeof findPid === 'string') {
      findPid = finders[findPid]
    }

    findPid(port).then(resolve, reject)
  })
}

module.exports = findPidByPort
