const tape = require('tape')
const queueTick = require('./')
const js = require('./queue-microtask')

tape('basic', function (t) {
  t.plan(2)

  queueTick(() => t.pass('tick'))
  js(() => t.pass('tock'))
})
