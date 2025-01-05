const test = require('brittle')
const { Readable, Writable, Transform } = require('streamx')
const Composer = require('./')

test('read and write', function (t) {
  t.plan(42)

  const c = new Composer()

  let writes = 0
  let reads = 0

  const r = new Readable()
  const w = new Writable({
    write (data, cb) {
      t.is(data, 'write-' + (writes++))
      setTimeout(cb, 0)
    }
  })

  c.setReadable(r)
  c.setWritable(w)

  let flushed = true
  for (let i = 0; i < 20; i++) {
    flushed = c.write('write-' + i)
  }

  t.not(flushed)

  for (let i = 0; i < 20; i++) {
    r.push('read-' + i)
  }

  t.ok(Readable.isBackpressured(r))

  c.on('data', function (data) {
    t.is(data, 'read-' + (reads++))
  })
})

test('read and write (twice)', function (t) {
  t.plan(42)

  const c = new Composer()

  let writes = 0
  let reads = 0

  const r = new Readable()
  const w = new Writable({
    write (data, cb) {
      t.is(data, 'write-' + (writes++))
      setTimeout(cb, 0)
    }
  })

  c.setReadable(r)
  c.setWritable(w)

  c.setReadable(r)
  c.setWritable(w)

  let flushed = true
  for (let i = 0; i < 20; i++) {
    flushed = c.write('write-' + i)
  }

  t.not(flushed)

  for (let i = 0; i < 20; i++) {
    r.push('read-' + i)
  }

  t.ok(Readable.isBackpressured(r))

  c.on('data', function (data) {
    t.is(data, 'read-' + (reads++))
  })
})

test('no write', function (t) {
  t.plan(13)

  const c = new Composer()

  let reads = 0

  const r = new Readable()

  c.setReadable(r)
  c.setWritable(null)

  for (let i = 0; i < 10; i++) {
    r.push('read-' + i)
  }

  r.push(null)

  c.on('data', function (data) {
    t.is(data, 'read-' + (reads++))
  })

  c.on('end', function () {
    t.pass('end')
  })

  c.on('finish', function () {
    t.pass('finish')
  })

  c.on('close', function () {
    t.pass('closed')
  })
})

test('no read', function (t) {
  t.plan(12)

  const c = new Composer()

  let writes = 0

  const w = new Writable({
    write (data, cb) {
      t.is(data, 'write-' + (writes++))
      setTimeout(cb, 0)
    }
  })

  c.setReadable(null)
  c.setWritable(w)

  for (let i = 0; i < 10; i++) {
    c.write('write-' + i)
  }

  c.end()

  c.on('end', function () {
    t.pass('ended')
  })

  c.on('close', function () {
    t.pass('closed')
  })
})

test('pipeline', function (t) {
  t.plan(22)

  const c = new Composer()

  c.setPipeline(new Transform(), new Transform())

  let reads = 0

  for (let i = 0; i < 20; i++) {
    c.write('hello-' + i)
  }

  c.on('finish', function () {
    t.pass('finish')
  })

  c.end()

  c.on('data', function (data) {
    t.is(data, 'hello-' + (reads++))
  })

  c.on('end', function () {
    t.pass('end')
  })
})

test('pipeline, static', function (t) {
  t.plan(21)

  const c = Composer.pipeline(new Transform(), new Transform(), new Transform(), new Transform())

  for (let i = 0; i < 20; i++) {
    c.write('hello-' + i)
  }

  c.end()

  let reads = 0
  c.on('data', function (data) {
    t.is(data, 'hello-' + (reads++))
  })

  c.on('end', function () {
    t.pass('ended')
  })
})

test('pipeline destroy', function (t) {
  t.plan(4)

  const streams = [new Transform(), new Transform(), new Transform(), new Transform()]
  const c = Composer.pipeline(streams)

  for (let i = 0; i < 20; i++) {
    c.write('hello-' + i)
  }

  c.destroy()

  c.on('close', function () {
    for (const stream of streams) {
      t.ok(stream.destroying)
    }
  })
})

test('pipeline destroy inner', function (t) {
  t.plan(5)

  const streams = [new Transform(), new Transform(), new Transform(), new Transform()]
  const c = Composer.pipeline(streams)

  for (let i = 0; i < 20; i++) {
    c.write('hello-' + i)
  }

  streams[1].destroy()

  c.on('error', function () {
    t.pass('has error')
  })

  c.on('close', function () {
    for (const stream of streams) {
      t.ok(stream.destroying)
    }
  })
})

test('pipeline w/ core streams', function (t) {
  t.plan(23)

  const coreStream = require('stream')

  const c = Composer.pipeline(new Transform({
    transform (obj, cb) {
      setImmediate(function () {
        cb(null, obj)
      })
    }
  }), new Transform({
    transform (obj, cb) {
      setImmediate(function () {
        cb(null, obj)
      })
    }
  }))
  let reads = 0

  const data = []
  for (let i = 0; i < 20; i++) {
    data.push({ msg: 'hello-' + i })
  }

  c.on('finish', function () {
    t.absent(pipelineEnded, 'finish')
  })

  c.on('end', function () {
    t.absent(pipelineEnded, 'ended')
  })

  let pipelineEnded = false

  coreStream.pipeline([coreStream.Readable.from(data), c], function (err) {
    pipelineEnded = true
    t.ok(!err, 'pipeline ended')
  })

  c.on('data', function (data) {
    t.alike(data, { msg: 'hello-' + reads++ }, 'got data')
  })
})
