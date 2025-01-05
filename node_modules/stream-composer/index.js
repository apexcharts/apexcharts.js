const { Duplex, pipeline } = require('streamx')

module.exports = class Composer extends Duplex {
  constructor (opts) {
    super(opts)

    this._writable = null
    this._readable = null
    this._isPipeline = false
    this._pipelineMissing = 2

    this._writeCallback = null
    this._finalCallback = null

    this._ondata = this._pushData.bind(this)
    this._onend = this._pushEnd.bind(this, null)
    this._ondrain = this._continueWrite.bind(this, null)
    this._onfinish = this._maybeFinal.bind(this)
    this._onerror = this.destroy.bind(this)
    this._onclose = this.destroy.bind(this, null)
  }

  static pipeline (...streams) {
    const c = new Composer()
    c.setPipeline(...streams)
    return c
  }

  static duplexer (ws = null, rs = null) {
    const c = new Composer()
    c.setWritable(ws)
    c.setReadable(rs)
    return c
  }

  setPipeline (first, ...streams) {
    const all = Array.isArray(first) ? first : [first, ...streams]

    this._isPipeline = true
    this.setWritable(all[0])
    this.setReadable(all[all.length - 1])

    pipeline(all, (err) => {
      if (err) this.destroy(err)
    })

    return this
  }

  setReadable (rs) {
    if (this._readable) {
      this._readable.removeListener('data', this._ondata)
      this._readable.removeListener('end', this._onend)
      this._readable.removeListener('error', this._onerror)
      this._readable.removeListener('close', this._onclose)
    }

    if (rs === null) {
      this._readable = null
      this.push(null)
      this.resume()
      return
    }

    this._readable = rs
    this._readable.on('data', this._ondata)
    this._readable.on('end', this._onend)
    this._readable.on('error', this._onerror)
    this._readable.on('close', this._onclose)

    if (this.destroying && this._readable.destroy) {
      this._readable.destroy()
    }

    return this
  }

  setWritable (ws) {
    if (this._writable) {
      this._writable.removeListener('drain', this._ondrain)
      this._writable.removeListener('finish', this._onfinish)
      this._writable.removeListener('error', this._onerror)
      this._writable.removeListener('close', this._onclose)
    }

    if (ws === null) {
      this._writable = null
      this._continueWrite(null)
      this.end()
      return
    }

    this._writable = ws
    this._writable.on('drain', this._ondrain)
    this._writable.on('finish', this._onfinish)
    this._writable.on('error', this._onerror)
    this._writable.on('close', this._onclose)

    if (this.destroying && this._writable.destroy) {
      this._writable.destroy()
    }

    return this
  }

  _read (cb) {
    if (this._readable !== null) {
      this._readable.resume()
    }

    cb(null)
  }

  _pushData (data) {
    if (this.push(data) === false && this._readable !== null) {
      this._readable.pause()
    }
  }

  _pushEnd () {
    if (this._isPipeline) {
      this.on('end', this._decrementPipeline.bind(this))
    }
    this.push(null)
    if (this._readable !== null) {
      this._readable.removeListener('close', this._onclose)
    }
  }

  _decrementPipeline () {
    if (--this._pipelineMissing === 0) this._continueFinal(null)
  }

  _maybeFinal () {
    if (this._writable !== null) {
      this._writable.removeListener('close', this._onclose)
    }

    if (this._isPipeline) this._decrementPipeline()
    else this._continueFinal(null)
  }

  _continueFinal (err) {
    if (this._finalCallback === null) return

    const cb = this._finalCallback
    this._finalCallback = null
    cb(err)
  }

  _continueWrite (err) {
    if (this._writeCallback === null) return
    const cb = this._writeCallback
    this._writeCallback = null
    cb(err)
  }

  _predestroy () {
    if (this._writable !== null && this._writable.destroy) this._writable.destroy()
    if (this._readable !== null && this._readable.destroy) this._readable.destroy()
    this._continueWrite(new Error('Stream destroyed'))
    this._continueFinal(new Error('Stream destroyed'))
  }

  _writev (datas, cb) {
    if (this._writable === null) {
      return cb(null)
    }

    let flushed = true

    for (const data of datas) {
      flushed = this._writable.write(data)
    }

    if (!flushed) {
      this._writeCallback = cb
      return
    }

    cb(null)
  }

  _final (cb) {
    if (this._writable === null) {
      return cb(null)
    }

    this._finalCallback = cb
    this._writable.end()
  }
}
