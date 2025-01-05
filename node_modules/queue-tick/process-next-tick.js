module.exports = (typeof process !== 'undefined' && typeof process.nextTick === 'function')
  ? process.nextTick.bind(process)
  : require('./queue-microtask')
